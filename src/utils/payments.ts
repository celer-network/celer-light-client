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

import { ConditionalPay } from '../protobufs/entity_pb';

export function calculatePaymentId(payment: ConditionalPay): string {
  const paymentBytes = payment.serializeBinary();
  const paymentHash = ethers.utils.arrayify(
    ethers.utils.keccak256(paymentBytes)
  );
  const resolver = payment.getPayResolver_asU8();
  const packed = new Uint8Array(paymentHash.length + resolver.length);
  packed.set(paymentHash);
  packed.set(resolver, paymentHash.length);
  return ethers.utils.keccak256(packed);
}

export function getAddedAndRemovedPendingPayments(
  oldPayments: Array<string | Uint8Array>,
  newPayments: Array<string | Uint8Array>
) {
  const added = newPayments.filter(x => !oldPayments.includes(x));
  const removed = oldPayments.filter(x => !newPayments.includes(x));
  return [added, removed];
}

export function isSeqNumValid(
  stored: number,
  receivedBase: number,
  receivedProposed: number
): boolean {
  return stored === receivedBase && receivedProposed > stored;
}
