import { BigNumber } from 'ethers/utils';

export class Balance {
  readonly freeSendingCapacity: BigNumber;
  readonly freeReceivingCapacity: BigNumber;
  readonly lockedSendingCapacity: BigNumber;
  readonly lockedReceivingCapacity: BigNumber;

  constructor(
    freeSendingCapacity: BigNumber,
    freeReceivingCapacity: BigNumber,
    lockedSendingCapacity: BigNumber,
    lockedReceivingCapacity: BigNumber
  ) {
    this.freeSendingCapacity = freeSendingCapacity;
    this.freeReceivingCapacity = freeReceivingCapacity;
    this.lockedSendingCapacity = lockedSendingCapacity;
    this.lockedReceivingCapacity = lockedReceivingCapacity;
  }
}
