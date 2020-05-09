import { ethers, Signer } from 'ethers';
import { BigNumber, LogDescription } from 'ethers/utils';

import { CelerLedgerFactory } from '../abi/CelerLedgerFactory';
import { TransactionOverrides } from '../abi/index';
import { ContractsInfo } from '../api/contracts_info';
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
    const { db } = this;
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
    const { signer } = this;
    const celerLedger = CelerLedgerFactory.connect(
      this.contractsInfo.celerLedgerAddress,
      signer
    );
    const overrides: TransactionOverrides = {};
    let transferFromAmount = amount;
    if (tokenType === TokenType.ETH) {
      overrides.value = amount;
      transferFromAmount = ethers.utils.bigNumberify(0);
    }

    const tx = await celerLedger.functions.deposit(
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
    for (const event of receipt.events) {
      if (event.topics[0] === ledgerInterface.events.Deposit.topic) {
        /* eslint-disable-next-line no-await-in-loop */
        await this.processDepositEvent(ledgerInterface.parseLog(event));
        break;
      }
    }
    return tx.hash;
  }

  private async processDepositEvent(log: LogDescription): Promise<void> {
    const { values } = log;
    const channelId = ethers.utils.hexlify(values.channelId);
    const addresses: string[] = values.peerAddrs;
    const { deposits } = values;
    const { db } = this;
    return db.transaction('rw', db.paymentChannels, async () => {
      const channel = await db.paymentChannels.get(channelId);
      const { depositWithdrawal } = channel;
      if (addresses[0] === channel.selfAddress) {
        [
          depositWithdrawal.selfDeposit,
          depositWithdrawal.peerDeposit,
        ] = deposits;
      } else {
        [
          depositWithdrawal.peerDeposit,
          depositWithdrawal.selfDeposit,
        ] = deposits;
      }
      await db.paymentChannels.put(channel);
    });
  }
}
