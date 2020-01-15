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
  VariableDefinition as APIVariableDefinition,
  VariableDefinitions as APIVariableDefinitions,
  TypeRef as APITypeRef,
} from '../../api';
import { Value, FieldResolveInfo, ResponsePath, OperationDefinition, VariableDefinition, TypeRef, FieldResolveRequest, FieldResolveResponse, Error as DriverError, InterfaceResolveTypeRequest, InterfaceResolveTypeResponse, SetSecretsRequest, SetSecretsResponse, ScalarParseRequest, ScalarParseResponse, ScalarSerializeRequest, ScalarSerializeResponse, UnionResolveTypeRequest, UnionResolveTypeResponse } from "../driver_pb";
import { RecordOfUnknown, RecordOfValues, getFromValue, getRecordFromValueMap, valueFromAny } from './value';
import { getProtocol } from './protocol';
import { getSource } from './source';
import { buildTypeRef } from './type_ref';
import { buildResponsePath } from './response_path';
import { buildOperationDefinition } from './operation';

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
      .filter(v => v.getVariable())
      .reduce((pv, cv) => {
          const variable = cv.getVariable();
          const name = variable.getName();
          pv[name] = values.get(name) || cv.getDefaultvalue();
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
    ...(operation && {operation}),
    ...(parentType && {parentType}),
    ...(path && {path}),
    ...(Object.keys(variableValues).length > 0 && {variableValues}),
    fieldName: info.getFieldname(),
    returnType: buildTypeRef(info.getReturntype()),
  };
}

function makeFieldResolveInput(req: FieldResolveRequest): FieldResolveInput {
  const info = mustGetInfo(req);
  const variables = mapVariables(info);
  const protocol = getProtocol(req);
  const source = getSource(req);
  const args = getRecordFromValueMap(req.getArgumentsMap(), variables);
  return {
    ...(Object.keys(args).length > 0 && {arguments: args}),
    ...(protocol && {protocol}),
    ...(typeof source !== 'undefined' && {source}),
    info: protoInfoLikeToInfoLike(info, variables),
  };
}

function valueFromResponse(
  out?:
    | (RecordOfUnknown & ResponseLike)
    | (() => unknown)
    | unknown,
): Value | undefined {
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

function setResponseResponse(
  resp: {
    setResponse: (value?: Value) => void;
  },
  out?:
    | ResponseLike 
    | (() => unknown)
    | unknown,
): void {
  const val = valueFromResponse(out);
  if (val) {
    resp.setResponse(val);
  }
}

function setResponseType(
  resp: {
    setType: (value?: TypeRef) => void;
  },
  out?:
    | {
        type?: string | (() => string);
        error?: Error;
      }
    | string
    | (() => string),
): void {
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
  resp.setType(t);
}

function setResponseValue(
  resp: {
    setValue: (value?: Value) => void;
  },
  out?:
    | {
        response?: unknown | (() => unknown);
        error?: Error;
      }
    | (() => unknown)
    | unknown,
): void {
  const val = valueFromResponse(out);
  if (val) {
    resp.setValue(val);
  }
}


const setResponseError = (
  resp: {
    setError: (value?: DriverError) => void;
  },
  out?:
    | {
        error?: Error;
      }
    | unknown,
): void => hasError(out) && resp.setError(errorFromHandlerError(out.error));

const hasMessage = (e: unknown): e is {message: string} =>
  !!e && typeof e === 'object' && typeof (e as {message: unknown}).message === 'string'

export function makeProtoError(e: {message:string} | unknown): DriverError {
  const err = new DriverError()
  let msg = 'unknown error'
  if (hasMessage(e)) {
    msg = e.message
  }
  err.setMsg(msg);
  return err
}

async function callHandler<ResponseType extends {
    setError: (value?: DriverError) => void;
  },
  ResponseDataType,
  RequestType,
  DriverInput,
  DriverOutput,
>(responseCtor: {
  new(): ResponseType,
  setResponseData(ResponseType, ResponseDataType),
},
  makeInputFunc: (req: RequestType) => DriverInput,
  handler: (x: DriverInput) => Promise<DriverOutput>,
  request: RequestType,
): Promise<ResponseType> {
  const response = new responseCtor();
  try {
    const out = await handler(makeInputFunc(request));
    responseCtor.setResponseData(response, out);
    setResponseError(response, out);
  } catch(e) {
    response.setError(makeProtoError(e));
  }
  return response;
}

class SettableFieldResolveResponse extends FieldResolveResponse {
  static setResponseData = setResponseResponse;
}

class SettableInterfaceResolveTypeResponse extends InterfaceResolveTypeResponse {
  static setResponseData = setResponseType
}

class SettableScalarParseResponse extends ScalarParseResponse {
  static setResponseData = setResponseValue;
}

class SettableScalarSerializeResponse extends ScalarSerializeResponse {
  static setResponseData = setResponseValue
}

class SettableUnionResolveTypeResponse extends UnionResolveTypeResponse {
  static setResponseData = setResponseType
}

export const fieldResolve = (req: FieldResolveRequest, handler: (x: FieldResolveInput) => Promise<FieldResolveOutput>): Promise<FieldResolveResponse> =>
  callHandler(
    SettableFieldResolveResponse,
    makeFieldResolveInput,
    handler,
    req,
  )

function makeInterfaceResolveTypeInput(req: InterfaceResolveTypeRequest): InterfaceResolveTypeInput {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    return {
      info: protoInfoLikeToInfoLike(info, variables),
      value: getFromValue(req.getValue()),
    };
}

export const interfaceResolveType = (
  req: InterfaceResolveTypeRequest,
  handler: (x: InterfaceResolveTypeInput) => Promise<InterfaceResolveTypeOutput | undefined>,
): Promise<InterfaceResolveTypeResponse> =>
  callHandler(
    SettableInterfaceResolveTypeResponse,
    makeInterfaceResolveTypeInput,
    handler,
    req,
  )

export async function setSecrets(
  req: SetSecretsRequest,
  handler: (x: SetSecretsInput) => Promise<SetSecretsOutput>,
): Promise<SetSecretsResponse> {
  const response = new SetSecretsResponse();
  try {
    const secretsInput: SetSecretsInput = {
      secrets: {},
    }
    req.getSecretsList().forEach(secret => {
      secretsInput.secrets[secret.getKey()] = secret.getValue();
    })
    const out = await handler(secretsInput);
    setResponseError(response, out);
  } catch (e) {
      response.setError(makeProtoError(e))
  }
  return response
}

const makeScalarParseInput = (req: ScalarParseRequest): ScalarParseInput => ({
  value: getFromValue(req.getValue()),
})

export const scalarParse = (
  req: ScalarParseRequest,
  handler: (x: ScalarParseInput) => Promise<ScalarParseOutput>,
): Promise<ScalarParseResponse> =>
  callHandler(
    SettableScalarParseResponse,
    makeScalarParseInput,
    handler,
    req,
  )

const makeScalarSerializeInput = (req: ScalarSerializeRequest): ScalarSerializeInput => ({
  value: getFromValue(req.getValue()),
})

export const scalarSerialize = (
  req: ScalarSerializeRequest,
  handler: (x: ScalarSerializeInput) => Promise<ScalarSerializeOutput>,
): Promise<ScalarSerializeResponse> =>
  callHandler(
    SettableScalarSerializeResponse,
    makeScalarSerializeInput,
    handler,
    req,
  )

function makeUnionResolveTypeInput(req: UnionResolveTypeRequest): UnionResolveTypeInput {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    return {
      info: protoInfoLikeToInfoLike(info, variables),
      value: getFromValue(req.getValue()),
    };
}

export const unionResolveType = (
  req: UnionResolveTypeRequest,
  handler: (x: UnionResolveTypeInput) => Promise<UnionResolveTypeOutput | undefined>,
): Promise<UnionResolveTypeResponse> => 
  callHandler(
    SettableUnionResolveTypeResponse,
    makeUnionResolveTypeInput,
    handler,
    req,
  )
