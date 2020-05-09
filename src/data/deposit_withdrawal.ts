import { PendingWithdrawal } from './pending_withdrawal';

export class DepositWithdrawal {
  selfDeposit: Uint8Array;
  selfWithdrawal: Uint8Array;
  peerDeposit: Uint8Array;
  peerWithdrawal: Uint8Array;
  selfPendingWithdrawal: PendingWithdrawal;
  peerPendingWithdrawal: PendingWithdrawal;

  constructor(
    selfDeposit: Uint8Array,
    selfWithdrawal: Uint8Array,
    peerDeposit: Uint8Array,
    peerWithdrawal: Uint8Array
  ) {
    this.selfDeposit = selfDeposit;
    this.selfWithdrawal = selfWithdrawal;
    this.peerDeposit = peerDeposit;
    this.peerWithdrawal = peerWithdrawal;
  }
}
