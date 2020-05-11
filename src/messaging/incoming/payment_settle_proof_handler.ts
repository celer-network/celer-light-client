import { ethers } from 'ethers';

import { Database } from '../../data/database';
import { ResolvePaymentProcessor } from '../../processors/resolve_payment_processor';
import { CelerMsg, PaymentSettleReason } from '../../protobufs/message_pb';
import {
  PaymentSettleRequestInfo,
  PaymentSettleRequestSender,
} from '../outgoing/payment_settle_request_sender';

export class PaymentSettleProofHandler {
  private readonly db: Database;
  private readonly paymentSettleRequestSender: PaymentSettleRequestSender;
  private readonly resolvePaymentProcessor: ResolvePaymentProcessor;

  constructor(
    db: Database,
    paymentSettleRequestSender: PaymentSettleRequestSender,
    resolvePaymentProcessor: ResolvePaymentProcessor
  ) {
    this.db = db;
    this.paymentSettleRequestSender = paymentSettleRequestSender;
    this.resolvePaymentProcessor = resolvePaymentProcessor;
  }

  async handle(message: CelerMsg): Promise<void> {
    const proof = message.getPaymentSettleProof();
    if (proof.getVouchedCondPayResultsList().length > 0) {
      // Vouched results not supported yet
      return;
    }
    const settledPaysList = proof.getSettledPaysList();
    if (settledPaysList.length === 0) {
      return;
    }
    const { db } = this;
    const paymentSettleRequestInfos: PaymentSettleRequestInfo[] = [];
    let channelId: string;
    const paymentIds = settledPaysList.map((settledPayment) =>
      ethers.utils.hexlify(settledPayment.getSettledPayId_asU8())
    );
    const payments = await db.payments.bulkGet(paymentIds);
    for (let i = 0; i < settledPaysList.length; i++) {
      const settledPayment = settledPaysList[i];
      const paymentId = ethers.utils.hexlify(
        settledPayment.getSettledPayId_asU8()
      );
      const settlementAmount = settledPayment.getAmount_asU8();
      const reason = settledPayment.getReason();
      const payment = payments[i];
      if (!payment) {
        return;
      }
      const currChannelId = payment.outgoingChannelId;
      if (!channelId) {
        channelId = currChannelId;
      } else if (currChannelId !== channelId) {
        // Can't settle payments from different channels
        return;
      }
      const paymentSettlementInfo = {
        payment,
        settlementAmount,
        reason,
      };
      switch (settledPayment.getReason()) {
        case PaymentSettleReason.PAY_RESOLVED_ONCHAIN:
          if (
            /* eslint-disable-next-line no-await-in-loop */
            !(await this.resolvePaymentProcessor.getOnChainPaymentInfo(
              paymentId
            ))
          ) {
            break;
          }
          paymentSettleRequestInfos.push(paymentSettlementInfo);
          break;
        case PaymentSettleReason.PAY_EXPIRED:
        case PaymentSettleReason.PAY_DEST_UNREACHABLE:
        case PaymentSettleReason.PAY_REJECTED:
          paymentSettleRequestInfos.push(paymentSettlementInfo);
          break;
        default:
      }
    }
    await this.paymentSettleRequestSender.sendPaymentSettleRequests(
      channelId,
      paymentSettleRequestInfos
    );
  }
}
