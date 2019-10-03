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

export class CustomSigner {
  readonly provider: JsonRpcProvider;

  constructor(provider: JsonRpcProvider) {
    this.provider = provider;
  }

  async signHash(data: Uint8Array): Promise<string> {
    const hash = ethers.utils.arrayify(ethers.utils.keccak256(data));
    const signature = await this.provider.getSigner().signMessage(hash);
    return CustomSigner.joinSignature(ethers.utils.splitSignature(signature));
  }

  private static joinSignature(signature: ethers.utils.Signature): string {
    // Hack to use v: 00/01
    // TODO(dominator008): Remove once OSP accepts 27/28
    signature = ethers.utils.splitSignature(signature);
    return ethers.utils.hexlify(
      ethers.utils.concat([
        signature.r,
        signature.s,
        signature.recoveryParam ? '0x1' : '0x0'
      ])
    );
  }

  static isSignatureValid(
    signer: string,
    data: Uint8Array,
    signature: ethers.utils.Signature
  ): boolean {
    return (
      ethers.utils.verifyMessage(
        ethers.utils.arrayify(ethers.utils.keccak256(data)),
        signature
      ) === signer
    );
  }
}
