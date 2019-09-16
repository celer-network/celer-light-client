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

import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { ConditionalPay } from '../protobufs/entity_pb';

export enum PaymentStatus {
  INITIAL = 0,
  PEER_FROM_SIGNED_PENDING = 1,
  CO_SIGNED_PENDING = 2,
  HASH_LOCK_REVEALED = 3,
  PEER_FROM_SIGNED_SETTLED = 4,
  CO_SIGNED_SETTLED = 5,
  EXPIRED = 6,
  FAILED = 7
}

export class Payment {
  readonly paymentId: string;
  readonly incomingChannelId: string;
  readonly outgoingChannelId: string;
  readonly note: Uint8Array; // Any
  private conditionalPay: Uint8Array; // ConditionalPay

  status: PaymentStatus;
  settlementAmount: Uint8Array; // BigNumber

  constructor(
    paymentId: string,
    conditionalPay: ConditionalPay,
    note: Any,
    incomingChannelId: string,
    outgoingChannelId: string
  ) {
    this.paymentId = paymentId;
    this.setConditionalPay(conditionalPay);
    this.status = PaymentStatus.INITIAL;
    this.note = note.serializeBinary();
    this.incomingChannelId = incomingChannelId;
    this.outgoingChannelId = outgoingChannelId;
  }

  getConditionalPay(): ConditionalPay {
    return ConditionalPay.deserializeBinary(this.conditionalPay);
  }

  setConditionalPay(conditionalPay: ConditionalPay): void {
    this.conditionalPay = conditionalPay.serializeBinary();
  }

  getNote(): Any {
    return Any.deserializeBinary(this.note);
  }
}
