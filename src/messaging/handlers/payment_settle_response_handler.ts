/**
 * @license
 * The MIT License
 *
 * Copyright (c) 2019 Celer Network
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { ethers } from 'ethers';

import { CustomSigner } from '../../crypto/custom_signer';
import { Database } from '../../data/database';
import { PaymentStatus } from '../../data/payment';
import { PaymentChannel } from '../../data/payment_channel';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import { CelerMsg, ErrCode } from '../../protobufs/message_pb';

export class PaymentSettleResponseHandler {
  private readonly db: Database;
  private readonly signer: CustomSigner;
  private readonly peerAddress: string;

  constructor(db: Database, signer: CustomSigner, peerAddress: string) {
    this.db = db;
    this.signer = signer;
    this.peerAddress = peerAddress;
  }

  async handle(message: CelerMsg): Promise<void> {
    const response = message.getPaymentSettleResponse();
    const db = this.db;
    const selfAddress = await this.signer.provider.getSigner().getAddress();
    const peerAddress = this.peerAddress;
    const receivedSignedSimplexState = response.getStateCosigned();
    if (!receivedSignedSimplexState) {
      return;
    }
    const [
      receivedSimplexState,
      receivedSimplexStateBytes
    ] = PaymentChannel.deserializeSignedSimplexState(
      receivedSignedSimplexState
    );
    const channelId = ethers.utils.hexlify(
      receivedSimplexState.getChannelId_asU8()
    );

    // Verify signatures
    const selfSignature = ethers.utils.splitSignature(
      receivedSignedSimplexState.getSigOfPeerFrom_asU8()
    );
    const peerSignature = ethers.utils.splitSignature(
      receivedSignedSimplexState.getSigOfPeerTo_asU8()
    );
    if (
      !CustomSigner.isSignatureValid(
        peerAddress,
        receivedSimplexStateBytes,
        peerSignature
      ) ||
      !CustomSigner.isSignatureValid(
        selfAddress,
        receivedSimplexStateBytes,
        selfSignature
      )
    ) {
      return;
    }

    if (response.hasError()) {
      await db.transaction('rw', db.paymentChannels, db.payments, async () => {
        const channel = await db.paymentChannels.get(channelId);
        if (!channel) {
          return;
        }
        const storedSimplexState = SimplexPaymentChannel.deserializeBinary(
          channel.getOutgoingSignedSimplexState().getSimplexState_asU8()
        );
        // Verify that the received sequence number is not lower than the stored
        // one
        if (receivedSimplexState.getSeqNum() < storedSimplexState.getSeqNum()) {
          return;
        }
        channel.setOutgoingSignedSimplexState(receivedSignedSimplexState);
        await db.paymentChannels.put(channel);
        // Mark all PEER_FROM_SIGNED_SETTLED payments as FAILED for now
        // TODO(dominator008): Revisit this
        const payments = await db.payments
          .where({
            status: PaymentStatus.PEER_FROM_SIGNED_SETTLED
          })
          .toArray();
        if (payments.length === 0) {
          return;
        }
        for (const payment of payments) {
          payment.status = PaymentStatus.FAILED;
          await db.payments.put(payment);
        }
      });
    } else {
      await db.transaction('rw', db.paymentChannels, db.payments, async () => {
        // TODO(dominator008): Maybe support multiple in-flight payments
        const payments = await db.payments
          .where({
            status: PaymentStatus.PEER_FROM_SIGNED_SETTLED
          })
          .toArray();
        if (payments.length === 0) {
          return;
        }
        const payment = payments[0];
        const channel = await db.paymentChannels.get(channelId);
        if (!channel) {
          return;
        }
        const storedSimplexState = SimplexPaymentChannel.deserializeBinary(
          channel.getOutgoingSignedSimplexState().getSimplexState_asU8()
        );
        // Verify that the received sequence number is higher than the stored
        // one
        if (
          receivedSimplexState.getSeqNum() <= storedSimplexState.getSeqNum()
        ) {
          return;
        }
        channel.setOutgoingSignedSimplexState(receivedSignedSimplexState);
        await db.paymentChannels.put(channel);
        payment.status = PaymentStatus.CO_SIGNED_SETTLED;
        await db.payments.put(payment);
      });
    }
  }
}
