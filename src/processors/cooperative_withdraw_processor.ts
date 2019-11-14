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
import { LogDescription } from 'ethers/utils';

import { CelerLedgerFactory } from '../abi/CelerLedgerFactory';
import { ContractsInfo } from '../api/contracts_info';
import { CryptoManager } from '../crypto/crypto_manager';
import { Database } from '../data/database';
import { MessageManager } from '../messaging/message_manager';
import { CooperativeWithdrawRequest as OnChainCooperativeWithdrawRequest } from '../protobufs/chain_pb';
import {
  AccountAmtPair,
  CooperativeWithdrawInfo
} from '../protobufs/entity_pb';
import {
  CelerMsg,
  CooperativeWithdrawRequest,
  CooperativeWithdrawResponse
} from '../protobufs/message_pb';
import * as typeUtils from '../utils/types';

const COOPERATIVE_WITHDRAW_TIMEOUT = 10;
const WAIT_RESPONSE_INTERVAL = 10;

export class CooperativeWithdrawProcessor {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly cryptoManager: CryptoManager;
  private readonly contractsInfo: ContractsInfo;

  private currentResponse: CooperativeWithdrawResponse;

  constructor(
    db: Database,
    messageManager: MessageManager,
    cryptoManager: CryptoManager,
    contractsInfo: ContractsInfo
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.cryptoManager = cryptoManager;
    this.contractsInfo = contractsInfo;
  }

  async cooperativeWithdraw(
    channelId: string,
    amount: string
  ): Promise<string> {
    const channelIdBytes = ethers.utils.arrayify(channelId);
    const celerLedger = CelerLedgerFactory.connect(
      this.contractsInfo.celerLedgerAddress,
      this.cryptoManager.provider
    );
    let seqNum = await celerLedger.functions.getCooperativeWithdrawSeqNum(
      channelIdBytes
    );
    seqNum = seqNum.add(1);

    const accountAmtPair = new AccountAmtPair();
    accountAmtPair.setAccount(
      ethers.utils.arrayify(await this.cryptoManager.signer.getAddress())
    );
    accountAmtPair.setAmt(
      ethers.utils.arrayify(ethers.utils.bigNumberify(amount))
    );

    const withdrawInfo = new CooperativeWithdrawInfo();
    withdrawInfo.setChannelId(channelIdBytes);
    withdrawInfo.setSeqNum(seqNum.toNumber());
    withdrawInfo.setWithdraw(accountAmtPair);
    withdrawInfo.setWithdrawDeadline(
      (await this.cryptoManager.provider.getBlockNumber()) +
        COOPERATIVE_WITHDRAW_TIMEOUT
    );

    const requesterSig = await this.cryptoManager.signHash(
      withdrawInfo.serializeBinary()
    );
    const request = new CooperativeWithdrawRequest();
    request.setWithdrawInfo(withdrawInfo);
    request.setRequesterSig(ethers.utils.arrayify(requesterSig));

    const message = new CelerMsg();
    message.setWithdrawRequest(request);
    // TODO(dominator008): Update pending withdrawal
    await this.messageManager.sendMessage(message);

    while (!this.currentResponse) {
      await CooperativeWithdrawProcessor.sleep(WAIT_RESPONSE_INTERVAL);
    }
    const txHash = await this.sendCooperativeWithdrawTx(this.currentResponse);
    this.currentResponse = undefined;
    return txHash;
  }

  async handle(message: CelerMsg): Promise<void> {
    const response = message.getWithdrawResponse();
    // TODO(dominator008): Validate that we do have a pending request
    // corresponding to the response, in case the counterparty tricks us with a
    // stale response
    this.currentResponse = message.getWithdrawResponse();
  }

  private static sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  private async sendCooperativeWithdrawTx(
    response: CooperativeWithdrawResponse
  ): Promise<string> {
    const requesterSigBytes = response.getRequesterSig_asU8();
    const approverSigBytes = response.getApproverSig_asU8();
    const withdrawInfo = response.getWithdrawInfo();
    const serializedWithdrawInfo = withdrawInfo.serializeBinary();
    const channelId = ethers.utils.hexlify(withdrawInfo.getChannelId_asU8());

    const selfAddress = await this.cryptoManager.signer.getAddress();
    const peerAddress = (await this.db.paymentChannels.get(channelId))
      .peerAddress;

    if (
      !CryptoManager.isSignatureValid(
        peerAddress,
        serializedWithdrawInfo,
        ethers.utils.splitSignature(approverSigBytes)
      )
    ) {
      throw new Error('Invalid peer signature');
    }

    const sigsList = typeUtils.sortSignatureList(
      selfAddress,
      peerAddress,
      requesterSigBytes,
      approverSigBytes
    );
    const onChainRequest = new OnChainCooperativeWithdrawRequest();
    onChainRequest.setWithdrawInfo(serializedWithdrawInfo);
    onChainRequest.setSigsList(sigsList);

    const celerLedger = CelerLedgerFactory.connect(
      this.contractsInfo.celerLedgerAddress,
      this.cryptoManager.signer
    );

    const tx = await celerLedger.functions.cooperativeWithdraw(
      onChainRequest.serializeBinary()
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error(`CooperativeWithdraw tx ${tx.hash} failed`);
    }
    const ledgerInterface = celerLedger.interface;
    for (const event of receipt.events) {
      if (
        event.topics[0] === ledgerInterface.events.CooperativeWithdraw.topic
      ) {
        await this.processCooperativeWithdrawEvent(
          ledgerInterface.parseLog(event)
        );
        break;
      }
    }
    return tx.hash;
  }

  private async processCooperativeWithdrawEvent(
    log: LogDescription
  ): Promise<void> {
    const values = log.values;
    const channelId = ethers.utils.hexlify(values.channelId);
    const receiver: string = values.receiver;
    const deposits: Uint8Array[] = values.deposits;
    const withdrawals: Uint8Array[] = values.withdrawals;
    // TODO(dominator008): Handle recipientChannelId
    const db = this.db;
    return db.transaction('rw', db.paymentChannels, async () => {
      const channel = await db.paymentChannels.get(channelId);
      const selfAddress = channel.selfAddress;
      if (selfAddress !== receiver) {
        return;
      }
      const depositWithdrawal = channel.depositWithdrawal;
      if (selfAddress < channel.peerAddress) {
        depositWithdrawal.selfDeposit = deposits[0];
        depositWithdrawal.peerDeposit = deposits[1];
        depositWithdrawal.selfWithdrawal = withdrawals[0];
        depositWithdrawal.peerWithdrawal = withdrawals[1];
      } else {
        depositWithdrawal.selfDeposit = deposits[1];
        depositWithdrawal.peerDeposit = deposits[0];
        depositWithdrawal.selfWithdrawal = withdrawals[1];
        depositWithdrawal.peerWithdrawal = withdrawals[0];
      }
      await db.paymentChannels.put(channel);
    });
  }
}
