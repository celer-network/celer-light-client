// package: webproxyrpc
// file: web_proxy.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as message_pb from "./message_pb";

export class SessionToken extends jspb.Message {
  getToken(): string;
  setToken(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SessionToken.AsObject;
  static toObject(includeInstance: boolean, msg: SessionToken): SessionToken.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SessionToken, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SessionToken;
  static deserializeBinaryFromReader(message: SessionToken, reader: jspb.BinaryReader): SessionToken;
}

export namespace SessionToken {
  export type AsObject = {
    token: string,
  }
}

