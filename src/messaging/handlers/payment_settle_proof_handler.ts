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

import { Database } from '../../data/database';
import { ResolvePaymentProcessor } from '../../processors/resolve_payment_processor';
import { CelerMsg, PaymentSettleReason } from '../../protobufs/message_pb';
import {
  PaymentSettleRequestInfo,
  PaymentSettleRequestSender
} from '../senders/payment_settle_request_sender';

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
    const db = this.db;
    const paymentSettleRequestInfos: PaymentSettleRequestInfo[] = [];
    let channelId: string;
    for (const settledPayment of settledPaysList) {
      const paymentId = ethers.utils.hexlify(
        settledPayment.getSettledPayId_asU8()
      );
      const settlementAmount = settledPayment.getAmount_asU8();
      const reason = settledPayment.getReason();
      const payment = await db.payments.get(paymentId);
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
        reason
      };
      switch (settledPayment.getReason()) {
        case PaymentSettleReason.PAY_RESOLVED_ONCHAIN:
          if (
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
