import { ethers, Signer } from 'ethers';

import { Erc20Factory } from '../abi/Erc20Factory';
import { ContractsInfo } from '../api/contracts_info';

const APPROVAL_AMOUNT = ethers.utils.parseEther('1e32');

export class ApproveErc20Processor {
  private readonly signer: Signer;
  private readonly contractsInfo: ContractsInfo;

  constructor(signer: Signer, contractsInfo: ContractsInfo) {
    this.signer = signer;
    this.contractsInfo = contractsInfo;
  }

  async approveIfNecessary(tokenAddress: string): Promise<string> {
    const { signer } = this;
    const ledgerAddress = ethers.utils.getAddress(
      this.contractsInfo.celerLedgerAddress
    );
    const tokenContract = Erc20Factory.connect(tokenAddress, signer);

    const selfAddress = await signer.getAddress();
    const allowance = await tokenContract.functions.allowance(
      selfAddress,
      ledgerAddress
    );
    if (allowance.eq(APPROVAL_AMOUNT)) {
      return '';
    }

    const tx = await tokenContract.functions.approve(
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
