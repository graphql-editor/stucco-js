import * as grpc from '@grpc/grpc-js';
import {
  FieldResolveInput,
  FieldResolveOutput,
  InterfaceResolveTypeInput,
  InterfaceResolveTypeOutput,
  SetSecretsInput,
  SetSecretsOutput,
  OperationDefinition as APIOperationDefinition,
  ResponsePath as APIResponsePath,
  ScalarParseInput,
  ScalarParseOutput,
  ScalarSerializeInput,
  ScalarSerializeOutput,
  UnionResolveTypeInput,
  UnionResolveTypeOutput,
  TypeRef as APITypeRef,
  SubscriptionConnectionInput,
  SubscriptionConnectionOutput,
  SubscriptionListenInput,
  SubscriptionListenEmitter,
} from '../../api';
import { messages } from 'stucco-ts-proto-gen';
import { RecordOfUnknown, RecordOfValues, getFromValue, getRecordFromValueMap, valueFromAny } from './value';
import { getProtocol } from './protocol';
import { getSource } from './source';
import { buildTypeRef } from './type_ref';
import { buildResponsePath } from './response_path';
import { buildOperationDefinition } from './operation';
import { EventEmitter } from 'events';

interface ProtoInfoLike {
  getFieldname: typeof messages.FieldResolveInfo.prototype.getFieldname;
  hasPath: typeof messages.FieldResolveInfo.prototype.hasPath;
  getPath: typeof messages.FieldResolveInfo.prototype.getPath;
  getReturntype: typeof messages.FieldResolveInfo.prototype.getReturntype;
  hasParenttype: typeof messages.FieldResolveInfo.prototype.hasParenttype;
  getParenttype: typeof messages.FieldResolveInfo.prototype.getParenttype;
  hasOperation: typeof messages.FieldResolveInfo.prototype.hasOperation;
  getOperation: typeof messages.FieldResolveInfo.prototype.getOperation;
  getVariablevaluesMap: typeof messages.FieldResolveInfo.prototype.getVariablevaluesMap;
}

interface InfoLike {
  fieldName: string;
  path?: APIResponsePath;
  returnType?: APITypeRef;
  parentType?: APITypeRef;
  operation?: APIOperationDefinition;
  variableValues?: Record<string, unknown>;
}

interface Type {
  type: string | (() => string);
}

interface ResponseLike {
  response: unknown;
  error?: Error;
}

function isType(
  v:
    | {
        type?: unknown;
      }
    | unknown,
): v is Type {
  return (
    typeof v === 'object' &&
    !!v &&
    'type' in v &&
    (typeof (v as { type?: unknown }).type === 'string' || typeof (v as { type?: unknown }).type === 'function')
  );
}

interface HasError {
  error: Error;
}

function hasError(
  v:
    | {
        error?: Error;
      }
    | unknown,
): v is HasError {
  return typeof v === 'object' && !!v && 'error' in v;
}

interface Response {
  response: unknown;
}

const isResponse = (
  v:
    | {
        response?: unknown;
      }
    | unknown,
): v is Response =>
  typeof v === 'object' && !!v && 'response' in v && typeof (v as { response?: unknown }).response !== 'undefined';

function mapVariables(infoLike: ProtoInfoLike): RecordOfValues {
  if (!infoLike.hasOperation()) {
    return {};
  }
  const op = infoLike.getOperation();
  if (!op) {
    return {};
  }
  const values = infoLike.getVariablevaluesMap();
  return op
    .getVariabledefinitionsList()
    .filter((v) => v.getVariable())
    .reduce((pv, cv) => {
      const name = cv.getVariable()?.getName();
      if (!name) {
        return pv;
      }
      const v = values.get(name) || cv.getDefaultvalue();
      if (v) {
        pv[name] = v;
      }
      return pv;
    }, {} as RecordOfValues);
}

function mustGetInfo(req: { getInfo: () => ProtoInfoLike | undefined }): ProtoInfoLike {
  const info = req.getInfo();
  if (typeof info === 'undefined') {
    throw new Error('info is required');
  }
  return info;
}

function protoInfoLikeToInfoLike(info: ProtoInfoLike, variables: RecordOfValues): InfoLike {
  const operation = info.hasOperation() && buildOperationDefinition(info.getOperation(), variables);
  const parentType = info.hasParenttype() && buildTypeRef(info.getParenttype());
  const path = info.hasPath() && buildResponsePath(info.getPath());
  const variableValues = getRecordFromValueMap(info.getVariablevaluesMap());
  return {
    ...(operation && { operation }),
    ...(parentType && { parentType }),
    ...(path && { path }),
    ...(Object.keys(variableValues).length > 0 && { variableValues }),
    fieldName: info.getFieldname(),
    returnType: buildTypeRef(info.getReturntype()),
  };
}

function valueFromResponse(
  out?: (RecordOfUnknown & ResponseLike) | (() => unknown) | unknown,
): messages.Value | undefined {
  if (!isResponse(out) && !hasError(out)) {
    out = { response: out };
  }
  let responseData: unknown;
  if (isResponse(out)) {
    responseData = out.response;
  }
  return valueFromAny(responseData);
}

function errorFromHandlerError(err: Error): messages.Error | undefined {
  const protoErr = new messages.Error();
  protoErr.setMsg(err.message || 'unknown error');
  return protoErr;
}

const hasMessage = (e: unknown): e is { message: string } =>
  !!e && typeof e === 'object' && typeof (e as { message: unknown }).message === 'string';

export function makeProtoError(e: { message: string } | unknown): messages.Error {
  const err = new messages.Error();
  let msg = 'unknown error';
  if (hasMessage(e)) {
    msg = e.message;
  }
  err.setMsg(msg);
  return err;
}

interface HandlerResponse<RequestType, DriverInput, DriverOutput> {
  set(_2: DriverOutput): void;
  input(req: RequestType): DriverInput;
  setError: (value?: messages.Error) => void;
}

async function callHandler<
  RequestType,
  DriverInput,
  DriverOutput,
  ResponseType extends HandlerResponse<RequestType, DriverInput, DriverOutput>
>(resp: ResponseType, handler: (x: DriverInput) => Promise<DriverOutput>, request: RequestType): Promise<ResponseType> {
  try {
    const out = await handler(resp.input(request));
    resp.set(out);
    if (hasError(out)) {
      resp.setError(errorFromHandlerError(out.error));
    }
  } catch (e) {
    resp.setError(makeProtoError(e));
  }
  return resp;
}

class SettableFieldResolveResponse extends messages.FieldResolveResponse {
  set(out?: ResponseLike | (() => unknown) | unknown): void {
    const val = valueFromResponse(out);
    if (val) {
      this.setResponse(val);
    }
  }
  input(req: messages.FieldResolveRequest): FieldResolveInput {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    const protocol = getProtocol(req);
    const source = getSource(req);
    const args = getRecordFromValueMap(req.getArgumentsMap(), variables);
    const rootValue = getFromValue(req.getInfo()?.getRootvalue());
    return {
      ...(Object.keys(args).length > 0 && { arguments: args }),
      ...(protocol && { protocol }),
      ...(typeof source !== 'undefined' && { source }),
      info: {
        ...protoInfoLikeToInfoLike(info, variables),
        ...(typeof rootValue !== 'undefined' && { rootValue }),
      },
    };
  }
}

interface SettableResolveTypeResponseInputReturn {
  info: InfoLike;
  value?: unknown;
}
type SettableResolveTypeResponseSetOutArg =
  | {
      type?: string | (() => string);
      error?: Error;
    }
  | (() => string)
  | string;

interface SettableResolveTypeResponseType<T> {
  setType(t: messages.TypeRef | undefined): unknown;
  set(out?: SettableResolveTypeResponseSetOutArg): unknown;
  input(req: T): SettableResolveTypeResponseInputReturn;
}
class SettableResolveTypeResponse<
  T extends {
    getInfo: () => ProtoInfoLike | undefined;
    getValue: () => messages.Value | undefined;
  }
> {
  constructor(private typeResponse: SettableResolveTypeResponseType<T>) {}
  set(out?: SettableResolveTypeResponseSetOutArg): void {
    if (typeof out === 'function') {
      out = { type: out() };
    } else if (typeof out === 'string') {
      out = { type: out };
    }
    let type = '';
    if (isType(out)) {
      if (typeof out.type === 'function') {
        out.type = out.type();
      }
      type = out.type;
    }
    if (!type) {
      if (hasError(out)) {
        return;
      }
      throw new Error('type cannot be empty');
    }
    const t = new messages.TypeRef();
    t.setName(type);
    this.typeResponse.setType(t);
  }
  input(req: T): SettableResolveTypeResponseInputReturn {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    return {
      info: protoInfoLikeToInfoLike(info, variables),
      value: getFromValue(req.getValue()),
    };
  }
}

class SettableInterfaceResolveTypeResponse extends messages.InterfaceResolveTypeResponse {
  _impl: SettableResolveTypeResponse<messages.InterfaceResolveTypeRequest>;
  constructor() {
    super();
    this._impl = new SettableResolveTypeResponse(this);
  }
  set(out?: SettableResolveTypeResponseSetOutArg): void {
    this._impl.set(out);
  }
  input(req: messages.InterfaceResolveTypeRequest): InterfaceResolveTypeInput {
    return this._impl.input(req);
  }
}

class SettableUnionResolveTypeResponse extends messages.UnionResolveTypeResponse {
  _impl: SettableResolveTypeResponse<messages.UnionResolveTypeRequest>;
  constructor() {
    super();
    this._impl = new SettableResolveTypeResponse(this);
  }
  set(out?: SettableResolveTypeResponseSetOutArg): void {
    this._impl.set(out);
  }
  input(req: messages.UnionResolveTypeRequest): UnionResolveTypeInput {
    return this._impl.input(req);
  }
}

class SettableSecretsResponse extends messages.SetSecretsResponse {
  set(): void {
    // no op, implements messages.SetSecretsResponse
  }
  input(req: messages.SetSecretsRequest): SetSecretsInput {
    return req.getSecretsList().reduce(
      (pv, cv) => {
        pv.secrets[cv.getKey()] = cv.getValue();
        return pv;
      },
      {
        secrets: {} as Record<string, string>,
      },
    );
  }
}

interface SettableScalarResponseInputReturn {
  value: unknown;
}

type SettableScalarResponseSetOutArg =
  | {
      value?: messages.Value | (() => messages.Value);
      error?: Error;
    }
  | (() => string)
  | string;

interface SettableScalarResponseValue<T> {
  setValue(v?: messages.Value): unknown;
  set(out?: SettableScalarResponseSetOutArg): unknown;
  input(req: T): SettableScalarResponseInputReturn;
}
class SettableScalarResponse<
  T extends {
    getValue: () => messages.Value | undefined;
  }
> {
  constructor(private typeResponse: SettableScalarResponseValue<T>) {}
  set(out?: SettableScalarResponseSetOutArg): void {
    const val = valueFromResponse(out);
    if (val) {
      this.typeResponse.setValue(val);
    }
  }
  input(req: T): SettableScalarResponseInputReturn {
    return {
      value: getFromValue(req.getValue()),
    };
  }
}

class SettableScalarParseResponse extends messages.ScalarParseResponse {
  _impl: SettableScalarResponse<messages.ScalarParseRequest>;
  constructor() {
    super();
    this._impl = new SettableScalarResponse(this);
  }
  set(out?: SettableScalarResponseSetOutArg): void {
    return this._impl.set(out);
  }
  input(req: messages.ScalarParseRequest): ScalarParseInput {
    return this._impl.input(req);
  }
}

class SettableScalarSerializeResponse extends messages.ScalarSerializeResponse {
  _impl: SettableScalarResponse<messages.ScalarSerializeRequest>;
  constructor() {
    super();
    this._impl = new SettableScalarResponse(this);
  }
  set(out?: SettableScalarResponseSetOutArg): void {
    return this._impl.set(out);
  }
  input(req: messages.ScalarSerializeRequest): ScalarSerializeInput {
    return this._impl.input(req);
  }
}

class SettableSubcriptionConnectionResponse extends messages.SubscriptionConnectionResponse {
  set(out?: ResponseLike | (() => unknown) | unknown): void {
    const val = valueFromResponse(out);
    if (val) {
      this.setResponse(val);
    }
  }
  input(req: messages.SubscriptionConnectionRequest): SubscriptionConnectionInput {
    const variableValues = getRecordFromValueMap(req.getVariablevaluesMap());
    const protocol = getProtocol(req);
    const query = req.getQuery();
    const operationName = req.getOperationname();
    return {
      query,
      variableValues,
      operationName,
      protocol,
    };
  }
}

export const fieldResolve = (
  req: messages.FieldResolveRequest,
  handler: (x: FieldResolveInput) => Promise<FieldResolveOutput>,
): Promise<messages.FieldResolveResponse> => callHandler(new SettableFieldResolveResponse(), handler, req);

export const interfaceResolveType = (
  req: messages.InterfaceResolveTypeRequest,
  handler: (x: InterfaceResolveTypeInput) => Promise<InterfaceResolveTypeOutput | undefined>,
): Promise<messages.InterfaceResolveTypeResponse> =>
  callHandler(new SettableInterfaceResolveTypeResponse(), handler, req);

export const setSecrets = (
  req: messages.SetSecretsRequest,
  handler: (x: SetSecretsInput) => Promise<SetSecretsOutput>,
): Promise<messages.SetSecretsResponse> => callHandler(new SettableSecretsResponse(), handler, req);

export const scalarParse = (
  req: messages.ScalarParseRequest,
  handler: (x: ScalarParseInput) => Promise<ScalarParseOutput>,
): Promise<messages.ScalarParseResponse> => callHandler(new SettableScalarParseResponse(), handler, req);

export const scalarSerialize = (
  req: messages.ScalarSerializeRequest,
  handler: (x: ScalarSerializeInput) => Promise<ScalarSerializeOutput>,
): Promise<messages.ScalarSerializeResponse> => callHandler(new SettableScalarSerializeResponse(), handler, req);

export const unionResolveType = (
  req: messages.UnionResolveTypeRequest,
  handler: (x: UnionResolveTypeInput) => Promise<UnionResolveTypeOutput | undefined>,
): Promise<messages.UnionResolveTypeResponse> => callHandler(new SettableUnionResolveTypeResponse(), handler, req);

export const subscriptionConnection = (
  req: messages.SubscriptionConnectionRequest,
  handler: (x: SubscriptionConnectionInput) => Promise<SubscriptionConnectionOutput>,
): Promise<messages.SubscriptionConnectionResponse> =>
  callHandler(new SettableSubcriptionConnectionResponse(), handler, req);

class Emitter {
  private eventEmitter: EventEmitter;
  constructor(
    private srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest, messages.SubscriptionListenMessage>,
  ) {
    this.eventEmitter = new EventEmitter();
    srv.on('close', () => {
      this.eventEmitter.emit('close');
    });
    srv.on('error', (err: Error) => {
      this.eventEmitter.emit('close', err);
    });
  }
  async emit(v?: unknown): Promise<void> {
    const msg = new messages.SubscriptionListenMessage();
    msg.setNext(true);
    if (typeof v !== 'undefined') {
      msg.setPayload(valueFromAny(v));
    }
    await new Promise<void>((resolve, reject) =>
      this.srv.write(msg, (e: unknown) => {
        if (e) {
          reject(e);
        }
        resolve();
      }),
    );
  }

  on(ev: 'close', handler: (err?: Error) => void): void {
    this.eventEmitter.on(ev, handler);
  }
  off(ev: 'close', handler: (err?: Error) => void): void {
    this.eventEmitter.off(ev, handler);
  }
}

export const subscritpionListen = (
  srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest, messages.SubscriptionListenMessage>,
  handler: (x: SubscriptionListenInput, emit: SubscriptionListenEmitter) => Promise<void>,
): Promise<void> =>
  handler(
    {
      query: srv.request.getQuery(),
      variableValues: getRecordFromValueMap(srv.request.getVariablevaluesMap()),
      operationName: srv.request.getOperationname(),
      protocol: getProtocol(srv.request),
      ...(srv.request.hasOperation() && { operation: buildOperationDefinition(srv.request.getOperation(), {}) }),
    },
    new Emitter(srv),
  );
