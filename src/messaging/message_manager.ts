/**
 * @license
 * The MIT License
 *
 * Copyright (c) 2019 Celer Network
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import { grpc } from '@improbable-eng/grpc-web';

import { Config } from '../config';
import { Signer } from '../crypto/signer';
import {
  AuthReq,
  CelerMsg,
  OpenChannelRequest,
  OpenChannelResponse
} from '../protobufs/message_pb';
import { WebProxyRpcClient } from '../protobufs/web_proxy_pb_service';
import { Database } from '../storage/database';
import { CondPayReceiptHandler } from './cond_pay_receipt_handler';
import { CondPayRequestHandler } from './cond_pay_request_handler';
import { CondPayResponseHandler } from './cond_pay_response_handler';
import { PaymentSettleRequestSender } from './payment_settle_request_sender';
import { PaymentSettleResponseHandler } from './payment_settle_response_handler';
import { RevealSecretAckHandler } from './reveal_secret_ack_handler';

interface MessageHandler {
  handle: (message: CelerMsg) => Promise<void>;
}

export class MessageManager {
  private readonly rpcClient: WebProxyRpcClient;
  private readonly handlers: Map<CelerMsg.MessageCase, MessageHandler>;
  private metadata: grpc.Metadata;

  constructor(
    config: Config,
    peerAddress: string,
    db: Database,
    signer: Signer
  ) {
    this.rpcClient = new WebProxyRpcClient(config.ospNetworkAddress);
    this.handlers = new Map();
    this.handlers.set(
      CelerMsg.MessageCase.COND_PAY_REQUEST,
      new CondPayRequestHandler(db, this, signer, config)
    );
    this.handlers.set(
      CelerMsg.MessageCase.COND_PAY_RESPONSE,
      new CondPayResponseHandler(db, peerAddress)
    );
    this.handlers.set(
      CelerMsg.MessageCase.COND_PAY_RECEIPT,
      new CondPayReceiptHandler(db, this)
    );
    const paymentSettleRequestSender = new PaymentSettleRequestSender(
      db,
      signer,
      this,
      peerAddress
    );
    this.handlers.set(
      CelerMsg.MessageCase.REVEAL_SECRET_ACK,
      new RevealSecretAckHandler(db, paymentSettleRequestSender)
    );
    this.handlers.set(
      CelerMsg.MessageCase.PAYMENT_SETTLE_RESPONSE,
      new PaymentSettleResponseHandler(db, peerAddress)
    );
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
    return await new Promise<OpenChannelResponse>((resolve, reject) => {
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
    stream.on('data', async (message: CelerMsg) => {
      await this.handlers.get(message.getMessageCase()).handle(message);
    });
  }
}
