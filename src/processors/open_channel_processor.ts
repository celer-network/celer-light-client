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
import {
  JsonRpcProvider,
  TransactionRequest,
  TransactionResponse
} from 'ethers/providers';
import { BigNumber, LogDescription } from 'ethers/utils';

import celerLedgerAbi from '../abi/celer_ledger.json';
import { Config } from '../config';
import { CustomSigner } from '../crypto/custom_signer';
import { Database } from '../data/database';
import { DepositWithdrawal } from '../data/deposit_withdrawal';
import { PaymentChannel } from '../data/payment_channel';
import { MessageManager } from '../messaging/message_manager';
import { OpenChannelRequest as OnChainOpenChannelRequest } from '../protobufs/chain_pb';
import {
  AccountAmtPair,
  PayIdList,
  PaymentChannelInitializer,
  SimplexPaymentChannel,
  TokenDistribution,
  TokenInfo,
  TokenTransfer,
  TokenType,
  TokenTypeMap
} from '../protobufs/entity_pb';
import {
  OpenChannelBy,
  OpenChannelRequest,
  OpenChannelResponse,
  SignedSimplexState
} from '../protobufs/message_pb';
import * as typeUtils from '../utils/types';

export class OpenChannelProcessor {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly signer: CustomSigner;
  private readonly provider: JsonRpcProvider;
  private readonly config: Config;

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
  }

  async openChannel(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    selfAmount: BigNumber,
    peerAmount: BigNumber
  ): Promise<string> {
    const selfAddress = await this.provider.getSigner().getAddress();
    const peerAddress = ethers.utils.getAddress(this.config.ospEthAddress);

    // TODO(dominator008): Revisit this logic and maybe allow multiple channels
    // per (selfAddress, peerAddress, tokenAddress) tuple
    const existingChannels = await this.db.paymentChannels
      .where({
        selfAddress,
        peerAddress,
        tokenAddress
      })
      .toArray();
    if (existingChannels.length > 0) {
      return existingChannels[0].channelId;
    }

    const selfAddressBytes = ethers.utils.arrayify(selfAddress);
    const peerAddressBytes = ethers.utils.arrayify(peerAddress);
    const selfAmountBytes = ethers.utils.arrayify(selfAmount);
    const peerAmountBytes = ethers.utils.arrayify(peerAmount);

    const selfAddressLower = selfAddress < peerAddress;
    const lowDistribution = new AccountAmtPair();
    const highDistribution = new AccountAmtPair();
    let msgValueReceiver: number;
    if (selfAddressLower) {
      lowDistribution.setAccount(selfAddressBytes);
      lowDistribution.setAmt(selfAmountBytes);
      highDistribution.setAccount(peerAddressBytes);
      highDistribution.setAmt(peerAmountBytes);
      msgValueReceiver = 0;
    } else {
      lowDistribution.setAccount(peerAddressBytes);
      lowDistribution.setAmt(peerAmountBytes);
      highDistribution.setAccount(selfAddressBytes);
      highDistribution.setAmt(selfAmountBytes);
      msgValueReceiver = 1;
    }
    const initializer = new PaymentChannelInitializer();
    const distribution = new TokenDistribution();
    const tokenInfo = typeUtils.createTokenInfo(tokenType, tokenAddress);
    distribution.setToken(tokenInfo);
    distribution.setDistributionList([lowDistribution, highDistribution]);
    initializer.setInitDistribution(distribution);
    initializer.setDisputeTimeout(this.config.paymentChannelDisputeTimeout);
    initializer.setMsgValueReceiver(msgValueReceiver);
    const blockNumber = await this.provider.getBlockNumber();
    initializer.setOpenDeadline(
      blockNumber + this.config.paymentChannelOpenTimeout
    );

    const initializerBytes = initializer.serializeBinary();
    const signature = await this.signer.signHash(initializerBytes);
    const signatureBytes = ethers.utils.arrayify(signature);
    const openBy = OpenChannelBy.OPEN_CHANNEL_PROPOSER;
    const request = new OpenChannelRequest();
    request.setChannelInitializer(initializerBytes);
    request.setRequesterSig(signatureBytes);
    request.setOpenBy(openBy);

    const response = await this.messageManager.openChannel(request);
    return this.sendOpenChannelTx(
      tokenType,
      selfAmount,
      response,
      selfAddressLower
    );
  }

  private async sendOpenChannelTx(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    selfAmount: BigNumber,
    response: OpenChannelResponse,
    selfAddressLower: boolean
  ): Promise<string> {
    const requesterSig = response.getRequesterSig_asU8();
    const approverSig = response.getApproverSig_asU8();
    let lowSig: Uint8Array;
    let highSig: Uint8Array;
    if (selfAddressLower) {
      lowSig = requesterSig;
      highSig = approverSig;
    } else {
      lowSig = approverSig;
      highSig = requesterSig;
    }
    const request = new OnChainOpenChannelRequest();
    request.setChannelInitializer(response.getChannelInitializer_asU8());
    request.setSigsList([lowSig, highSig]);
    const requestBytes = request.serializeBinary();

    const celerLedger = new ethers.Contract(
      this.config.celerLedgerAddress,
      JSON.stringify(celerLedgerAbi),
      this.provider.getSigner()
    );

    const overrides: TransactionRequest = {};
    if (tokenType === TokenType.ETH) {
      overrides.value = selfAmount;
    }

    const tx: TransactionResponse = await celerLedger.openChannel(
      requestBytes,
      overrides
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error(`OpenChannel tx ${tx.hash} failed`);
    }
    const ledgerInterface = celerLedger.interface;
    let channelId: string;
    for (const log of receipt.logs) {
      if (log.topics[0] === ledgerInterface.events.OpenChannel.topic) {
        channelId = await this.processOpenChannelEvent(
          ledgerInterface.parseLog(log)
        );
        break;
      }
    }
    return channelId;
  }

  private async processOpenChannelEvent(log: LogDescription): Promise<string> {
    const values = log.values;
    const addresses: string[] = values.peerAddrs;
    const initialDeposits: BigNumber[] = values.initialDeposits;
    let selfDeposit: BigNumber;
    let peerDeposit: BigNumber;
    let peerAddress: string;
    const selfAddress = await this.provider.getSigner().getAddress();
    if (addresses[0] === selfAddress) {
      peerAddress = addresses[1];
      selfDeposit = initialDeposits[0];
      peerDeposit = initialDeposits[1];
    } else {
      peerAddress = addresses[0];
      selfDeposit = initialDeposits[1];
      peerDeposit = initialDeposits[0];
    }
    const channelId: string = values.channelId;
    const tokenType: TokenTypeMap[keyof TokenTypeMap] = values.tokenType.toNumber();
    const tokenAddress: string = values.tokenAddress;
    const channel = new PaymentChannel(
      channelId,
      selfAddress,
      peerAddress,
      tokenType,
      tokenAddress
    );
    const zeroBytes = ethers.utils.arrayify(ethers.constants.Zero);
    const depositWithdrawal = new DepositWithdrawal(
      ethers.utils.arrayify(selfDeposit),
      zeroBytes,
      ethers.utils.arrayify(peerDeposit),
      zeroBytes
    );
    channel.depositWithdrawal = depositWithdrawal;

    channel.setIncomingSignedSimplexState(
      await this.initializeSignedSimplexState(
        channelId,
        tokenType,
        tokenAddress,
        selfAddress,
        peerAddress,
        false
      )
    );
    channel.setOutgoingSignedSimplexState(
      await this.initializeSignedSimplexState(
        channelId,
        tokenType,
        tokenAddress,
        selfAddress,
        peerAddress,
        true
      )
    );

    await this.db.paymentChannels.add(channel);
    return channelId;
  }

  private async initializeSignedSimplexState(
    channelId: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    selfAddress: string,
    peerAddress: string,
    selfIsPeerFrom: boolean
  ): Promise<SignedSimplexState> {
    let peerFrom: string;
    let peerTo: string;
    if (selfIsPeerFrom) {
      peerFrom = selfAddress;
      peerTo = peerAddress;
    } else {
      peerFrom = peerAddress;
      peerTo = selfAddress;
    }
    const zeroBytes = ethers.utils.arrayify(ethers.utils.bigNumberify(0));
    const simplexState = new SimplexPaymentChannel();
    simplexState.setChannelId(ethers.utils.arrayify(channelId));
    simplexState.setPeerFrom(ethers.utils.arrayify(peerFrom));
    simplexState.setSeqNum(0);
    const transferToPeer = new TokenTransfer();
    const token = new TokenInfo();
    token.setTokenType(tokenType);
    token.setTokenAddress(ethers.utils.arrayify(tokenAddress));
    const receiver = new AccountAmtPair();
    receiver.setAccount(ethers.utils.arrayify(peerTo));
    receiver.setAmt(zeroBytes);
    transferToPeer.setToken(token);
    transferToPeer.setReceiver(receiver);
    simplexState.setTransferToPeer(transferToPeer);
    simplexState.setPendingPayIds(new PayIdList());
    simplexState.setLastPayResolveDeadline(0);
    simplexState.setTotalPendingAmount(zeroBytes);
    const simplexStateBytes = simplexState.serializeBinary();
    const selfSig = ethers.utils.arrayify(
      await this.signer.signHash(simplexStateBytes)
    );
    let sigOfPeerFrom: Uint8Array;
    let sigOfPeerTo: Uint8Array;
    if (selfIsPeerFrom) {
      sigOfPeerFrom = selfSig;
    } else {
      sigOfPeerTo = selfSig;
    }
    const signedSimplexState = new SignedSimplexState();
    signedSimplexState.setSimplexState(simplexStateBytes);
    signedSimplexState.setSigOfPeerFrom(sigOfPeerFrom);
    signedSimplexState.setSigOfPeerTo(sigOfPeerTo);
    return signedSimplexState;
  }
}
