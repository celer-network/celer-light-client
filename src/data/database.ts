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

/**
 * @fileoverview A client-side database based on dexie.js
 */

import Dexie from 'dexie';

import { HashLock } from './hash_lock';
import { Payment } from './payment';
import { PaymentChannel } from './payment_channel';

const CELER_DATABASE = `CelerDatabase`;

export class Database extends Dexie {
  readonly paymentChannels: Dexie.Table<PaymentChannel, string>;
  readonly payments: Dexie.Table<Payment, string>;
  readonly hashLocks: Dexie.Table<HashLock, string>;

  constructor() {
    super(CELER_DATABASE);

    const db = this;
    db.version(1).stores({
      paymentChannels: 'channelId,peerAddress,tokenAddress',
      payments: 'paymentId,status,incomingChannelId,outgoingChannelId',
      hashLocks: 'hash'
    });

    db.paymentChannels.mapToClass(PaymentChannel);
    db.payments.mapToClass(Payment);
    db.hashLocks.mapToClass(HashLock);
  }
}
