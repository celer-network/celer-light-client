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

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { ConditionType } from '../../protobufs/entity_pb';
import { CelerMsg, PaymentSettleReason } from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';
import { PaymentSettleRequestSender } from '../senders/payment_settle_request_sender';

export class RevealSecretAckHandler {
  private readonly db: Database;
  private readonly paymentSettleRequestSender: PaymentSettleRequestSender;

  constructor(
    db: Database,
    paymentSettleRequestSender: PaymentSettleRequestSender
  ) {
    this.db = db;
    this.paymentSettleRequestSender = paymentSettleRequestSender;
  }

  async handle(message: CelerMsg): Promise<void> {
    const ack = message.getRevealSecretAck();
    const paymentIdBytes = ack.getPayId_asU8();
    const paymentId = ethers.utils.hexlify(paymentIdBytes);
    const db = this.db;
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      return;
    }
    const conditionalPay = payment.getConditionalPay();
    const signatureBytes = ack.getPayDestSecretSig_asU8();
    const conditions = conditionalPay.getConditionsList();
    // Assume conditions[0] is a HASH_LOCK
    if (
      conditions.length < 1 ||
      conditions[0].getConditionType() !== ConditionType.HASH_LOCK
    ) {
      return;
    }
    const secretHash = ethers.utils.hexlify(conditions[0].getHashLock_asU8());
    const hashLock = await db.hashLocks.get(secretHash);
    if (!hashLock) {
      return;
    }
    if (
      !CryptoManager.isSignatureValid(
        typeUtils.bytesToAddress(conditionalPay.getDest_asU8()),
        hashLock.secret,
        ethers.utils.splitSignature(signatureBytes)
      )
    ) {
      return;
    }
    // If the only condition is HASH_LOCK, settle the payment
    if (conditions.length === 1) {
      return await this.paymentSettleRequestSender.sendPaymentSettleRequests(
        payment.outgoingChannelId,
        [
          {
            payment,
            settlementAmount: conditionalPay
              .getTransferFunc()
              .getMaxTransfer()
              .getReceiver()
              .getAmt_asU8(),
            reason: PaymentSettleReason.PAY_PAID_MAX
          }
        ]
      );
    }
  }
}
