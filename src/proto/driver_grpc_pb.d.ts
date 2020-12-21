// package: proto
// file: proto/driver.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as proto_driver_pb from "../proto/driver_pb";

interface IDriverService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    fieldResolve: IDriverService_IFieldResolve;
    interfaceResolveType: IDriverService_IInterfaceResolveType;
    scalarParse: IDriverService_IScalarParse;
    scalarSerialize: IDriverService_IScalarSerialize;
    unionResolveType: IDriverService_IUnionResolveType;
    setSecrets: IDriverService_ISetSecrets;
    stream: IDriverService_IStream;
    stdout: IDriverService_IStdout;
    stderr: IDriverService_IStderr;
    subscriptionConnection: IDriverService_ISubscriptionConnection;
    subscriptionListen: IDriverService_ISubscriptionListen;
}

interface IDriverService_IFieldResolve extends grpc.MethodDefinition<proto_driver_pb.FieldResolveRequest, proto_driver_pb.FieldResolveResponse> {
    path: "/proto.Driver/FieldResolve";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.FieldResolveRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.FieldResolveRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.FieldResolveResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.FieldResolveResponse>;
}
interface IDriverService_IInterfaceResolveType extends grpc.MethodDefinition<proto_driver_pb.InterfaceResolveTypeRequest, proto_driver_pb.InterfaceResolveTypeResponse> {
    path: "/proto.Driver/InterfaceResolveType";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.InterfaceResolveTypeRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.InterfaceResolveTypeRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.InterfaceResolveTypeResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.InterfaceResolveTypeResponse>;
}
interface IDriverService_IScalarParse extends grpc.MethodDefinition<proto_driver_pb.ScalarParseRequest, proto_driver_pb.ScalarParseResponse> {
    path: "/proto.Driver/ScalarParse";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.ScalarParseRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.ScalarParseRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.ScalarParseResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.ScalarParseResponse>;
}
interface IDriverService_IScalarSerialize extends grpc.MethodDefinition<proto_driver_pb.ScalarSerializeRequest, proto_driver_pb.ScalarSerializeResponse> {
    path: "/proto.Driver/ScalarSerialize";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.ScalarSerializeRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.ScalarSerializeRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.ScalarSerializeResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.ScalarSerializeResponse>;
}
interface IDriverService_IUnionResolveType extends grpc.MethodDefinition<proto_driver_pb.UnionResolveTypeRequest, proto_driver_pb.UnionResolveTypeResponse> {
    path: "/proto.Driver/UnionResolveType";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.UnionResolveTypeRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.UnionResolveTypeRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.UnionResolveTypeResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.UnionResolveTypeResponse>;
}
interface IDriverService_ISetSecrets extends grpc.MethodDefinition<proto_driver_pb.SetSecretsRequest, proto_driver_pb.SetSecretsResponse> {
    path: "/proto.Driver/SetSecrets";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.SetSecretsRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.SetSecretsRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.SetSecretsResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.SetSecretsResponse>;
}
interface IDriverService_IStream extends grpc.MethodDefinition<proto_driver_pb.StreamRequest, proto_driver_pb.StreamMessage> {
    path: "/proto.Driver/Stream";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<proto_driver_pb.StreamRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.StreamRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.StreamMessage>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.StreamMessage>;
}
interface IDriverService_IStdout extends grpc.MethodDefinition<proto_driver_pb.ByteStreamRequest, proto_driver_pb.ByteStream> {
    path: "/proto.Driver/Stdout";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<proto_driver_pb.ByteStreamRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.ByteStreamRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.ByteStream>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.ByteStream>;
}
interface IDriverService_IStderr extends grpc.MethodDefinition<proto_driver_pb.ByteStreamRequest, proto_driver_pb.ByteStream> {
    path: "/proto.Driver/Stderr";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<proto_driver_pb.ByteStreamRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.ByteStreamRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.ByteStream>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.ByteStream>;
}
interface IDriverService_ISubscriptionConnection extends grpc.MethodDefinition<proto_driver_pb.SubscriptionConnectionRequest, proto_driver_pb.SubscriptionConnectionResponse> {
    path: "/proto.Driver/SubscriptionConnection";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_driver_pb.SubscriptionConnectionRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.SubscriptionConnectionRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.SubscriptionConnectionResponse>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.SubscriptionConnectionResponse>;
}
interface IDriverService_ISubscriptionListen extends grpc.MethodDefinition<proto_driver_pb.SubscriptionListenRequest, proto_driver_pb.SubscriptionListenMessage> {
    path: "/proto.Driver/SubscriptionListen";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<proto_driver_pb.SubscriptionListenRequest>;
    requestDeserialize: grpc.deserialize<proto_driver_pb.SubscriptionListenRequest>;
    responseSerialize: grpc.serialize<proto_driver_pb.SubscriptionListenMessage>;
    responseDeserialize: grpc.deserialize<proto_driver_pb.SubscriptionListenMessage>;
}

export const DriverService: IDriverService;

export interface IDriverServer {
    fieldResolve: grpc.handleUnaryCall<proto_driver_pb.FieldResolveRequest, proto_driver_pb.FieldResolveResponse>;
    interfaceResolveType: grpc.handleUnaryCall<proto_driver_pb.InterfaceResolveTypeRequest, proto_driver_pb.InterfaceResolveTypeResponse>;
    scalarParse: grpc.handleUnaryCall<proto_driver_pb.ScalarParseRequest, proto_driver_pb.ScalarParseResponse>;
    scalarSerialize: grpc.handleUnaryCall<proto_driver_pb.ScalarSerializeRequest, proto_driver_pb.ScalarSerializeResponse>;
    unionResolveType: grpc.handleUnaryCall<proto_driver_pb.UnionResolveTypeRequest, proto_driver_pb.UnionResolveTypeResponse>;
    setSecrets: grpc.handleUnaryCall<proto_driver_pb.SetSecretsRequest, proto_driver_pb.SetSecretsResponse>;
    stream: grpc.handleServerStreamingCall<proto_driver_pb.StreamRequest, proto_driver_pb.StreamMessage>;
    stdout: grpc.handleServerStreamingCall<proto_driver_pb.ByteStreamRequest, proto_driver_pb.ByteStream>;
    stderr: grpc.handleServerStreamingCall<proto_driver_pb.ByteStreamRequest, proto_driver_pb.ByteStream>;
    subscriptionConnection: grpc.handleUnaryCall<proto_driver_pb.SubscriptionConnectionRequest, proto_driver_pb.SubscriptionConnectionResponse>;
    subscriptionListen: grpc.handleServerStreamingCall<proto_driver_pb.SubscriptionListenRequest, proto_driver_pb.SubscriptionListenMessage>;
}

export interface IDriverClient {
    fieldResolve(request: proto_driver_pb.FieldResolveRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    fieldResolve(request: proto_driver_pb.FieldResolveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    fieldResolve(request: proto_driver_pb.FieldResolveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    scalarParse(request: proto_driver_pb.ScalarParseRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    scalarParse(request: proto_driver_pb.ScalarParseRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    scalarParse(request: proto_driver_pb.ScalarParseRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    setSecrets(request: proto_driver_pb.SetSecretsRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    setSecrets(request: proto_driver_pb.SetSecretsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    setSecrets(request: proto_driver_pb.SetSecretsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    stream(request: proto_driver_pb.StreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.StreamMessage>;
    stream(request: proto_driver_pb.StreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.StreamMessage>;
    stdout(request: proto_driver_pb.ByteStreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    stdout(request: proto_driver_pb.ByteStreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    stderr(request: proto_driver_pb.ByteStreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    stderr(request: proto_driver_pb.ByteStreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    subscriptionListen(request: proto_driver_pb.SubscriptionListenRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.SubscriptionListenMessage>;
    subscriptionListen(request: proto_driver_pb.SubscriptionListenRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.SubscriptionListenMessage>;
}

export class DriverClient extends grpc.Client implements IDriverClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public fieldResolve(request: proto_driver_pb.FieldResolveRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    public fieldResolve(request: proto_driver_pb.FieldResolveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    public fieldResolve(request: proto_driver_pb.FieldResolveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.FieldResolveResponse) => void): grpc.ClientUnaryCall;
    public interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public interfaceResolveType(request: proto_driver_pb.InterfaceResolveTypeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.InterfaceResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public scalarParse(request: proto_driver_pb.ScalarParseRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    public scalarParse(request: proto_driver_pb.ScalarParseRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    public scalarParse(request: proto_driver_pb.ScalarParseRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarParseResponse) => void): grpc.ClientUnaryCall;
    public scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    public scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    public scalarSerialize(request: proto_driver_pb.ScalarSerializeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.ScalarSerializeResponse) => void): grpc.ClientUnaryCall;
    public unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public unionResolveType(request: proto_driver_pb.UnionResolveTypeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.UnionResolveTypeResponse) => void): grpc.ClientUnaryCall;
    public setSecrets(request: proto_driver_pb.SetSecretsRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    public setSecrets(request: proto_driver_pb.SetSecretsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    public setSecrets(request: proto_driver_pb.SetSecretsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SetSecretsResponse) => void): grpc.ClientUnaryCall;
    public stream(request: proto_driver_pb.StreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.StreamMessage>;
    public stream(request: proto_driver_pb.StreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.StreamMessage>;
    public stdout(request: proto_driver_pb.ByteStreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    public stdout(request: proto_driver_pb.ByteStreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    public stderr(request: proto_driver_pb.ByteStreamRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    public stderr(request: proto_driver_pb.ByteStreamRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.ByteStream>;
    public subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    public subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    public subscriptionConnection(request: proto_driver_pb.SubscriptionConnectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_driver_pb.SubscriptionConnectionResponse) => void): grpc.ClientUnaryCall;
    public subscriptionListen(request: proto_driver_pb.SubscriptionListenRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.SubscriptionListenMessage>;
    public subscriptionListen(request: proto_driver_pb.SubscriptionListenRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<proto_driver_pb.SubscriptionListenMessage>;
}
