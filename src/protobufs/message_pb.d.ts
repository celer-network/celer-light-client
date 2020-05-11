// package: rpc
// file: message.proto

import * as jspb from 'google-protobuf';
import * as entity_pb from './entity_pb';
import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';

export class MID extends jspb.Message {
  getTag(): string;
  setTag(value: string): void;

  getSeq(): number;
  setSeq(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MID.AsObject;
  static toObject(includeInstance: boolean, msg: MID): MID.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(message: MID, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MID;
  static deserializeBinaryFromReader(
    message: MID,
    reader: jspb.BinaryReader
  ): MID;
}

export namespace MID {
  export type AsObject = {
    tag: string;
    seq: number;
  };
}

export class CelerMsg extends jspb.Message {
  hasMid(): boolean;
  clearMid(): void;
  getMid(): MID | undefined;
  setMid(value?: MID): void;

  hasRetMid(): boolean;
  clearRetMid(): void;
  getRetMid(): MID | undefined;
  setRetMid(value?: MID): void;

  getFlag(): number;
  setFlag(value: number): void;

  getToAddr(): Uint8Array | string;
  getToAddr_asU8(): Uint8Array;
  getToAddr_asB64(): string;
  setToAddr(value: Uint8Array | string): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  hasAuthReq(): boolean;
  clearAuthReq(): void;
  getAuthReq(): AuthReq | undefined;
  setAuthReq(value?: AuthReq): void;

  hasAuthAck(): boolean;
  clearAuthAck(): void;
  getAuthAck(): AuthAck | undefined;
  setAuthAck(value?: AuthAck): void;

  hasCondPayRequest(): boolean;
  clearCondPayRequest(): void;
  getCondPayRequest(): CondPayRequest | undefined;
  setCondPayRequest(value?: CondPayRequest): void;

  hasCondPayResponse(): boolean;
  clearCondPayResponse(): void;
  getCondPayResponse(): CondPayResponse | undefined;
  setCondPayResponse(value?: CondPayResponse): void;

  hasPaymentSettleProof(): boolean;
  clearPaymentSettleProof(): void;
  getPaymentSettleProof(): PaymentSettleProof | undefined;
  setPaymentSettleProof(value?: PaymentSettleProof): void;

  hasPaymentSettleRequest(): boolean;
  clearPaymentSettleRequest(): void;
  getPaymentSettleRequest(): PaymentSettleRequest | undefined;
  setPaymentSettleRequest(value?: PaymentSettleRequest): void;

  hasPaymentSettleResponse(): boolean;
  clearPaymentSettleResponse(): void;
  getPaymentSettleResponse(): PaymentSettleResponse | undefined;
  setPaymentSettleResponse(value?: PaymentSettleResponse): void;

  hasWithdrawRequest(): boolean;
  clearWithdrawRequest(): void;
  getWithdrawRequest(): CooperativeWithdrawRequest | undefined;
  setWithdrawRequest(value?: CooperativeWithdrawRequest): void;

  hasWithdrawResponse(): boolean;
  clearWithdrawResponse(): void;
  getWithdrawResponse(): CooperativeWithdrawResponse | undefined;
  setWithdrawResponse(value?: CooperativeWithdrawResponse): void;

  hasRoutingRequest(): boolean;
  clearRoutingRequest(): void;
  getRoutingRequest(): RoutingRequest | undefined;
  setRoutingRequest(value?: RoutingRequest): void;

  hasCondPayReceipt(): boolean;
  clearCondPayReceipt(): void;
  getCondPayReceipt(): CondPayReceipt | undefined;
  setCondPayReceipt(value?: CondPayReceipt): void;

  hasRevealSecret(): boolean;
  clearRevealSecret(): void;
  getRevealSecret(): RevealSecret | undefined;
  setRevealSecret(value?: RevealSecret): void;

  hasRevealSecretAck(): boolean;
  clearRevealSecretAck(): void;
  getRevealSecretAck(): RevealSecretAck | undefined;
  setRevealSecretAck(value?: RevealSecretAck): void;

  hasPayResultVouchRequest(): boolean;
  clearPayResultVouchRequest(): void;
  getPayResultVouchRequest(): entity_pb.VouchedCondPayResult | undefined;
  setPayResultVouchRequest(value?: entity_pb.VouchedCondPayResult): void;

  hasPayResultVouchResponse(): boolean;
  clearPayResultVouchResponse(): void;
  getPayResultVouchResponse(): entity_pb.VouchedCondPayResult | undefined;
  setPayResultVouchResponse(value?: entity_pb.VouchedCondPayResult): void;

  getMessageCase(): CelerMsg.MessageCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CelerMsg.AsObject;
  static toObject(includeInstance: boolean, msg: CelerMsg): CelerMsg.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CelerMsg,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CelerMsg;
  static deserializeBinaryFromReader(
    message: CelerMsg,
    reader: jspb.BinaryReader
  ): CelerMsg;
}

export namespace CelerMsg {
  export type AsObject = {
    mid?: MID.AsObject;
    retMid?: MID.AsObject;
    flag: number;
    toAddr: Uint8Array | string;
    error?: Error.AsObject;
    authReq?: AuthReq.AsObject;
    authAck?: AuthAck.AsObject;
    condPayRequest?: CondPayRequest.AsObject;
    condPayResponse?: CondPayResponse.AsObject;
    paymentSettleProof?: PaymentSettleProof.AsObject;
    paymentSettleRequest?: PaymentSettleRequest.AsObject;
    paymentSettleResponse?: PaymentSettleResponse.AsObject;
    withdrawRequest?: CooperativeWithdrawRequest.AsObject;
    withdrawResponse?: CooperativeWithdrawResponse.AsObject;
    routingRequest?: RoutingRequest.AsObject;
    condPayReceipt?: CondPayReceipt.AsObject;
    revealSecret?: RevealSecret.AsObject;
    revealSecretAck?: RevealSecretAck.AsObject;
    payResultVouchRequest?: entity_pb.VouchedCondPayResult.AsObject;
    payResultVouchResponse?: entity_pb.VouchedCondPayResult.AsObject;
  };

  export enum MessageCase {
    MESSAGE_NOT_SET = 0,
    ERROR = 6,
    AUTH_REQ = 7,
    AUTH_ACK = 8,
    COND_PAY_REQUEST = 9,
    COND_PAY_RESPONSE = 10,
    PAYMENT_SETTLE_PROOF = 11,
    PAYMENT_SETTLE_REQUEST = 12,
    PAYMENT_SETTLE_RESPONSE = 13,
    WITHDRAW_REQUEST = 14,
    WITHDRAW_RESPONSE = 15,
    ROUTING_REQUEST = 16,
    COND_PAY_RECEIPT = 31,
    REVEAL_SECRET = 32,
    REVEAL_SECRET_ACK = 33,
    PAY_RESULT_VOUCH_REQUEST = 34,
    PAY_RESULT_VOUCH_RESPONSE = 35,
  }
}

export class Error extends jspb.Message {
  getCode(): ErrCodeMap[keyof ErrCodeMap];
  setCode(value: ErrCodeMap[keyof ErrCodeMap]): void;

  getReason(): string;
  setReason(value: string): void;

  getSeq(): number;
  setSeq(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Error.AsObject;
  static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Error,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Error;
  static deserializeBinaryFromReader(
    message: Error,
    reader: jspb.BinaryReader
  ): Error;
}

export namespace Error {
  export type AsObject = {
    code: ErrCodeMap[keyof ErrCodeMap];
    reason: string;
    seq: number;
  };
}

export class AuthReq extends jspb.Message {
  getMyAddr(): Uint8Array | string;
  getMyAddr_asU8(): Uint8Array;
  getMyAddr_asB64(): string;
  setMyAddr(value: Uint8Array | string): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  getMySig(): Uint8Array | string;
  getMySig_asU8(): Uint8Array;
  getMySig_asB64(): string;
  setMySig(value: Uint8Array | string): void;

  getExpectPeer(): Uint8Array | string;
  getExpectPeer_asU8(): Uint8Array;
  getExpectPeer_asB64(): string;
  setExpectPeer(value: Uint8Array | string): void;

  getMutualAuth(): boolean;
  setMutualAuth(value: boolean): void;

  getProtocolVersion(): number;
  setProtocolVersion(value: number): void;

  clearOpenedChannelsList(): void;
  getOpenedChannelsList(): Array<ChannelSummary>;
  setOpenedChannelsList(value: Array<ChannelSummary>): void;
  addOpenedChannels(value?: ChannelSummary, index?: number): ChannelSummary;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthReq.AsObject;
  static toObject(includeInstance: boolean, msg: AuthReq): AuthReq.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AuthReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): AuthReq;
  static deserializeBinaryFromReader(
    message: AuthReq,
    reader: jspb.BinaryReader
  ): AuthReq;
}

export namespace AuthReq {
  export type AsObject = {
    myAddr: Uint8Array | string;
    timestamp: number;
    mySig: Uint8Array | string;
    expectPeer: Uint8Array | string;
    mutualAuth: boolean;
    protocolVersion: number;
    openedChannelsList: Array<ChannelSummary.AsObject>;
  };
}

export class AuthAck extends jspb.Message {
  hasStartMid(): boolean;
  clearStartMid(): void;
  getStartMid(): MID | undefined;
  setStartMid(value?: MID): void;

  getMySig(): Uint8Array | string;
  getMySig_asU8(): Uint8Array;
  getMySig_asB64(): string;
  setMySig(value: Uint8Array | string): void;

  clearSyncChannelsList(): void;
  getSyncChannelsList(): Array<ChannelInAuth>;
  setSyncChannelsList(value: Array<ChannelInAuth>): void;
  addSyncChannels(value?: ChannelInAuth, index?: number): ChannelInAuth;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthAck.AsObject;
  static toObject(includeInstance: boolean, msg: AuthAck): AuthAck.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AuthAck,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): AuthAck;
  static deserializeBinaryFromReader(
    message: AuthAck,
    reader: jspb.BinaryReader
  ): AuthAck;
}

export namespace AuthAck {
  export type AsObject = {
    startMid?: MID.AsObject;
    mySig: Uint8Array | string;
    syncChannelsList: Array<ChannelInAuth.AsObject>;
  };
}

export class RevealSecret extends jspb.Message {
  getPayId(): Uint8Array | string;
  getPayId_asU8(): Uint8Array;
  getPayId_asB64(): string;
  setPayId(value: Uint8Array | string): void;

  getSecret(): Uint8Array | string;
  getSecret_asU8(): Uint8Array;
  getSecret_asB64(): string;
  setSecret(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RevealSecret.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RevealSecret
  ): RevealSecret.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RevealSecret,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RevealSecret;
  static deserializeBinaryFromReader(
    message: RevealSecret,
    reader: jspb.BinaryReader
  ): RevealSecret;
}

export namespace RevealSecret {
  export type AsObject = {
    payId: Uint8Array | string;
    secret: Uint8Array | string;
  };
}

export class RevealSecretAck extends jspb.Message {
  getPayId(): Uint8Array | string;
  getPayId_asU8(): Uint8Array;
  getPayId_asB64(): string;
  setPayId(value: Uint8Array | string): void;

  getPayDestSecretSig(): Uint8Array | string;
  getPayDestSecretSig_asU8(): Uint8Array;
  getPayDestSecretSig_asB64(): string;
  setPayDestSecretSig(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RevealSecretAck.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RevealSecretAck
  ): RevealSecretAck.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RevealSecretAck,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RevealSecretAck;
  static deserializeBinaryFromReader(
    message: RevealSecretAck,
    reader: jspb.BinaryReader
  ): RevealSecretAck;
}

export namespace RevealSecretAck {
  export type AsObject = {
    payId: Uint8Array | string;
    payDestSecretSig: Uint8Array | string;
  };
}

export class CondPayRequest extends jspb.Message {
  getCondPay(): Uint8Array | string;
  getCondPay_asU8(): Uint8Array;
  getCondPay_asB64(): string;
  setCondPay(value: Uint8Array | string): void;

  hasStateOnlyPeerFromSig(): boolean;
  clearStateOnlyPeerFromSig(): void;
  getStateOnlyPeerFromSig(): SignedSimplexState | undefined;
  setStateOnlyPeerFromSig(value?: SignedSimplexState): void;

  hasNote(): boolean;
  clearNote(): void;
  getNote(): google_protobuf_any_pb.Any | undefined;
  setNote(value?: google_protobuf_any_pb.Any): void;

  getBaseSeq(): number;
  setBaseSeq(value: number): void;

  getDirectPay(): boolean;
  setDirectPay(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CondPayRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CondPayRequest
  ): CondPayRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CondPayRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CondPayRequest;
  static deserializeBinaryFromReader(
    message: CondPayRequest,
    reader: jspb.BinaryReader
  ): CondPayRequest;
}

export namespace CondPayRequest {
  export type AsObject = {
    condPay: Uint8Array | string;
    stateOnlyPeerFromSig?: SignedSimplexState.AsObject;
    note?: google_protobuf_any_pb.Any.AsObject;
    baseSeq: number;
    directPay: boolean;
  };
}

export class CondPayResponse extends jspb.Message {
  hasStateCosigned(): boolean;
  clearStateCosigned(): void;
  getStateCosigned(): SignedSimplexState | undefined;
  setStateCosigned(value?: SignedSimplexState): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CondPayResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CondPayResponse
  ): CondPayResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CondPayResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CondPayResponse;
  static deserializeBinaryFromReader(
    message: CondPayResponse,
    reader: jspb.BinaryReader
  ): CondPayResponse;
}

export namespace CondPayResponse {
  export type AsObject = {
    stateCosigned?: SignedSimplexState.AsObject;
    error?: Error.AsObject;
  };
}

export class SettledPayment extends jspb.Message {
  getSettledPayId(): Uint8Array | string;
  getSettledPayId_asU8(): Uint8Array;
  getSettledPayId_asB64(): string;
  setSettledPayId(value: Uint8Array | string): void;

  getReason(): PaymentSettleReasonMap[keyof PaymentSettleReasonMap];
  setReason(value: PaymentSettleReasonMap[keyof PaymentSettleReasonMap]): void;

  getAmount(): Uint8Array | string;
  getAmount_asU8(): Uint8Array;
  getAmount_asB64(): string;
  setAmount(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettledPayment.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SettledPayment
  ): SettledPayment.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SettledPayment,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SettledPayment;
  static deserializeBinaryFromReader(
    message: SettledPayment,
    reader: jspb.BinaryReader
  ): SettledPayment;
}

export namespace SettledPayment {
  export type AsObject = {
    settledPayId: Uint8Array | string;
    reason: PaymentSettleReasonMap[keyof PaymentSettleReasonMap];
    amount: Uint8Array | string;
  };
}

export class PaymentSettleProof extends jspb.Message {
  clearVouchedCondPayResultsList(): void;
  getVouchedCondPayResultsList(): Array<entity_pb.VouchedCondPayResult>;
  setVouchedCondPayResultsList(
    value: Array<entity_pb.VouchedCondPayResult>
  ): void;
  addVouchedCondPayResults(
    value?: entity_pb.VouchedCondPayResult,
    index?: number
  ): entity_pb.VouchedCondPayResult;

  clearSettledPaysList(): void;
  getSettledPaysList(): Array<SettledPayment>;
  setSettledPaysList(value: Array<SettledPayment>): void;
  addSettledPays(value?: SettledPayment, index?: number): SettledPayment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentSettleProof.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PaymentSettleProof
  ): PaymentSettleProof.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PaymentSettleProof,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PaymentSettleProof;
  static deserializeBinaryFromReader(
    message: PaymentSettleProof,
    reader: jspb.BinaryReader
  ): PaymentSettleProof;
}

export namespace PaymentSettleProof {
  export type AsObject = {
    vouchedCondPayResultsList: Array<entity_pb.VouchedCondPayResult.AsObject>;
    settledPaysList: Array<SettledPayment.AsObject>;
  };
}

export class PaymentSettleRequest extends jspb.Message {
  clearSettledPaysList(): void;
  getSettledPaysList(): Array<SettledPayment>;
  setSettledPaysList(value: Array<SettledPayment>): void;
  addSettledPays(value?: SettledPayment, index?: number): SettledPayment;

  hasStateOnlyPeerFromSig(): boolean;
  clearStateOnlyPeerFromSig(): void;
  getStateOnlyPeerFromSig(): SignedSimplexState | undefined;
  setStateOnlyPeerFromSig(value?: SignedSimplexState): void;

  getBaseSeq(): number;
  setBaseSeq(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentSettleRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PaymentSettleRequest
  ): PaymentSettleRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PaymentSettleRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PaymentSettleRequest;
  static deserializeBinaryFromReader(
    message: PaymentSettleRequest,
    reader: jspb.BinaryReader
  ): PaymentSettleRequest;
}

export namespace PaymentSettleRequest {
  export type AsObject = {
    settledPaysList: Array<SettledPayment.AsObject>;
    stateOnlyPeerFromSig?: SignedSimplexState.AsObject;
    baseSeq: number;
  };
}

export class PaymentSettleResponse extends jspb.Message {
  hasStateCosigned(): boolean;
  clearStateCosigned(): void;
  getStateCosigned(): SignedSimplexState | undefined;
  setStateCosigned(value?: SignedSimplexState): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentSettleResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PaymentSettleResponse
  ): PaymentSettleResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PaymentSettleResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PaymentSettleResponse;
  static deserializeBinaryFromReader(
    message: PaymentSettleResponse,
    reader: jspb.BinaryReader
  ): PaymentSettleResponse;
}

export namespace PaymentSettleResponse {
  export type AsObject = {
    stateCosigned?: SignedSimplexState.AsObject;
    error?: Error.AsObject;
  };
}

export class OpenChannelRequest extends jspb.Message {
  getChannelInitializer(): Uint8Array | string;
  getChannelInitializer_asU8(): Uint8Array;
  getChannelInitializer_asB64(): string;
  setChannelInitializer(value: Uint8Array | string): void;

  getRequesterSig(): Uint8Array | string;
  getRequesterSig_asU8(): Uint8Array;
  getRequesterSig_asB64(): string;
  setRequesterSig(value: Uint8Array | string): void;

  getOpenBy(): OpenChannelByMap[keyof OpenChannelByMap];
  setOpenBy(value: OpenChannelByMap[keyof OpenChannelByMap]): void;

  getOspToOsp(): boolean;
  setOspToOsp(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OpenChannelRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: OpenChannelRequest
  ): OpenChannelRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: OpenChannelRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): OpenChannelRequest;
  static deserializeBinaryFromReader(
    message: OpenChannelRequest,
    reader: jspb.BinaryReader
  ): OpenChannelRequest;
}

export namespace OpenChannelRequest {
  export type AsObject = {
    channelInitializer: Uint8Array | string;
    requesterSig: Uint8Array | string;
    openBy: OpenChannelByMap[keyof OpenChannelByMap];
    ospToOsp: boolean;
  };
}

export class OpenChannelResponse extends jspb.Message {
  getChannelInitializer(): Uint8Array | string;
  getChannelInitializer_asU8(): Uint8Array;
  getChannelInitializer_asB64(): string;
  setChannelInitializer(value: Uint8Array | string): void;

  getRequesterSig(): Uint8Array | string;
  getRequesterSig_asU8(): Uint8Array;
  getRequesterSig_asB64(): string;
  setRequesterSig(value: Uint8Array | string): void;

  getApproverSig(): Uint8Array | string;
  getApproverSig_asU8(): Uint8Array;
  getApproverSig_asB64(): string;
  setApproverSig(value: Uint8Array | string): void;

  getStatus(): OpenChannelStatusMap[keyof OpenChannelStatusMap];
  setStatus(value: OpenChannelStatusMap[keyof OpenChannelStatusMap]): void;

  getPaymentChannelId(): Uint8Array | string;
  getPaymentChannelId_asU8(): Uint8Array;
  getPaymentChannelId_asB64(): string;
  setPaymentChannelId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OpenChannelResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: OpenChannelResponse
  ): OpenChannelResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: OpenChannelResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): OpenChannelResponse;
  static deserializeBinaryFromReader(
    message: OpenChannelResponse,
    reader: jspb.BinaryReader
  ): OpenChannelResponse;
}

export namespace OpenChannelResponse {
  export type AsObject = {
    channelInitializer: Uint8Array | string;
    requesterSig: Uint8Array | string;
    approverSig: Uint8Array | string;
    status: OpenChannelStatusMap[keyof OpenChannelStatusMap];
    paymentChannelId: Uint8Array | string;
  };
}

export class CooperativeWithdrawRequest extends jspb.Message {
  hasWithdrawInfo(): boolean;
  clearWithdrawInfo(): void;
  getWithdrawInfo(): entity_pb.CooperativeWithdrawInfo | undefined;
  setWithdrawInfo(value?: entity_pb.CooperativeWithdrawInfo): void;

  getRequesterSig(): Uint8Array | string;
  getRequesterSig_asU8(): Uint8Array;
  getRequesterSig_asB64(): string;
  setRequesterSig(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeWithdrawRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CooperativeWithdrawRequest
  ): CooperativeWithdrawRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CooperativeWithdrawRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeWithdrawRequest;
  static deserializeBinaryFromReader(
    message: CooperativeWithdrawRequest,
    reader: jspb.BinaryReader
  ): CooperativeWithdrawRequest;
}

export namespace CooperativeWithdrawRequest {
  export type AsObject = {
    withdrawInfo?: entity_pb.CooperativeWithdrawInfo.AsObject;
    requesterSig: Uint8Array | string;
  };
}

export class CooperativeWithdrawResponse extends jspb.Message {
  hasWithdrawInfo(): boolean;
  clearWithdrawInfo(): void;
  getWithdrawInfo(): entity_pb.CooperativeWithdrawInfo | undefined;
  setWithdrawInfo(value?: entity_pb.CooperativeWithdrawInfo): void;

  getRequesterSig(): Uint8Array | string;
  getRequesterSig_asU8(): Uint8Array;
  getRequesterSig_asB64(): string;
  setRequesterSig(value: Uint8Array | string): void;

  getApproverSig(): Uint8Array | string;
  getApproverSig_asU8(): Uint8Array;
  getApproverSig_asB64(): string;
  setApproverSig(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeWithdrawResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CooperativeWithdrawResponse
  ): CooperativeWithdrawResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CooperativeWithdrawResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeWithdrawResponse;
  static deserializeBinaryFromReader(
    message: CooperativeWithdrawResponse,
    reader: jspb.BinaryReader
  ): CooperativeWithdrawResponse;
}

export namespace CooperativeWithdrawResponse {
  export type AsObject = {
    withdrawInfo?: entity_pb.CooperativeWithdrawInfo.AsObject;
    requesterSig: Uint8Array | string;
    approverSig: Uint8Array | string;
  };
}

export class CondPayReceipt extends jspb.Message {
  getPayId(): Uint8Array | string;
  getPayId_asU8(): Uint8Array;
  getPayId_asB64(): string;
  setPayId(value: Uint8Array | string): void;

  getPayDestSig(): Uint8Array | string;
  getPayDestSig_asU8(): Uint8Array;
  getPayDestSig_asB64(): string;
  setPayDestSig(value: Uint8Array | string): void;

  getPayDelegatorSig(): Uint8Array | string;
  getPayDelegatorSig_asU8(): Uint8Array;
  getPayDelegatorSig_asB64(): string;
  setPayDelegatorSig(value: Uint8Array | string): void;

  hasDelegationProof(): boolean;
  clearDelegationProof(): void;
  getDelegationProof(): DelegationProof | undefined;
  setDelegationProof(value?: DelegationProof): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CondPayReceipt.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CondPayReceipt
  ): CondPayReceipt.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CondPayReceipt,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CondPayReceipt;
  static deserializeBinaryFromReader(
    message: CondPayReceipt,
    reader: jspb.BinaryReader
  ): CondPayReceipt;
}

export namespace CondPayReceipt {
  export type AsObject = {
    payId: Uint8Array | string;
    payDestSig: Uint8Array | string;
    payDelegatorSig: Uint8Array | string;
    delegationProof?: DelegationProof.AsObject;
  };
}

export class SignedSimplexState extends jspb.Message {
  getSimplexState(): Uint8Array | string;
  getSimplexState_asU8(): Uint8Array;
  getSimplexState_asB64(): string;
  setSimplexState(value: Uint8Array | string): void;

  getSigOfPeerFrom(): Uint8Array | string;
  getSigOfPeerFrom_asU8(): Uint8Array;
  getSigOfPeerFrom_asB64(): string;
  setSigOfPeerFrom(value: Uint8Array | string): void;

  getSigOfPeerTo(): Uint8Array | string;
  getSigOfPeerTo_asU8(): Uint8Array;
  getSigOfPeerTo_asB64(): string;
  setSigOfPeerTo(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedSimplexState.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SignedSimplexState
  ): SignedSimplexState.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignedSimplexState,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignedSimplexState;
  static deserializeBinaryFromReader(
    message: SignedSimplexState,
    reader: jspb.BinaryReader
  ): SignedSimplexState;
}

export namespace SignedSimplexState {
  export type AsObject = {
    simplexState: Uint8Array | string;
    sigOfPeerFrom: Uint8Array | string;
    sigOfPeerTo: Uint8Array | string;
  };
}

export class SignedDuplexState extends jspb.Message {
  clearSimplexStatesList(): void;
  getSimplexStatesList(): Array<SignedSimplexState>;
  setSimplexStatesList(value: Array<SignedSimplexState>): void;
  addSimplexStates(
    value?: SignedSimplexState,
    index?: number
  ): SignedSimplexState;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedDuplexState.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SignedDuplexState
  ): SignedDuplexState.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignedDuplexState,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignedDuplexState;
  static deserializeBinaryFromReader(
    message: SignedDuplexState,
    reader: jspb.BinaryReader
  ): SignedDuplexState;
}

export namespace SignedDuplexState {
  export type AsObject = {
    simplexStatesList: Array<SignedSimplexState.AsObject>;
  };
}

export class PeerAddress extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): void;

  getTokenAddr(): string;
  setTokenAddr(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PeerAddress.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PeerAddress
  ): PeerAddress.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PeerAddress,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PeerAddress;
  static deserializeBinaryFromReader(
    message: PeerAddress,
    reader: jspb.BinaryReader
  ): PeerAddress;
}

export namespace PeerAddress {
  export type AsObject = {
    address: string;
    tokenAddr: string;
  };
}

export class PeerStatus extends jspb.Message {
  getFreeBalance(): string;
  setFreeBalance(value: string): void;

  getJoinStatus(): JoinCelerStatusMap[keyof JoinCelerStatusMap];
  setJoinStatus(value: JoinCelerStatusMap[keyof JoinCelerStatusMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PeerStatus.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PeerStatus
  ): PeerStatus.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PeerStatus,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PeerStatus;
  static deserializeBinaryFromReader(
    message: PeerStatus,
    reader: jspb.BinaryReader
  ): PeerStatus;
}

export namespace PeerStatus {
  export type AsObject = {
    freeBalance: string;
    joinStatus: JoinCelerStatusMap[keyof JoinCelerStatusMap];
  };
}

export class ChannelSummary extends jspb.Message {
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): void;

  getMySeqNum(): number;
  setMySeqNum(value: number): void;

  getPeerSeqNum(): number;
  setPeerSeqNum(value: number): void;

  getLedgerAddr(): Uint8Array | string;
  getLedgerAddr_asU8(): Uint8Array;
  getLedgerAddr_asB64(): string;
  setLedgerAddr(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelSummary.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChannelSummary
  ): ChannelSummary.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ChannelSummary,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChannelSummary;
  static deserializeBinaryFromReader(
    message: ChannelSummary,
    reader: jspb.BinaryReader
  ): ChannelSummary;
}

export namespace ChannelSummary {
  export type AsObject = {
    channelId: Uint8Array | string;
    mySeqNum: number;
    peerSeqNum: number;
    ledgerAddr: Uint8Array | string;
  };
}

export class ChannelInAuth extends jspb.Message {
  getCid(): Uint8Array | string;
  getCid_asU8(): Uint8Array;
  getCid_asB64(): string;
  setCid(value: Uint8Array | string): void;

  getChannelState(): number;
  setChannelState(value: number): void;

  hasOpenChannelResponse(): boolean;
  clearOpenChannelResponse(): void;
  getOpenChannelResponse(): OpenChannelResponse | undefined;
  setOpenChannelResponse(value?: OpenChannelResponse): void;

  hasAuthackSimplex(): boolean;
  clearAuthackSimplex(): void;
  getAuthackSimplex(): SignedSimplexState | undefined;
  setAuthackSimplex(value?: SignedSimplexState): void;

  clearAuthackPaysList(): void;
  getAuthackPaysList(): Array<PayInAuthAck>;
  setAuthackPaysList(value: Array<PayInAuthAck>): void;
  addAuthackPays(value?: PayInAuthAck, index?: number): PayInAuthAck;

  hasAuthreqSimplex(): boolean;
  clearAuthreqSimplex(): void;
  getAuthreqSimplex(): SignedSimplexState | undefined;
  setAuthreqSimplex(value?: SignedSimplexState): void;

  clearAuthreqPaysList(): void;
  getAuthreqPaysList(): Array<PayInAuthAck>;
  setAuthreqPaysList(value: Array<PayInAuthAck>): void;
  addAuthreqPays(value?: PayInAuthAck, index?: number): PayInAuthAck;

  getLedgerAddr(): Uint8Array | string;
  getLedgerAddr_asU8(): Uint8Array;
  getLedgerAddr_asB64(): string;
  setLedgerAddr(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelInAuth.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChannelInAuth
  ): ChannelInAuth.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ChannelInAuth,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChannelInAuth;
  static deserializeBinaryFromReader(
    message: ChannelInAuth,
    reader: jspb.BinaryReader
  ): ChannelInAuth;
}

export namespace ChannelInAuth {
  export type AsObject = {
    cid: Uint8Array | string;
    channelState: number;
    openChannelResponse?: OpenChannelResponse.AsObject;
    authackSimplex?: SignedSimplexState.AsObject;
    authackPaysList: Array<PayInAuthAck.AsObject>;
    authreqSimplex?: SignedSimplexState.AsObject;
    authreqPaysList: Array<PayInAuthAck.AsObject>;
    ledgerAddr: Uint8Array | string;
  };
}

export class PayInAuthAck extends jspb.Message {
  getPay(): Uint8Array | string;
  getPay_asU8(): Uint8Array;
  getPay_asB64(): string;
  setPay(value: Uint8Array | string): void;

  hasNote(): boolean;
  clearNote(): void;
  getNote(): google_protobuf_any_pb.Any | undefined;
  setNote(value?: google_protobuf_any_pb.Any): void;

  getState(): number;
  setState(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PayInAuthAck.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PayInAuthAck
  ): PayInAuthAck.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PayInAuthAck,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PayInAuthAck;
  static deserializeBinaryFromReader(
    message: PayInAuthAck,
    reader: jspb.BinaryReader
  ): PayInAuthAck;
}

export namespace PayInAuthAck {
  export type AsObject = {
    pay: Uint8Array | string;
    note?: google_protobuf_any_pb.Any.AsObject;
    state: number;
  };
}

export class DelegationDescription extends jspb.Message {
  getDelegator(): Uint8Array | string;
  getDelegator_asU8(): Uint8Array;
  getDelegator_asB64(): string;
  setDelegator(value: Uint8Array | string): void;

  getDelegatee(): Uint8Array | string;
  getDelegatee_asU8(): Uint8Array;
  getDelegatee_asB64(): string;
  setDelegatee(value: Uint8Array | string): void;

  getExpiresAfterBlock(): number;
  setExpiresAfterBlock(value: number): void;

  clearTokenToDelegateList(): void;
  getTokenToDelegateList(): Array<Uint8Array | string>;
  getTokenToDelegateList_asU8(): Array<Uint8Array>;
  getTokenToDelegateList_asB64(): Array<string>;
  setTokenToDelegateList(value: Array<Uint8Array | string>): void;
  addTokenToDelegate(
    value: Uint8Array | string,
    index?: number
  ): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelegationDescription.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelegationDescription
  ): DelegationDescription.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelegationDescription,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelegationDescription;
  static deserializeBinaryFromReader(
    message: DelegationDescription,
    reader: jspb.BinaryReader
  ): DelegationDescription;
}

export namespace DelegationDescription {
  export type AsObject = {
    delegator: Uint8Array | string;
    delegatee: Uint8Array | string;
    expiresAfterBlock: number;
    tokenToDelegateList: Array<Uint8Array | string>;
  };
}

export class DelegationProof extends jspb.Message {
  getDelegationDescriptionBytes(): Uint8Array | string;
  getDelegationDescriptionBytes_asU8(): Uint8Array;
  getDelegationDescriptionBytes_asB64(): string;
  setDelegationDescriptionBytes(value: Uint8Array | string): void;

  getSignature(): Uint8Array | string;
  getSignature_asU8(): Uint8Array;
  getSignature_asB64(): string;
  setSignature(value: Uint8Array | string): void;

  getSigner(): Uint8Array | string;
  getSigner_asU8(): Uint8Array;
  getSigner_asB64(): string;
  setSigner(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelegationProof.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelegationProof
  ): DelegationProof.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelegationProof,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelegationProof;
  static deserializeBinaryFromReader(
    message: DelegationProof,
    reader: jspb.BinaryReader
  ): DelegationProof;
}

export namespace DelegationProof {
  export type AsObject = {
    delegationDescriptionBytes: Uint8Array | string;
    signature: Uint8Array | string;
    signer: Uint8Array | string;
  };
}

export class DelegationRequest extends jspb.Message {
  hasProof(): boolean;
  clearProof(): void;
  getProof(): DelegationProof | undefined;
  setProof(value?: DelegationProof): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelegationRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelegationRequest
  ): DelegationRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelegationRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelegationRequest;
  static deserializeBinaryFromReader(
    message: DelegationRequest,
    reader: jspb.BinaryReader
  ): DelegationRequest;
}

export namespace DelegationRequest {
  export type AsObject = {
    proof?: DelegationProof.AsObject;
  };
}

export class DelegationResponse extends jspb.Message {
  getError(): string;
  setError(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelegationResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelegationResponse
  ): DelegationResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelegationResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelegationResponse;
  static deserializeBinaryFromReader(
    message: DelegationResponse,
    reader: jspb.BinaryReader
  ): DelegationResponse;
}

export namespace DelegationResponse {
  export type AsObject = {
    error: string;
  };
}

export class QueryDelegationRequest extends jspb.Message {
  getDelegatee(): Uint8Array | string;
  getDelegatee_asU8(): Uint8Array;
  getDelegatee_asB64(): string;
  setDelegatee(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryDelegationRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: QueryDelegationRequest
  ): QueryDelegationRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: QueryDelegationRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): QueryDelegationRequest;
  static deserializeBinaryFromReader(
    message: QueryDelegationRequest,
    reader: jspb.BinaryReader
  ): QueryDelegationRequest;
}

export namespace QueryDelegationRequest {
  export type AsObject = {
    delegatee: Uint8Array | string;
  };
}

export class QueryDelegationResponse extends jspb.Message {
  hasProof(): boolean;
  clearProof(): void;
  getProof(): DelegationProof | undefined;
  setProof(value?: DelegationProof): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryDelegationResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: QueryDelegationResponse
  ): QueryDelegationResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: QueryDelegationResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): QueryDelegationResponse;
  static deserializeBinaryFromReader(
    message: QueryDelegationResponse,
    reader: jspb.BinaryReader
  ): QueryDelegationResponse;
}

export namespace QueryDelegationResponse {
  export type AsObject = {
    proof?: DelegationProof.AsObject;
  };
}

export class MigrateChannelRequest extends jspb.Message {
  getChannelMigrationInfo(): Uint8Array | string;
  getChannelMigrationInfo_asU8(): Uint8Array;
  getChannelMigrationInfo_asB64(): string;
  setChannelMigrationInfo(value: Uint8Array | string): void;

  getRequesterSig(): Uint8Array | string;
  getRequesterSig_asU8(): Uint8Array;
  getRequesterSig_asB64(): string;
  setRequesterSig(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MigrateChannelRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MigrateChannelRequest
  ): MigrateChannelRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MigrateChannelRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MigrateChannelRequest;
  static deserializeBinaryFromReader(
    message: MigrateChannelRequest,
    reader: jspb.BinaryReader
  ): MigrateChannelRequest;
}

export namespace MigrateChannelRequest {
  export type AsObject = {
    channelMigrationInfo: Uint8Array | string;
    requesterSig: Uint8Array | string;
  };
}

export class MigrateChannelResponse extends jspb.Message {
  getApproverSig(): Uint8Array | string;
  getApproverSig_asU8(): Uint8Array;
  getApproverSig_asB64(): string;
  setApproverSig(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MigrateChannelResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MigrateChannelResponse
  ): MigrateChannelResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MigrateChannelResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MigrateChannelResponse;
  static deserializeBinaryFromReader(
    message: MigrateChannelResponse,
    reader: jspb.BinaryReader
  ): MigrateChannelResponse;
}

export namespace MigrateChannelResponse {
  export type AsObject = {
    approverSig: Uint8Array | string;
  };
}

export class GetPayHistoryRequest extends jspb.Message {
  getPeer(): string;
  setPeer(value: string): void;

  getBeforeTs(): number;
  setBeforeTs(value: number): void;

  getItemsPerPage(): number;
  setItemsPerPage(value: number): void;

  getTsSig(): Uint8Array | string;
  getTsSig_asU8(): Uint8Array;
  getTsSig_asB64(): string;
  setTsSig(value: Uint8Array | string): void;

  getTs(): number;
  setTs(value: number): void;

  getSmallestPayId(): string;
  setSmallestPayId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPayHistoryRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetPayHistoryRequest
  ): GetPayHistoryRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetPayHistoryRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetPayHistoryRequest;
  static deserializeBinaryFromReader(
    message: GetPayHistoryRequest,
    reader: jspb.BinaryReader
  ): GetPayHistoryRequest;
}

export namespace GetPayHistoryRequest {
  export type AsObject = {
    peer: string;
    beforeTs: number;
    itemsPerPage: number;
    tsSig: Uint8Array | string;
    ts: number;
    smallestPayId: string;
  };
}

export class OneHistoricalPay extends jspb.Message {
  getDst(): string;
  setDst(value: string): void;

  getToken(): string;
  setToken(value: string): void;

  getAmt(): string;
  setAmt(value: string): void;

  getState(): number;
  setState(value: number): void;

  getPayId(): string;
  setPayId(value: string): void;

  getCreateTs(): number;
  setCreateTs(value: number): void;

  getSrc(): string;
  setSrc(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OneHistoricalPay.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: OneHistoricalPay
  ): OneHistoricalPay.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: OneHistoricalPay,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): OneHistoricalPay;
  static deserializeBinaryFromReader(
    message: OneHistoricalPay,
    reader: jspb.BinaryReader
  ): OneHistoricalPay;
}

export namespace OneHistoricalPay {
  export type AsObject = {
    dst: string;
    token: string;
    amt: string;
    state: number;
    payId: string;
    createTs: number;
    src: string;
  };
}

export class GetPayHistoryResponse extends jspb.Message {
  clearPaysList(): void;
  getPaysList(): Array<OneHistoricalPay>;
  setPaysList(value: Array<OneHistoricalPay>): void;
  addPays(value?: OneHistoricalPay, index?: number): OneHistoricalPay;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPayHistoryResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetPayHistoryResponse
  ): GetPayHistoryResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetPayHistoryResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetPayHistoryResponse;
  static deserializeBinaryFromReader(
    message: GetPayHistoryResponse,
    reader: jspb.BinaryReader
  ): GetPayHistoryResponse;
}

export namespace GetPayHistoryResponse {
  export type AsObject = {
    paysList: Array<OneHistoricalPay.AsObject>;
  };
}

export class ChannelRoutingInfo extends jspb.Message {
  getCid(): string;
  setCid(value: string): void;

  getBalance(): string;
  setBalance(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelRoutingInfo.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChannelRoutingInfo
  ): ChannelRoutingInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ChannelRoutingInfo,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChannelRoutingInfo;
  static deserializeBinaryFromReader(
    message: ChannelRoutingInfo,
    reader: jspb.BinaryReader
  ): ChannelRoutingInfo;
}

export namespace ChannelRoutingInfo {
  export type AsObject = {
    cid: string;
    balance: string;
  };
}

export class RoutingUpdate extends jspb.Message {
  getOrigin(): string;
  setOrigin(value: string): void;

  getTs(): number;
  setTs(value: number): void;

  clearChannelsList(): void;
  getChannelsList(): Array<ChannelRoutingInfo>;
  setChannelsList(value: Array<ChannelRoutingInfo>): void;
  addChannels(value?: ChannelRoutingInfo, index?: number): ChannelRoutingInfo;

  getProtoVersion(): number;
  setProtoVersion(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutingUpdate.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutingUpdate
  ): RoutingUpdate.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutingUpdate,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutingUpdate;
  static deserializeBinaryFromReader(
    message: RoutingUpdate,
    reader: jspb.BinaryReader
  ): RoutingUpdate;
}

export namespace RoutingUpdate {
  export type AsObject = {
    origin: string;
    ts: number;
    channelsList: Array<ChannelRoutingInfo.AsObject>;
    protoVersion: number;
  };
}

export class SignedRoutingUpdate extends jspb.Message {
  getUpdate(): Uint8Array | string;
  getUpdate_asU8(): Uint8Array;
  getUpdate_asB64(): string;
  setUpdate(value: Uint8Array | string): void;

  getSig(): Uint8Array | string;
  getSig_asU8(): Uint8Array;
  getSig_asB64(): string;
  setSig(value: Uint8Array | string): void;

  getTtl(): number;
  setTtl(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedRoutingUpdate.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SignedRoutingUpdate
  ): SignedRoutingUpdate.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignedRoutingUpdate,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignedRoutingUpdate;
  static deserializeBinaryFromReader(
    message: SignedRoutingUpdate,
    reader: jspb.BinaryReader
  ): SignedRoutingUpdate;
}

export namespace SignedRoutingUpdate {
  export type AsObject = {
    update: Uint8Array | string;
    sig: Uint8Array | string;
    ttl: number;
  };
}

export class RoutingRequest extends jspb.Message {
  clearUpdatesList(): void;
  getUpdatesList(): Array<SignedRoutingUpdate>;
  setUpdatesList(value: Array<SignedRoutingUpdate>): void;
  addUpdates(value?: SignedRoutingUpdate, index?: number): SignedRoutingUpdate;

  getSender(): string;
  setSender(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutingRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutingRequest
  ): RoutingRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutingRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutingRequest;
  static deserializeBinaryFromReader(
    message: RoutingRequest,
    reader: jspb.BinaryReader
  ): RoutingRequest;
}

export namespace RoutingRequest {
  export type AsObject = {
    updatesList: Array<SignedRoutingUpdate.AsObject>;
    sender: string;
  };
}

export interface ErrCodeMap {
  OK: 0;
  UNAUTHORIZED: 1;
  INVALID_SIG: 2;
  INCORRECT_CLOCK: 3;
  WRONG_PEER: 4;
  INVALID_SEQ_NUM: 5;
  PAY_ROUTE_LOOP: 6;
  NO_ROUTE_TO_DST: 7;
}

export const ErrCode: ErrCodeMap;

export interface PaymentSettleReasonMap {
  NONE: 0;
  PAY_EXPIRED: 1;
  PAY_REJECTED: 2;
  PAY_RESOLVED_ONCHAIN: 3;
  PAY_PAID_MAX: 4;
  PAY_DEST_UNREACHABLE: 5;
  PAY_VOUCHED: 6;
}

export const PaymentSettleReason: PaymentSettleReasonMap;

export interface OpenChannelByMap {
  UNDEFINED_OPEN_BY: 0;
  OPEN_CHANNEL_PROPOSER: 1;
  OPEN_CHANNEL_APPROVER: 2;
}

export const OpenChannelBy: OpenChannelByMap;

export interface OpenChannelStatusMap {
  UNDEFINED_OPEN_CHANNEL_STATUS: 0;
  OPEN_CHANNEL_APPROVED: 1;
  OPEN_CHANNEL_TX_SUBMITTED: 2;
  OPEN_CHANNEL_TCB_OPENED: 3;
}

export const OpenChannelStatus: OpenChannelStatusMap;

export interface JoinCelerStatusMap {
  NOT_JOIN: 0;
  LOCAL: 1;
  REMOTE: 2;
}

export const JoinCelerStatus: JoinCelerStatusMap;
