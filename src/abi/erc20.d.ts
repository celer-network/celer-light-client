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

interface Erc20Interface extends Interface {
  functions: {
    approve: TypedFunctionDescription<{
      encode([_spender, _value]: [string, BigNumberish]): string;
    }>;

    transferFrom: TypedFunctionDescription<{
      encode([_from, _to, _value]: [string, string, BigNumberish]): string;
    }>;

    transfer: TypedFunctionDescription<{
      encode([_to, _value]: [string, BigNumberish]): string;
    }>;
  };

  events: {
    Approval: TypedEventDescription<{
      encodeTopics([owner, spender, value]: [
        string | null,
        string | null,
        null
      ]): string[];
    }>;

    Transfer: TypedEventDescription<{
      encodeTopics([from, to, value]: [
        string | null,
        string | null,
        null
      ]): string[];
    }>;
  };
}

export class Erc20 extends Contract {
  connect(signerOrProvider: Signer | Provider | string): Erc20;
  attach(addressOrName: string): Erc20;
  deployed(): Promise<Erc20>;

  on(event: EventFilter | string, listener: Listener): Erc20;
  once(event: EventFilter | string, listener: Listener): Erc20;
  addListener(eventName: EventFilter | string, listener: Listener): Erc20;
  removeAllListeners(eventName: EventFilter | string): Erc20;
  removeListener(eventName: any, listener: Listener): Erc20;

  interface: Erc20Interface;

  functions: {
    balanceOf(_owner: string): Promise<BigNumber>;

    allowance(_owner: string, _spender: string): Promise<BigNumber>;

    approve(
      _spender: string,
      _value: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    transferFrom(
      _from: string,
      _to: string,
      _value: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    transfer(
      _to: string,
      _value: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    name(): Promise<string>;
    totalSupply(): Promise<BigNumber>;
    decimals(): Promise<number>;
    symbol(): Promise<string>;
  };

  filters: {
    Approval(
      owner: string | null,
      spender: string | null,
      value: null
    ): EventFilter;

    Transfer(from: string | null, to: string | null, value: null): EventFilter;
  };

  estimate: {
    approve(_spender: string, _value: BigNumberish): Promise<BigNumber>;

    transferFrom(
      _from: string,
      _to: string,
      _value: BigNumberish
    ): Promise<BigNumber>;

    transfer(_to: string, _value: BigNumberish): Promise<BigNumber>;
  };
}