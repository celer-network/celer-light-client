import { BigNumber } from 'ethers/utils';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { CondPayRequestSender } from '../messaging/outgoing/cond_pay_request_sender';
import {
  Condition,
  TokenTypeMap,
  TransferFunctionType,
  TransferFunctionTypeMap,
} from '../protobufs/entity_pb';

export class SendPaymentProcessor {
  private readonly condPayRequestSender: CondPayRequestSender;

  constructor(condPayRequestSender: CondPayRequestSender) {
    this.condPayRequestSender = condPayRequestSender;
  }

  async sendConditionalPayment(
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: string,
    destination: string,
    amount: BigNumber,
    transferFunctionType: TransferFunctionTypeMap[keyof TransferFunctionTypeMap],
    conditions: Condition[],
    timeout: number,
    note: Any
  ): Promise<string> {
    if (transferFunctionType !== TransferFunctionType.BOOLEAN_AND) {
      throw new Error('Unsupported transfer function type');
    }
    return this.condPayRequestSender.sendConditionalPayment(
      tokenType,
      tokenAddress,
      destination,
      amount,
      transferFunctionType,
      conditions,
      timeout,
      note
    );
  }
}
