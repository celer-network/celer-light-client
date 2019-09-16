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
import { JsonRpcProvider } from 'ethers/providers';
import { BigNumber } from 'ethers/utils';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { Config } from '../config';
import { CustomSigner } from '../crypto/custom_signer';
import { MessageManager } from '../messaging/message_manager';
import {
  AccountAmtPair,
  Condition,
  ConditionalPay,
  ConditionType,
  SimplexPaymentChannel,
  TokenInfo,
  TokenTransfer,
  TransferFunction,
  TransferFunctionType,
  TransferFunctionTypeMap
} from '../protobufs/entity_pb';
import {
  CelerMsg,
  CondPayRequest,
  SignedSimplexState
} from '../protobufs/message_pb';
import { Database } from '../storage/database';
import { HashLock } from '../storage/hash_lock';
import { Payment, PaymentStatus } from '../storage/payment';
import {
  PaymentChannel,
  PaymentChannelStatus
} from '../storage/payment_channel';
import * as errorUtils from '../utils/errors';
import * as paymentUtils from '../utils/payments';

export class SendPaymentProcessor {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly signer: CustomSigner;
  private readonly provider: JsonRpcProvider;
  private readonly config: Config;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    messageManager: MessageManager,
    signer: CustomSigner,
    provider: JsonRpcProvider,
    config: Config
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.signer = signer;
    this.provider = provider;
    this.config = config;
    this.peerAddress = ethers.utils.getAddress(this.config.ospEthAddress);
  }

  async sendConditionalPayment(
    tokenInfo: TokenInfo,
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
    transfer.setToken(tokenInfo);
    const destinationBytes = ethers.utils.arrayify(destination);
    const accountAmount = new AccountAmtPair();
    accountAmount.setAccount(destinationBytes);
    accountAmount.setAmt(ethers.utils.arrayify(amount));
    transfer.setReceiver(accountAmount);

    const resolveDeadline = (await this.provider.getBlockNumber()) + timeout;
    const conditionalPay = new ConditionalPay();
    conditionalPay.setSrc(
      ethers.utils.arrayify(await this.provider.getSigner().getAddress())
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
        ethers.utils.getAddress(this.config.payResolverAddress)
      )
    );
    conditionalPay.setPayTimestamp(SendPaymentProcessor.getPayTimestamp());
    const paymentId = paymentUtils.calculatePaymentId(conditionalPay);
    const paymentBytes = conditionalPay.serializeBinary();
    const db = this.db;
    const peerAddress = this.peerAddress;
    const channel = await db.paymentChannels.get({ peerAddress });
    const payment = new Payment(
      paymentId,
      conditionalPay,
      note,
      undefined,
      channel.channelId
    );
    const [
      signedSimplexState,
      baseSeq
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

  static async generateHashLockCondition(db: Database): Promise<Condition> {
    const secret = ethers.utils.randomBytes(32);
    const hash = ethers.utils.keccak256(secret);
    const hashLockCondition = new Condition();
    hashLockCondition.setConditionType(ConditionType.HASH_LOCK);
    hashLockCondition.setHashLock(ethers.utils.arrayify(hash));
    await db.hashLocks.add(new HashLock(secret, hash));
    return hashLockCondition;
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
      this.signer,
      signedSimplexState,
      simplexState
    );
    await this.db.payments.add(payment);
    return [signedSimplexState, baseSeqNum];
  }

  private static getPayTimestamp(): number {
    let random = String(Math.floor(Math.random() * 1e6));
    while (random.length < 6) {
      random = '0' + random;
    }
    return Number(String(Date.now()) + random);
  }
}
