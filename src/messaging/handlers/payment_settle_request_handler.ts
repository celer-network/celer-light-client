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

import Dexie from 'dexie';
import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Config } from '../../api/config';
import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { Payment, PaymentStatus } from '../../data/payment';
import { PaymentChannel } from '../../data/payment_channel';
import { ResolvePaymentProcessor } from '../../processors/resolve_payment_processor';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import {
  CelerMsg,
  ErrCode,
  Error as ErrorResponse,
  PaymentSettleReason,
  PaymentSettleResponse,
  SettledPayment,
  SignedSimplexState
} from '../../protobufs/message_pb';
import * as errorUtils from '../../utils/errors';
import * as typeUtils from '../../utils/types';
import { MessageManager } from '../message_manager';

const INCOMING_EXPIRATION_SAFETY_MARGIN = 4;

export class PaymentSettleRequestHandler {
  private readonly db: Database;
  private readonly messageManager: MessageManager;
  private readonly resolvePaymentProcessor: ResolvePaymentProcessor;
  private readonly cryptoManager: CryptoManager;
  private readonly config: Config;
  private readonly peerAddress: string;

  constructor(
    db: Database,
    messageManager: MessageManager,
    resolvePaymentProcessor: ResolvePaymentProcessor,
    cryptoManager: CryptoManager,
    config: Config
  ) {
    this.db = db;
    this.messageManager = messageManager;
    this.resolvePaymentProcessor = resolvePaymentProcessor;
    this.cryptoManager = cryptoManager;
    this.config = config;
    this.peerAddress = ethers.utils.getAddress(this.config.ospEthAddress);
  }

  async handle(requestMessage: CelerMsg): Promise<void> {
    const request = requestMessage.getPaymentSettleRequest();
    const receivedSignedSimplexState = request.getStateOnlyPeerFromSig();
    const receivedSimplexStateBytes = receivedSignedSimplexState.getSimplexState_asU8();
    const receivedSimplexState = SimplexPaymentChannel.deserializeBinary(
      receivedSimplexStateBytes
    );
    const receivedChannelId = ethers.utils.hexlify(
      receivedSimplexState.getChannelId_asU8()
    );

    const settledPayments = request.getSettledPaysList();
    const {
      result: { valid, errCode, errReason },
      lastCosignedSimplexState
    } = await this.verifyPaymentSettleRequest(
      await this.cryptoManager.signer.getAddress(),
      receivedChannelId,
      request.getBaseSeq(),
      receivedSignedSimplexState,
      receivedSimplexState,
      receivedSimplexStateBytes,
      settledPayments
    );

    const responseMessage = new CelerMsg();
    const paymentSettleResponse = new PaymentSettleResponse();
    if (valid) {
      const selfSignature = await this.cryptoManager.signHash(
        receivedSimplexStateBytes
      );
      const selfSignatureBytes = ethers.utils.arrayify(selfSignature);
      receivedSignedSimplexState.setSigOfPeerTo(selfSignatureBytes);

      const db = this.db;
      const channel = await db.paymentChannels.get(receivedChannelId);
      channel.setIncomingSignedSimplexState(receivedSignedSimplexState);
      await db.paymentChannels.put(channel);

      paymentSettleResponse.setStateCosigned(receivedSignedSimplexState);
      responseMessage.setPaymentSettleResponse(paymentSettleResponse);
      await this.messageManager.sendMessage(responseMessage);

      await db.transaction('rw', db.payments, async () => {
        for (const settledPayment of settledPayments) {
          await db.payments.update(
            ethers.utils.hexlify(settledPayment.getSettledPayId_asU8()),
            { status: PaymentStatus.CO_SIGNED_SETTLED }
          );
        }
      });
    } else {
      if (lastCosignedSimplexState) {
        paymentSettleResponse.setStateCosigned(lastCosignedSimplexState);
      }
      const errorResponse = new ErrorResponse();
      errorResponse.setSeq(receivedSimplexState.getSeqNum());
      if (errCode) {
        errorResponse.setCode(errCode);
      }
      if (errReason) {
        errorResponse.setReason(errReason);
      }
      paymentSettleResponse.setError(errorResponse);
      responseMessage.setPaymentSettleResponse(paymentSettleResponse);
      await this.messageManager.sendMessage(responseMessage);
    }
  }

  private async verifyPaymentSettleRequest(
    selfAddress: string,
    receivedChannelId: string,
    receivedBaseSeqNum: number,
    receivedSignedSimplexState: SignedSimplexState,
    receivedSimplexState: SimplexPaymentChannel,
    receivedSimplexStateBytes: Uint8Array,
    settledPayments: SettledPayment[]
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

    // Verify pending payment list
    const storedPendingPayIds = storedSimplexState.getPendingPayIds();
    const receivedPendingPayIds = receivedSimplexState.getPendingPayIds();
    const storedPendingPayIdsList = storedPendingPayIds.getPayIdsList_asU8();
    const receivedPendingPayIdsList = receivedPendingPayIds.getPayIdsList_asU8();
    const [
      removedPendingPayIds,
      addedPendingPayIds
    ] = Payment.getPaymentIdListDifferences(
      storedPendingPayIds,
      receivedPendingPayIds
    );
    // Only allow removed pending payments
    if (addedPendingPayIds.length > 0 || removedPendingPayIds.length === 0) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.INVALID_PENDING_PAYMENTS
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify that settled payments and removed pending payments match
    const settledPaymentIds: Uint8Array[] = [];
    for (const settledPayment of settledPayments) {
      settledPaymentIds.push(settledPayment.getSettledPayId_asU8());
    }
    const [
      paymentIdsOnlyInSettled,
      paymentIdsOnlyInRemoved
    ] = Payment.getUint8ArrayListDifferences(
      settledPaymentIds,
      removedPendingPayIds
    );
    if (
      paymentIdsOnlyInSettled.length > 0 ||
      paymentIdsOnlyInRemoved.length > 0
    ) {
      return {
        result: {
          valid: false,
          errReason:
            'Mismatch between settled payments and removed pending payments'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    const settledAmounts: BigNumber[] = [];
    let totalSettledAmount = ethers.utils.bigNumberify(0);
    for (const settledPayment of settledPayments) {
      const settledAmount = ethers.utils.bigNumberify(
        settledPayment.getAmount_asU8()
      );
      settledAmounts.push(settledAmount);
      totalSettledAmount = totalSettledAmount.add(settledAmount);
    }

    // Verify transfer amount
    const oldTransferAmount = ethers.utils.bigNumberify(
      storedSimplexState
        .getTransferToPeer()
        .getReceiver()
        .getAmt_asU8()
    );
    const newTransferAmount = ethers.utils.bigNumberify(
      receivedSimplexState
        .getTransferToPeer()
        .getReceiver()
        .getAmt_asU8()
    );
    const deltaAmount = newTransferAmount.sub(oldTransferAmount);
    // For now, only allow settling maximal transfer or 0
    // TODO(dominator008): Relax this check
    if (!deltaAmount.eq(totalSettledAmount) && !deltaAmount.eq(0)) {
      return {
        result: {
          valid: false,
          errReason: 'Invalid transfer amount'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify last resolve deadline
    if (
      storedSimplexState.getLastPayResolveDeadline() !==
      receivedSimplexState.getLastPayResolveDeadline()
    ) {
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
    if (
      !receivedPendingAmount.add(totalSettledAmount).eq(storedPendingAmount)
    ) {
      return {
        result: {
          valid: false,
          errReason: 'Invalid total pending amount'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    // Verify all payments exist
    const payments: Payment[] = [];
    try {
      await db.transaction('r', db.payments, async () => {
        for (const settledPaymentId of settledPaymentIds) {
          const payment = await db.payments.get(
            ethers.utils.hexlify(settledPaymentId)
          );
          if (!payment) {
            Dexie.currentTransaction.abort();
            return;
          }
          payments.push(payment);
        }
      });
    } catch (_) {
      return {
        result: {
          valid: false,
          errReason: 'Unknown settled payments'
        },
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    const detailsResult = await this.verifySettledPaymentDetails(
      selfAddress,
      settledPayments,
      settledAmounts,
      payments
    );
    if (!detailsResult.valid) {
      return {
        result: detailsResult,
        lastCosignedSimplexState: storedSignedSimplexState
      };
    }

    return { result: { valid: true } };
  }

  private async verifySettledPaymentDetails(
    selfAddress: string,
    settledPayments: SettledPayment[],
    settledAmounts: BigNumber[],
    payments: Payment[]
  ): Promise<errorUtils.VerificationResult> {
    for (let i = 0; i < settledPayments.length; i++) {
      const payment = payments[i];
      const conditionalPay = payment.getConditionalPay();
      // Verify payment destination
      if (
        selfAddress !== typeUtils.bytesToAddress(conditionalPay.getDest_asU8())
      ) {
        return {
          valid: false,
          errCode: ErrCode.WRONG_PEER
        };
      }

      const settledAmount = settledAmounts[i];
      const reason = settledPayments[i].getReason();
      switch (reason) {
        case PaymentSettleReason.PAY_EXPIRED: {
          // If we have already initiated the settlement, ignore and continue
          // TODO(dominator008): Check this logic
          if (payment.status === PaymentStatus.PEER_FROM_SIGNED_SETTLED) {
            continue;
          }

          // Verify payment expiration
          const blockNumber = await this.cryptoManager.provider.getBlockNumber();
          if (
            blockNumber <
            payment.getConditionalPay().getResolveDeadline() +
              INCOMING_EXPIRATION_SAFETY_MARGIN
          ) {
            return {
              valid: false,
              errReason: 'Payment not expired'
            };
          }

          // Verify that the settled amount is 0
          if (!settledAmount.eq(0)) {
            return {
              valid: false,
              errReason: 'Invalid settled amount'
            };
          }

          // Verify that the payment is not resolved on-chain with a non-zero
          // amount
          const onChainPaymentInfo = await this.resolvePaymentProcessor.getOnChainPaymentInfo(
            payment.paymentId
          );
          if (onChainPaymentInfo && onChainPaymentInfo.amount.gt(0)) {
            return {
              valid: false,
              errReason: 'Payment resolved on-chain with non-zero amount'
            };
          }
          break;
        }
        case PaymentSettleReason.PAY_PAID_MAX:
        case PaymentSettleReason.PAY_RESOLVED_ONCHAIN: {
          // Verify that the settled amount is the max transfer
          const maxTransfer = ethers.utils.bigNumberify(
            conditionalPay
              .getTransferFunc()
              .getMaxTransfer()
              .getReceiver()
              .getAmt_asU8()
          );
          if (!settledAmount.eq(maxTransfer)) {
            return {
              valid: false,
              errReason: 'Invalid settled amount'
            };
          }
          break;
        }
        case PaymentSettleReason.PAY_REJECTED:
        case PaymentSettleReason.PAY_DEST_UNREACHABLE: {
          // Must be a reply to a PEER_FROM_SIGNED_SETTLED payment
          if (!(payment.status === PaymentStatus.PEER_FROM_SIGNED_SETTLED)) {
            return {
              valid: false,
              errReason: 'Invalid payment status'
            };
          }

          // Verify that the settled amount is 0
          if (!settledAmount.eq(0)) {
            return {
              valid: false,
              errReason: 'Invalid settled amount'
            };
          }
          break;
        }
        default:
          return {
            valid: false,
            errReason: 'Unsupported payment settlement reason'
          };
      }
    }

    return { valid: true };
  }
}
