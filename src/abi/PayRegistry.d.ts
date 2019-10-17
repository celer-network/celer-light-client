/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface PayRegistryInterface extends Interface {
  functions: {
    setPayAmount: TypedFunctionDescription<{
      encode([_payHash, _amt]: [Arrayish, BigNumberish]): string;
    }>;

    setPayDeadline: TypedFunctionDescription<{
      encode([_payHash, _deadline]: [Arrayish, BigNumberish]): string;
    }>;

    setPayInfo: TypedFunctionDescription<{
      encode([_payHash, _amt, _deadline]: [
        Arrayish,
        BigNumberish,
        BigNumberish
      ]): string;
    }>;

    setPayAmounts: TypedFunctionDescription<{
      encode([_payHashes, _amts]: [(Arrayish)[], (BigNumberish)[]]): string;
    }>;

    setPayDeadlines: TypedFunctionDescription<{
      encode([_payHashes, _deadlines]: [
        (Arrayish)[],
        (BigNumberish)[]
      ]): string;
    }>;

    setPayInfos: TypedFunctionDescription<{
      encode([_payHashes, _amts, _deadlines]: [
        (Arrayish)[],
        (BigNumberish)[],
        (BigNumberish)[]
      ]): string;
    }>;
  };

  events: {
    PayInfoUpdate: TypedEventDescription<{
      encodeTopics([payId, amount, resolveDeadline]: [
        Arrayish | null,
        null,
        null
      ]): string[];
    }>;
  };
}

export class PayRegistry extends Contract {
  connect(signerOrProvider: Signer | Provider | string): PayRegistry;
  attach(addressOrName: string): PayRegistry;
  deployed(): Promise<PayRegistry>;

  on(event: EventFilter | string, listener: Listener): PayRegistry;
  once(event: EventFilter | string, listener: Listener): PayRegistry;
  addListener(eventName: EventFilter | string, listener: Listener): PayRegistry;
  removeAllListeners(eventName: EventFilter | string): PayRegistry;
  removeListener(eventName: any, listener: Listener): PayRegistry;

  interface: PayRegistryInterface;

  functions: {
    payInfoMap(
      arg0: Arrayish
    ): Promise<{
      amount: BigNumber;
      resolveDeadline: BigNumber;
      0: BigNumber;
      1: BigNumber;
    }>;

    calculatePayId(_payHash: Arrayish, _setter: string): Promise<string>;

    getPayAmounts(
      _payIds: (Arrayish)[],
      _lastPayResolveDeadline: BigNumberish
    ): Promise<(BigNumber)[]>;

    getPayInfo(
      _payId: Arrayish
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
    }>;

    setPayAmount(
      _payHash: Arrayish,
      _amt: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    setPayDeadline(
      _payHash: Arrayish,
      _deadline: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    setPayInfo(
      _payHash: Arrayish,
      _amt: BigNumberish,
      _deadline: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    setPayAmounts(
      _payHashes: (Arrayish)[],
      _amts: (BigNumberish)[],
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    setPayDeadlines(
      _payHashes: (Arrayish)[],
      _deadlines: (BigNumberish)[],
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    setPayInfos(
      _payHashes: (Arrayish)[],
      _amts: (BigNumberish)[],
      _deadlines: (BigNumberish)[],
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  filters: {
    PayInfoUpdate(
      payId: Arrayish | null,
      amount: null,
      resolveDeadline: null
    ): EventFilter;
  };

  estimate: {
    setPayAmount(_payHash: Arrayish, _amt: BigNumberish): Promise<BigNumber>;

    setPayDeadline(
      _payHash: Arrayish,
      _deadline: BigNumberish
    ): Promise<BigNumber>;

    setPayInfo(
      _payHash: Arrayish,
      _amt: BigNumberish,
      _deadline: BigNumberish
    ): Promise<BigNumber>;

    setPayAmounts(
      _payHashes: (Arrayish)[],
      _amts: (BigNumberish)[]
    ): Promise<BigNumber>;

    setPayDeadlines(
      _payHashes: (Arrayish)[],
      _deadlines: (BigNumberish)[]
    ): Promise<BigNumber>;

    setPayInfos(
      _payHashes: (Arrayish)[],
      _amts: (BigNumberish)[],
      _deadlines: (BigNumberish)[]
    ): Promise<BigNumber>;
  };
}
