import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { Config } from '../../api/config';
import { ContractsInfo } from '../../api/contracts_info';
import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { Payment, PaymentStatus } from '../../data/payment';
import {
  PaymentChannel,
  PaymentChannelStatus,
} from '../../data/payment_channel';
import {
  AccountAmtPair,
  Condition,
  ConditionalPay,
  SimplexPaymentChannel,
  TokenTransfer,
  TokenTypeMap,
  TransferFunction,
  TransferFunctionType,
  TransferFunctionTypeMap,
} from '../../protobufs/entity_pb';
import {
  CelerMsg,
  CondPayRequest,
  SignedSimplexState,
} from '../../protobufs/message_pb';
import * as errorUtils from '../../utils/errors';
import * as typeUtils from '../../utils/types';
import { MessageManager } from '../message_manager';

export class CondPayRequestSender {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly cryptoManager: CryptoManager;
  private readonly contractsInfo: ContractsInfo;
  private readonly config: Config;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    messageManager: MessageManager,
    cryptoManager: CryptoManager,
    contractsInfo: ContractsInfo,
    config: Config
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.cryptoManager = cryptoManager;
    this.contractsInfo = contractsInfo;
    this.config = config;
    this.peerAddress = ethers.utils.getAddress(this.config.ospEthAddress);
  }

  async sendConditionalPayment(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    destination: string,
    amount: BigNumber,
    transferFunctionType: TransferFunctionTypeMap[keyof TransferFunctionTypeMap],
    conditions: Condition[],
    timeout: number,
    note: Any
  ): Promise<string> {
    if (transferFunctionType !== TransferFunctionType.BOOLEAN_AND) {
      throw new Error('Unsupported transfer function type');
    }
    const transfer = new TokenTransfer();
    transfer.setToken(typeUtils.createTokenInfo(tokenType, tokenAddress));
    const destinationBytes = ethers.utils.arrayify(destination);
    const accountAmount = new AccountAmtPair();
    accountAmount.setAccount(destinationBytes);
    accountAmount.setAmt(ethers.utils.arrayify(amount));
    transfer.setReceiver(accountAmount);

    const resolveDeadline =
      (await this.cryptoManager.provider.getBlockNumber()) + timeout;
    const conditionalPay = new ConditionalPay();
    conditionalPay.setSrc(
      ethers.utils.arrayify(await this.cryptoManager.signer.getAddress())
    );
    conditionalPay.setDest(destinationBytes);
    conditionalPay.setConditionsList(conditions);
    const transferFunc = new TransferFunction();
    transferFunc.setLogicType(transferFunctionType);
    transferFunc.setMaxTransfer(transfer);
    conditionalPay.setTransferFunc(transferFunc);
    conditionalPay.setResolveDeadline(resolveDeadline);
    conditionalPay.setResolveTimeout(
      this.config.paymentResolutionDisputeTimeout
    );

    conditionalPay.setPayResolver(
      ethers.utils.arrayify(
        ethers.utils.getAddress(this.contractsInfo.payResolverAddress)
      )
    );
    conditionalPay.setPayTimestamp(CondPayRequestSender.getPayTimestamp());
    const paymentId = Payment.calculatePaymentId(conditionalPay);
    const paymentBytes = conditionalPay.serializeBinary();
    const { db } = this;
    const selfAddress = await this.cryptoManager.signer.getAddress();
    const { peerAddress } = this;
    const channels = await db.paymentChannels
      .where({
        selfAddress,
        peerAddress,
        tokenAddress,
      })
      .toArray();
    if (channels.length === 0) {
      throw new Error('No available channel');
    }
    const channel = channels[0];
    const payment = new Payment(
      paymentId,
      conditionalPay,
      undefined,
      channel.channelId,
      note
    );
    const [
      signedSimplexState,
      baseSeq,
    ] = await this.initializePaymentAndGetUpdatedSignedSimplexState(
      channel,
      payment,
      paymentId,
      amount,
      resolveDeadline
    );

    const message = new CelerMsg();
    const condPayRequest = new CondPayRequest();
    condPayRequest.setCondPay(paymentBytes);
    condPayRequest.setStateOnlyPeerFromSig(signedSimplexState);
    condPayRequest.setBaseSeq(baseSeq);
    condPayRequest.setNote(note);
    message.setCondPayRequest(condPayRequest);
    await this.messageManager.sendMessage(message);

    payment.status = PaymentStatus.PEER_FROM_SIGNED_PENDING;
    await db.payments.put(payment);

    return paymentId;
  }

  private async initializePaymentAndGetUpdatedSignedSimplexState(
    channel: PaymentChannel,
    payment: Payment,
    paymentId: string,
    paymentAmount: BigNumber,
    resolveDeadline: number
  ): Promise<[SignedSimplexState, number]> {
    if (channel.status !== PaymentChannelStatus.OPEN) {
      throw errorUtils.paymentChannelNotOpen(channel.channelId);
    }
    const signedSimplexState = channel.getOutgoingSignedSimplexState();
    const simplexState = SimplexPaymentChannel.deserializeBinary(
      signedSimplexState.getSimplexState_asU8()
    );
    simplexState.getPendingPayIds().addPayIds(ethers.utils.arrayify(paymentId));
    const oldTotalPendingAmount = ethers.utils.bigNumberify(
      simplexState.getTotalPendingAmount_asU8()
    );
    simplexState.setTotalPendingAmount(
      ethers.utils.arrayify(oldTotalPendingAmount.add(paymentAmount))
    );
    if (resolveDeadline > simplexState.getLastPayResolveDeadline()) {
      simplexState.setLastPayResolveDeadline(resolveDeadline);
    }
    const baseSeqNum = simplexState.getSeqNum();
    simplexState.setSeqNum(baseSeqNum + 1);

    await PaymentChannel.signUpdatedSimplexState(
      this.cryptoManager,
      signedSimplexState,
      simplexState
    );
    await this.db.payments.add(payment);

    return [signedSimplexState, baseSeqNum];
  }

  private static getPayTimestamp(): string {
    let random = String(Math.floor(Math.random() * 1e6));
    while (random.length < 6) {
      random = `0${random}`;
    }
    return String(Date.now()) + random;
  }
}
