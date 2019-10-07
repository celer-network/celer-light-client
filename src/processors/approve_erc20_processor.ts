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
import { JsonRpcProvider, TransactionResponse } from 'ethers/providers';
import { BigNumber } from 'ethers/utils';

import erc20Abi from '../abi/erc20.json';
import { Config } from '../config.js';

const APPROVAL_AMOUNT = ethers.utils.parseEther('1e32');

export class ApproveErc20Processor {
  private readonly provider: JsonRpcProvider;
  private readonly config: Config;

  constructor(provider: JsonRpcProvider, config: Config) {
    this.provider = provider;
    this.config = config;
  }

  async approveIfNecessary(tokenAddress: string): Promise<string> {
    const signer = this.provider.getSigner();
    const ledgerAddress = ethers.utils.getAddress(
      this.config.celerLedgerAddress
    );
    const tokenContract = new ethers.Contract(
      tokenAddress,
      JSON.stringify(erc20Abi),
      signer
    );

    const selfAddress = await signer.getAddress();
    const allowance: BigNumber = await tokenContract.allowance(
      selfAddress,
      ledgerAddress
    );
    if (allowance.eq(APPROVAL_AMOUNT)) {
      return '';
    }

    const tx: TransactionResponse = await tokenContract.approve(
      ledgerAddress,
      APPROVAL_AMOUNT
    );
    const receipt = await tx.wait();
    const txHash = tx.hash;
    if (receipt.status === 0) {
      throw new Error(`Approve tx ${txHash} failed`);
    }
    return txHash;
  }
}
