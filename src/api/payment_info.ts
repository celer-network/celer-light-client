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

import { PaymentStatus } from '../data/payment';
import { TokenTypeMap } from '../protobufs/entity_pb';

export interface PaymentInfo {
  /** The payment ID */
  readonly paymentId: string;
  /** The token type. See [[TokenTypeMap]] */
  readonly tokenType: TokenTypeMap[keyof TokenTypeMap];
  /** The token address */
  readonly tokenAddress: string;
  /** The maximal amount transferrable to the destination, in wei */
  readonly maxTransferAmount: string;
  /** The ETH address of the recipient */
  readonly destination: string;
  /** The status of the payment. See [[PaymentStatus]] */
  readonly status: PaymentStatus;
  /** The settled amount, in wei */
  readonly settlementAmount: string;
}
