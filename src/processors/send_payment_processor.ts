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

import { BigNumber } from 'ethers/utils';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { CondPayRequestSender } from '../messaging/senders/cond_pay_request_sender';
import {
  Condition,
  TokenInfo,
  TransferFunctionType,
  TransferFunctionTypeMap
} from '../protobufs/entity_pb';

export class SendPaymentProcessor {
  private readonly condPayRequestSender: CondPayRequestSender;

  constructor(condPayRequestSender: CondPayRequestSender) {
    this.condPayRequestSender = condPayRequestSender;
  }

  async sendConditionalPayment(
    tokenInfo: TokenInfo,
    destination: string,
    amount: BigNumber,
    transferFunctionType: TransferFunctionTypeMap[keyof TransferFunctionTypeMap],
    conditions: Condition[],
    timeout: number,
    note: Any
  ): Promise<string> {
    if (transferFunctionType !== TransferFunctionType.BOOLEAN_AND) {
      throw new Error('Unsupported transfer function type');
    }
    return this.condPayRequestSender.sendConditionalPayment(
      tokenInfo,
      destination,
      amount,
      transferFunctionType,
      conditions,
      timeout,
      note
    );
  }
}
