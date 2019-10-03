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

export interface Config {
  /** The CelerLedger contract address */
  readonly celerLedgerAddress: string;
  /** The CelerWallet contract address */
  readonly celerWalletAddress: string;
  /** The PayRegistry contract address */
  readonly payRegistryAddress: string;
  /** The PayResolver contract address */
  readonly payResolverAddress: string;
  /** The VirtContractResolver contract address */
  readonly virtContractResolverAddress: string;

  /** The payment channel open timeout, in blocks */
  readonly paymentChannelOpenTimeout: number;
  /** The payment channel dispute timeout, in blocks */
  readonly paymentChannelDisputeTimeout: number;
  /** The payment resolution dispute timeout, in blocks */
  readonly paymentResolutionDisputeTimeout: number;
  /** The default payment timeout, in blocks */
  readonly defaultPaymentTimeout: number;
  /** The maximal number of pending payments on a channel */
  readonly maxPendingPayments: number;

  /** The JSON-RPC URL for the Ethereum provider */
  readonly ethJsonRpcUrl: string;
  /** The ETH address of the Off-chain Service Provider (OSP) */
  readonly ospEthAddress: string;
  /** The network address of the Off-chain Service Provider (OSP) */
  readonly ospNetworkAddress: string;
}
