/**
 * @fileoverview A client-side database based on dexie.js
 */

import Dexie from 'dexie';

import { HashLock } from './hash_lock';
import { Payment } from './payment';
import { PaymentChannel } from './payment_channel';

const CELER_DATABASE = 'CelerDatabase';

export class Database extends Dexie {
  readonly paymentChannels: Dexie.Table<PaymentChannel, string>;
  readonly payments: Dexie.Table<Payment, string>;
  readonly hashLocks: Dexie.Table<HashLock, string>;

  constructor() {
    super(CELER_DATABASE);

    this.version(1).stores({
      paymentChannels: 'channelId, [selfAddress+peerAddress+tokenAddress]',
      payments: 'paymentId, status',
      hashLocks: 'hash',
    });

    this.paymentChannels.mapToClass(PaymentChannel);
    this.payments.mapToClass(Payment);
    this.hashLocks.mapToClass(HashLock);
  }
}
