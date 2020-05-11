import { ethers } from 'ethers';

import { CelerLedgerFactory } from '../../abi/CelerLedgerFactory';
import { ContractsInfo } from '../../api/contracts_info';
import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { DepositWithdrawal } from '../../data/deposit_withdrawal';
import { Payment, PaymentStatus } from '../../data/payment';
import {
  PaymentChannel,
  PaymentChannelStatus,
} from '../../data/payment_channel';
import {
  ConditionalPay,
  SimplexPaymentChannel,
} from '../../protobufs/entity_pb';
import {
  CelerMsg,
  ChannelInAuth,
  PayInAuthAck,
  SignedSimplexState,
} from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';

// Needs to match the field numbers in goCeler
enum ChannelStateInAuth {
  NULL = 0,
  TRUST_OPENED = 1,
  INSTANTIATING = 2,
  OPENED = 3,
  SETTLING = 4,
  CLOSED = 5,
}

// Needs to match the field numbers in goCeler
enum PaymentStateInAuth {
  NULL = 0,
  ONESIG_PENDING = 1,
  COSIGNED_PENDING = 2,
  SECRET_REVEALED = 3,
  ONESIG_PAID = 4,
  COSIGNED_PAID = 5,
  ONESIG_CANCELED = 6,
  COSIGNED_CANCLED = 7,
  NACKED = 8,
  INGRESS_REJECTED = 9,
}

export class AuthAckHandler {
  private readonly db: Database;
  private readonly cryptoManager: CryptoManager;
  private readonly contractsInfo: ContractsInfo;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    cryptoManager: CryptoManager,
    contractsInfo: ContractsInfo,
    peerAddress: string
  ) {
    this.db = db;
    this.cryptoManager = cryptoManager;
    this.contractsInfo = contractsInfo;
    this.peerAddress = peerAddress;
  }

  async handle(ackMessage: CelerMsg): Promise<void> {
    const ack = ackMessage.getAuthAck();
    if (!ack) {
      return;
    }
    const selfAddress = await this.cryptoManager.signer.getAddress();
    const results: Promise<void>[] = [];
    for (const channelInAuth of ack.getSyncChannelsList()) {
      results.push(this.processChannelInAuth(channelInAuth, selfAddress));
    }
    await Promise.all(results);
  }

  private async processChannelInAuth(
    channelInAuth: ChannelInAuth,
    selfAddress: string
  ): Promise<void> {
    const channelState = channelInAuth.getChannelState();
    if (
      channelState === ChannelStateInAuth.NULL ||
      channelState === ChannelStateInAuth.CLOSED ||
      channelState === ChannelStateInAuth.TRUST_OPENED ||
      channelState === ChannelStateInAuth.INSTANTIATING
    ) {
      // Don't sync unsupported channel states
      return;
    }
    const channelIdBytes = channelInAuth.getCid_asU8();
    const channelId = ethers.utils.hexlify(channelIdBytes);
    let outgoingSignedSimplexState = channelInAuth.getAuthreqSimplex();
    let incomingSignedSimplexState = channelInAuth.getAuthackSimplex();
    let incomingSimplexState;
    let incomingSimplexStateBytes;
    let outgoingSimplexState;
    let outgoingSimplexStateBytes;
    // A non-null Simplex means that peer sees need to sync
    if (incomingSignedSimplexState) {
      [
        incomingSimplexState,
        incomingSimplexStateBytes,
      ] = PaymentChannel.deserializeSignedSimplexState(
        incomingSignedSimplexState
      );
      const [
        valid,
        fixedIncomingSignedSimplexState,
      ] = await this.verifyAndFixSignedSimplexState(
        incomingSignedSimplexState,
        incomingSimplexState,
        incomingSimplexStateBytes,
        channelId,
        this.peerAddress,
        selfAddress
      );
      if (!valid) {
        return;
      }
      incomingSignedSimplexState = fixedIncomingSignedSimplexState;
    }
    if (outgoingSignedSimplexState) {
      [
        outgoingSimplexState,
        outgoingSimplexStateBytes,
      ] = PaymentChannel.deserializeSignedSimplexState(
        outgoingSignedSimplexState
      );
      const [
        valid,
        fixedOutgoingSignedSimplexState,
      ] = await this.verifyAndFixSignedSimplexState(
        outgoingSignedSimplexState,
        outgoingSimplexState,
        outgoingSimplexStateBytes,
        channelId,
        selfAddress,
        this.peerAddress
      );
      if (!valid) {
        return;
      }
      outgoingSignedSimplexState = fixedOutgoingSignedSimplexState;
    }

    // TODO: Check ledger address

    const storedChannel = await this.db.paymentChannels.get(channelId);
    if (!storedChannel) {
      await this.addChannel(
        channelInAuth,
        incomingSignedSimplexState,
        outgoingSignedSimplexState,
        outgoingSimplexState,
        channelId,
        channelIdBytes,
        channelState,
        selfAddress
      );
    } else {
      await this.updateChannel(
        storedChannel,
        channelInAuth,
        incomingSignedSimplexState,
        incomingSimplexState,
        outgoingSignedSimplexState,
        outgoingSimplexState,
        channelId,
        channelIdBytes,
        channelState
      );
    }
  }

  private async addChannel(
    channelInAuth: ChannelInAuth,
    incomingSignedSimplexState: SignedSimplexState,
    outgoingSignedSimplexState: SignedSimplexState,
    outgoingSimplexState: SimplexPaymentChannel,
    channelId: string,
    channelIdBytes: Uint8Array,
    channelState: ChannelStateInAuth,
    selfAddress: string
  ): Promise<void> {
    if (!incomingSignedSimplexState || !outgoingSignedSimplexState) {
      return;
    }
    const tokenInfo = outgoingSimplexState.getTransferToPeer().getToken();
    const channel = new PaymentChannel(
      channelId,
      selfAddress,
      this.peerAddress,
      tokenInfo.getTokenType(),
      typeUtils.bytesToAddress(tokenInfo.getTokenAddress_asU8()),
      typeUtils.bytesToAddress(channelInAuth.getLedgerAddr_asU8())
    );
    channel.setIncomingSignedSimplexState(incomingSignedSimplexState);
    channel.setOutgoingSignedSimplexState(outgoingSignedSimplexState);
    channel.depositWithdrawal = await this.getOnchainDepositWithdrawal(
      channelIdBytes,
      channelState
    );
    await this.db.paymentChannels.add(channel);
    await this.insertPaymentsFromAuth(channelInAuth, channelId);
  }

  private async updateChannel(
    storedChannel: PaymentChannel,
    channelInAuth: ChannelInAuth,
    incomingSignedSimplexState: SignedSimplexState,
    incomingSimplexState: SimplexPaymentChannel,
    outgoingSignedSimplexState: SignedSimplexState,
    outgoingSimplexState: SimplexPaymentChannel,
    channelId: string,
    channelIdBytes: Uint8Array,
    channelState: ChannelStateInAuth
  ): Promise<void> {
    const channel = storedChannel;
    const storedChannelStatus = channel.status;
    if (
      storedChannelStatus === PaymentChannelStatus.OPEN &&
      channelInAuth.getChannelState() === ChannelStateInAuth.SETTLING
    ) {
      channel.status = PaymentChannelStatus.SETTLING;
    }

    // TODO: Update ledger address

    if (outgoingSignedSimplexState) {
      const [
        storedOutgoingSimplexState,
        ,
      ] = PaymentChannel.deserializeSignedSimplexState(
        outgoingSignedSimplexState
      );
      if (
        outgoingSimplexState.getSeqNum() <
        storedOutgoingSimplexState.getSeqNum()
      ) {
        return;
      }
    }
    if (incomingSignedSimplexState) {
      const [
        storedIncomingSimplexState,
        ,
      ] = PaymentChannel.deserializeSignedSimplexState(
        incomingSignedSimplexState
      );
      if (
        incomingSimplexState.getSeqNum() <
        storedIncomingSimplexState.getSeqNum()
      ) {
        return;
      }
    }
    channel.setIncomingSignedSimplexState(incomingSignedSimplexState);
    channel.setOutgoingSignedSimplexState(outgoingSignedSimplexState);
    channel.depositWithdrawal = await this.getOnchainDepositWithdrawal(
      channelIdBytes,
      channelState
    );
    await this.db.paymentChannels.put(channel);
    await this.insertPaymentsFromAuth(channelInAuth, channelId);
  }

  private async getOnchainDepositWithdrawal(
    channelIdBytes: Uint8Array,
    channelStateInAuth: ChannelStateInAuth
  ): Promise<DepositWithdrawal> {
    switch (channelStateInAuth) {
      case ChannelStateInAuth.OPENED:
      case ChannelStateInAuth.SETTLING: {
        const ledgerFactory = CelerLedgerFactory.connect(
          this.contractsInfo.celerLedgerAddress,
          this.cryptoManager.provider
        );
        const {
          0: addresses,
          1: deposits,
          2: withdrawals,
        } = await ledgerFactory.getBalanceMap(channelIdBytes);
        const selfAddress = await this.cryptoManager.signer.getAddress();
        if (addresses[0] === selfAddress) {
          return new DepositWithdrawal(
            ethers.utils.arrayify(deposits[0]),
            ethers.utils.arrayify(withdrawals[0]),
            ethers.utils.arrayify(deposits[1]),
            ethers.utils.arrayify(withdrawals[1])
          );
        }
        if (addresses[0] === this.peerAddress) {
          return new DepositWithdrawal(
            ethers.utils.arrayify(deposits[1]),
            ethers.utils.arrayify(withdrawals[1]),
            ethers.utils.arrayify(deposits[0]),
            ethers.utils.arrayify(withdrawals[0])
          );
        }
        throw new Error('Invalid addresses');
      }
      default:
        throw new Error('Unsupported channel state');
    }
  }

  private async verifyAndFixSignedSimplexState(
    signedSimplexState: SignedSimplexState,
    simplexState: SimplexPaymentChannel,
    simplexStateBytes: Uint8Array,
    expectedCid: string,
    expectedPeerFrom: string,
    expectedPeerTo: string
  ): Promise<[boolean, SignedSimplexState]> {
    if (
      ethers.utils.hexlify(simplexState.getChannelId_asU8()) !== expectedCid
    ) {
      return [false, undefined];
    }
    if (
      typeUtils.bytesToAddress(simplexState.getPeerFrom_asU8()) !==
      expectedPeerFrom
    ) {
      return [false, undefined];
    }
    if (simplexState.getSeqNum() !== 0) {
      const peerFromSignature = ethers.utils.splitSignature(
        signedSimplexState.getSigOfPeerFrom_asU8()
      );
      const peerToSignature = ethers.utils.splitSignature(
        signedSimplexState.getSigOfPeerTo_asU8()
      );
      if (
        !CryptoManager.isSignatureValid(
          expectedPeerFrom,
          simplexStateBytes,
          peerFromSignature
        ) ||
        !CryptoManager.isSignatureValid(
          expectedPeerTo,
          simplexStateBytes,
          peerToSignature
        )
      ) {
        return [false, undefined];
      }
      return [true, signedSimplexState];
    }
    // If seqNum is 0, remove peer signature and add self signature
    // TODO: Check this logic
    const amountBytes = simplexState
      .getTransferToPeer()
      .getReceiver()
      .getAmt_asU8();
    const pendingAmountBytes = simplexState.getTotalPendingAmount_asU8();
    if (
      ethers.utils.hexlify(typeUtils.ZERO_BYTES) !==
        ethers.utils.hexlify(amountBytes) ||
      ethers.utils.hexlify(typeUtils.ZERO_BYTES) !==
        ethers.utils.hexlify(pendingAmountBytes)
    ) {
      return [false, undefined];
    }
    const pendingPayIds = simplexState.getPendingPayIds();
    if (
      pendingPayIds.getPayIdsList_asU8().length !== 0 ||
      pendingPayIds.getNextListHash_asU8().length !== 0
    ) {
      return [false, undefined];
    }
    const selfSignatureBytes = ethers.utils.arrayify(
      await this.cryptoManager.signHash(simplexStateBytes)
    );
    const selfAddress = await this.cryptoManager.signer.getAddress();
    if (expectedPeerFrom === selfAddress) {
      signedSimplexState.setSigOfPeerFrom(selfSignatureBytes);
      signedSimplexState.setSigOfPeerTo(undefined);
    } else {
      signedSimplexState.setSigOfPeerFrom(undefined);
      signedSimplexState.setSigOfPeerTo(selfSignatureBytes);
    }
    return [true, signedSimplexState];
  }

  private async insertPaymentsFromAuth(
    channelInAuth: ChannelInAuth,
    channelId: string
  ): Promise<void> {
    const results: Promise<void>[] = [];
    for (const payInAuthAck of channelInAuth.getAuthackPaysList()) {
      results.push(this.insertPaymentFromAuth(payInAuthAck, channelId, true));
    }
    for (const payInAuthAck of channelInAuth.getAuthreqPaysList()) {
      results.push(this.insertPaymentFromAuth(payInAuthAck, channelId, false));
    }
    await Promise.all(results);
  }

  private async insertPaymentFromAuth(
    payInAuthAck: PayInAuthAck,
    channelId: string,
    incoming: boolean
  ): Promise<void> {
    const conditionalPay = ConditionalPay.deserializeBinary(
      payInAuthAck.getPay_asU8()
    );
    const paymentId = Payment.calculatePaymentId(conditionalPay);
    const storedPayment = await this.db.payments.get(paymentId);
    let incomingChannelId: string;
    let outgoingChannelId: string;
    if (incoming) {
      incomingChannelId = channelId;
    } else {
      outgoingChannelId = channelId;
    }
    if (!storedPayment) {
      const payment = new Payment(
        paymentId,
        conditionalPay,
        incomingChannelId,
        outgoingChannelId,
        payInAuthAck.getNote()
      );
      await this.db.payments.add(payment);
    } else {
      const storedIncomingChannelId = storedPayment.incomingChannelId;
      const storedOutgoingChannelId = storedPayment.outgoingChannelId;
      if (
        incomingChannelId !== storedIncomingChannelId ||
        outgoingChannelId !== storedOutgoingChannelId
      ) {
        throw new Error('Invalid channelId');
      }
      const convertedStatus = AuthAckHandler.paymentStateInAuthToPaymentStatus(
        payInAuthAck.getState()
      );
      if (storedPayment.status !== convertedStatus) {
        await this.db.payments.update(storedPayment, {
          status: convertedStatus,
        });
      }
    }
  }

  private static paymentStateInAuthToPaymentStatus(
    paymentStateInAuth: PaymentStateInAuth
  ): PaymentStatus {
    switch (paymentStateInAuth) {
      case PaymentStateInAuth.NULL:
        return PaymentStatus.INITIAL;
      case PaymentStateInAuth.ONESIG_PENDING:
        return PaymentStatus.PEER_FROM_SIGNED_PENDING;
      case PaymentStateInAuth.COSIGNED_PENDING:
        return PaymentStatus.CO_SIGNED_PENDING;
      case PaymentStateInAuth.SECRET_REVEALED:
        return PaymentStatus.HASH_LOCK_REVEALED;
      case PaymentStateInAuth.ONESIG_PAID:
      case PaymentStateInAuth.ONESIG_CANCELED:
        return PaymentStatus.PEER_FROM_SIGNED_SETTLED;
      case PaymentStateInAuth.COSIGNED_PAID:
      case PaymentStateInAuth.COSIGNED_CANCLED:
        return PaymentStatus.CO_SIGNED_SETTLED;
      case PaymentStateInAuth.NACKED:
      case PaymentStateInAuth.INGRESS_REJECTED:
        return PaymentStatus.FAILED;
      default:
        throw new Error('Unknown payment status in auth');
    }
  }
}
