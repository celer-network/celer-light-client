import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { Payment, PaymentStatus } from '../../data/payment';
import {
  PaymentChannel,
  PaymentChannelStatus,
} from '../../data/payment_channel';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import {
  CelerMsg,
  PaymentSettleReasonMap,
  PaymentSettleRequest,
  SettledPayment,
  SignedSimplexState,
} from '../../protobufs/message_pb';
import * as errorUtils from '../../utils/errors';
import { MessageManager } from '../message_manager';

export interface PaymentSettleRequestInfo {
  readonly payment: Payment;
  readonly settlementAmount: Uint8Array;
  readonly reason: PaymentSettleReasonMap[keyof PaymentSettleReasonMap];
}

export class PaymentSettleRequestSender {
  private readonly db: Database;
  private readonly cryptoManager: CryptoManager;
  private readonly messageManager: MessageManager;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    cryptoManager: CryptoManager,
    messageManager: MessageManager,
    peerAddress: string
  ) {
    this.db = db;
    this.cryptoManager = cryptoManager;
    this.messageManager = messageManager;
    this.peerAddress = peerAddress;
  }

  async sendPaymentSettleRequests(
    channelId: string,
    settleRequestInfos: PaymentSettleRequestInfo[]
  ): Promise<void> {
    const { db } = this;
    const payments = settleRequestInfos.map((info) => info.payment);
    const settlementAmounts = settleRequestInfos.map(
      (info) => info.settlementAmount
    );
    const reasons = settleRequestInfos.map((info) => info.reason);
    const [
      signedSimpleState,
      baseSeqNum,
    ] = await this.getUpdatedSignedSimplexState(
      channelId,
      payments,
      settlementAmounts
    );
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

    for (let i = 0; i < paymentCount; i++) {
      const payment = payments[i];
      payment.status = PaymentStatus.PEER_FROM_SIGNED_SETTLED;
      payment.settlementAmount = settlementAmounts[i];
    }
    await db.payments.bulkPut(payments);
  }

  private async getUpdatedSignedSimplexState(
    channelId: string,
    payments: Payment[],
    settlementAmounts: Uint8Array[]
  ): Promise<[SignedSimplexState, number]> {
    const { db } = this;
    const channel = await db.paymentChannels.get(channelId);
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
      const { paymentId } = payment;
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
      this.cryptoManager,
      signedSimplexState,
      simplexState
    );

    return [signedSimplexState, baseSeqNum];
  }
}
