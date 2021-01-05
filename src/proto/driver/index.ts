import * as grpc from 'grpc';
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
import {
  Value,
  FieldResolveInfo,
  TypeRef,
  FieldResolveRequest,
  FieldResolveResponse,
  Error as DriverError,
  InterfaceResolveTypeRequest,
  InterfaceResolveTypeResponse,
  SetSecretsRequest,
  SetSecretsResponse,
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
  UnionResolveTypeRequest,
  UnionResolveTypeResponse,
  SubscriptionConnectionRequest,
  SubscriptionConnectionResponse,
  SubscriptionListenRequest,
  SubscriptionListenMessage,
} from '../driver_pb';
import { RecordOfUnknown, RecordOfValues, getFromValue, getRecordFromValueMap, valueFromAny } from './value';
import { getProtocol } from './protocol';
import { getSource } from './source';
import { buildTypeRef } from './type_ref';
import { buildResponsePath } from './response_path';
import { buildOperationDefinition } from './operation';
import { EventEmitter } from 'events';

interface ProtoInfoLike {
  getFieldname: typeof FieldResolveInfo.prototype.getFieldname;
  hasPath: typeof FieldResolveInfo.prototype.hasPath;
  getPath: typeof FieldResolveInfo.prototype.getPath;
  getReturntype: typeof FieldResolveInfo.prototype.getReturntype;
  hasParenttype: typeof FieldResolveInfo.prototype.hasParenttype;
  getParenttype: typeof FieldResolveInfo.prototype.getParenttype;
  hasOperation: typeof FieldResolveInfo.prototype.hasOperation;
  getOperation: typeof FieldResolveInfo.prototype.getOperation;
  getVariablevaluesMap: typeof FieldResolveInfo.prototype.getVariablevaluesMap;
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
  const parentType = info.hasParenttype && buildTypeRef(info.getParenttype());
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

function valueFromResponse(out?: (RecordOfUnknown & ResponseLike) | (() => unknown) | unknown): Value | undefined {
  if (!isResponse(out) && !hasError(out)) {
    out = { response: out };
  }
  let responseData: unknown;
  if (isResponse(out)) {
    responseData = out.response;
  }
  return valueFromAny(responseData);
}

function errorFromHandlerError(err: Error): DriverError | undefined {
  const protoErr = new DriverError();
  protoErr.setMsg(err.message || 'unknown error');
  return protoErr;
}

const hasMessage = (e: unknown): e is { message: string } =>
  !!e && typeof e === 'object' && typeof (e as { message: unknown }).message === 'string';

export function makeProtoError(e: { message: string } | unknown): DriverError {
  const err = new DriverError();
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
  setError: (value?: DriverError) => void;
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

class SettableFieldResolveResponse extends FieldResolveResponse {
  set(out?: ResponseLike | (() => unknown) | unknown): void {
    const val = valueFromResponse(out);
    if (val) {
      this.setResponse(val);
    }
  }
  input(req: FieldResolveRequest): FieldResolveInput {
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
  setType(t: TypeRef | undefined): unknown;
  set(out?: SettableResolveTypeResponseSetOutArg): unknown;
  input(req: T): SettableResolveTypeResponseInputReturn;
}
class SettableResolveTypeResponse<
  T extends {
    getInfo: () => ProtoInfoLike | undefined;
    getValue: () => Value | undefined;
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
    const t = new TypeRef();
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

class SettableInterfaceResolveTypeResponse extends InterfaceResolveTypeResponse {
  _impl: SettableResolveTypeResponse<InterfaceResolveTypeRequest>;
  constructor() {
    super();
    this._impl = new SettableResolveTypeResponse(this);
  }
  set(out?: SettableResolveTypeResponseSetOutArg): void {
    this._impl.set(out);
  }
  input(req: InterfaceResolveTypeRequest): InterfaceResolveTypeInput {
    return this._impl.input(req);
  }
}

class SettableUnionResolveTypeResponse extends UnionResolveTypeResponse {
  _impl: SettableResolveTypeResponse<UnionResolveTypeRequest>;
  constructor() {
    super();
    this._impl = new SettableResolveTypeResponse(this);
  }
  set(out?: SettableResolveTypeResponseSetOutArg): void {
    this._impl.set(out);
  }
  input(req: UnionResolveTypeRequest): UnionResolveTypeInput {
    return this._impl.input(req);
  }
}

class SettableSecretsResponse extends SetSecretsResponse {
  set(): void {
    // no op, implements SetSecretsResponse
  }
  input(req: SetSecretsRequest): SetSecretsInput {
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
      value?: Value | (() => Value);
      error?: Error;
    }
  | (() => string)
  | string;

interface SettableScalarResponseValue<T> {
  setValue(v?: Value): unknown;
  set(out?: SettableScalarResponseSetOutArg): unknown;
  input(req: T): SettableScalarResponseInputReturn;
}
class SettableScalarResponse<
  T extends {
    getValue: () => Value | undefined;
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

class SettableScalarParseResponse extends ScalarParseResponse {
  _impl: SettableScalarResponse<ScalarParseRequest>;
  constructor() {
    super();
    this._impl = new SettableScalarResponse(this);
  }
  set(out?: SettableScalarResponseSetOutArg): void {
    return this._impl.set(out);
  }
  input(req: ScalarParseRequest): ScalarParseInput {
    return this._impl.input(req);
  }
}

class SettableScalarSerializeResponse extends ScalarSerializeResponse {
  _impl: SettableScalarResponse<ScalarSerializeRequest>;
  constructor() {
    super();
    this._impl = new SettableScalarResponse(this);
  }
  set(out?: SettableScalarResponseSetOutArg): void {
    return this._impl.set(out);
  }
  input(req: ScalarSerializeRequest): ScalarSerializeInput {
    return this._impl.input(req);
  }
}

class SettableSubcriptionConnectionResponse extends SubscriptionConnectionResponse {
  set(out?: ResponseLike | (() => unknown) | unknown): void {
    const val = valueFromResponse(out);
    if (val) {
      this.setResponse(val);
    }
  }
  input(req: SubscriptionConnectionRequest): SubscriptionConnectionInput {
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
  req: FieldResolveRequest,
  handler: (x: FieldResolveInput) => Promise<FieldResolveOutput>,
): Promise<FieldResolveResponse> => callHandler(new SettableFieldResolveResponse(), handler, req);

export const interfaceResolveType = (
  req: InterfaceResolveTypeRequest,
  handler: (x: InterfaceResolveTypeInput) => Promise<InterfaceResolveTypeOutput | undefined>,
): Promise<InterfaceResolveTypeResponse> => callHandler(new SettableInterfaceResolveTypeResponse(), handler, req);

export const setSecrets = (
  req: SetSecretsRequest,
  handler: (x: SetSecretsInput) => Promise<SetSecretsOutput>,
): Promise<SetSecretsResponse> => callHandler(new SettableSecretsResponse(), handler, req);

export const scalarParse = (
  req: ScalarParseRequest,
  handler: (x: ScalarParseInput) => Promise<ScalarParseOutput>,
): Promise<ScalarParseResponse> => callHandler(new SettableScalarParseResponse(), handler, req);

export const scalarSerialize = (
  req: ScalarSerializeRequest,
  handler: (x: ScalarSerializeInput) => Promise<ScalarSerializeOutput>,
): Promise<ScalarSerializeResponse> => callHandler(new SettableScalarSerializeResponse(), handler, req);

export const unionResolveType = (
  req: UnionResolveTypeRequest,
  handler: (x: UnionResolveTypeInput) => Promise<UnionResolveTypeOutput | undefined>,
): Promise<UnionResolveTypeResponse> => callHandler(new SettableUnionResolveTypeResponse(), handler, req);

export const subscriptionConnection = (
  req: SubscriptionConnectionRequest,
  handler: (x: SubscriptionConnectionInput) => Promise<SubscriptionConnectionOutput>,
): Promise<SubscriptionConnectionResponse> => callHandler(new SettableSubcriptionConnectionResponse(), handler, req);

class Emitter {
  private eventEmitter: EventEmitter;
  constructor(private srv: grpc.ServerWritableStream<SubscriptionListenRequest>) {
    this.eventEmitter = new EventEmitter();
    srv.on('close', () => {
      this.eventEmitter.emit('close');
    });
    srv.on('error', (err: Error) => {
      this.eventEmitter.emit('close', err);
    });
  }
  async emit(v?: unknown): Promise<void> {
    const msg = new SubscriptionListenMessage();
    msg.setNext(true);
    if (typeof v !== 'undefined') {
      msg.setPayload(valueFromAny(v));
    }
    await new Promise<void>((resolve, reject) =>
      this.srv.write(msg, (e) => {
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
  srv: grpc.ServerWritableStream<SubscriptionListenRequest>,
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
