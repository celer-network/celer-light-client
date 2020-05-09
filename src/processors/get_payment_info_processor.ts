import { ethers } from 'ethers';

import { PaymentInfo } from '../api/payment_info';
import { Database } from '../data/database';
import * as errorUtils from '../utils/errors';
import * as typeUtils from '../utils/types';

export class GetPaymentInfoProcessor {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getPaymentInfo(paymentId: string): Promise<PaymentInfo> {
    const payment = await this.db.payments.get(paymentId);
    if (!payment) {
      throw errorUtils.unknownPayment(paymentId);
    }

    const conditionalPay = payment.getConditionalPay();
    const maxTransfer = conditionalPay.getTransferFunc().getMaxTransfer();
    const tokenInfo = maxTransfer.getToken();
    return {
      paymentId,
      maxTransferAmount: ethers.utils
        .bigNumberify(maxTransfer.getReceiver().getAmt_asU8())
        .toString(),
      destination: typeUtils.bytesToAddress(conditionalPay.getDest_asU8()),
      tokenType: tokenInfo.getTokenType(),
      tokenAddress: typeUtils.bytesToAddress(tokenInfo.getTokenAddress_asU8()),
      status: payment.status,
      settlementAmount:
        payment.settlementAmount &&
        ethers.utils.bigNumberify(payment.settlementAmount).toString(),
    };
  }

  async getIncomingPaymentIds(channelId: string): Promise<string[]> {
    return (
      await this.db.payments
        .filter((payment) => payment.incomingChannelId === channelId)
        .toArray()
    ).map((payment) => payment.paymentId);
  }

  async getOutgoingPaymentIds(channelId: string): Promise<string[]> {
    return (
      await this.db.payments
        .filter((payment) => payment.outgoingChannelId === channelId)
        .toArray()
    ).map((payment) => payment.paymentId);
  }
}
