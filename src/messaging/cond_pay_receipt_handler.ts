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

import { CustomSigner } from '../crypto/custom_signer';
import { ConditionType } from '../protobufs/entity_pb';
import { CelerMsg, RevealSecret } from '../protobufs/message_pb';
import { Database } from '../storage/database';
import * as utils from '../utils/types';
import { MessageManager } from './message_manager';

export class CondPayReceiptHandler {
  private readonly db: Database;
  private readonly messageManager: MessageManager;

  constructor(db: Database, messageManager: MessageManager) {
    this.db = db;
    this.messageManager = messageManager;
  }

  async handle(incomingMessage: CelerMsg): Promise<void> {
    const receipt = incomingMessage.getCondPayReceipt();
    const paymentIdBytes = receipt.getPayId_asU8();
    const paymentId = ethers.utils.hexlify(paymentIdBytes);
    const db = this.db;
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      return;
    }
    const conditionalPay = payment.getConditionalPay();
    const destinationBytes = conditionalPay.getDest_asU8();
    const destination = utils.bytesToAddress(destinationBytes);
    if (
      !CustomSigner.isSignatureValid(
        destination,
        conditionalPay.serializeBinary(),
        ethers.utils.splitSignature(receipt.getPayDestSig_asU8())
      )
    ) {
      return;
    }
    for (const condition of conditionalPay.getConditionsList()) {
      if (condition.getConditionType() === ConditionType.HASH_LOCK) {
        const secretHash = ethers.utils.hexlify(condition.getHashLock_asU8());
        const hashLock = await db.hashLocks.get(secretHash);
        if (!hashLock) {
          return;
        }
        const revealSecretMessage = new RevealSecret();
        revealSecretMessage.setPayId(paymentIdBytes);
        revealSecretMessage.setSecret(hashLock.secret);
        const outgoingMessage = new CelerMsg();
        outgoingMessage.setToAddr(destinationBytes);
        outgoingMessage.setRevealSecret(revealSecretMessage);
        await this.messageManager.sendMessage(outgoingMessage);
      }
    }
  }
}
