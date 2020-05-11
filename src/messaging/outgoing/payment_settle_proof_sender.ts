import { ethers } from 'ethers';

import {
  CelerMsg,
  PaymentSettleProof,
  PaymentSettleReasonMap,
  SettledPayment,
} from '../../protobufs/message_pb';
import { MessageManager } from '../message_manager';

export interface PaymentSettleProofInfo {
  paymentId: string;
  reason: PaymentSettleReasonMap[keyof PaymentSettleReasonMap];
}
export class PaymentSettleProofSender {
  private readonly messageManager: MessageManager;

  constructor(messageManager: MessageManager) {
    this.messageManager = messageManager;
  }

  async sendPaymentSettleProofs(
    settleProofInfos: PaymentSettleProofInfo[]
  ): Promise<void> {
    const settledPaysList = [];
    const proof = new PaymentSettleProof();
    for (const info of settleProofInfos) {
      const settledPayment = new SettledPayment();
      settledPayment.setSettledPayId(ethers.utils.arrayify(info.paymentId));
      settledPayment.setReason(info.reason);
      settledPaysList.push(settledPayment);
    }
    proof.setSettledPaysList(settledPaysList);
    const message = new CelerMsg();
    message.setPaymentSettleProof(proof);
    await this.messageManager.sendMessage(message);
    // TODO(dominator008): Check if we need persistance here.
  }
}
