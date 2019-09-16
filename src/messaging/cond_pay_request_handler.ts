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

import { Config } from '../config';
import { CustomSigner } from '../crypto/custom_signer';
import { ConditionalPay, SimplexPaymentChannel } from '../protobufs/entity_pb';
import {
  CelerMsg,
  CondPayResponse,
  ErrCode,
  ErrCodeMap,
  Error as ErrorResponse,
  SignedSimplexState
} from '../protobufs/message_pb';
import { Database } from '../storage/database';
import { Payment, PaymentStatus } from '../storage/payment';
import { PaymentChannelStatus } from '../storage/payment_channel';
import * as errorUtils from '../utils/errors';
import * as paymentUtils from '../utils/payments';
import * as typeUtils from '../utils/types';
import { MessageManager } from './message_manager';

const INVALID_PENDING_PAYMENTS = 'Invalid pending payments';

export class CondPayRequestHandler {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly signer: CustomSigner;
  private readonly config: Config;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    messageManager: MessageManager,
    signer: CustomSigner,
    config: Config
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.signer = signer;
    this.config = config;
    this.peerAddress = ethers.utils.getAddress(this.config.ospEthAddress);
  }

  async handle(incomingMessage: CelerMsg): Promise<void> {
    const db = this.db;
    const request = incomingMessage.getCondPayRequest();
    const receivedSignedSimplexState = request.getStateOnlyPeerFromSig();
    const receivedSimplexStateBytes = receivedSignedSimplexState.getSimplexState_asU8();
    const receivedSimplexState = SimplexPaymentChannel.deserializeBinary(
      receivedSimplexStateBytes
    );
    const conditionalPay = ConditionalPay.deserializeBinary(
      request.getCondPay_asU8()
    );
    const paymentId = paymentUtils.calculatePaymentId(conditionalPay);
    const receivedChannelId = ethers.utils.hexlify(
      receivedSimplexState.getChannelId_asU8()
    );

    const {
      valid,
      lastCosignedSimplexState,
      errCode,
      errReason
    } = await this.verifyCondPayRequest(
      await this.signer.provider.getSigner().getAddress(),
      paymentId,
      receivedChannelId,
      request.getBaseSeq(),
      receivedSignedSimplexState,
      receivedSimplexState,
      receivedSimplexStateBytes,
      conditionalPay
    );

    const outgoingMessage = new CelerMsg();
    outgoingMessage.setToAddr(conditionalPay.getSrc_asU8());
    const condPayResponse = new CondPayResponse();
    if (valid) {
      const mySig = await this.signer.signHash(receivedSimplexStateBytes);
      receivedSignedSimplexState.setSigOfPeerTo(ethers.utils.arrayify(mySig));

      const channel = await db.paymentChannels.get(receivedChannelId);
      channel.setIncomingSignedSimplexState(receivedSignedSimplexState);
      await db.paymentChannels.put(channel);

      condPayResponse.setStateCosigned(receivedSignedSimplexState);
      outgoingMessage.setCondPayResponse(condPayResponse);
      await this.messageManager.sendMessage(outgoingMessage);

      const payment = new Payment(
        paymentId,
        conditionalPay,
        request.getNote(),
        receivedChannelId,
        undefined
      );
      payment.status = PaymentStatus.CO_SIGNED_PENDING;
      await db.payments.add(payment);
    } else {
      if (lastCosignedSimplexState) {
        condPayResponse.setStateCosigned(lastCosignedSimplexState);
      }
      const errorResponse = new ErrorResponse();
      if (errCode) {
        errorResponse.setCode(errCode);
      }
      if (errReason) {
        errorResponse.setReason(errReason);
      }
      condPayResponse.setError(errorResponse);
      outgoingMessage.setCondPayResponse(condPayResponse);
      await this.messageManager.sendMessage(outgoingMessage);
    }
  }

  private async verifyCondPayRequest(
    selfAddress: string,
    paymentId: string,
    receivedChannelId: string,
    receivedBaseSeqNum: number,
    receivedSignedSimplexState: SignedSimplexState,
    receivedSimplexState: SimplexPaymentChannel,
    receivedSimplexStateBytes: Uint8Array,
    conditionalPay: ConditionalPay
  ): Promise<{
    readonly valid: boolean;
    readonly lastCosignedSimplexState?: SignedSimplexState;
    readonly errCode?: ErrCodeMap[keyof ErrCodeMap];
    readonly errReason?: string;
  }> {
    const db = this.db;

    // Verify channel existence
    const channel = await db.paymentChannels.get(receivedChannelId);
    if (!channel) {
      return {
        valid: false,
        errReason: errorUtils.unknownChannel(receivedChannelId).message
      };
    }

    const storedSignedSimplexState = channel.getIncomingSignedSimplexState();
    const storedSimplexState = SimplexPaymentChannel.deserializeBinary(
      storedSignedSimplexState.getSimplexState_asU8()
    );

    // Verify channel status
    if (channel.status !== PaymentChannelStatus.OPEN) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: errorUtils.paymentChannelNotOpen(receivedChannelId).message
      };
    }

    // Verify peer signature
    const peerSignature = ethers.utils.splitSignature(
      receivedSignedSimplexState.getSigOfPeerFrom_asU8()
    );
    if (
      !CustomSigner.isSignatureValid(
        this.peerAddress,
        receivedSimplexStateBytes,
        peerSignature
      )
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errCode: ErrCode.INVALID_SIG
      };
    }

    // Verify payment destination
    if (
      selfAddress !== typeUtils.bytesToAddress(conditionalPay.getDest_asU8())
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errCode: ErrCode.WRONG_PEER
      };
    }

    // Verify peerFrom
    if (
      ethers.utils.hexlify(receivedSimplexState.getPeerFrom_asU8()) !==
      ethers.utils.hexlify(storedSimplexState.getPeerFrom_asU8())
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Invalid peerFrom'
      };
    }

    // Verify base sequence number and proposed sequence number
    if (
      !paymentUtils.isSeqNumValid(
        storedSimplexState.getSeqNum(),
        receivedSimplexState.getSeqNum(),
        receivedBaseSeqNum
      )
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errCode: ErrCode.INVALID_SEQ_NUM
      };
    }

    // Verify balance
    const balance = channel.calculateBalance();
    const receivedAmount = ethers.utils.bigNumberify(
      conditionalPay
        .getTransferFunc()
        .getMaxTransfer()
        .getReceiver()
        .getAmt_asU8()
    );
    if (receivedAmount.gt(balance.freeReceivingCapacity)) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Insufficient balance'
      };
    }

    // Verify PayResolver address
    if (
      typeUtils.bytesToAddress(conditionalPay.getPayResolver_asU8()) !==
      ethers.utils.getAddress(this.config.payResolverAddress)
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Invalid PayResolver address'
      };
    }

    // Verify last payment resolve deadline
    // TODO(dominator008): Check this logic
    const deadline = Math.max(
      storedSimplexState.getLastPayResolveDeadline(),
      conditionalPay.getResolveDeadline()
    );
    if (deadline !== receivedSimplexState.getLastPayResolveDeadline()) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Invalid last payment resolve deadline'
      };
    }

    // Verify transfer amount
    if (
      ethers.utils.hexlify(
        storedSimplexState
          .getTransferToPeer()
          .getReceiver()
          .getAmt_asU8()
      ) !==
      ethers.utils.hexlify(
        receivedSimplexState
          .getTransferToPeer()
          .getReceiver()
          .getAmt_asU8()
      )
    ) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Invalid transfer amount'
      };
    }

    // Verify total pending amount
    const storedPendingAmount = ethers.utils.bigNumberify(
      storedSimplexState.getTotalPendingAmount_asU8()
    );
    const receivedPendingAmount = ethers.utils.bigNumberify(
      receivedSimplexState.getTotalPendingAmount_asU8()
    );
    if (!storedPendingAmount.add(receivedAmount).eq(receivedPendingAmount)) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Invalid total pending amount'
      };
    }

    // Verify max number of pending payments
    const storedPendingPayments = storedSimplexState
      .getPendingPayIds()
      .getPayIdsList();
    const receivedPendingPayments = receivedSimplexState
      .getPendingPayIds()
      .getPayIdsList();
    if (receivedPendingPayments.length > this.config.maxPendingPayments) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: 'Too many pending payments'
      };
    }

    // Verify pending payment list
    const [
      addedPendingPayments,
      removedPendingPayments
    ] = paymentUtils.getAddedAndRemovedPendingPayments(
      storedPendingPayments,
      receivedPendingPayments
    );
    // Only allow one added pending payment and no removed payments
    if (removedPendingPayments.length > 0 || addedPendingPayments.length > 1) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: INVALID_PENDING_PAYMENTS
      };
    }
    if (paymentId !== ethers.utils.hexlify(addedPendingPayments[0])) {
      return {
        valid: false,
        lastCosignedSimplexState: storedSignedSimplexState,
        errReason: INVALID_PENDING_PAYMENTS
      };
    }

    return { valid: true };
  }
}
