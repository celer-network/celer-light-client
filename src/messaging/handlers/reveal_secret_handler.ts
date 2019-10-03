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

import { CustomSigner } from '../../crypto/custom_signer';
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
  private readonly signer: CustomSigner;

  constructor(
    db: Database,
    messageManager: MessageManager,
    signer: CustomSigner
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.signer = signer;
  }

  async handle(revealSecretMessage: CelerMsg): Promise<void> {
    const revealSecret = revealSecretMessage.getRevealSecret();
    const secret = revealSecret.getSecret_asU8();
    const paymentIdBytes = revealSecret.getPayId_asU8();
    const paymentId = ethers.utils.hexlify(paymentIdBytes);
    const db = this.db;
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      return;
    }
    const conditionalPay = payment.getConditionalPay();
    if (
      typeUtils.bytesToAddress(conditionalPay.getDest_asU8()) !==
      (await this.signer.provider.getSigner().getAddress())
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

    const signature = await this.signer.signHash(secret);
    const revealSecretAck = new RevealSecretAck();
    revealSecretAck.setPayId(paymentIdBytes);
    revealSecretAck.setPayDestSecretSig(signature);
    const revealSecretAckMessage = new CelerMsg();
    revealSecretAckMessage.setToAddr(conditionalPay.getSrc_asU8());
    revealSecretAckMessage.setRevealSecretAck(revealSecretAck);
    await this.messageManager.sendMessage(revealSecretAckMessage);

    payment.status = PaymentStatus.HASH_LOCK_REVEALED;
    await this.db.payments.put(payment);
  }
}
