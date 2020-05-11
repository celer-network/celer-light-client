import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Config } from '../../api/config';
import { CryptoManager } from '../../crypto/crypto_manager';
import { Database } from '../../data/database';
import { Payment, PaymentStatus } from '../../data/payment';
import { PaymentChannel } from '../../data/payment_channel';
import { PaymentChannelUtils } from '../../data/payment_channel_utils';
import { ResolvePaymentProcessor } from '../../processors/resolve_payment_processor';
import { SimplexPaymentChannel } from '../../protobufs/entity_pb';
import {
  CelerMsg,
  ErrCode,
  Error as ErrorResponse,
  PaymentSettleReason,
  PaymentSettleResponse,
  SettledPayment,
  SignedSimplexState,
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
      lastCosignedSimplexState,
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

      const { db } = this;
      const channel = await db.paymentChannels.get(receivedChannelId);
      channel.setIncomingSignedSimplexState(receivedSignedSimplexState);
      await db.paymentChannels.put(channel);

      paymentSettleResponse.setStateCosigned(receivedSignedSimplexState);
      responseMessage.setPaymentSettleResponse(paymentSettleResponse);
      await this.messageManager.sendMessage(responseMessage);

      const paymentIds = settledPayments.map((settledPayment) =>
        ethers.utils.hexlify(settledPayment.getSettledPayId_asU8())
      );
      const payments = await db.payments.bulkGet(paymentIds);
      for (const payment of payments) {
        payment.status = PaymentStatus.CO_SIGNED_SETTLED;
      }
      await db.payments.bulkPut(payments);
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
    const { db } = this;
    const {
      result: existenceResult,
      channel,
      storedSignedSimplexState,
      storedSimplexState,
    } = await PaymentChannelUtils.verifyIncomingChannelExistence(
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
        lastCosignedSimplexState: storedSignedSimplexState,
      };
    }

    // Verify pending payment list
    const storedPendingPayIds = storedSimplexState.getPendingPayIds();
    const receivedPendingPayIds = receivedSimplexState.getPendingPayIds();
    const [
      removedPendingPayIds,
      addedPendingPayIds,
    ] = Payment.getPaymentIdListDifferences(
      storedPendingPayIds,
      receivedPendingPayIds
    );
    // Only allow removed pending payments
    if (addedPendingPayIds.length > 0 || removedPendingPayIds.length === 0) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.INVALID_PENDING_PAYMENTS,
        },
        lastCosignedSimplexState: storedSignedSimplexState,
      };
    }

    // Verify that settled payments and removed pending payments match
    const settledPaymentIds: Uint8Array[] = [];
    for (const settledPayment of settledPayments) {
      settledPaymentIds.push(settledPayment.getSettledPayId_asU8());
    }
    const [
      paymentIdsOnlyInSettled,
      paymentIdsOnlyInRemoved,
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
            'Mismatch between settled payments and removed pending payments',
        },
        lastCosignedSimplexState: storedSignedSimplexState,
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
      storedSimplexState.getTransferToPeer().getReceiver().getAmt_asU8()
    );
    const newTransferAmount = ethers.utils.bigNumberify(
      receivedSimplexState.getTransferToPeer().getReceiver().getAmt_asU8()
    );
    const deltaAmount = newTransferAmount.sub(oldTransferAmount);
    // For now, only allow settling maximal transfer or 0
    // TODO(dominator008): Relax this check
    if (!deltaAmount.eq(totalSettledAmount) && !deltaAmount.eq(0)) {
      return {
        result: {
          valid: false,
          errReason: 'Invalid transfer amount',
        },
        lastCosignedSimplexState: storedSignedSimplexState,
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
          errReason: 'Invalid last payment resolve deadline',
        },
        lastCosignedSimplexState: storedSignedSimplexState,
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
          errReason: 'Invalid total pending amount',
        },
        lastCosignedSimplexState: storedSignedSimplexState,
      };
    }

    // Verify all payments exist
    const paymentIds = settledPaymentIds.map((settledPaymentId) =>
      ethers.utils.hexlify(settledPaymentId)
    );
    const payments = await db.payments.bulkGet(paymentIds);
    if (payments.length !== paymentIds.length) {
      return {
        result: {
          valid: false,
          errReason: 'Unknown settled payments',
        },
        lastCosignedSimplexState: storedSignedSimplexState,
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
        lastCosignedSimplexState: storedSignedSimplexState,
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
    const blockNumber = await this.cryptoManager.provider.getBlockNumber();
    for (let i = 0; i < settledPayments.length; i++) {
      const payment = payments[i];
      const conditionalPay = payment.getConditionalPay();
      // Verify payment destination
      if (
        selfAddress !== typeUtils.bytesToAddress(conditionalPay.getDest_asU8())
      ) {
        return {
          valid: false,
          errCode: ErrCode.WRONG_PEER,
        };
      }

      const settledAmount = settledAmounts[i];
      const reason = settledPayments[i].getReason();
      switch (reason) {
        case PaymentSettleReason.PAY_EXPIRED: {
          // If we have already initiated the settlement, ignore and continue
          // TODO(dominator008): Check this logic
          if (payment.status === PaymentStatus.PEER_FROM_SIGNED_SETTLED) {
            /* eslint-disable-next-line no-continue */
            continue;
          }

          // Verify payment expiration
          if (
            blockNumber <
            payment.getConditionalPay().getResolveDeadline() +
              INCOMING_EXPIRATION_SAFETY_MARGIN
          ) {
            return {
              valid: false,
              errReason: 'Payment not expired',
            };
          }

          // Verify that the settled amount is 0
          if (!settledAmount.eq(0)) {
            return {
              valid: false,
              errReason: 'Invalid settled amount',
            };
          }

          // Verify that the payment is not resolved on-chain with a non-zero
          // amount
          /* eslint-disable-next-line no-await-in-loop */
          const onChainPaymentInfo = await this.resolvePaymentProcessor.getOnChainPaymentInfo(
            payment.paymentId
          );
          if (onChainPaymentInfo && onChainPaymentInfo.amount.gt(0)) {
            return {
              valid: false,
              errReason: 'Payment resolved on-chain with non-zero amount',
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
              errReason: 'Invalid settled amount',
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
              errReason: 'Invalid payment status',
            };
          }

          // Verify that the settled amount is 0
          if (!settledAmount.eq(0)) {
            return {
              valid: false,
              errReason: 'Invalid settled amount',
            };
          }
          break;
        }
        default:
          return {
            valid: false,
            errReason: 'Unsupported payment settlement reason',
          };
      }
    }

    return { valid: true };
  }
}
