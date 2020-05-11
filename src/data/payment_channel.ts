import { ethers } from 'ethers';

import { CryptoManager } from '../crypto/crypto_manager';
import { SimplexPaymentChannel, TokenTypeMap } from '../protobufs/entity_pb';
import { ErrCode, SignedSimplexState } from '../protobufs/message_pb';
import * as errorUtils from '../utils/errors';
import { Balance } from './balance';
import { DepositWithdrawal } from './deposit_withdrawal';

export enum PaymentChannelStatus {
  OPEN = 0,
  SETTLING = 1,
  SETTLED = 2,
}

export class PaymentChannel {
  readonly channelId: string;
  readonly selfAddress: string;
  readonly peerAddress: string;
  readonly tokenType: TokenTypeMap[keyof TokenTypeMap];
  readonly tokenAddress: string;

  ledgerAddress: string;
  depositWithdrawal: DepositWithdrawal;
  status: PaymentChannelStatus;

  private incomingSignedSimplexState: Uint8Array; // SignedSimplexState
  private outgoingSignedSimplexState: Uint8Array; // SignedSimplexState

  constructor(
    channelId: string,
    selfAddress: string,
    peerAddress: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    ledgerAddress: string
  ) {
    this.channelId = channelId;
    this.selfAddress = selfAddress;
    this.peerAddress = peerAddress;
    this.tokenType = tokenType;
    this.tokenAddress = tokenAddress;
    this.ledgerAddress = ledgerAddress;

    this.status = PaymentChannelStatus.OPEN;
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

    const { depositWithdrawal } = this;
    const selfDeposit = ethers.utils.bigNumberify(
      depositWithdrawal.selfDeposit
    );
    const selfWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.selfWithdrawal
    );
    const peerDeposit = ethers.utils.bigNumberify(
      depositWithdrawal.peerDeposit
    );
    const peerWithdrawal = ethers.utils.bigNumberify(
      depositWithdrawal.peerWithdrawal
    );
    const selfPendingWithdrawal = depositWithdrawal.selfPendingWithdrawal
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
      incomingSimplexState.getTransferToPeer().getReceiver().getAmt_asU8()
    );
    const transferToPeer = ethers.utils.bigNumberify(
      outgoingSimplexState.getTransferToPeer().getReceiver().getAmt_asU8()
    );
    const pendingTransferToPeer = ethers.utils.bigNumberify(
      outgoingSimplexState.getTotalPendingAmount_asU8()
    );
    const pendingTransferFromPeer = ethers.utils.bigNumberify(
      incomingSimplexState.getTotalPendingAmount_asU8()
    );

    const freeSendingCapacity = selfDeposit
      .sub(selfWithdrawal)
      .sub(selfPendingWithdrawal)
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
    cryptoManager: CryptoManager,
    signedSimplexState: SignedSimplexState,
    simplexState: SimplexPaymentChannel
  ): Promise<void> {
    const simplexStateBytes = simplexState.serializeBinary();
    const sigOfPeerFromBytes = ethers.utils.arrayify(
      await cryptoManager.signHash(simplexStateBytes)
    );
    signedSimplexState.setSimplexState(simplexStateBytes);
    signedSimplexState.setSigOfPeerFrom(sigOfPeerFromBytes);
    signedSimplexState.setSimplexState(simplexState.serializeBinary());
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

  static verifyIncomingCommonSimplexStates(
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
        errReason: errorUtils.paymentChannelNotOpen(receivedChannelId).message,
      };
    }

    // Verify peer signature
    const peerFromSignature = ethers.utils.splitSignature(
      receivedSignedSimplexState.getSigOfPeerFrom_asU8()
    );
    if (
      !CryptoManager.isSignatureValid(
        peerAddress,
        receivedSimplexStateBytes,
        peerFromSignature
      )
    ) {
      return {
        valid: false,
        errCode: ErrCode.INVALID_SIG,
      };
    }

    // Verify peerFrom
    if (
      receivedSimplexState.getPeerFrom_asB64() !==
      storedSimplexState.getPeerFrom_asB64()
    ) {
      return {
        valid: false,
        errReason: 'Invalid peerFrom',
      };
    }

    // Verify base sequence number and proposed sequence number
    if (
      !PaymentChannel.isSeqNumValid(
        storedSimplexState.getSeqNum(),
        receivedBaseSeqNum,
        receivedSimplexState.getSeqNum()
      )
    ) {
      return {
        valid: false,
        errCode: ErrCode.INVALID_SEQ_NUM,
      };
    }

    return { valid: true };
  }

  private static isSeqNumValid(
    stored: number,
    receivedBase: number,
    receivedProposed: number
  ): boolean {
    return stored === receivedBase && receivedProposed > stored;
  }
}
