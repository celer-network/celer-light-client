import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { PaymentStatus } from '../../data/payment';
import { PaymentChannel } from '../../data/payment_channel';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import { CelerMsg } from '../../protobufs/message_pb';

export class CondPayResponseHandler {
  private readonly db: Database;
  private readonly cryptoManager: CryptoManager;
  private readonly peerAddress: string;

  constructor(db: Database, cryptoManager: CryptoManager, peerAddress: string) {
    this.db = db;
    this.cryptoManager = cryptoManager;
    this.peerAddress = peerAddress;
  }

  async handle(message: CelerMsg): Promise<void> {
    const response = message.getCondPayResponse();
    const { db } = this;
    const selfAddress = await this.cryptoManager.signer.getAddress();
    const { peerAddress } = this;
    const receivedSignedSimplexState = response.getStateCosigned();
    if (!receivedSignedSimplexState) {
      return;
    }
    const [
      receivedSimplexState,
      receivedSimplexStateBytes,
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
      !CryptoManager.isSignatureValid(
        peerAddress,
        receivedSimplexStateBytes,
        peerSignature
      ) ||
      !CryptoManager.isSignatureValid(
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

        // Mark all PEER_FROM_SIGNED_PENDING payments as FAILED for now
        // TODO(dominator008): Revisit this
        const payments = await db.payments
          .where({
            status: PaymentStatus.PEER_FROM_SIGNED_PENDING,
          })
          .toArray();
        if (payments.length === 0) {
          return;
        }
        for (const payment of payments) {
          payment.status = PaymentStatus.FAILED;
        }
        await db.payments.bulkPut(payments);
      });
    } else {
      await db.transaction('rw', db.paymentChannels, db.payments, async () => {
        // TODO(dominator008): Maybe support multiple in-flight payments
        const payments = await db.payments
          .where({
            status: PaymentStatus.PEER_FROM_SIGNED_PENDING,
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
        payment.status = PaymentStatus.CO_SIGNED_PENDING;
        await db.payments.put(payment);
      });
    }
  }
}
