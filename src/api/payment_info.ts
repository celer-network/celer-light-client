import { PaymentStatus } from '../data/payment';
import { TokenTypeMap } from '../protobufs/entity_pb';

export interface PaymentInfo {
  /** The payment ID */
  readonly paymentId: string;
  /** The token type. See [[TokenTypeMap]] */
  readonly tokenType: TokenTypeMap[keyof TokenTypeMap];
  /** The token address */
  readonly tokenAddress: string;
  /** The maximal amount transferrable to the destination, in wei */
  readonly maxTransferAmount: string;
  /** The ETH address of the recipient */
  readonly destination: string;
  /** The status of the payment. See [[PaymentStatus]] */
  readonly status: PaymentStatus;
  /** The settled amount, in wei */
  readonly settlementAmount: string;
}
