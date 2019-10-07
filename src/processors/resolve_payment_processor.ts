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
import { JsonRpcProvider } from 'ethers/providers';
import { BigNumber } from 'ethers/utils';

import payRegistryAbi from '../abi/pay_registry.json';
import { Config } from '../config';

export class OnChainPaymentInfo {
  readonly amount: BigNumber;
  readonly resolveDeadline: number;

  constructor(amount: BigNumber, resolveDeadline: number) {
    this.amount = amount;
    this.resolveDeadline = resolveDeadline;
  }
}

export class ResolvePaymentProcessor {
  private readonly provider: JsonRpcProvider;
  private readonly config: Config;

  // TODO(dominator008): Complete this
  constructor(provider: JsonRpcProvider, config: Config) {
    this.provider = provider;
    this.config = config;
  }

  async getOnChainPaymentInfo(paymentId: string): Promise<OnChainPaymentInfo> {
    const payRegistry = new ethers.Contract(
      this.config.payRegistryAddress,
      String(payRegistryAbi),
      this.provider
    );
    const [amount, resolveDeadline]: [
      BigNumber,
      BigNumber
    ] = await payRegistry.payInfoMap(ethers.utils.arrayify(paymentId));
    if (resolveDeadline.eq(0)) {
      return undefined;
    }
    return new OnChainPaymentInfo(amount, resolveDeadline.toNumber());
  }
}