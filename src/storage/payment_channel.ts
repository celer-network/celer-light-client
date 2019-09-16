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

import { ethers } from 'ethers';

import { Signer } from '../crypto/signer';
import { SimplexPaymentChannel, TokenTypeMap } from '../protobufs/entity_pb';
import { SignedSimplexState } from '../protobufs/message_pb';
import { Balance } from './balance';
import { Database } from './database';
import { DepositWithdrawal } from './deposit_withdrawal';

export enum PaymentChannelStatus {
  OPEN = 0,
  SETTLING = 1,
  SETTLED = 2
}

export class PaymentChannel {
  channelId: string;
  peerAddress: string;
  tokenType: TokenTypeMap[keyof TokenTypeMap];
  tokenAddress: string;
  depositWithdrawal: DepositWithdrawal;
  status: PaymentChannelStatus;
  sequenceNumber: number;
  private incomingSignedSimplexState: Uint8Array; // SignedSimplexState
  private outgoingSignedSimplexState: Uint8Array; // SignedSimplexState

  constructor(
    channelId: string,
    peerAddress: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string
  ) {
    this.channelId = channelId;
    this.peerAddress = peerAddress;
    this.tokenType = tokenType;
    this.tokenAddress = tokenAddress;

    this.status = PaymentChannelStatus.OPEN;
    this.sequenceNumber = 0;
  }

  setIncomingSignedSimplexState(state: SignedSimplexState): void {
    this.incomingSignedSimplexState = state.serializeBinary();
  }

  getIncomingSignedSimplexState(): SignedSimplexState {
    return SignedSimplexState.deserializeBinary(
      this.incomingSignedSimplexState
    );
  }

  setOutgoingSignedSimplexState(state: SignedSimplexState): void {
    this.outgoingSignedSimplexState = state.serializeBinary();
  }

  getOutgoingSignedSimplexState(): SignedSimplexState {
    return SignedSimplexState.deserializeBinary(
      this.outgoingSignedSimplexState
    );
  }

  calculateBalance(): Balance {
    const incomingSimplexState = SimplexPaymentChannel.deserializeBinary(
      this.getIncomingSignedSimplexState().getSimplexState_asU8()
    );
    const outgoingSimplexState = SimplexPaymentChannel.deserializeBinary(
      this.getOutgoingSignedSimplexState().getSimplexState_asU8()
    );

    const depositWithdrawal = this.depositWithdrawal;
    const myDeposit = ethers.utils.bigNumberify(depositWithdrawal.myDeposit);
    const myWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.myWithdrawal
    );
    const peerDeposit = ethers.utils.bigNumberify(
      depositWithdrawal.peerDeposit
    );
    const peerWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.peerWithdrawal
    );
    const myPendingWithdrawal = depositWithdrawal.myPendingWithdrawal
      ? ethers.utils.bigNumberify(depositWithdrawal.myPendingWithdrawal.amount)
      : ethers.utils.bigNumberify(0);
    const peerPendingWithdrawal = depositWithdrawal.peerPendingWithdrawal
      ? ethers.utils.bigNumberify(
          depositWithdrawal.peerPendingWithdrawal.amount
        )
      : ethers.utils.bigNumberify(0);
    const transferFromPeer = ethers.utils.bigNumberify(
      incomingSimplexState
        .getTransferToPeer()
        .getReceiver()
        .getAmt_asU8()
    );
    const transferToPeer = ethers.utils.bigNumberify(
      outgoingSimplexState
        .getTransferToPeer()
        .getReceiver()
        .getAmt_asU8()
    );
    const pendingTransferToPeer = ethers.utils.bigNumberify(
      outgoingSimplexState.getTotalPendingAmount_asU8()
    );
    const pendingTransferFromPeer = ethers.utils.bigNumberify(
      incomingSimplexState.getTotalPendingAmount_asU8()
    );

    const freeSendingCapacity = myDeposit
      .sub(myWithdrawal)
      .sub(myPendingWithdrawal)
      .add(transferFromPeer)
      .sub(transferToPeer)
      .sub(pendingTransferToPeer);
    const freeReceivingCapacity = peerDeposit
      .sub(peerWithdrawal)
      .sub(peerPendingWithdrawal)
      .add(transferToPeer)
      .sub(transferFromPeer)
      .sub(pendingTransferFromPeer);
    const lockedSendingCapacity = pendingTransferToPeer;
    const lockedReceivingCapacity = pendingTransferFromPeer;

    return new Balance(
      freeSendingCapacity,
      freeReceivingCapacity,
      lockedSendingCapacity,
      lockedReceivingCapacity
    );
  }

  static async signUpdatedSimplexState(
    signer: Signer,
    signedSimplexState: SignedSimplexState,
    simplexState: SimplexPaymentChannel
  ): Promise<void> {
    const simplexStateBytes = simplexState.serializeBinary();
    const sigOfPeerFromBytes = ethers.utils.arrayify(
      await signer.signHash(simplexStateBytes)
    );
    signedSimplexState.setSimplexState(simplexStateBytes);
    signedSimplexState.setSigOfPeerFrom(sigOfPeerFromBytes);
    signedSimplexState.setSimplexState(simplexState.serializeBinary());
  }

  static async storeCosignedSimplexState(
    cosignedState: SignedSimplexState,
    db: Database,
    peerAddress: string
  ) {
    await db.transaction('rw', db.paymentChannels, async () => {
      const paymentChannel = await db.paymentChannels.get({
        peerAddress
      });
      if (!paymentChannel) {
        return;
      }
      paymentChannel.setOutgoingSignedSimplexState(cosignedState);
      await db.paymentChannels.put(paymentChannel);
    });
  }
}
