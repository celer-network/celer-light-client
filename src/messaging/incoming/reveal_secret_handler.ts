import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { HashLock } from '../../data/hash_lock';
import { PaymentStatus } from '../../data/payment';
import { ConditionType } from '../../protobufs/entity_pb';
import { CelerMsg, RevealSecretAck } from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';
import { MessageManager } from '../message_manager';

export class RevealSecretHandler {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly cryptoManager: CryptoManager;

  constructor(
    db: Database,
    messageManager: MessageManager,
    cryptoManager: CryptoManager
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.cryptoManager = cryptoManager;
  }

  async handle(revealSecretMessage: CelerMsg): Promise<void> {
    const revealSecret = revealSecretMessage.getRevealSecret();
    const secret = revealSecret.getSecret_asU8();
    const paymentIdBytes = revealSecret.getPayId_asU8();
    const paymentId = ethers.utils.hexlify(paymentIdBytes);
    const { db } = this;
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      return;
    }
    const conditionalPay = payment.getConditionalPay();
    if (
      typeUtils.bytesToAddress(conditionalPay.getDest_asU8()) !==
      (await this.cryptoManager.signer.getAddress())
    ) {
      return;
    }
    const hash = ethers.utils.keccak256(secret);
    const conditions = conditionalPay.getConditionsList();
    if (
      conditions.length < 1 ||
      conditions[0].getConditionType() !== ConditionType.HASH_LOCK ||
      ethers.utils.hexlify(conditions[0].getHashLock_asU8()) !== hash
    ) {
      return;
    }

    await this.db.hashLocks.put(new HashLock(secret, hash));

    const signature = await this.cryptoManager.signHash(secret);
    const revealSecretAck = new RevealSecretAck();
    revealSecretAck.setPayId(paymentIdBytes);
    revealSecretAck.setPayDestSecretSig(ethers.utils.arrayify(signature));
    const revealSecretAckMessage = new CelerMsg();
    revealSecretAckMessage.setToAddr(conditionalPay.getSrc_asU8());
    revealSecretAckMessage.setRevealSecretAck(revealSecretAck);
    await this.messageManager.sendMessage(revealSecretAckMessage);

    payment.status = PaymentStatus.HASH_LOCK_REVEALED;
    await this.db.payments.put(payment);
  }
}
