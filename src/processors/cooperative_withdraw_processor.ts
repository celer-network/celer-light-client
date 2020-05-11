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
  CooperativeWithdrawInfo,
} from '../protobufs/entity_pb';
import {
  CelerMsg,
  CooperativeWithdrawRequest,
  CooperativeWithdrawResponse,
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
      /* eslint-disable-next-line no-await-in-loop */
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
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
    const { peerAddress } = await this.db.paymentChannels.get(channelId);

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
        /* eslint-disable-next-line no-await-in-loop */
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
    const { values } = log;
    const channelId = ethers.utils.hexlify(values.channelId);
    const { receiver, deposits, withdrawals } = values;
    // TODO(dominator008): Handle recipientChannelId
    const { db } = this;
    return db.transaction('rw', db.paymentChannels, async () => {
      const channel = await db.paymentChannels.get(channelId);
      const { selfAddress } = channel;
      if (selfAddress !== receiver) {
        return;
      }
      const { depositWithdrawal } = channel;
      if (selfAddress < channel.peerAddress) {
        [
          depositWithdrawal.selfDeposit,
          depositWithdrawal.peerDeposit,
        ] = deposits;
        [
          depositWithdrawal.selfWithdrawal,
          depositWithdrawal.peerWithdrawal,
        ] = withdrawals;
      } else {
        [
          depositWithdrawal.peerDeposit,
          depositWithdrawal.selfDeposit,
        ] = deposits;
        [
          depositWithdrawal.peerWithdrawal,
          depositWithdrawal.selfWithdrawal,
        ] = withdrawals;
      }
      await db.paymentChannels.put(channel);
    });
  }
}
