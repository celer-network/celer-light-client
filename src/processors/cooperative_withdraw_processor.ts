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

import { Contract, ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import celerLedgerAbi from '../abi/celer_ledger.json';
import { ContractsInfo } from '../api/contracts_info';
import { CryptoManager } from '../crypto/crypto_manager.js';
import { Database } from '../data/database';
import { CooperativeWithdrawRequest } from '../protobufs/chain_pb';
import {
  AccountAmtPair,
  CooperativeWithdrawInfo,
  TokenInfo
} from '../protobufs/entity_pb';

export class CooperativeWithdrawProcessor {
  private readonly db: Database;
  private readonly cryptoManager: CryptoManager;
  private readonly contractsInfo: ContractsInfo;

  // TODO(dominator008): Implement this
  constructor(
    db: Database,
    cryptoManager: CryptoManager,
    contractsInfo: ContractsInfo
  ) {
    this.db = db;
    this.cryptoManager = cryptoManager;
    this.contractsInfo = contractsInfo;
  }

  async cooperativeWithdraw(
    channelId: string,
    amount: string
  ): Promise<string> {
    const channelIdBytes = ethers.utils.arrayify(channelId);
    const celerLedger = new ethers.Contract(
      this.contractsInfo.celerLedgerAddress,
      JSON.stringify(celerLedgerAbi),
      this.cryptoManager.provider
    );
    let seqNum: BigNumber = await celerLedger.getCooperativeWithdrawSeqNum(
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

    const cooperativeWithdrawInfo = new CooperativeWithdrawInfo();
    cooperativeWithdrawInfo.setChannelId(channelIdBytes);

    const request = new CooperativeWithdrawRequest();

    //    request.setWithdrawInfo();
    return '';
  }
}
