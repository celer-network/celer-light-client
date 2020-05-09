import { PaymentChannelStatus } from '../data/payment_channel';
import { TokenTypeMap } from '../protobufs/entity_pb';

export interface BalanceInfo {
  /** The amount sendable via the channel, in wei */
  readonly freeSendingCapacity: string;
  /** The amount receivable via the channel, in wei */
  readonly freeReceivingCapacity: string;
  /** The pending outgoing amount on the channel, in wei */
  readonly lockedSendingCapacity: string;
  /** The pending incoming amount on the channel, in wei */
  readonly lockedReceivingCapacity: string;
}

export interface PaymentChannelInfo {
  /** The channel ID */
  readonly channelId: string;
  /** The token type. See [[TokenTypeMap]] */
  readonly tokenType: TokenTypeMap[keyof TokenTypeMap];
  /** The token address */
  readonly tokenAddress: string;
  /** The ETH address of the peer */
  readonly peerAddress: string;
  /** The status of the channel */
  readonly status: PaymentChannelStatus;
  /** The balance information of the channel. See [[BalanceInfo]] */
  readonly balance: BalanceInfo;
}
