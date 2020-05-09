import { ethers } from 'ethers';

import { Condition, ConditionType } from '../protobufs/entity_pb';
import { Database } from './database';
import { HashLock } from './hash_lock';

export class HashLockUtils {
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
