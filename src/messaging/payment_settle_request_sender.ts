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

import { Signer } from '../crypto/signer';
import { SimplexPaymentChannel } from '../protobufs/entity_pb';
import {
  CelerMsg,
  PaymentSettleReasonMap,
  PaymentSettleRequest,
  SettledPayment,
  SignedSimplexState
} from '../protobufs/message_pb';
import { Database } from '../storage/database';
import { Payment, PaymentStatus } from '../storage/payment';
import {
  PaymentChannel,
  PaymentChannelStatus
} from '../storage/payment_channel';
import * as errorUtils from '../utils/errors';
import { MessageManager } from './message_manager';

export interface PaymentSettlementInfo {
  readonly payment: Payment;
  readonly settlementAmount: Uint8Array;
  readonly reason: PaymentSettleReasonMap[keyof PaymentSettleReasonMap];
}

export class PaymentSettleRequestSender {
  private readonly db: Database;
  private readonly signer: Signer;
  private readonly messageManager: MessageManager;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    signer: Signer,
    messageManager: MessageManager,
    peerAddress: string
  ) {
    this.db = db;
    this.signer = signer;
    this.messageManager = messageManager;
    this.peerAddress = peerAddress;
  }

  async sendPaymentSettleRequests(settlementInfos: PaymentSettlementInfo[]) {
    const db = this.db;
    const payments = settlementInfos.map(info => info.payment);
    const settlementAmounts = settlementInfos.map(
      info => info.settlementAmount
    );
    const reasons = settlementInfos.map(info => info.reason);
    const [
      signedSimpleState,
      baseSeqNum
    ] = await this.getUpdatedSignedSimplexState(payments, settlementAmounts);
    const paymentCount = payments.length;
    const settledPayments = new Array(paymentCount);
    for (let i = 0; i < paymentCount; i++) {
      const payment = payments[i];
      const settledPayment = new SettledPayment();
      settledPayment.setSettledPayId(ethers.utils.arrayify(payment.paymentId));
      settledPayment.setReason(reasons[i]);
      settledPayment.setAmount(ethers.utils.arrayify(settlementAmounts[i]));
      settledPayments[i] = settledPayment;
    }

    const request = new PaymentSettleRequest();
    request.setStateOnlyPeerFromSig(signedSimpleState);
    request.setSettledPaysList(settledPayments);
    request.setBaseSeq(baseSeqNum);
    const message = new CelerMsg();
    message.setPaymentSettleRequest(request);
    await this.messageManager.sendMessage(message);

    await db.transaction('rw', db.payments, async () => {
      for (let i = 0; i < paymentCount; i++) {
        const payment = payments[i];
        payment.status = PaymentStatus.PEER_FROM_SIGNED_SETTLED;
        payment.settlementAmount = settlementAmounts[i];
        await db.payments.put(payment);
      }
    });
  }

  private async getUpdatedSignedSimplexState(
    payments: Payment[],
    settlementAmounts: Uint8Array[]
  ): Promise<[SignedSimplexState, number]> {
    const db = this.db;
    const peerAddress = this.peerAddress;
    const channel = await db.paymentChannels.get({ peerAddress });
    if (channel.status !== PaymentChannelStatus.OPEN) {
      throw errorUtils.paymentChannelNotOpen(channel.channelId);
    }
    const signedSimplexState = channel.getOutgoingSignedSimplexState();
    const simplexState = SimplexPaymentChannel.deserializeBinary(
      signedSimplexState.getSimplexState_asU8()
    );
    const paymentIdsToClear = new Set<string>();
    let totalPendingAmount = ethers.utils.bigNumberify(
      simplexState.getTotalPendingAmount_asU8()
    );
    const receiver = simplexState.getTransferToPeer().getReceiver();
    let transferAmount = ethers.utils.bigNumberify(receiver.getAmt_asU8());
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      const settlementAmount = settlementAmounts[i];
      const paymentId = payment.paymentId;
      const conditionalPay = payment.getConditionalPay();
      const maxPaymentAmount = ethers.utils.bigNumberify(
        conditionalPay
          .getTransferFunc()
          .getMaxTransfer()
          .getReceiver()
          .getAmt_asU8()
      );
      totalPendingAmount = totalPendingAmount.sub(maxPaymentAmount);
      transferAmount = transferAmount.add(settlementAmount);
      paymentIdsToClear.add(paymentId);
    }
    const pendingPayIds = simplexState.getPendingPayIds();
    const filteredPayIdsList = pendingPayIds
      .getPayIdsList_asU8()
      .filter((currentPaymentId: Uint8Array) => {
        return !paymentIdsToClear.has(ethers.utils.hexlify(currentPaymentId));
      });
    pendingPayIds.setPayIdsList(filteredPayIdsList);
    receiver.setAmt(ethers.utils.arrayify(transferAmount));
    simplexState.setTotalPendingAmount(
      ethers.utils.arrayify(totalPendingAmount)
    );
    const baseSeqNum = simplexState.getSeqNum();
    simplexState.setSeqNum(baseSeqNum + 1);

    await PaymentChannel.signUpdatedSimplexState(
      this.signer,
      signedSimplexState,
      simplexState
    );

    return [signedSimplexState, baseSeqNum];
  }
}
