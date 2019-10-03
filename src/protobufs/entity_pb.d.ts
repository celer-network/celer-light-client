// package: entity
// file: entity.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_descriptor_pb from "google-protobuf/google/protobuf/descriptor_pb";

export class AccountAmtPair extends jspb.Message {
  getAccount(): Uint8Array | string;
  getAccount_asU8(): Uint8Array;
  getAccount_asB64(): string;
  setAccount(value: Uint8Array | string): void;

  getAmt(): Uint8Array | string;
  getAmt_asU8(): Uint8Array;
  getAmt_asB64(): string;
  setAmt(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccountAmtPair.AsObject;
  static toObject(includeInstance: boolean, msg: AccountAmtPair): AccountAmtPair.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AccountAmtPair, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccountAmtPair;
  static deserializeBinaryFromReader(message: AccountAmtPair, reader: jspb.BinaryReader): AccountAmtPair;
}

export namespace AccountAmtPair {
  export type AsObject = {
    account: Uint8Array | string,
    amt: Uint8Array | string,
  }
}

export class TokenInfo extends jspb.Message {
  getTokenType(): TokenTypeMap[keyof TokenTypeMap];
  setTokenType(value: TokenTypeMap[keyof TokenTypeMap]): void;

  getTokenAddress(): Uint8Array | string;
  getTokenAddress_asU8(): Uint8Array;
  getTokenAddress_asB64(): string;
  setTokenAddress(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TokenInfo.AsObject;
  static toObject(includeInstance: boolean, msg: TokenInfo): TokenInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TokenInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TokenInfo;
  static deserializeBinaryFromReader(message: TokenInfo, reader: jspb.BinaryReader): TokenInfo;
}

export namespace TokenInfo {
  export type AsObject = {
    tokenType: TokenTypeMap[keyof TokenTypeMap],
    tokenAddress: Uint8Array | string,
  }
}

export class TokenDistribution extends jspb.Message {
  hasToken(): boolean;
  clearToken(): void;
  getToken(): TokenInfo | undefined;
  setToken(value?: TokenInfo): void;

  clearDistributionList(): void;
  getDistributionList(): Array<AccountAmtPair>;
  setDistributionList(value: Array<AccountAmtPair>): void;
  addDistribution(value?: AccountAmtPair, index?: number): AccountAmtPair;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TokenDistribution.AsObject;
  static toObject(includeInstance: boolean, msg: TokenDistribution): TokenDistribution.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TokenDistribution, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TokenDistribution;
  static deserializeBinaryFromReader(message: TokenDistribution, reader: jspb.BinaryReader): TokenDistribution;
}

export namespace TokenDistribution {
  export type AsObject = {
    token?: TokenInfo.AsObject,
    distributionList: Array<AccountAmtPair.AsObject>,
  }
}

export class TokenTransfer extends jspb.Message {
  hasToken(): boolean;
  clearToken(): void;
  getToken(): TokenInfo | undefined;
  setToken(value?: TokenInfo): void;

  hasReceiver(): boolean;
  clearReceiver(): void;
  getReceiver(): AccountAmtPair | undefined;
  setReceiver(value?: AccountAmtPair): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TokenTransfer.AsObject;
  static toObject(includeInstance: boolean, msg: TokenTransfer): TokenTransfer.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TokenTransfer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TokenTransfer;
  static deserializeBinaryFromReader(message: TokenTransfer, reader: jspb.BinaryReader): TokenTransfer;
}

export namespace TokenTransfer {
  export type AsObject = {
    token?: TokenInfo.AsObject,
    receiver?: AccountAmtPair.AsObject,
  }
}

export class SimplexPaymentChannel extends jspb.Message {
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): void;

  getPeerFrom(): Uint8Array | string;
  getPeerFrom_asU8(): Uint8Array;
  getPeerFrom_asB64(): string;
  setPeerFrom(value: Uint8Array | string): void;

  getSeqNum(): number;
  setSeqNum(value: number): void;

  hasTransferToPeer(): boolean;
  clearTransferToPeer(): void;
  getTransferToPeer(): TokenTransfer | undefined;
  setTransferToPeer(value?: TokenTransfer): void;

  hasPendingPayIds(): boolean;
  clearPendingPayIds(): void;
  getPendingPayIds(): PayIdList | undefined;
  setPendingPayIds(value?: PayIdList): void;

  getLastPayResolveDeadline(): number;
  setLastPayResolveDeadline(value: number): void;

  getTotalPendingAmount(): Uint8Array | string;
  getTotalPendingAmount_asU8(): Uint8Array;
  getTotalPendingAmount_asB64(): string;
  setTotalPendingAmount(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SimplexPaymentChannel.AsObject;
  static toObject(includeInstance: boolean, msg: SimplexPaymentChannel): SimplexPaymentChannel.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SimplexPaymentChannel, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SimplexPaymentChannel;
  static deserializeBinaryFromReader(message: SimplexPaymentChannel, reader: jspb.BinaryReader): SimplexPaymentChannel;
}

export namespace SimplexPaymentChannel {
  export type AsObject = {
    channelId: Uint8Array | string,
    peerFrom: Uint8Array | string,
    seqNum: number,
    transferToPeer?: TokenTransfer.AsObject,
    pendingPayIds?: PayIdList.AsObject,
    lastPayResolveDeadline: number,
    totalPendingAmount: Uint8Array | string,
  }
}

export class PayIdList extends jspb.Message {
  clearPayIdsList(): void;
  getPayIdsList(): Array<Uint8Array | string>;
  getPayIdsList_asU8(): Array<Uint8Array>;
  getPayIdsList_asB64(): Array<string>;
  setPayIdsList(value: Array<Uint8Array | string>): void;
  addPayIds(value: Uint8Array | string, index?: number): Uint8Array | string;

  getNextListHash(): Uint8Array | string;
  getNextListHash_asU8(): Uint8Array;
  getNextListHash_asB64(): string;
  setNextListHash(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PayIdList.AsObject;
  static toObject(includeInstance: boolean, msg: PayIdList): PayIdList.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PayIdList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PayIdList;
  static deserializeBinaryFromReader(message: PayIdList, reader: jspb.BinaryReader): PayIdList;
}

export namespace PayIdList {
  export type AsObject = {
    payIdsList: Array<Uint8Array | string>,
    nextListHash: Uint8Array | string,
  }
}

export class TransferFunction extends jspb.Message {
  getLogicType(): TransferFunctionTypeMap[keyof TransferFunctionTypeMap];
  setLogicType(value: TransferFunctionTypeMap[keyof TransferFunctionTypeMap]): void;

  hasMaxTransfer(): boolean;
  clearMaxTransfer(): void;
  getMaxTransfer(): TokenTransfer | undefined;
  setMaxTransfer(value?: TokenTransfer): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransferFunction.AsObject;
  static toObject(includeInstance: boolean, msg: TransferFunction): TransferFunction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransferFunction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransferFunction;
  static deserializeBinaryFromReader(message: TransferFunction, reader: jspb.BinaryReader): TransferFunction;
}

export namespace TransferFunction {
  export type AsObject = {
    logicType: TransferFunctionTypeMap[keyof TransferFunctionTypeMap],
    maxTransfer?: TokenTransfer.AsObject,
  }
}

export class ConditionalPay extends jspb.Message {
  getPayTimestamp(): string;
  setPayTimestamp(value: string): void;

  getSrc(): Uint8Array | string;
  getSrc_asU8(): Uint8Array;
  getSrc_asB64(): string;
  setSrc(value: Uint8Array | string): void;

  getDest(): Uint8Array | string;
  getDest_asU8(): Uint8Array;
  getDest_asB64(): string;
  setDest(value: Uint8Array | string): void;

  clearConditionsList(): void;
  getConditionsList(): Array<Condition>;
  setConditionsList(value: Array<Condition>): void;
  addConditions(value?: Condition, index?: number): Condition;

  hasTransferFunc(): boolean;
  clearTransferFunc(): void;
  getTransferFunc(): TransferFunction | undefined;
  setTransferFunc(value?: TransferFunction): void;

  getResolveDeadline(): number;
  setResolveDeadline(value: number): void;

  getResolveTimeout(): number;
  setResolveTimeout(value: number): void;

  getPayResolver(): Uint8Array | string;
  getPayResolver_asU8(): Uint8Array;
  getPayResolver_asB64(): string;
  setPayResolver(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConditionalPay.AsObject;
  static toObject(includeInstance: boolean, msg: ConditionalPay): ConditionalPay.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConditionalPay, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConditionalPay;
  static deserializeBinaryFromReader(message: ConditionalPay, reader: jspb.BinaryReader): ConditionalPay;
}

export namespace ConditionalPay {
  export type AsObject = {
    payTimestamp: string,
    src: Uint8Array | string,
    dest: Uint8Array | string,
    conditionsList: Array<Condition.AsObject>,
    transferFunc?: TransferFunction.AsObject,
    resolveDeadline: number,
    resolveTimeout: number,
    payResolver: Uint8Array | string,
  }
}

export class CondPayResult extends jspb.Message {
  getCondPay(): Uint8Array | string;
  getCondPay_asU8(): Uint8Array;
  getCondPay_asB64(): string;
  setCondPay(value: Uint8Array | string): void;

  getAmount(): Uint8Array | string;
  getAmount_asU8(): Uint8Array;
  getAmount_asB64(): string;
  setAmount(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CondPayResult.AsObject;
  static toObject(includeInstance: boolean, msg: CondPayResult): CondPayResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CondPayResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CondPayResult;
  static deserializeBinaryFromReader(message: CondPayResult, reader: jspb.BinaryReader): CondPayResult;
}

export namespace CondPayResult {
  export type AsObject = {
    condPay: Uint8Array | string,
    amount: Uint8Array | string,
  }
}

export class VouchedCondPayResult extends jspb.Message {
  getCondPayResult(): Uint8Array | string;
  getCondPayResult_asU8(): Uint8Array;
  getCondPayResult_asB64(): string;
  setCondPayResult(value: Uint8Array | string): void;

  getSigOfSrc(): Uint8Array | string;
  getSigOfSrc_asU8(): Uint8Array;
  getSigOfSrc_asB64(): string;
  setSigOfSrc(value: Uint8Array | string): void;

  getSigOfDest(): Uint8Array | string;
  getSigOfDest_asU8(): Uint8Array;
  getSigOfDest_asB64(): string;
  setSigOfDest(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VouchedCondPayResult.AsObject;
  static toObject(includeInstance: boolean, msg: VouchedCondPayResult): VouchedCondPayResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VouchedCondPayResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VouchedCondPayResult;
  static deserializeBinaryFromReader(message: VouchedCondPayResult, reader: jspb.BinaryReader): VouchedCondPayResult;
}

export namespace VouchedCondPayResult {
  export type AsObject = {
    condPayResult: Uint8Array | string,
    sigOfSrc: Uint8Array | string,
    sigOfDest: Uint8Array | string,
  }
}

export class Condition extends jspb.Message {
  getConditionType(): ConditionTypeMap[keyof ConditionTypeMap];
  setConditionType(value: ConditionTypeMap[keyof ConditionTypeMap]): void;

  getHashLock(): Uint8Array | string;
  getHashLock_asU8(): Uint8Array;
  getHashLock_asB64(): string;
  setHashLock(value: Uint8Array | string): void;

  getDeployedContractAddress(): Uint8Array | string;
  getDeployedContractAddress_asU8(): Uint8Array;
  getDeployedContractAddress_asB64(): string;
  setDeployedContractAddress(value: Uint8Array | string): void;

  getVirtualContractAddress(): Uint8Array | string;
  getVirtualContractAddress_asU8(): Uint8Array;
  getVirtualContractAddress_asB64(): string;
  setVirtualContractAddress(value: Uint8Array | string): void;

  getArgsQueryFinalization(): Uint8Array | string;
  getArgsQueryFinalization_asU8(): Uint8Array;
  getArgsQueryFinalization_asB64(): string;
  setArgsQueryFinalization(value: Uint8Array | string): void;

  getArgsQueryOutcome(): Uint8Array | string;
  getArgsQueryOutcome_asU8(): Uint8Array;
  getArgsQueryOutcome_asB64(): string;
  setArgsQueryOutcome(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Condition.AsObject;
  static toObject(includeInstance: boolean, msg: Condition): Condition.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Condition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Condition;
  static deserializeBinaryFromReader(message: Condition, reader: jspb.BinaryReader): Condition;
}

export namespace Condition {
  export type AsObject = {
    conditionType: ConditionTypeMap[keyof ConditionTypeMap],
    hashLock: Uint8Array | string,
    deployedContractAddress: Uint8Array | string,
    virtualContractAddress: Uint8Array | string,
    argsQueryFinalization: Uint8Array | string,
    argsQueryOutcome: Uint8Array | string,
  }
}

export class CooperativeWithdrawInfo extends jspb.Message {
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): void;

  getSeqNum(): number;
  setSeqNum(value: number): void;

  hasWithdraw(): boolean;
  clearWithdraw(): void;
  getWithdraw(): AccountAmtPair | undefined;
  setWithdraw(value?: AccountAmtPair): void;

  getWithdrawDeadline(): number;
  setWithdrawDeadline(value: number): void;

  getRecipientChannelId(): Uint8Array | string;
  getRecipientChannelId_asU8(): Uint8Array;
  getRecipientChannelId_asB64(): string;
  setRecipientChannelId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeWithdrawInfo.AsObject;
  static toObject(includeInstance: boolean, msg: CooperativeWithdrawInfo): CooperativeWithdrawInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CooperativeWithdrawInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeWithdrawInfo;
  static deserializeBinaryFromReader(message: CooperativeWithdrawInfo, reader: jspb.BinaryReader): CooperativeWithdrawInfo;
}

export namespace CooperativeWithdrawInfo {
  export type AsObject = {
    channelId: Uint8Array | string,
    seqNum: number,
    withdraw?: AccountAmtPair.AsObject,
    withdrawDeadline: number,
    recipientChannelId: Uint8Array | string,
  }
}

export class PaymentChannelInitializer extends jspb.Message {
  hasInitDistribution(): boolean;
  clearInitDistribution(): void;
  getInitDistribution(): TokenDistribution | undefined;
  setInitDistribution(value?: TokenDistribution): void;

  getOpenDeadline(): number;
  setOpenDeadline(value: number): void;

  getDisputeTimeout(): number;
  setDisputeTimeout(value: number): void;

  getMsgValueReceiver(): number;
  setMsgValueReceiver(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentChannelInitializer.AsObject;
  static toObject(includeInstance: boolean, msg: PaymentChannelInitializer): PaymentChannelInitializer.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaymentChannelInitializer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaymentChannelInitializer;
  static deserializeBinaryFromReader(message: PaymentChannelInitializer, reader: jspb.BinaryReader): PaymentChannelInitializer;
}

export namespace PaymentChannelInitializer {
  export type AsObject = {
    initDistribution?: TokenDistribution.AsObject,
    openDeadline: number,
    disputeTimeout: number,
    msgValueReceiver: number,
  }
}

export class CooperativeSettleInfo extends jspb.Message {
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): void;

  getSeqNum(): number;
  setSeqNum(value: number): void;

  clearSettleBalanceList(): void;
  getSettleBalanceList(): Array<AccountAmtPair>;
  setSettleBalanceList(value: Array<AccountAmtPair>): void;
  addSettleBalance(value?: AccountAmtPair, index?: number): AccountAmtPair;

  getSettleDeadline(): number;
  setSettleDeadline(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeSettleInfo.AsObject;
  static toObject(includeInstance: boolean, msg: CooperativeSettleInfo): CooperativeSettleInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CooperativeSettleInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeSettleInfo;
  static deserializeBinaryFromReader(message: CooperativeSettleInfo, reader: jspb.BinaryReader): CooperativeSettleInfo;
}

export namespace CooperativeSettleInfo {
  export type AsObject = {
    channelId: Uint8Array | string,
    seqNum: number,
    settleBalanceList: Array<AccountAmtPair.AsObject>,
    settleDeadline: number,
  }
}

export class ChannelMigrationInfo extends jspb.Message {
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): void;

  getFromLedgerAddress(): Uint8Array | string;
  getFromLedgerAddress_asU8(): Uint8Array;
  getFromLedgerAddress_asB64(): string;
  setFromLedgerAddress(value: Uint8Array | string): void;

  getToLedgerAddress(): Uint8Array | string;
  getToLedgerAddress_asU8(): Uint8Array;
  getToLedgerAddress_asB64(): string;
  setToLedgerAddress(value: Uint8Array | string): void;

  getMigrationDeadline(): number;
  setMigrationDeadline(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelMigrationInfo.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelMigrationInfo): ChannelMigrationInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelMigrationInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelMigrationInfo;
  static deserializeBinaryFromReader(message: ChannelMigrationInfo, reader: jspb.BinaryReader): ChannelMigrationInfo;
}

export namespace ChannelMigrationInfo {
  export type AsObject = {
    channelId: Uint8Array | string,
    fromLedgerAddress: Uint8Array | string,
    toLedgerAddress: Uint8Array | string,
    migrationDeadline: number,
  }
}

  export const soltype: jspb.ExtensionFieldInfo<string>;

export interface TokenTypeMap {
  INVALID: 0;
  ETH: 1;
  ERC20: 2;
}

export const TokenType: TokenTypeMap;

export interface TransferFunctionTypeMap {
  BOOLEAN_AND: 0;
  BOOLEAN_OR: 1;
  BOOLEAN_CIRCUIT: 2;
  NUMERIC_ADD: 3;
  NUMERIC_MAX: 4;
  NUMERIC_MIN: 5;
}

export const TransferFunctionType: TransferFunctionTypeMap;

export interface ConditionTypeMap {
  HASH_LOCK: 0;
  DEPLOYED_CONTRACT: 1;
  VIRTUAL_CONTRACT: 2;
}

export const ConditionType: ConditionTypeMap;

