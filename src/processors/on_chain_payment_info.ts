import { BigNumber } from 'ethers/utils';

export class OnChainPaymentInfo {
  readonly amount: BigNumber;
  readonly resolveDeadline: number;

  constructor(amount: BigNumber, resolveDeadline: number) {
    this.amount = amount;
    this.resolveDeadline = resolveDeadline;
  }
}
