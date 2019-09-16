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

/**
 * @fileoverview Celer Light Client APIs
 */

import isNode from 'detect-node';
import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { grpc } from '@improbable-eng/grpc-web';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

import { Config } from '../config';
import { CustomSigner } from '../crypto/custom_signer';
import { MessageManager } from '../messaging/message_manager';
import { ApproveErc20Processor } from '../processors/approve_erc20_processor';
import { DepositProcessor } from '../processors/deposit_processor';
import { GetPaymentChannelInfoProcessor } from '../processors/get_payment_channel_info_processor';
import { GetPaymentInfoProcessor } from '../processors/get_payment_info_processor';
import { OpenChannelProcessor } from '../processors/open_channel_processor';
import { SendPaymentProcessor } from '../processors/send_payment_processor';
import {
  Condition,
  TokenType,
  TokenTypeMap,
  TransferFunctionType,
  TransferFunctionTypeMap
} from '../protobufs/entity_pb';
import { AuthReq } from '../protobufs/message_pb';
import { Database } from '../storage/database';
import * as utils from '../utils/types';
import { PaymentChannelInfo } from './payment_channel_info';
import { PaymentInfo } from './payment_info';

export class Celer {
  private readonly config: Config;
  private readonly provider: JsonRpcProvider;
  private readonly signer: CustomSigner;
  private readonly db: Database;
  private readonly peerAddress: string;

  private readonly messageManager: MessageManager;
  private readonly approveErc20Processor: ApproveErc20Processor;
  private readonly openChannelProcessor: OpenChannelProcessor;
  private readonly depositProcessor: DepositProcessor;
  private readonly sendPaymentProcessor: SendPaymentProcessor;
  private readonly getPaymentChannelInfoProcessor: GetPaymentChannelInfoProcessor;
  private readonly getPaymentInfoProcessor: GetPaymentInfoProcessor;

  private constructor(config: Config) {
    this.db = new Database();
    const db = this.db;
    this.config = config;
    if (isNode) {
      grpc.setDefaultTransport(NodeHttpTransport());
    }
    this.peerAddress = ethers.utils.getAddress(config.ospEthAddress);
    const provider = new JsonRpcProvider(config.ethJsonRpcUrl);
    this.provider = provider;
    const signer = new CustomSigner(provider);
    this.signer = signer;
    this.messageManager = new MessageManager(
      config,
      this.peerAddress,
      db,
      signer
    );
    this.openChannelProcessor = new OpenChannelProcessor(
      db,
      this.messageManager,
      signer,
      provider,
      config
    );
    this.sendPaymentProcessor = new SendPaymentProcessor(
      db,
      this.messageManager,
      signer,
      provider,
      config
    );
    this.getPaymentChannelInfoProcessor = new GetPaymentChannelInfoProcessor(
      db
    );
    this.getPaymentInfoProcessor = new GetPaymentInfoProcessor(db);
  }

  /**
   * Creates a Celer Light Client instance.
   *
   * @param config - The configuration object
   */
  static async create(config: Config): Promise<Celer> {
    const client = new Celer(config);
    await client.messageManager.createSession();
    const authRequest = new AuthReq();
    const selfAddressBytes = ethers.utils.arrayify(
      await client.provider.getSigner().getAddress()
    );
    const peerAddressBytes = ethers.utils.arrayify(client.peerAddress);
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampBytes = ethers.utils.arrayify(
      ethers.utils.bigNumberify(timestamp)
    );
    const signatureBytes = ethers.utils.arrayify(
      await client.signer.signHash(timestampBytes)
    );
    authRequest.setMyAddr(selfAddressBytes);
    authRequest.setTimestamp(timestamp);
    authRequest.setExpectPeer(peerAddressBytes);
    authRequest.setMySig(signatureBytes);
    client.messageManager.subscribeMessages(authRequest);
    return client;
  }

  /**
   * Approves the CelerLedger contract to spend an ERC-20 token.
   *
   * @param tokenAddress - The token address
   */
  approveErc20(tokenAddress: string) {
    return this.approveErc20Processor.approveIfNecessary(tokenAddress);
  }

  /**
   * Opens an ETH channel.
   *
   * @param amount - The amount to be deposited into the channel, in wei
   * @param peerAmount - The amount to be deposited into the channel by the
   *     counterparty, in wei
   * @returns The channel ID
   */
  openEthChannel(amount: string, peerAmount: string): Promise<string> {
    return this.openChannelProcessor.openChannel(
      utils.getTokenInfo(TokenType.ETH, ethers.constants.AddressZero),
      ethers.utils.bigNumberify(amount),
      ethers.utils.bigNumberify(peerAmount)
    );
  }

  /**
   * Opens an ERC-20 channel.
   *
   * @param tokenAddress - The token address
   * @param amount - The amount to be deposited into the channel, in wei
   * @param peerAmount - The amount to be deposited into the channel by the
   *     counterparty, in wei
   * @returns The channel ID
   */
  openErc20Channel(
    tokenAddress: string,
    amount: string,
    peerAmount: string
  ): Promise<string> {
    return this.openChannelProcessor.openChannel(
      utils.getTokenInfo(TokenType.ERC20, tokenAddress),
      ethers.utils.bigNumberify(amount),
      ethers.utils.bigNumberify(peerAmount)
    );
  }

  /**
   * Deposits ETH into a payment channel.
   *
   * @param channelId - The channel ID.
   * @param amount - The amount to be deposited into the channel, in wei
   * @returns The deposit transaction hash
   */
  depositEth(channelId: string, amount: string): Promise<string> {
    return this.depositProcessor.deposit(
      channelId,
      utils.getTokenInfo(TokenType.ETH, ethers.constants.AddressZero),
      amount
    );
  }

  /**
   * Deposits ERC-20 into a payment channel.
   *
   * @param channelId - The channel ID.
   * @param tokenAddress - The token address
   * @param amount - The amount to be deposited into the channel, in wei
   * @returns The deposit transaction hash
   */
  depositErc20(
    channelId: string,
    tokenAddress: string,
    amount: string
  ): Promise<string> {
    return this.depositProcessor.deposit(
      channelId,
      utils.getTokenInfo(TokenType.ERC20, tokenAddress),
      amount
    );
  }

  /**
   * Sends an unconditional ETH payment.
   *
   * @param destination - The ETH address of the recipient
   * @param amount - The amount to be sent, in wei
   * @returns The payment ID
   */
  async sendEth(destination: string, amount: string): Promise<string> {
    destination = ethers.utils.getAddress(destination);
    return this.sendPaymentProcessor.sendConditionalPayment(
      utils.getTokenInfo(TokenType.ETH, ethers.constants.AddressZero),
      ethers.utils.getAddress(destination),
      ethers.utils.bigNumberify(amount),
      TransferFunctionType.BOOLEAN_AND,
      [await SendPaymentProcessor.generateHashLockCondition(this.db)],
      this.config.paymentTimeout,
      undefined
    );
  }

  /**
   * Sends an unconditional ERC-20 payment.
   *
   * @param tokenAddress - The token address
   * @param destination - The ETH address of the recipient
   * @param amount - The amount to be sent, in wei
   * @returns The payment ID
   */
  async sendErc20(
    tokenAddress: string,
    destination: string,
    amount: string
  ): Promise<string> {
    destination = ethers.utils.getAddress(destination);
    return this.sendPaymentProcessor.sendConditionalPayment(
      utils.getTokenInfo(TokenType.ERC20, tokenAddress),
      ethers.utils.getAddress(destination),
      ethers.utils.bigNumberify(amount),
      TransferFunctionType.BOOLEAN_AND,
      [await SendPaymentProcessor.generateHashLockCondition(this.db)],
      this.config.paymentTimeout,
      undefined
    );
  }

  /**
   * Sends an conditional payment.
   *
   * @param tokenType - The token type, currently supporting ETH and ERC20
   * @param tokenAddress - The token address (only used for ERC20 payments)
   * @param destination - The ETH address of the recipient
   * @param amount - The amount to be sent, in wei
   * @param transferFunctionType - The type of the transfer logic. Currently
   *     only supporting BOOLEAN_AND
   * @param conditions - The list of Condition objects
   * @param timeout - The number of blocks after which the payment expires
   * @param note - A payment note for additional processing
   * @returns The payment ID
   */
  sendConditionalPayment(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    destination: string,
    amount: string,
    transferFunctionType: TransferFunctionTypeMap[keyof TransferFunctionTypeMap],
    conditions: Condition[],
    timeout: number,
    note: Any
  ): Promise<string> {
    destination = ethers.utils.getAddress(destination);
    return this.sendPaymentProcessor.sendConditionalPayment(
      utils.getTokenInfo(tokenType, tokenAddress),
      ethers.utils.getAddress(destination),
      ethers.utils.bigNumberify(amount),
      transferFunctionType,
      conditions,
      timeout,
      note
    );
  }

  /**
   * Gets the info about a payment channel
   *
   * @param channelId - The channel ID
   * @returns The payment channel info
   */
  getPaymentChannelInfo(channelId: string): Promise<PaymentChannelInfo> {
    return this.getPaymentChannelInfoProcessor.getPaymentChannelInfo(channelId);
  }

  /**
   * Gets the info about a payment
   *
   * @param paymentId - The payment ID
   * @returns The payment info
   */
  getPaymentInfo(paymentId: string): Promise<PaymentInfo> {
    return this.getPaymentInfoProcessor.getPaymentInfo(paymentId);
  }

  /**
   * Gets the IDs of all incoming payments on a channel
   *
   * @param channelId - The channel ID
   * @returns The list of IDs for all incoming payments
   */
  getIncomingPaymentIds(channelId: string): Promise<string[]> {
    return this.getPaymentInfoProcessor.getIncomingPaymentIds(channelId);
  }

  /**
   * Gets the IDs of all outgoing payments on a channel
   *
   * @param channelId - The channel ID
   * @returns The list of IDs for all outgoing payments
   */
  getOutgoingPaymentIds(channelId: string): Promise<string[]> {
    return this.getPaymentInfoProcessor.getOutgoingPaymentIds(channelId);
  }
}
