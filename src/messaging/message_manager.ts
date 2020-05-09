import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import { grpc } from '@improbable-eng/grpc-web';

import { Config } from '../api/config';
import {
  AuthReq,
  CelerMsg,
  OpenChannelRequest,
  OpenChannelResponse,
} from '../protobufs/message_pb';
import {
  ResponseStream,
  WebProxyRpcClient,
} from '../protobufs/web_proxy_pb_service';

interface MessageHandler {
  handle: (message: CelerMsg) => Promise<void>;
}

export class MessageManager {
  private readonly rpcClient: WebProxyRpcClient;
  private readonly handlers: Map<CelerMsg.MessageCase, MessageHandler>;
  private readonly messageQueue: CelerMsg[];
  private metadata: grpc.Metadata;
  private dispatcherSpawned: boolean;
  private subscribeStream: ResponseStream<CelerMsg>;

  constructor(config: Config) {
    this.rpcClient = new WebProxyRpcClient(config.ospNetworkAddress);
    this.handlers = new Map();
    this.messageQueue = [];
    this.dispatcherSpawned = false;
  }

  async createSession(): Promise<void> {
    const sessionToken = await new Promise<string>((resolve, reject) => {
      this.rpcClient.createSession(new Empty(), (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token.getToken());
        }
      });
    });
    const metadata = new grpc.Metadata();
    metadata.set('session', sessionToken);
    this.metadata = metadata;
  }

  async openChannel(request: OpenChannelRequest): Promise<OpenChannelResponse> {
    // TODO(dominator008): Maybe merge OpenChannel into CelerMsg
    return new Promise<OpenChannelResponse>((resolve, reject) => {
      this.rpcClient.openChannel(request, this.metadata, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async sendMessage(message: CelerMsg): Promise<void> {
    await new Promise((resolve, reject) => {
      this.rpcClient.sendMessage(message, this.metadata, (error, _) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  subscribeMessages(auth: AuthReq): void {
    const stream = this.rpcClient.subscribeMessages(auth, this.metadata);
    stream.on('data', (message: CelerMsg) => {
      this.messageQueue.push(message);
      if (!this.dispatcherSpawned) {
        this.dispatcherSpawned = true;
        this.dispatchMessages();
      }
    });
    this.subscribeStream = stream;
  }

  setHandler(messageCase: CelerMsg.MessageCase, handler: MessageHandler): void {
    this.handlers.set(messageCase, handler);
  }

  close(): void {
    if (this.subscribeStream) {
      this.subscribeStream.cancel();
    }
  }

  private async dispatchMessages(): Promise<void> {
    const { messageQueue } = this;
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      /* eslint-disable-next-line no-await-in-loop */
      await this.handlers.get(message.getMessageCase()).handle(message);
    }
    this.dispatcherSpawned = false;
  }
}
