export class PendingWithdrawal {
  amount: Uint8Array;
  deadline: number;

  constructor(amount: Uint8Array, deadline: number) {
    this.amount = amount;
    this.deadline = deadline;
  }
}
