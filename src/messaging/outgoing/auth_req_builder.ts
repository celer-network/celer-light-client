import { ethers } from 'ethers';

import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import { AuthReq, ChannelSummary } from '../../protobufs/message_pb';
import * as typeUtils from '../../utils/types';

export class AuthReqBuilder {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async build(
    peerAddress: string,
    cryptoManager: CryptoManager
  ): Promise<AuthReq> {
    const authRequest = new AuthReq();
    const selfAddressBytes = ethers.utils.arrayify(
      await cryptoManager.signer.getAddress()
    );
    const peerAddressBytes = ethers.utils.arrayify(peerAddress);
    // Use Unix timestamp and pad to 8 bytes as required by the OSP
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampBytes = ethers.utils.padZeros(
      typeUtils.numberToBytes(timestamp),
      8
    );
    const signatureBytes = ethers.utils.arrayify(
      await cryptoManager.signHash(timestampBytes)
    );
    authRequest.setMyAddr(selfAddressBytes);
    authRequest.setTimestamp(timestamp);
    authRequest.setExpectPeer(peerAddressBytes);
    authRequest.setMySig(signatureBytes);
    authRequest.setMutualAuth(true);
    authRequest.setProtocolVersion(1); // Signal sync support
    authRequest.setOpenedChannelsList(await this.getChannels());
    return authRequest;
  }

  private async getChannels(): Promise<ChannelSummary[]> {
    const summaries = [];
    await this.db.paymentChannels.each((channel) => {
      const summary = new ChannelSummary();
      summary.setChannelId(ethers.utils.arrayify(channel.channelId));
      const outgoingSimplexState = SimplexPaymentChannel.deserializeBinary(
        channel.getOutgoingSignedSimplexState().getSimplexState_asU8()
      );
      const incomingSimplexState = SimplexPaymentChannel.deserializeBinary(
        channel.getIncomingSignedSimplexState().getSimplexState_asU8()
      );
      summary.setMySeqNum(outgoingSimplexState.getSeqNum());
      summary.setPeerSeqNum(incomingSimplexState.getSeqNum());
      summary.setLedgerAddr(ethers.utils.arrayify(channel.ledgerAddress));
      summaries.push(summary);
    });
    return summaries;
  }
}
