import * as jspb from 'google-protobuf';
import {
  Directive as APIDirective,
  Directives as APIDirectives,
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
  Selections,
  UnionResolveTypeInput,
  UnionResolveTypeOutput,
  VariableDefinition as APIVariableDefinition,
  VariableDefinitions as APIVariableDefinitions,
  Selection as APISelection,
  TypeRef as APITypeRef,
  HttpRequest,
} from '../../api';
import { Value, ArrayValue, ObjectValue, FieldResolveInfo, ResponsePath, OperationDefinition, Selection, Directive, VariableDefinition, TypeRef, FieldResolveRequest, FieldResolveResponse, Error as DriverError, InterfaceResolveTypeRequest, InterfaceResolveTypeResponse, SetSecretsRequest, SetSecretsResponse, ScalarParseRequest, ScalarParseResponse, ScalarSerializeRequest, ScalarSerializeResponse, UnionResolveTypeRequest, UnionResolveTypeResponse } from "../driver_pb";
import { GrpcHealthCheck } from 'grpc-ts-health-check';

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

function isResponse(
  v:
    | {
        response?: unknown;
      }
    | unknown,
): v is Response {
  return (
    typeof v === 'object' && !!v && 'response' in v && typeof (v as { response?: unknown }).response !== 'undefined'
  );
}


const isHttpRequestProtocol = (protocol: unknown): protocol is HttpRequest => {
  if (typeof protocol !== 'object' || protocol === null) {
    return false;
  }
  if (!('headers' in protocol)) {
    return false;
  }
  const unknownHeaders = (protocol as { headers: unknown }).headers;
  if (typeof unknownHeaders !== 'object' || unknownHeaders === null) {
    return false;
  }
  const headers = unknownHeaders as { [k: string]: unknown };
  return (
    Object.keys(headers).find((k) => {
      const header = headers[k];
      if (!Array.isArray(header)) {
        return true;
      }
      return header.find((el) => typeof el !== 'string');
    }) === undefined
  );
};


function valueFromAny(data: unknown): Value {
  const val = new Value();
  if (Buffer.isBuffer(data)) {
    val.setAny(Uint8Array.from(data));
  } else if (ArrayBuffer.isView(data)) {
    val.setAny(new Uint8Array(data.buffer));
  } else if (Array.isArray(data)) {
    const arr = new ArrayValue();
    arr.setItemsList(data.map((v) => valueFromAny(v)));
    val.setA(arr);
  } else {
    switch (typeof data) {
    case 'undefined':
      val.setNil(true);
      break;
    case 'number':
      if (data % 1 === 0) {
        val.setI(data);
      } else {
        val.setF(data);
      }
      break;
    case 'string':
      val.setS(data);
      break;
    case 'boolean':
      val.setB(data);
      break;
    case 'object':
      if (data !== null) {
        const keyData = data as { [k: string]: unknown };
        const obj = new ObjectValue();
        Object.keys(data).forEach((k) => {
          obj.getPropsMap().set(k, valueFromAny(keyData[k]));
        });
        val.setO(obj);
      } else {
        val.setNil(true);
      }
      break;
    }
  }
  return val;
}

function mapVariables(infoLike: ProtoInfoLike): { [k: string]: Value } {
    if (!infoLike.hasOperation()) {
        return {};
    }
    const op = infoLike.getOperation();
    if (!op) {
        return {};
    }
    const variables = op.getVariabledefinitionsList().reduce((pv, cv) => {
        const variable = cv.getVariable();
        if (variable) {
        pv[variable.getName()] = cv.getDefaultvalue() || new Value();
        }
        return pv;
    }, {} as { [k: string]: Value });
    infoLike.getVariablevaluesMap().forEach((v, k) => {
        variables[k] = v;
    });
    return variables;
}

function getFromValue(value?: Value, variables?: { [key: string]: Value }): unknown {
  if (typeof value === 'undefined') {
    return;
  }
  if (value.hasNil()) {
    return null;
  }
  if (value.hasI()) {
    return value.getI();
  }
  if (value.hasU()) {
    return value.getU();
  }
  if (value.hasF()) {
    return value.getF();
  }
  if (value.hasS()) {
    return value.getS();
  }
  if (value.hasB()) {
    return value.getB();
  }
  if (value.hasO()) {
    const obj: { [k: string]: unknown } = {};
    const o = value.getO();
    if (o) {
      o.getPropsMap().forEach((v: Value, k: string) => {
        obj[k] = getFromValue(v);
      });
    }
    return obj;
  }
  if (value.hasA()) {
    const arr: unknown[] = [];
    const a = value.getA();
    if (a) {
      a.getItemsList().forEach((v) => {
        arr.push(getFromValue(v));
      });
    }
    return arr;
  }
  if (value.hasAny()) {
    return value.getAny_asU8();
  }
  if (value.hasVariable()) {
    if (variables) {
      return getFromValue(variables[value.getVariable()]);
    }
    return undefined;
  }
  // null is marshaled to value without anything set.
  // To reflect that behaviour, we unmarshal empty value
  // also as null.
  return null;
}

function getRecordFromValueMap(
  m: jspb.Map<string, Value>,
  variables?: { [k: string]: Value },
): Record<string, unknown> {
  const mm: Record<string, unknown> = {};
  m.forEach((v, k) => {
    mm[k] = getFromValue(v, variables);
  });
  return mm;
}

function mustGetInfo<T>(req: { getInfo: () => T | undefined }): T {
  const info = req.getInfo();
  if (typeof info === 'undefined') {
    throw new Error('info is required');
  }
  return info;
}

function buildResponsePath(rp: ResponsePath | undefined): APIResponsePath | undefined {
  if (typeof rp === 'undefined') {
    return;
  }
  return {
    key: getFromValue(rp.getKey()),
    prev: buildResponsePath(rp.getPrev()),
  };
}

function buildTypeRef(tr: TypeRef | undefined): APITypeRef | undefined {
  let hTypeRef: APITypeRef | undefined;
  if (typeof tr !== 'undefined') {
    if (tr.getName() !== '') {
      hTypeRef = {
        name: tr.getName(),
      };
    } else if (typeof tr.getNonnull() !== 'undefined') {
      hTypeRef = {
        nonNull: buildTypeRef(tr.getNonnull()),
      };
    } else if (typeof tr.getList() !== 'undefined') {
      hTypeRef = {
        list: buildTypeRef(tr.getList()),
      };
    }
  }
  return hTypeRef;
}

function buildVariableDefinition(vd: VariableDefinition): APIVariableDefinition | undefined {
  const vr = vd.getVariable();
  if (typeof vr === 'undefined') {
    return;
  }
  return {
    defaultValue: getFromValue(vd.getDefaultvalue()),
    variable: {
      name: vr.getName(),
    },
  };
}

function buildVariableDefinitions(vds: VariableDefinition[]): APIVariableDefinitions {
  const defs: APIVariableDefinitions = [];
  for (const vd of vds) {
    const def = buildVariableDefinition(vd);
    if (typeof def === 'undefined') {
      continue;
    }
    defs.push(def);
  }
  return defs;
}

function buildDirective(dir: Directive, variables: { [k: string]: Value }): APIDirective {
  return {
    arguments: getRecordFromValueMap(dir.getArgumentsMap(), variables),
    name: dir.getName(),
  };
}

function buildDirectives(dirs: Directive[], variables: { [k: string]: Value }): APIDirectives {
  const hdirs: APIDirectives = [];
  for (const dir of dirs) {
    hdirs.push(buildDirective(dir, variables));
  }
  return hdirs;
}

function buildSelection(selection: Selection, variables: { [k: string]: Value }): APISelection {
  let outSelection: APISelection;
  const name = selection.getName();
  const def = selection.getDefinition();
  if (name !== '') {
    outSelection = {
      name: selection.getName(),
    };
    if (Object.keys(selection.getArgumentsMap()).length > 0) {
      outSelection.arguments = getRecordFromValueMap(selection.getArgumentsMap(), variables);
    }
    if (selection.getDirectivesList().length > 0) {
      outSelection.directives = buildDirectives(selection.getDirectivesList(), variables);
    }
    if (selection.getSelectionsetList().length > 0) {
      outSelection.selectionSet = buildSelections(selection.getSelectionsetList(), variables);
    }
  } else if (typeof def !== 'undefined') {
    outSelection = {
      definition: {
        selectionSet: buildSelections(def.getSelectionsetList(), variables),
        typeCondition: buildTypeRef(def.getTypecondition()),
      },
    };
    if (def.getDirectivesList().length > 0) {
      outSelection.definition.directives = buildDirectives(def.getDirectivesList(), variables);
    }
    if (def.getVariabledefinitionsList().length > 0) {
      outSelection.definition.variableDefinitions = buildVariableDefinitions(def.getVariabledefinitionsList());
    }
  } else {
    throw new Error('invalid selection');
  }
  return outSelection;
}

function buildSelections(selectionSet: Selection[], variables: { [k: string]: Value }): Selections {
  const selections: Selections = [];
  for (const sel of selectionSet) {
    selections.push(buildSelection(sel, variables));
  }
  return selections;
}

function buildOperationDefinition(
  od: OperationDefinition | undefined,
  variables: { [k: string]: Value },
): APIOperationDefinition | undefined {
  if (typeof od === 'undefined') {
    return;
  }
  return {
    directives: buildDirectives(od.getDirectivesList(), variables),
    name: od.getName(),
    operation: od.getOperation(),
    selectionSet: buildSelections(od.getSelectionsetList(), variables),
    variableDefinitions: buildVariableDefinitions(od.getVariabledefinitionsList()),
  };
}

function protoInfoLikeToInfoLike(info: ProtoInfoLike, variables: { [k: string]: Value }): InfoLike {
  const newInfo: InfoLike = {
    fieldName: info.getFieldname(),
    returnType: buildTypeRef(info.getReturntype()),
  };

  if (info.hasOperation()) {
    newInfo.operation = buildOperationDefinition(info.getOperation(), variables);
  }
  if (info.hasParenttype()) {
    newInfo.parentType = buildTypeRef(info.getParenttype());
  }
  if (info.hasPath()) {
    newInfo.path = buildResponsePath(info.getPath());
  }
  const variableValues = getRecordFromValueMap(info.getVariablevaluesMap());
  if (Object.keys(variableValues).length > 0) {
    newInfo.variableValues = variableValues;
  }
  return newInfo;
}

function makeFieldResolveInput(req: FieldResolveRequest): FieldResolveInput {
  const info = mustGetInfo(req);
  const variables = mapVariables(info);
  const fieldResolveInput: FieldResolveInput = {
    info: protoInfoLikeToInfoLike(info, variables),
  };
  const args = getRecordFromValueMap(req.getArgumentsMap(), variables);
  if (Object.keys(args).length > 0) {
    fieldResolveInput.arguments = args;
  }
  if (req.hasProtocol()) {
    const protocol = getFromValue(req.getProtocol());
    if (isHttpRequestProtocol(protocol)) {
      fieldResolveInput.protocol = protocol;
    }
  }
  if (req.hasSource()) {
    fieldResolveInput.source = getFromValue(req.getSource());
  }
  return fieldResolveInput
}

function valueFromResponse(
  out?:
    | {
        [k: string]: unknown;
        response: unknown;
        error?: Error;
      }
    | (() => unknown)
    | unknown,
): Value | undefined {
  if (typeof out === 'function') {
    out = { response: out() };
  } else if (!isResponse(out) && !hasError(out)) {
    out = { response: out };
  }
  let responseData: unknown;
  if (isResponse(out) && !hasError(out)) {
    if (typeof out.response === 'function') {
      out.response = out.response();
    }
    responseData = out.response;
  }
  if (hasError(out) && !responseData) {
    return;
  }
  return valueFromAny(responseData);
}

function errorFromHandlerError(err: Error): DriverError | undefined {
  const grpcErr = new DriverError();
  grpcErr.setMsg(err.message || 'unknown error');
  return grpcErr;
}

function setResponseResponse(
  resp: {
    setResponse: (value?: Value) => void;
  },
  out?:
    | {
        response?: unknown;
        error?: Error;
      }
    | (() => unknown)
    | unknown,
): void {
  const val = valueFromResponse(out);
  if (val) {
    resp.setResponse(valueFromResponse(out));
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
    resp.setValue(valueFromResponse(out));
  }
}


function setResponseError(
  resp: {
    setError: (value?: DriverError) => void;
  },
  out?:
    | {
        error?: Error;
      }
    | unknown,
): void {
  if (hasError(out)) {
    resp.setError(errorFromHandlerError(out.error));
  }
}

function hasMessage(e: unknown): e is {message: string} {
  if (typeof e !== 'object' || !e) {
    return false
  }
  if (!('message' in e)) {
    return false
  }
  return typeof (e as {message: unknown}).message === 'string'
}

export function makeGrpcError(e: {message:string} | unknown): DriverError {
  const err = new DriverError()
  let msg = 'unknown error'
  if (hasMessage(e)) {
    msg = e.message
  }
  err.setMsg(msg);
  return err
}

export async function fieldResolve(req: FieldResolveRequest, handler: (x: FieldResolveInput) => Promise<FieldResolveOutput>): Promise<FieldResolveResponse> {
    const response = new FieldResolveResponse();
    try {
      const out = await handler(makeFieldResolveInput(req));
      setResponseResponse(response, out);
      setResponseError(response, out);
    } catch (e) {
      response.setError(makeGrpcError(e))
    }
    return response
}

function makeInterfaceResolveTypeInput(req: InterfaceResolveTypeRequest): InterfaceResolveTypeInput {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    return {
      info: protoInfoLikeToInfoLike(info, variables),
      value: getFromValue(req.getValue()),
    };
}

export async function interfaceResolveType(
  req: InterfaceResolveTypeRequest,
  handler: (x: InterfaceResolveTypeInput) => Promise<InterfaceResolveTypeOutput | undefined>,
): Promise<InterfaceResolveTypeResponse> {
  const response = new InterfaceResolveTypeResponse();
  try {
    const out = await handler(makeInterfaceResolveTypeInput(req));
    setResponseType(response, out);
    setResponseError(response, out);
  } catch (e) {
      response.setError(makeGrpcError(e))
  }
  return response
}

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
      response.setError(makeGrpcError(e))
  }
  return response
}

export async function scalarParse(
  req: ScalarParseRequest,
  handler: (x: ScalarParseInput) => Promise<ScalarParseOutput>,
): Promise<ScalarParseResponse> {
  const response = new ScalarParseResponse();
  try {
    const out = await handler({
      value: getFromValue(req.getValue()),
    });
    setResponseValue(response, out);
    setResponseError(response, out);
  } catch (e) {
    response.setError(makeGrpcError(e))
  }
  return response
}

export async function scalarSerialize(
  req: ScalarSerializeRequest,
  handler: (x: ScalarSerializeInput) => Promise<ScalarSerializeOutput>,
): Promise<ScalarSerializeResponse> {
  const response = new ScalarSerializeResponse();
  try {
    const out = await handler({
      value: getFromValue(req.getValue()),
    });
    setResponseValue(response, out);
    setResponseError(response, out);
  } catch (e) {
    response.setError(makeGrpcError(e))
  }
  return response
}

function makeUnionResolveTypeInput(req: UnionResolveTypeRequest): UnionResolveTypeInput {
    const info = mustGetInfo(req);
    const variables = mapVariables(info);
    return {
      info: protoInfoLikeToInfoLike(info, variables),
      value: getFromValue(req.getValue()),
    };
}

export async function unionResolveType(
  req: UnionResolveTypeRequest,
  handler: (x: UnionResolveTypeInput) => Promise<UnionResolveTypeOutput | undefined>,
): Promise<UnionResolveTypeResponse> {
  const response = new UnionResolveTypeResponse();
  try {
    const out = await handler(makeUnionResolveTypeInput(req));
    setResponseType(response, out);
    setResponseError(response, out);
  } catch (e) {
      response.setError(makeGrpcError(e))
  }
  return response
}