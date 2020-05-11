import { PaymentSettleProofSender } from '../messaging/outgoing/payment_settle_proof_sender';
import { PaymentSettleReasonMap } from '../protobufs/message_pb';

export class SettlePaymentProcessor {
  private readonly paymentSettleProofSender: PaymentSettleProofSender;

  constructor(paymentSettleProofSender: PaymentSettleProofSender) {
    this.paymentSettleProofSender = paymentSettleProofSender;
  }

  settlePayment(
    paymentId: string,
    reason: PaymentSettleReasonMap[keyof PaymentSettleReasonMap]
  ): Promise<void> {
    const info = { paymentId, reason };
    return this.paymentSettleProofSender.sendPaymentSettleProofs([info]);
  }
}
