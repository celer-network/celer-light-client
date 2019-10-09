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

import { Config } from '../../config';
import { CustomSigner } from '../../crypto/custom_signer';
import { Database } from '../../data/database';
import { Payment, PaymentStatus } from '../../data/payment';
import { PaymentChannel } from '../../data/payment_channel';
import {
  ConditionalPay,
  SimplexPaymentChannel
} from '../../protobufs/entity_pb';
import {
  CelerMsg,
  CondPayReceipt,
  CondPayResponse,
  ErrCode,
  Error as ErrorResponse,
  SignedSimplexState
} from '../../protobufs/message_pb';
import * as errorUtils from '../../utils/errors';
import * as typeUtils from '../../utils/types';
import { MessageManager } from '../message_manager';

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

  async handle(requestMessage: CelerMsg): Promise<void> {
    const request = requestMessage.getCondPayRequest();
    const receivedSignedSimplexState = request.getStateOnlyPeerFromSig();
    const receivedSimplexStateBytes = receivedSignedSimplexState.getSimplexState_asU8();
    const receivedSimplexState = SimplexPaymentChannel.deserializeBinary(
      receivedSimplexStateBytes
    );
    const conditionalPay = ConditionalPay.deserializeBinary(
      request.getCondPay_asU8()
    );
    const paymentId = Payment.calculatePaymentId(conditionalPay);
    const receivedChannelId = ethers.utils.hexlify(
      receivedSimplexState.getChannelId_asU8()
    );

    const {
      result: { valid, errCode, errReason },
      lastCosignedSimplexState
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

    const responseMessage = new CelerMsg();
    const condPayResponse = new CondPayResponse();
    if (valid) {
      // Send CondPayResponse and CondPayReceipt
      const selfSignatureForSimplexState = await this.signer.signHash(
        receivedSimplexStateBytes
      );
      const selfSignatureForSimplexStateBytes = ethers.utils.arrayify(
        selfSignatureForSimplexState
      );
      receivedSignedSimplexState.setSigOfPeerTo(
        selfSignatureForSimplexStateBytes
      );

      const db = this.db;
      const channel = await db.paymentChannels.get(receivedChannelId);
      channel.setIncomingSignedSimplexState(receivedSignedSimplexState);
      await db.paymentChannels.put(channel);

      condPayResponse.setStateCosigned(receivedSignedSimplexState);
      responseMessage.setCondPayResponse(condPayResponse);
      await this.messageManager.sendMessage(responseMessage);

      const payment = new Payment(
        paymentId,
        conditionalPay,
        receivedChannelId,
        undefined,
        request.getNote()
      );
      payment.status = PaymentStatus.CO_SIGNED_PENDING;
      await db.payments.add(payment);

      const receiptMessage = new CelerMsg();
      receiptMessage.setToAddr(conditionalPay.getSrc_asU8());
      const condPayReceipt = new CondPayReceipt();
      const selfSignatureForConditionalPay = await this.signer.signHash(
        conditionalPay.serializeBinary()
      );
      const selfSignatureForConditionalPayBytes = ethers.utils.arrayify(
        selfSignatureForConditionalPay
      );
      condPayReceipt.setPayDestSig(selfSignatureForConditionalPayBytes);
      condPayReceipt.setPayId(ethers.utils.arrayify(paymentId));
      receiptMessage.setCondPayReceipt(condPayReceipt);
      await this.messageManager.sendMessage(receiptMessage);
    } else {
      // Only send CondPayResponse with error and latest cosigned simplex state
      if (lastCosignedSimplexState) {
        condPayResponse.setStateCosigned(lastCosignedSimplexState);
      }
      const errorResponse = new ErrorResponse();
      errorResponse.setSeq(receivedSimplexState.getSeqNum());
      if (errCode) {
        errorResponse.setCode(errCode);
      }
      if (errReason) {
        errorResponse.setReason(errReason);
      }
      condPayResponse.setError(errorResponse);
      responseMessage.setCondPayResponse(condPayResponse);
      await this.messageManager.sendMessage(responseMessage);
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
    readonly result: errorUtils.VerificationResult;
    readonly lastCosignedSimplexState?: SignedSimplexState;
  }> {
    const db = this.db;
    const {
      result: existenceResult,
      channel,
      storedSignedSimplexState,
      storedSimplexState
    } = await PaymentChannel.verifyIncomingChannelExistence(
      db,
      receivedChannelId
    );
    if (!existenceResult.valid) {
      return { result: existenceResult };
    }

    const commonResult = PaymentChannel.verifyIncomingCommonSimplexStates(
      channel,
      this.peerAddress,
      receivedChannelId,
      receivedBaseSeqNum,
      receivedSignedSimplexState,
      receivedSimplexState,
      receivedSimplexStateBytes,
      storedSimplexState
    );
    if (!commonResult.valid) {
      return {
        result: commonResult,
        lastCosignedSimplexState: storedSignedSimplexState
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
        result: {
          valid: false,
          errReason: 'Invalid transfer amount'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify payment destination
    if (
      selfAddress !== typeUtils.bytesToAddress(conditionalPay.getDest_asU8())
    ) {
      return {
        result: {
          valid: false,
          errCode: ErrCode.WRONG_PEER
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify balance assuming all payments will be settled with the maximal
    // transfer amount
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
        result: {
          valid: false,
          errReason: 'Insufficient balance'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify PayResolver address
    if (
      typeUtils.bytesToAddress(conditionalPay.getPayResolver_asU8()) !==
      ethers.utils.getAddress(this.config.payResolverAddress)
    ) {
      return {
        result: {
          valid: false,
          errReason: 'Invalid PayResolver address'
        },
        lastCosignedSimplexState: storedSignedSimplexState
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
        result: {
          valid: false,
          errReason: 'Invalid last payment resolve deadline'
        },
        lastCosignedSimplexState: storedSignedSimplexState
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
        result: {
          valid: false,
          errReason: 'Invalid total pending amount'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify max number of pending payments
    const storedPendingPayIds = storedSimplexState.getPendingPayIds();
    const receivedPendingPayIds = receivedSimplexState.getPendingPayIds();
    const receivedPendingPayIdsList = receivedPendingPayIds.getPayIdsList_asU8();
    if (receivedPendingPayIdsList.length > this.config.maxPendingPayments) {
      return {
        result: {
          valid: false,
          errReason: 'Too many pending payments'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify pending payment list
    const [
      removedPendingPaymentIds,
      addedPendingPaymentIds
    ] = Payment.getPaymentIdListDifferences(
      storedPendingPayIds,
      receivedPendingPayIds
    );
    // Only allow one added pending payment and no removed payments
    if (
      removedPendingPaymentIds.length > 0 ||
      addedPendingPaymentIds.length > 1
    ) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.INVALID_PENDING_PAYMENTS
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }
    if (paymentId !== ethers.utils.hexlify(addedPendingPaymentIds[0])) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.INVALID_PENDING_PAYMENTS
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    return { result: { valid: true } };
  }
}
