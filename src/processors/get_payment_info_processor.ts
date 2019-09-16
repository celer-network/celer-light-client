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

import { PaymentInfo } from '../api/payment_info';
import { Database } from '../storage/database';
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
      settlementAmount: ethers.utils
        .bigNumberify(payment.settlementAmount)
        .toString()
    };
  }

  async getIncomingPaymentIds(channelId: string): Promise<string[]> {
    return (await this.db.payments
      .filter(payment => payment.incomingChannelId === channelId)
      .toArray()).map(payment => payment.paymentId);
  }

  async getOutgoingPaymentIds(channelId: string): Promise<string[]> {
    return (await this.db.payments
      .filter(payment => payment.outgoingChannelId === channelId)
      .toArray()).map(payment => payment.paymentId);
  }
}
