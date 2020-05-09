import { ErrCodeMap } from '../protobufs/message_pb';

export const INVALID_PENDING_PAYMENTS = 'Invalid pending payments';

export interface VerificationResult {
  readonly valid: boolean;
  readonly errCode?: ErrCodeMap[keyof ErrCodeMap];
  readonly errReason?: string;
}

export function unknownChannel(channelId: string): Error {
  return new Error(`Unknown channel ${channelId}`);
}

export function paymentChannelNotOpen(channelId: string): Error {
  return new Error(`Payment channel ${channelId} not in OPEN status`);
}

export function unknownPayment(paymentId: string): Error {
  return new Error(`Unknown payment ${paymentId}`);
}
