import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { ConditionType } from '../../protobufs/entity_pb';
import { CelerMsg, RevealSecret } from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';
import { MessageManager } from '../message_manager';

export class CondPayReceiptHandler {
  private readonly db: Database;

  private readonly messageManager: MessageManager;

  constructor(db: Database, messageManager: MessageManager) {
    this.db = db;
    this.messageManager = messageManager;
  }

  async handle(receiptMessage: CelerMsg): Promise<void> {
    const receipt = receiptMessage.getCondPayReceipt();
    const paymentIdBytes = receipt.getPayId_asU8();
    const paymentId = ethers.utils.hexlify(paymentIdBytes);
    const { db } = this;
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      return;
    }
    const conditionalPay = payment.getConditionalPay();
    const destinationBytes = conditionalPay.getDest_asU8();
    const destination = typeUtils.bytesToAddress(destinationBytes);
    if (
      !CryptoManager.isSignatureValid(
        destination,
        conditionalPay.serializeBinary(),
        ethers.utils.splitSignature(receipt.getPayDestSig_asU8())
      )
    ) {
      return;
    }
    for (const condition of conditionalPay.getConditionsList()) {
      /* eslint-disable no-await-in-loop */
      if (condition.getConditionType() === ConditionType.HASH_LOCK) {
        const secretHash = ethers.utils.hexlify(condition.getHashLock_asU8());
        const hashLock = await db.hashLocks.get(secretHash);
        if (!hashLock) {
          return;
        }
        const revealSecret = new RevealSecret();
        revealSecret.setPayId(paymentIdBytes);
        revealSecret.setSecret(hashLock.secret);
        const revealSecretMessage = new CelerMsg();
        revealSecretMessage.setToAddr(destinationBytes);
        revealSecretMessage.setRevealSecret(revealSecret);
        await this.messageManager.sendMessage(revealSecretMessage);
      }
      /* eslint-enable no-await-in-loop */
    }
  }
}
