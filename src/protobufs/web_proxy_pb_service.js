// package: webproxyrpc
// file: web_proxy.proto

var web_proxy_pb = require("./web_proxy_pb");
var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb");
var message_pb = require("./message_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var WebProxyRpc = (function () {
  function WebProxyRpc() {}
  WebProxyRpc.serviceName = "webproxyrpc.WebProxyRpc";
  return WebProxyRpc;
}());

WebProxyRpc.CreateSession = {
  methodName: "CreateSession",
  service: WebProxyRpc,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: web_proxy_pb.SessionToken
};

WebProxyRpc.OpenChannel = {
  methodName: "OpenChannel",
  service: WebProxyRpc,
  requestStream: false,
  responseStream: false,
  requestType: message_pb.OpenChannelRequest,
  responseType: message_pb.OpenChannelResponse
};

WebProxyRpc.SubscribeMessages = {
  methodName: "SubscribeMessages",
  service: WebProxyRpc,
  requestStream: false,
  responseStream: true,
  requestType: message_pb.AuthReq,
  responseType: message_pb.CelerMsg
};

WebProxyRpc.SendMessage = {
  methodName: "SendMessage",
  service: WebProxyRpc,
  requestStream: false,
  responseStream: false,
  requestType: message_pb.CelerMsg,
  responseType: google_protobuf_empty_pb.Empty
};

exports.WebProxyRpc = WebProxyRpc;

function WebProxyRpcClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

WebProxyRpcClient.prototype.createSession = function createSession(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WebProxyRpc.CreateSession, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

WebProxyRpcClient.prototype.openChannel = function openChannel(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WebProxyRpc.OpenChannel, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

WebProxyRpcClient.prototype.subscribeMessages = function subscribeMessages(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(WebProxyRpc.SubscribeMessages, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

WebProxyRpcClient.prototype.sendMessage = function sendMessage(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(WebProxyRpc.SendMessage, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

exports.WebProxyRpcClient = WebProxyRpcClient;

