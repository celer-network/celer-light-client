export interface ContractsInfo {
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
}
