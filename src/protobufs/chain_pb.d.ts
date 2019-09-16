// package: chain
// file: chain.proto

import * as jspb from "google-protobuf";

export class OpenChannelRequest extends jspb.Message {
  getChannelInitializer(): Uint8Array | string;
  getChannelInitializer_asU8(): Uint8Array;
  getChannelInitializer_asB64(): string;
  setChannelInitializer(value: Uint8Array | string): void;

  clearSigsList(): void;
  getSigsList(): Array<Uint8Array | string>;
  getSigsList_asU8(): Array<Uint8Array>;
  getSigsList_asB64(): Array<string>;
  setSigsList(value: Array<Uint8Array | string>): void;
  addSigs(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OpenChannelRequest.AsObject;
  static toObject(includeInstance: boolean, msg: OpenChannelRequest): OpenChannelRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OpenChannelRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OpenChannelRequest;
  static deserializeBinaryFromReader(message: OpenChannelRequest, reader: jspb.BinaryReader): OpenChannelRequest;
}

export namespace OpenChannelRequest {
  export type AsObject = {
    channelInitializer: Uint8Array | string,
    sigsList: Array<Uint8Array | string>,
  }
}

export class CooperativeWithdrawRequest extends jspb.Message {
  getWithdrawInfo(): Uint8Array | string;
  getWithdrawInfo_asU8(): Uint8Array;
  getWithdrawInfo_asB64(): string;
  setWithdrawInfo(value: Uint8Array | string): void;

  clearSigsList(): void;
  getSigsList(): Array<Uint8Array | string>;
  getSigsList_asU8(): Array<Uint8Array>;
  getSigsList_asB64(): Array<string>;
  setSigsList(value: Array<Uint8Array | string>): void;
  addSigs(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeWithdrawRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CooperativeWithdrawRequest): CooperativeWithdrawRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CooperativeWithdrawRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeWithdrawRequest;
  static deserializeBinaryFromReader(message: CooperativeWithdrawRequest, reader: jspb.BinaryReader): CooperativeWithdrawRequest;
}

export namespace CooperativeWithdrawRequest {
  export type AsObject = {
    withdrawInfo: Uint8Array | string,
    sigsList: Array<Uint8Array | string>,
  }
}

export class CooperativeSettleRequest extends jspb.Message {
  getSettleInfo(): Uint8Array | string;
  getSettleInfo_asU8(): Uint8Array;
  getSettleInfo_asB64(): string;
  setSettleInfo(value: Uint8Array | string): void;

  clearSigsList(): void;
  getSigsList(): Array<Uint8Array | string>;
  getSigsList_asU8(): Array<Uint8Array>;
  getSigsList_asB64(): Array<string>;
  setSigsList(value: Array<Uint8Array | string>): void;
  addSigs(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CooperativeSettleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CooperativeSettleRequest): CooperativeSettleRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CooperativeSettleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CooperativeSettleRequest;
  static deserializeBinaryFromReader(message: CooperativeSettleRequest, reader: jspb.BinaryReader): CooperativeSettleRequest;
}

export namespace CooperativeSettleRequest {
  export type AsObject = {
    settleInfo: Uint8Array | string,
    sigsList: Array<Uint8Array | string>,
  }
}

export class ResolvePayByConditionsRequest extends jspb.Message {
  getCondPay(): Uint8Array | string;
  getCondPay_asU8(): Uint8Array;
  getCondPay_asB64(): string;
  setCondPay(value: Uint8Array | string): void;

  clearHashPreimagesList(): void;
  getHashPreimagesList(): Array<Uint8Array | string>;
  getHashPreimagesList_asU8(): Array<Uint8Array>;
  getHashPreimagesList_asB64(): Array<string>;
  setHashPreimagesList(value: Array<Uint8Array | string>): void;
  addHashPreimages(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResolvePayByConditionsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ResolvePayByConditionsRequest): ResolvePayByConditionsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ResolvePayByConditionsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResolvePayByConditionsRequest;
  static deserializeBinaryFromReader(message: ResolvePayByConditionsRequest, reader: jspb.BinaryReader): ResolvePayByConditionsRequest;
}

export namespace ResolvePayByConditionsRequest {
  export type AsObject = {
    condPay: Uint8Array | string,
    hashPreimagesList: Array<Uint8Array | string>,
  }
}

export class SignedSimplexState extends jspb.Message {
  getSimplexState(): Uint8Array | string;
  getSimplexState_asU8(): Uint8Array;
  getSimplexState_asB64(): string;
  setSimplexState(value: Uint8Array | string): void;

  clearSigsList(): void;
  getSigsList(): Array<Uint8Array | string>;
  getSigsList_asU8(): Array<Uint8Array>;
  getSigsList_asB64(): Array<string>;
  setSigsList(value: Array<Uint8Array | string>): void;
  addSigs(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedSimplexState.AsObject;
  static toObject(includeInstance: boolean, msg: SignedSimplexState): SignedSimplexState.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignedSimplexState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignedSimplexState;
  static deserializeBinaryFromReader(message: SignedSimplexState, reader: jspb.BinaryReader): SignedSimplexState;
}

export namespace SignedSimplexState {
  export type AsObject = {
    simplexState: Uint8Array | string,
    sigsList: Array<Uint8Array | string>,
  }
}

export class SignedSimplexStateArray extends jspb.Message {
  clearSignedSimplexStatesList(): void;
  getSignedSimplexStatesList(): Array<SignedSimplexState>;
  setSignedSimplexStatesList(value: Array<SignedSimplexState>): void;
  addSignedSimplexStates(value?: SignedSimplexState, index?: number): SignedSimplexState;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedSimplexStateArray.AsObject;
  static toObject(includeInstance: boolean, msg: SignedSimplexStateArray): SignedSimplexStateArray.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignedSimplexStateArray, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignedSimplexStateArray;
  static deserializeBinaryFromReader(message: SignedSimplexStateArray, reader: jspb.BinaryReader): SignedSimplexStateArray;
}

export namespace SignedSimplexStateArray {
  export type AsObject = {
    signedSimplexStatesList: Array<SignedSimplexState.AsObject>,
  }
}

export class ChannelMigrationRequest extends jspb.Message {
  getChannelMigrationInfo(): Uint8Array | string;
  getChannelMigrationInfo_asU8(): Uint8Array;
  getChannelMigrationInfo_asB64(): string;
  setChannelMigrationInfo(value: Uint8Array | string): void;

  clearSigsList(): void;
  getSigsList(): Array<Uint8Array | string>;
  getSigsList_asU8(): Array<Uint8Array>;
  getSigsList_asB64(): Array<string>;
  setSigsList(value: Array<Uint8Array | string>): void;
  addSigs(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelMigrationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelMigrationRequest): ChannelMigrationRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelMigrationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelMigrationRequest;
  static deserializeBinaryFromReader(message: ChannelMigrationRequest, reader: jspb.BinaryReader): ChannelMigrationRequest;
}

export namespace ChannelMigrationRequest {
  export type AsObject = {
    channelMigrationInfo: Uint8Array | string,
    sigsList: Array<Uint8Array | string>,
  }
}

