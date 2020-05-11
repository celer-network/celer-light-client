import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { ConditionType } from '../../protobufs/entity_pb';
import { CelerMsg, PaymentSettleReason } from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';
import { PaymentSettleRequestSender } from '../outgoing/payment_settle_request_sender';

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
    const { db } = this;
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
      await this.paymentSettleRequestSender.sendPaymentSettleRequests(
        payment.outgoingChannelId,
        [
          {
            payment,
            settlementAmount: conditionalPay
              .getTransferFunc()
              .getMaxTransfer()
              .getReceiver()
              .getAmt_asU8(),
            reason: PaymentSettleReason.PAY_PAID_MAX,
          },
        ]
      );
    }
  }
}
