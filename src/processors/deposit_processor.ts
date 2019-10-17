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

import { ethers, Signer } from 'ethers';
import { TransactionRequest, TransactionResponse } from 'ethers/providers';
import { BigNumber, LogDescription } from 'ethers/utils';

import celerLedgerAbi from '../abi/celer_ledger.json';
import { ContractsInfo } from '../api/contracts_info.js';
import { Database } from '../data/database';
import { TokenType, TokenTypeMap } from '../protobufs/entity_pb';
import * as errorUtils from '../utils/errors';

export class DepositProcessor {
  private readonly db: Database;
  private readonly signer: Signer;
  private readonly contractsInfo: ContractsInfo;

  constructor(db: Database, signer: Signer, contractsInfo: ContractsInfo) {
    this.db = db;
    this.signer = signer;
    this.contractsInfo = contractsInfo;
  }

  async deposit(
    channelId: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    amount: string
  ): Promise<string> {
    const db = this.db;
    const channel = await db.paymentChannels.get(channelId);
    if (!channel) {
      throw errorUtils.unknownChannel(channelId);
    }
    return this.sendDepositTx(
      channelId,
      tokenType,
      ethers.utils.bigNumberify(amount)
    );
  }

  private async sendDepositTx(
    channelId: string,
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    amount: BigNumber
  ): Promise<string> {
    const signer = this.signer;
    const celerLedger = new ethers.Contract(
      this.contractsInfo.celerLedgerAddress,
      JSON.stringify(celerLedgerAbi),
      signer
    );

    const overrides: TransactionRequest = {};
    let transferFromAmount = amount;
    if (tokenType === TokenType.ETH) {
      overrides.value = amount;
      transferFromAmount = ethers.utils.bigNumberify(0);
    }

    const selfAddress = await signer.getAddress();
    const tx: TransactionResponse = await celerLedger.deposit(
      ethers.utils.arrayify(channelId),
      await signer.getAddress(),
      transferFromAmount,
      overrides
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error(`Deposit tx ${tx.hash} failed`);
    }
    const ledgerInterface = celerLedger.interface;
    for (const log of receipt.logs) {
      if (log.topics[0] === ledgerInterface.events.Deposit.topic) {
        await this.processDepositEvent(ledgerInterface.parseLog(log));
        break;
      }
    }
    return tx.hash;
  }

  private async processDepositEvent(log: LogDescription): Promise<void> {
    const values = log.values;
    const channelId = ethers.utils.hexlify(values.channelId);
    const addresses: string[] = values.peerAddrs;
    const deposits: Uint8Array[] = values.deposits;
    const db = this.db;
    return db.transaction('rw', db.paymentChannels, async () => {
      const channel = await db.paymentChannels.get(channelId);
      const depositWithdrawal = channel.depositWithdrawal;
      if (addresses[0] === channel.selfAddress) {
        depositWithdrawal.selfDeposit = deposits[0];
        depositWithdrawal.peerDeposit = deposits[1];
      } else {
        depositWithdrawal.selfDeposit = deposits[1];
        depositWithdrawal.peerDeposit = deposits[0];
      }
      await db.paymentChannels.put(channel);
    });
  }
}
