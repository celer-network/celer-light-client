/**
 * @fileoverview Celer Light Client APIs
 */

import isNode from 'detect-node';
import { ethers, Signer, Wallet } from 'ethers';
import { AsyncSendable, JsonRpcProvider } from 'ethers/providers';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { grpc } from '@improbable-eng/grpc-web';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

import { CryptoManager } from '../crypto/crypto_manager';
import { Database } from '../data/database';
import { HashLockUtils } from '../data/hash_lock_utils';
import { AuthAckHandler } from '../messaging/incoming/auth_ack_handler';
import { CondPayReceiptHandler } from '../messaging/incoming/cond_pay_receipt_handler';
import { CondPayRequestHandler } from '../messaging/incoming/cond_pay_request_handler';
import { CondPayResponseHandler } from '../messaging/incoming/cond_pay_response_handler';
import { PaymentSettleProofHandler } from '../messaging/incoming/payment_settle_proof_handler';
import { PaymentSettleRequestHandler } from '../messaging/incoming/payment_settle_request_handler';
import { PaymentSettleResponseHandler } from '../messaging/incoming/payment_settle_response_handler';
import { RevealSecretAckHandler } from '../messaging/incoming/reveal_secret_ack_handler';
import { RevealSecretHandler } from '../messaging/incoming/reveal_secret_handler';
import { MessageManager } from '../messaging/message_manager';
import { AuthReqBuilder } from '../messaging/outgoing/auth_req_builder';
import { CondPayRequestSender } from '../messaging/outgoing/cond_pay_request_sender';
import { PaymentSettleRequestSender } from '../messaging/outgoing/payment_settle_request_sender';
import { ApproveErc20Processor } from '../processors/approve_erc20_processor';
import { CooperativeWithdrawProcessor } from '../processors/cooperative_withdraw_processor';
import { DepositProcessor } from '../processors/deposit_processor';
import { GetPaymentChannelInfoProcessor } from '../processors/get_payment_channel_info_processor';
import { GetPaymentInfoProcessor } from '../processors/get_payment_info_processor';
import { OpenChannelProcessor } from '../processors/open_channel_processor';
import { ResolvePaymentProcessor } from '../processors/resolve_payment_processor';
import { SendPaymentProcessor } from '../processors/send_payment_processor';
import { SettlePaymentProcessor } from '../processors/settle_payment_processor';
import {
  Condition,
  TokenTypeMap,
  TransferFunctionType,
  TransferFunctionTypeMap,
} from '../protobufs/entity_pb';
import { CelerMsg, PaymentSettleReason } from '../protobufs/message_pb';
import * as typeUtils from '../utils/types';
import { Config } from './config';
import { ContractsInfo } from './contracts_info';
import { PaymentChannelInfo } from './payment_channel_info';
import { PaymentInfo } from './payment_info';

export class Celer {
  private readonly db: Database;
  private readonly cryptoManager: CryptoManager;
  private readonly config: Config;
  private readonly peerAddress: string;

  private readonly messageManager: MessageManager;
  private readonly approveErc20Processor: ApproveErc20Processor;
  private readonly openChannelProcessor: OpenChannelProcessor;
  private readonly depositProcessor: DepositProcessor;
  private readonly cooperativeWithdrawProcessor: CooperativeWithdrawProcessor;
  private readonly sendPaymentProcessor: SendPaymentProcessor;
  private readonly resolvePaymentProcessor: ResolvePaymentProcessor;
  private readonly settlePaymentProcessor: SettlePaymentProcessor;
  private readonly getPaymentChannelInfoProcessor: GetPaymentChannelInfoProcessor;
  private readonly getPaymentInfoProcessor: GetPaymentInfoProcessor;

  private constructor(
    provider: JsonRpcProvider,
    signer: Signer,
    contractsInfo: ContractsInfo,
    config: Config
  ) {
    this.db = new Database();
    const { db } = this;
    this.config = config;
    if (isNode) {
      grpc.setDefaultTransport(NodeHttpTransport());
    }
    const peerAddress = ethers.utils.getAddress(config.ospEthAddress);
    this.peerAddress = peerAddress;
    const cryptoManager = new CryptoManager(provider, signer);
    this.cryptoManager = cryptoManager;
    const messageManager = new MessageManager(config);
    this.messageManager = messageManager;

    const condPayRequestSender = new CondPayRequestSender(
      db,
      messageManager,
      cryptoManager,
      contractsInfo,
      config
    );
    const paymentSettleRequestSender = new PaymentSettleRequestSender(
      db,
      cryptoManager,
      messageManager,
      peerAddress
    );
    this.openChannelProcessor = new OpenChannelProcessor(
      db,
      messageManager,
      cryptoManager,
      contractsInfo,
      config
    );
    this.depositProcessor = new DepositProcessor(db, signer, contractsInfo);
    this.sendPaymentProcessor = new SendPaymentProcessor(condPayRequestSender);
    const resolvePaymentProcessor = new ResolvePaymentProcessor(
      provider,
      contractsInfo
    );
    this.resolvePaymentProcessor = resolvePaymentProcessor;
    this.getPaymentChannelInfoProcessor = new GetPaymentChannelInfoProcessor(
      db
    );
    this.getPaymentInfoProcessor = new GetPaymentInfoProcessor(db);

    const cooperativeWithdrawProcessor = new CooperativeWithdrawProcessor(
      db,
      messageManager,
      cryptoManager,
      contractsInfo
    );
    this.cooperativeWithdrawProcessor = cooperativeWithdrawProcessor;

    this.messageManager.setHandler(
      CelerMsg.MessageCase.AUTH_ACK,
      new AuthAckHandler(db, cryptoManager, contractsInfo, peerAddress)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.COND_PAY_REQUEST,
      new CondPayRequestHandler(
        db,
        messageManager,
        cryptoManager,
        contractsInfo,
        config
      )
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.COND_PAY_RESPONSE,
      new CondPayResponseHandler(db, cryptoManager, peerAddress)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.COND_PAY_RECEIPT,
      new CondPayReceiptHandler(db, messageManager)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.REVEAL_SECRET,
      new RevealSecretHandler(db, messageManager, cryptoManager)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.REVEAL_SECRET_ACK,
      new RevealSecretAckHandler(db, paymentSettleRequestSender)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.PAYMENT_SETTLE_REQUEST,
      new PaymentSettleRequestHandler(
        db,
        messageManager,
        resolvePaymentProcessor,
        cryptoManager,
        config
      )
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.PAYMENT_SETTLE_RESPONSE,
      new PaymentSettleResponseHandler(db, cryptoManager, peerAddress)
    );
    this.messageManager.setHandler(
      CelerMsg.MessageCase.PAYMENT_SETTLE_PROOF,
      new PaymentSettleProofHandler(
        db,
        paymentSettleRequestSender,
        resolvePaymentProcessor
      )
    );

    this.messageManager.setHandler(
      CelerMsg.MessageCase.WITHDRAW_RESPONSE,
      cooperativeWithdrawProcessor
    );
  }

  /**
   * Creates a Celer Light Client instance.
   *
   * @param connection One of:
   *     <ul>
   *       <li>JsonRpcProvider instance</li>
   *       <li>Metamask web3.currentProvider object</li>
   *       <li>JSON-RPC connection URL</li>
   *     </ul>
   * @param account One of:
   *     <ul>
   *       <li>Signer (Wallet)</li>
   *       <li>Hex-encoded address of an account in the provider</li>
   *       <li>Hex-encoded private key</li>
   *       <li>Number index of an account loaded in the provider</li>
   *     </ul>
   * @param contractsInfo The addresses of the Celer contracts
   * @param config The configuration object
   */
  static async create(
    connection: ethers.providers.JsonRpcProvider | AsyncSendable | string,
    account: ethers.Signer | string | number,
    contractsInfo: ContractsInfo,
    config: Config
  ): Promise<Celer> {
    let provider: ethers.providers.JsonRpcProvider;
    if (connection instanceof ethers.providers.JsonRpcProvider) {
      provider = connection;
    } else if (typeof connection === 'string') {
      provider = new ethers.providers.JsonRpcProvider(connection);
    } else {
      // Assume AsyncSendable
      provider = new ethers.providers.Web3Provider(connection);
    }

    // Connect signer to provider
    let signer: Signer;
    if (Signer.isSigner(account)) {
      if (account.provider === provider) {
        signer = account;
      } else if (account instanceof ethers.Wallet) {
        signer = account.connect(provider);
      } else {
        throw new Error(`Invalid account ${account}`);
      }
    } else if (typeof account === 'number') {
      // Index of the account in provider
      signer = provider.getSigner(account);
    } else if (typeUtils.isAddress(account)) {
      const accounts = await provider.listAccounts();
      if (!accounts.includes(account)) {
        throw new Error(`Unknown account ${account} in provider`);
      }
      signer = provider.getSigner(account);
    } else {
      // Assume private key
      signer = new Wallet(account, provider);
    }

    const client = new Celer(provider, signer, contractsInfo, config);
    await client.messageManager.createSession();
    const authReqBuilder = new AuthReqBuilder(client.db);
    const authRequest = await authReqBuilder.build(
      client.peerAddress,
      client.cryptoManager
    );
    client.messageManager.subscribeMessages(authRequest);
    return client;
  }

  /**
   * Approves the CelerLedger contract to spend an ERC-20 token.
   *
   * @param tokenAddress The token address
   */
  approveErc20(tokenAddress: string): Promise<string> {
    return this.approveErc20Processor.approveIfNecessary(tokenAddress);
  }

  /**
   * Opens a payment channel.
   *
   * @param tokenType The token type, currently supporting ETH and ERC20
   * @param tokenAddress The token address
   * @param amount The amount to be deposited into the channel, in wei
   * @param peerAmount The amount to be deposited into the channel by the
   *     counterparty, in wei
   * @returns The channel ID
   */
  openPaymentChannel(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    amount: string,
    peerAmount: string
  ): Promise<string> {
    return this.openChannelProcessor.openChannel(
      tokenType,
      tokenAddress,
      ethers.utils.bigNumberify(amount),
      ethers.utils.bigNumberify(peerAmount)
    );
  }

  /**
   * Deposits into a payment channel.
   *
   * @param channelId The channel ID.
   * @param tokenType The token type, currently supporting ETH and ERC20
   * @param amount The amount to be deposited into the channel, in wei
   * @returns The deposit transaction hash
   */
  deposit(
    channelId: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    amount: string
  ): Promise<string> {
    return this.depositProcessor.deposit(channelId, tokenType, amount);
  }

  /**
   * Cooperatively withdraw from a payment channel.
   *
   * @param channelId The channel ID.
   * @param amount The amount to be withdrawn from the channel, in wei
   * @returns The deposit transaction hash
   */
  cooperativeWithdraw(channelId: string, amount: string): Promise<string> {
    return this.cooperativeWithdrawProcessor.cooperativeWithdraw(
      channelId,
      amount
    );
  }

  /**
   * Sends a payment with a single hash lock condition.
   *
   * @param tokenType The token type, currently supporting ETH and ERC20
   * @param tokenAddress The token address
   * @param destination The ETH address of the recipient
   * @param amount The amount to be sent, in wei
   * @param note An optional payment note with additional information for the
   *     recipient
   * @returns The payment ID
   */
  async sendPayment(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    destination: string,
    amount: string,
    note?: Any
  ): Promise<string> {
    return this.sendPaymentProcessor.sendConditionalPayment(
      tokenType,
      tokenAddress,
      ethers.utils.getAddress(destination),
      ethers.utils.bigNumberify(amount),
      TransferFunctionType.BOOLEAN_AND,
      [await HashLockUtils.generateHashLockCondition(this.db)],
      this.config.defaultPaymentTimeout,
      note
    );
  }

  /**
   * Sends a conditional payment.
   *
   * @param tokenType The token type, currently supporting ETH and ERC20
   * @param tokenAddress The token address (only used for ERC20 payments)
   * @param destination The ETH address of the recipient
   * @param amount The amount to be sent, in wei
   * @param transferFunctionType - The type of the transfer logic. Currently
   *     only supporting BOOLEAN_AND
   * @param conditions The list of Condition objects
   * @param timeout The number of blocks after which the payment expires
   * @param note An optional payment note with additional information for the
   *     recipient
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
    return this.sendPaymentProcessor.sendConditionalPayment(
      tokenType,
      tokenAddress,
      ethers.utils.getAddress(destination),
      ethers.utils.bigNumberify(amount),
      transferFunctionType,
      conditions,
      timeout,
      note
    );
  }

  /**
   * Confirms an outgoing payment
   *
   * @param paymentId The payment ID
   */
  confirmOutgoingPayment(paymentId: string): Promise<void> {
    return this.settlePaymentProcessor.settlePayment(
      paymentId,
      PaymentSettleReason.PAY_PAID_MAX
    );
  }

  /**
   * Rejects an incoming payment
   *
   * @param paymentId The payment ID
   */
  rejectIncomingPayment(paymentId: string): Promise<void> {
    return this.settlePaymentProcessor.settlePayment(
      paymentId,
      PaymentSettleReason.PAY_REJECTED
    );
  }

  /**
   * Gets the info about a payment channel
   *
   * @param channelId The channel ID
   * @returns The payment channel info
   */
  getPaymentChannelInfo(channelId: string): Promise<PaymentChannelInfo> {
    return this.getPaymentChannelInfoProcessor.getPaymentChannelInfo(channelId);
  }

  /**
   * Gets all payment channel IDs for a token
   *
   * @param tokenAddress The token address
   * @returns The payment channel IDs
   */
  async getAllPaymentChannelIdsForToken(
    tokenAddress: string
  ): Promise<string[]> {
    const selfAddress = await this.cryptoManager.signer.getAddress();
    return this.getPaymentChannelInfoProcessor.getAllPaymentChannelIdsForToken(
      selfAddress,
      this.peerAddress,
      tokenAddress
    );
  }

  /**
   * Gets the info about a payment
   *
   * @param paymentId The payment ID
   * @returns The payment info
   */
  getPaymentInfo(paymentId: string): Promise<PaymentInfo> {
    return this.getPaymentInfoProcessor.getPaymentInfo(paymentId);
  }

  /**
   * Gets the IDs of all incoming payments on a channel
   *
   * @param channelId The channel ID
   * @returns The list of IDs for all incoming payments
   */
  getIncomingPaymentIds(channelId: string): Promise<string[]> {
    return this.getPaymentInfoProcessor.getIncomingPaymentIds(channelId);
  }

  /**
   * Gets the IDs of all outgoing payments on a channel
   *
   * @param channelId The channel ID
   * @returns The list of IDs for all outgoing payments
   */
  getOutgoingPaymentIds(channelId: string): Promise<string[]> {
    return this.getPaymentInfoProcessor.getOutgoingPaymentIds(channelId);
  }

  /**
   * Generates a and stores a hash lock condition for a payment.
   *
   * @returns A hash lock condition
   */
  generateHashLockCondition(): Promise<Condition> {
    return HashLockUtils.generateHashLockCondition(this.db);
  }

  /**
   * Removes a hash lock condition from storage.
   *
   * @param condition A hash lock condition
   */
  removeHashlockCondition(condition: Condition): Promise<void> {
    return HashLockUtils.removeHashLockCondition(this.db, condition);
  }

  /**
   * Closes the database connection.
   * NOTE: Should be only used in tests.
   */
  close(): void {
    this.messageManager.close();
    this.db.close();
  }
}
