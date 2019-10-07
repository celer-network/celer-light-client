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

import { CustomSigner } from '../crypto/custom_signer';
import { SimplexPaymentChannel, TokenTypeMap } from '../protobufs/entity_pb';
import { ErrCode, SignedSimplexState } from '../protobufs/message_pb';
import * as errorUtils from '../utils/errors';
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
    const myDeposit = ethers.utils.bigNumberify(depositWithdrawal.selfDeposit);
    const myWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.selfWithdrawal
    );
    const peerDeposit = ethers.utils.bigNumberify(
      depositWithdrawal.peerDeposit
    );
    const peerWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.peerWithdrawal
    );
    const myPendingWithdrawal = depositWithdrawal.selfPendingWithdrawal
      ? ethers.utils.bigNumberify(
          depositWithdrawal.selfPendingWithdrawal.amount
        )
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
    signer: CustomSigner,
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

  static isSeqNumValid(
    stored: number,
    receivedBase: number,
    receivedProposed: number
  ): boolean {
    return stored === receivedBase && receivedProposed > stored;
  }

  static async verifyChannelExistence(
    db: Database,
    receivedChannelId: string
  ): Promise<{
    readonly result: errorUtils.VerificationResult;
    readonly channel?: PaymentChannel;
    readonly storedSignedSimplexState?: SignedSimplexState;
    readonly storedSimplexState?: SimplexPaymentChannel;
  }> {
    const channel = await db.paymentChannels.get(receivedChannelId);
    if (!channel) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.unknownChannel(receivedChannelId).message
        }
      };
    }
    const storedSignedSimplexState = channel.getIncomingSignedSimplexState();
    const storedSimplexState = SimplexPaymentChannel.deserializeBinary(
      storedSignedSimplexState.getSimplexState_asU8()
    );
    return {
      result: { valid: true },
      channel,
      storedSignedSimplexState,
      storedSimplexState
    };
  }

  static deserializeSignedSimplexState(
    signedSimplexState: SignedSimplexState
  ): [SimplexPaymentChannel, Uint8Array] {
    const simplexStateBytes = signedSimplexState.getSimplexState_asU8();
    const simplexState = SimplexPaymentChannel.deserializeBinary(
      simplexStateBytes
    );
    return [simplexState, simplexStateBytes];
  }

  static verifyCommonSimplexStates(
    channel: PaymentChannel,
    peerAddress: string,
    receivedChannelId: string,
    receivedBaseSeqNum: number,
    receivedSignedSimplexState: SignedSimplexState,
    receivedSimplexState: SimplexPaymentChannel,
    receivedSimplexStateBytes: Uint8Array,
    storedSimplexState: SimplexPaymentChannel
  ): errorUtils.VerificationResult {
    // Verify channel OPEN status
    if (channel.status !== PaymentChannelStatus.OPEN) {
      return {
        valid: false,
        errReason: errorUtils.paymentChannelNotOpen(receivedChannelId).message
      };
    }

    // Verify peer signature
    const peerSignature = ethers.utils.splitSignature(
      receivedSignedSimplexState.getSigOfPeerFrom_asU8()
    );
    if (
      !CustomSigner.isSignatureValid(
        peerAddress,
        receivedSimplexStateBytes,
        peerSignature
      )
    ) {
      return {
        valid: false,
        errCode: ErrCode.INVALID_SIG
      };
    }

    // Verify peerFrom
    if (
      ethers.utils.hexlify(receivedSimplexState.getPeerFrom_asU8()) !==
      ethers.utils.hexlify(storedSimplexState.getPeerFrom_asU8())
    ) {
      return {
        valid: false,
        errReason: 'Invalid peerFrom'
      };
    }

    // Verify base sequence number and proposed sequence number
    if (
      !PaymentChannel.isSeqNumValid(
        storedSimplexState.getSeqNum(),
        receivedSimplexState.getSeqNum(),
        receivedBaseSeqNum
      )
    ) {
      return {
        valid: false,
        errCode: ErrCode.INVALID_SEQ_NUM
      };
    }
  }
}
