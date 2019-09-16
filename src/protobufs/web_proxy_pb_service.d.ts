// package: webproxyrpc
// file: web_proxy.proto

import * as web_proxy_pb from "./web_proxy_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as message_pb from "./message_pb";
import {grpc} from "@improbable-eng/grpc-web";

type WebProxyRpcCreateSession = {
  readonly methodName: string;
  readonly service: typeof WebProxyRpc;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof web_proxy_pb.SessionToken;
};

type WebProxyRpcOpenChannel = {
  readonly methodName: string;
  readonly service: typeof WebProxyRpc;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof message_pb.OpenChannelRequest;
  readonly responseType: typeof message_pb.OpenChannelResponse;
};

type WebProxyRpcSubscribeMessages = {
  readonly methodName: string;
  readonly service: typeof WebProxyRpc;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof message_pb.AuthReq;
  readonly responseType: typeof message_pb.CelerMsg;
};

type WebProxyRpcSendMessage = {
  readonly methodName: string;
  readonly service: typeof WebProxyRpc;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof message_pb.CelerMsg;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

export class WebProxyRpc {
  static readonly serviceName: string;
  static readonly CreateSession: WebProxyRpcCreateSession;
  static readonly OpenChannel: WebProxyRpcOpenChannel;
  static readonly SubscribeMessages: WebProxyRpcSubscribeMessages;
  static readonly SendMessage: WebProxyRpcSendMessage;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class WebProxyRpcClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  createSession(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: web_proxy_pb.SessionToken|null) => void
  ): UnaryResponse;
  createSession(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: web_proxy_pb.SessionToken|null) => void
  ): UnaryResponse;
  openChannel(
    requestMessage: message_pb.OpenChannelRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: message_pb.OpenChannelResponse|null) => void
  ): UnaryResponse;
  openChannel(
    requestMessage: message_pb.OpenChannelRequest,
    callback: (error: ServiceError|null, responseMessage: message_pb.OpenChannelResponse|null) => void
  ): UnaryResponse;
  subscribeMessages(requestMessage: message_pb.AuthReq, metadata?: grpc.Metadata): ResponseStream<message_pb.CelerMsg>;
  sendMessage(
    requestMessage: message_pb.CelerMsg,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  sendMessage(
    requestMessage: message_pb.CelerMsg,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
}

