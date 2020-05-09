export interface Config {
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
