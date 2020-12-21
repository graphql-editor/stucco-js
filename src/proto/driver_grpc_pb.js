// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var proto_driver_pb = require('../proto/driver_pb.js');

function serialize_proto_ByteStream(arg) {
  if (!(arg instanceof proto_driver_pb.ByteStream)) {
    throw new Error('Expected argument of type proto.ByteStream');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ByteStream(buffer_arg) {
  return proto_driver_pb.ByteStream.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_ByteStreamRequest(arg) {
  if (!(arg instanceof proto_driver_pb.ByteStreamRequest)) {
    throw new Error('Expected argument of type proto.ByteStreamRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ByteStreamRequest(buffer_arg) {
  return proto_driver_pb.ByteStreamRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_FieldResolveRequest(arg) {
  if (!(arg instanceof proto_driver_pb.FieldResolveRequest)) {
    throw new Error('Expected argument of type proto.FieldResolveRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_FieldResolveRequest(buffer_arg) {
  return proto_driver_pb.FieldResolveRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_FieldResolveResponse(arg) {
  if (!(arg instanceof proto_driver_pb.FieldResolveResponse)) {
    throw new Error('Expected argument of type proto.FieldResolveResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_FieldResolveResponse(buffer_arg) {
  return proto_driver_pb.FieldResolveResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_InterfaceResolveTypeRequest(arg) {
  if (!(arg instanceof proto_driver_pb.InterfaceResolveTypeRequest)) {
    throw new Error('Expected argument of type proto.InterfaceResolveTypeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_InterfaceResolveTypeRequest(buffer_arg) {
  return proto_driver_pb.InterfaceResolveTypeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_InterfaceResolveTypeResponse(arg) {
  if (!(arg instanceof proto_driver_pb.InterfaceResolveTypeResponse)) {
    throw new Error('Expected argument of type proto.InterfaceResolveTypeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_InterfaceResolveTypeResponse(buffer_arg) {
  return proto_driver_pb.InterfaceResolveTypeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_ScalarParseRequest(arg) {
  if (!(arg instanceof proto_driver_pb.ScalarParseRequest)) {
    throw new Error('Expected argument of type proto.ScalarParseRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ScalarParseRequest(buffer_arg) {
  return proto_driver_pb.ScalarParseRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_ScalarParseResponse(arg) {
  if (!(arg instanceof proto_driver_pb.ScalarParseResponse)) {
    throw new Error('Expected argument of type proto.ScalarParseResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ScalarParseResponse(buffer_arg) {
  return proto_driver_pb.ScalarParseResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_ScalarSerializeRequest(arg) {
  if (!(arg instanceof proto_driver_pb.ScalarSerializeRequest)) {
    throw new Error('Expected argument of type proto.ScalarSerializeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ScalarSerializeRequest(buffer_arg) {
  return proto_driver_pb.ScalarSerializeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_ScalarSerializeResponse(arg) {
  if (!(arg instanceof proto_driver_pb.ScalarSerializeResponse)) {
    throw new Error('Expected argument of type proto.ScalarSerializeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_ScalarSerializeResponse(buffer_arg) {
  return proto_driver_pb.ScalarSerializeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SetSecretsRequest(arg) {
  if (!(arg instanceof proto_driver_pb.SetSecretsRequest)) {
    throw new Error('Expected argument of type proto.SetSecretsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SetSecretsRequest(buffer_arg) {
  return proto_driver_pb.SetSecretsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SetSecretsResponse(arg) {
  if (!(arg instanceof proto_driver_pb.SetSecretsResponse)) {
    throw new Error('Expected argument of type proto.SetSecretsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SetSecretsResponse(buffer_arg) {
  return proto_driver_pb.SetSecretsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_StreamMessage(arg) {
  if (!(arg instanceof proto_driver_pb.StreamMessage)) {
    throw new Error('Expected argument of type proto.StreamMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_StreamMessage(buffer_arg) {
  return proto_driver_pb.StreamMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_StreamRequest(arg) {
  if (!(arg instanceof proto_driver_pb.StreamRequest)) {
    throw new Error('Expected argument of type proto.StreamRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_StreamRequest(buffer_arg) {
  return proto_driver_pb.StreamRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SubscriptionConnectionRequest(arg) {
  if (!(arg instanceof proto_driver_pb.SubscriptionConnectionRequest)) {
    throw new Error('Expected argument of type proto.SubscriptionConnectionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SubscriptionConnectionRequest(buffer_arg) {
  return proto_driver_pb.SubscriptionConnectionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SubscriptionConnectionResponse(arg) {
  if (!(arg instanceof proto_driver_pb.SubscriptionConnectionResponse)) {
    throw new Error('Expected argument of type proto.SubscriptionConnectionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SubscriptionConnectionResponse(buffer_arg) {
  return proto_driver_pb.SubscriptionConnectionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SubscriptionListenMessage(arg) {
  if (!(arg instanceof proto_driver_pb.SubscriptionListenMessage)) {
    throw new Error('Expected argument of type proto.SubscriptionListenMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SubscriptionListenMessage(buffer_arg) {
  return proto_driver_pb.SubscriptionListenMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SubscriptionListenRequest(arg) {
  if (!(arg instanceof proto_driver_pb.SubscriptionListenRequest)) {
    throw new Error('Expected argument of type proto.SubscriptionListenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SubscriptionListenRequest(buffer_arg) {
  return proto_driver_pb.SubscriptionListenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_UnionResolveTypeRequest(arg) {
  if (!(arg instanceof proto_driver_pb.UnionResolveTypeRequest)) {
    throw new Error('Expected argument of type proto.UnionResolveTypeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_UnionResolveTypeRequest(buffer_arg) {
  return proto_driver_pb.UnionResolveTypeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_UnionResolveTypeResponse(arg) {
  if (!(arg instanceof proto_driver_pb.UnionResolveTypeResponse)) {
    throw new Error('Expected argument of type proto.UnionResolveTypeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_UnionResolveTypeResponse(buffer_arg) {
  return proto_driver_pb.UnionResolveTypeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var DriverService = exports.DriverService = {
  fieldResolve: {
    path: '/proto.Driver/FieldResolve',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.FieldResolveRequest,
    responseType: proto_driver_pb.FieldResolveResponse,
    requestSerialize: serialize_proto_FieldResolveRequest,
    requestDeserialize: deserialize_proto_FieldResolveRequest,
    responseSerialize: serialize_proto_FieldResolveResponse,
    responseDeserialize: deserialize_proto_FieldResolveResponse,
  },
  interfaceResolveType: {
    path: '/proto.Driver/InterfaceResolveType',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.InterfaceResolveTypeRequest,
    responseType: proto_driver_pb.InterfaceResolveTypeResponse,
    requestSerialize: serialize_proto_InterfaceResolveTypeRequest,
    requestDeserialize: deserialize_proto_InterfaceResolveTypeRequest,
    responseSerialize: serialize_proto_InterfaceResolveTypeResponse,
    responseDeserialize: deserialize_proto_InterfaceResolveTypeResponse,
  },
  scalarParse: {
    path: '/proto.Driver/ScalarParse',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.ScalarParseRequest,
    responseType: proto_driver_pb.ScalarParseResponse,
    requestSerialize: serialize_proto_ScalarParseRequest,
    requestDeserialize: deserialize_proto_ScalarParseRequest,
    responseSerialize: serialize_proto_ScalarParseResponse,
    responseDeserialize: deserialize_proto_ScalarParseResponse,
  },
  scalarSerialize: {
    path: '/proto.Driver/ScalarSerialize',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.ScalarSerializeRequest,
    responseType: proto_driver_pb.ScalarSerializeResponse,
    requestSerialize: serialize_proto_ScalarSerializeRequest,
    requestDeserialize: deserialize_proto_ScalarSerializeRequest,
    responseSerialize: serialize_proto_ScalarSerializeResponse,
    responseDeserialize: deserialize_proto_ScalarSerializeResponse,
  },
  unionResolveType: {
    path: '/proto.Driver/UnionResolveType',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.UnionResolveTypeRequest,
    responseType: proto_driver_pb.UnionResolveTypeResponse,
    requestSerialize: serialize_proto_UnionResolveTypeRequest,
    requestDeserialize: deserialize_proto_UnionResolveTypeRequest,
    responseSerialize: serialize_proto_UnionResolveTypeResponse,
    responseDeserialize: deserialize_proto_UnionResolveTypeResponse,
  },
  setSecrets: {
    path: '/proto.Driver/SetSecrets',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.SetSecretsRequest,
    responseType: proto_driver_pb.SetSecretsResponse,
    requestSerialize: serialize_proto_SetSecretsRequest,
    requestDeserialize: deserialize_proto_SetSecretsRequest,
    responseSerialize: serialize_proto_SetSecretsResponse,
    responseDeserialize: deserialize_proto_SetSecretsResponse,
  },
  stream: {
    path: '/proto.Driver/Stream',
    requestStream: false,
    responseStream: true,
    requestType: proto_driver_pb.StreamRequest,
    responseType: proto_driver_pb.StreamMessage,
    requestSerialize: serialize_proto_StreamRequest,
    requestDeserialize: deserialize_proto_StreamRequest,
    responseSerialize: serialize_proto_StreamMessage,
    responseDeserialize: deserialize_proto_StreamMessage,
  },
  stdout: {
    path: '/proto.Driver/Stdout',
    requestStream: false,
    responseStream: true,
    requestType: proto_driver_pb.ByteStreamRequest,
    responseType: proto_driver_pb.ByteStream,
    requestSerialize: serialize_proto_ByteStreamRequest,
    requestDeserialize: deserialize_proto_ByteStreamRequest,
    responseSerialize: serialize_proto_ByteStream,
    responseDeserialize: deserialize_proto_ByteStream,
  },
  stderr: {
    path: '/proto.Driver/Stderr',
    requestStream: false,
    responseStream: true,
    requestType: proto_driver_pb.ByteStreamRequest,
    responseType: proto_driver_pb.ByteStream,
    requestSerialize: serialize_proto_ByteStreamRequest,
    requestDeserialize: deserialize_proto_ByteStreamRequest,
    responseSerialize: serialize_proto_ByteStream,
    responseDeserialize: deserialize_proto_ByteStream,
  },
  subscriptionConnection: {
    path: '/proto.Driver/SubscriptionConnection',
    requestStream: false,
    responseStream: false,
    requestType: proto_driver_pb.SubscriptionConnectionRequest,
    responseType: proto_driver_pb.SubscriptionConnectionResponse,
    requestSerialize: serialize_proto_SubscriptionConnectionRequest,
    requestDeserialize: deserialize_proto_SubscriptionConnectionRequest,
    responseSerialize: serialize_proto_SubscriptionConnectionResponse,
    responseDeserialize: deserialize_proto_SubscriptionConnectionResponse,
  },
  subscriptionListen: {
    path: '/proto.Driver/SubscriptionListen',
    requestStream: false,
    responseStream: true,
    requestType: proto_driver_pb.SubscriptionListenRequest,
    responseType: proto_driver_pb.SubscriptionListenMessage,
    requestSerialize: serialize_proto_SubscriptionListenRequest,
    requestDeserialize: deserialize_proto_SubscriptionListenRequest,
    responseSerialize: serialize_proto_SubscriptionListenMessage,
    responseDeserialize: deserialize_proto_SubscriptionListenMessage,
  },
};

exports.DriverClient = grpc.makeGenericClientConstructor(DriverService);
