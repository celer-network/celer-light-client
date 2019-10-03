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

import { BalanceInfo, PaymentChannelInfo } from '../api/payment_channel_info';
import { Database } from '../data/database';
import * as errorUtils from '../utils/errors';

export class GetPaymentChannelInfoProcessor {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getPaymentChannelInfo(channelId: string): Promise<PaymentChannelInfo> {
    const channel = await this.db.paymentChannels.get(channelId);
    if (!channel) {
      throw errorUtils.unknownChannel(channelId);
    }

    const balance = channel.calculateBalance();
    const balanceInfo: BalanceInfo = {
      freeSendingCapacity: balance.freeSendingCapacity.toString(),
      freeReceivingCapacity: balance.freeReceivingCapacity.toString(),
      lockedSendingCapacity: balance.lockedSendingCapacity.toString(),
      lockedReceivingCapacity: balance.lockedReceivingCapacity.toString()
    };
    return {
      channelId,
      tokenType: channel.tokenType,
      tokenAddress: channel.tokenAddress,
      peerAddress: channel.peerAddress,
      status: channel.status,
      balance: balanceInfo
    };
  }
}
