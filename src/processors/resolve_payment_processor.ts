import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

import { PayRegistryFactory } from '../abi/PayRegistryFactory';
import { ContractsInfo } from '../api/contracts_info';
import { OnChainPaymentInfo } from './on_chain_payment_info';

export class ResolvePaymentProcessor {
  private readonly provider: JsonRpcProvider;
  private readonly contractsInfo: ContractsInfo;

  // TODO(dominator008): Complete this
  constructor(provider: JsonRpcProvider, contractsInfo: ContractsInfo) {
    this.provider = provider;
    this.contractsInfo = contractsInfo;
  }

  async getOnChainPaymentInfo(paymentId: string): Promise<OnChainPaymentInfo> {
    const payRegistry = PayRegistryFactory.connect(
      this.contractsInfo.payRegistryAddress,
      this.provider
    );
    const { amount, resolveDeadline } = await payRegistry.functions.payInfoMap(
      ethers.utils.arrayify(paymentId)
    );
    if (resolveDeadline.eq(0)) {
      return undefined;
    }
    return new OnChainPaymentInfo(amount, resolveDeadline.toNumber());
  }
}
