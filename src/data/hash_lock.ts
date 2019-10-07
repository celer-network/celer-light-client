/**
 * @license
 * The MIT License
 *
 * Copyright (c) 2019 ScaleSphere Foundation LTD
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

import { Condition, ConditionType } from '../protobufs/entity_pb';
import { Database } from './database';

export class HashLock {
  readonly secret: Uint8Array;
  readonly hash: string;

  constructor(secret: Uint8Array, hash: string) {
    this.secret = secret;
    this.hash = hash;
  }

  static async generateHashLockCondition(db: Database): Promise<Condition> {
    const secret = ethers.utils.randomBytes(32);
    const hash = ethers.utils.keccak256(secret);
    const hashLockCondition = new Condition();
    hashLockCondition.setConditionType(ConditionType.HASH_LOCK);
    hashLockCondition.setHashLock(ethers.utils.arrayify(hash));
    await db.hashLocks.add(new HashLock(secret, hash));
    return hashLockCondition;
  }

  static async removeHashLockCondition(
    db: Database,
    condition: Condition
  ): Promise<void> {
    if (condition.getConditionType() !== ConditionType.HASH_LOCK) {
      return;
    }
    const hash = ethers.utils.hexlify(condition.getHashLock_asU8());
    await db.hashLocks.delete(hash);
  }
}
