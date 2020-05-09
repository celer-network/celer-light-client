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
      lockedReceivingCapacity: balance.lockedReceivingCapacity.toString(),
    };
    return {
      channelId,
      tokenType: channel.tokenType,
      tokenAddress: channel.tokenAddress,
      peerAddress: channel.peerAddress,
      status: channel.status,
      balance: balanceInfo,
    };
  }

  async getAllPaymentChannelIdsForToken(
    selfAddress: string,
    peerAddress: string,
    tokenAddress: string
  ): Promise<string[]> {
    const channels = await this.db.paymentChannels
      .where({
        selfAddress,
        peerAddress,
        tokenAddress,
      })
      .toArray();
    return channels.map((channel) => channel.channelId);
  }
}
