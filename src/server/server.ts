import { readFileSync } from 'fs';
import * as jspb from 'google-protobuf';
import * as grpc from 'grpc';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import { extname } from 'path';
import {
  Directive as APIDirective,
  Directives as APIDirectives,
  FieldResolveInput,
  FieldResolveOutput,
  InterfaceResolveTypeInput,
  InterfaceResolveTypeOutput,
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
} from '../api';
import { DriverService } from '../proto/driver_grpc_pb';
import {
  ArrayValue,
  ByteStream,
  Directive,
  Error as DriverError,
  FieldResolveInfo,
  FieldResolveRequest,
  FieldResolveResponse,
  Function as DriverFunction,
  InterfaceResolveTypeRequest,
  InterfaceResolveTypeResponse,
  ObjectValue,
  OperationDefinition,
  ResponsePath,
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
  Selection,
  TypeRef,
  UnionResolveTypeRequest,
  UnionResolveTypeResponse,
  Value,
  VariableDefinition,
} from '../proto/driver_pb';
import { DevNull } from './devnull';
import { Writable } from 'stream';

interface WithFunction {
  hasFunction(): boolean;
  getFunction(): DriverFunction | undefined;
}

interface WriteOverload {
  (buffer: string | Buffer | Uint8Array, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
  (str: string, encoding?: string | undefined, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
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

function hijackWrite(w: WriteOverload, to: WriteOverload): WriteOverload {
  const hijack: WriteOverload = (
    first: string | Buffer | Uint8Array,
    second: ((err?: Error | null | undefined) => void) | string | undefined,
    cb?: ((err?: Error | null | undefined) => void) | undefined,
  ): boolean => {
    if (typeof first === 'string' && (typeof second === 'string' || typeof second === 'undefined')) {
      to(first, second, cb);
      return w(first, second, cb);
    } else if (
      (typeof first === 'string' || Buffer.isBuffer(first) || ArrayBuffer.isView(first)) &&
      typeof second === 'function'
    ) {
      to(first, second);
      return w(first, second);
    }
    return false;
  };
  return hijack;
}

interface ServerOptions {
  bindAddress?: string;
  pluginMode?: boolean;
  rootCerts?: string;
  privateKey?: string;
  certChain?: string;
  checkClientCertificate?: boolean;
  grpcServerOpts?: object;
  server?: GRPCServer;
}

interface GRPCServer {
  start: typeof grpc.Server.prototype.start;
  addService: typeof grpc.Server.prototype.addService;
  tryShutdown: typeof grpc.Server.prototype.tryShutdown;
  bind: typeof grpc.Server.prototype.bind;
}

interface GRPCInfoLike {
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

export class Server {
  private server: GRPCServer;
  private stdoutStreams: Writable[];
  private stderrStreams: Writable[];
  constructor(private serverOpts: ServerOptions = {}) {
    const healthCheckStatusMap = {
      plugin: HealthCheckResponse.ServingStatus.SERVING,
    };
    this.server = serverOpts.server || new grpc.Server(this.serverOpts.grpcServerOpts);
    const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
    this.server.addService(HealthService, grpcHealthCheck);
    this.server.addService(DriverService, {
      fieldResolve: this.wrap(this, this.fieldResolve),
      interfaceResolveType: this.wrap(this, this.interfaceResolveType),
      scalarParse: this.wrap(this, this.scalarParse),
      scalarSerialize: this.wrap(this, this.scalarSerialize),
      stderr: this.wrap(this, this.stderr),
      stdout: this.wrap(this, this.stdout),
      stream: undefined,
      unionResolveType: this.wrap(this, this.unionResolveType),
    });
    this.stdoutStreams = [];
    this.stderrStreams = [];
  }

  public doError<
    T extends {
      setError: (value?: DriverError) => void;
    }
  >(
    e: {
      message?: string;
    },
    ctor: new () => T,
    cb: (e: grpc.ServiceError | null, resp: T) => void,
  ): void {
    console.error(e);
    const response = new ctor();
    const grpcErr = new DriverError();
    grpcErr.setMsg(e && e.message ? e.message : 'unknown error');
    response.setError(grpcErr);
    cb(null, response);
  }

  public valueFromResponse(
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
    return this.valueFromAny(responseData);
  }

  public setResponseResponse(
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
    const val = this.valueFromResponse(out);
    if (val) {
      resp.setResponse(this.valueFromResponse(out));
    }
  }

  public setResponseType(
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

  public setResponseValue(
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
    const val = this.valueFromResponse(out);
    if (val) {
      resp.setValue(this.valueFromResponse(out));
    }
  }

  public setResponseError(
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
      resp.setError(this.errorFromHandlerError(out.error));
    }
  }

  public async fieldResolve(
    call: grpc.ServerUnaryCall<FieldResolveRequest>,
    callback: grpc.sendUnaryData<FieldResolveResponse>,
  ): Promise<void> {
    try {
      const response = new FieldResolveResponse();
      const fieldResolve = await this.getHandler<FieldResolveInput, FieldResolveOutput>(call.request);
      const info = this.mustGetInfo(call.request);
      const variables = this.mapVariables(info);
      const fieldResolveInput: FieldResolveInput = {
        info: this.grpcInfoLikeToServerInfoLike(info, variables),
      };
      const args = this.getRecordFromValueMap(call.request.getArgumentsMap(), variables);
      if (Object.keys(args).length > 0) {
        fieldResolveInput.arguments = args;
      }
      if (call.request.hasProtocol()) {
        const protocol = this.getFromValue(call.request.getProtocol());
        if (isHttpRequestProtocol(protocol)) {
          fieldResolveInput.protocol = protocol;
        }
      }
      if (call.request.hasSource()) {
        fieldResolveInput.source = this.getFromValue(call.request.getSource());
      }
      const out = await fieldResolve(fieldResolveInput);
      this.setResponseResponse(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, FieldResolveResponse, callback);
    }
  }

  public async interfaceResolveType(
    call: grpc.ServerUnaryCall<InterfaceResolveTypeRequest>,
    callback: grpc.sendUnaryData<InterfaceResolveTypeResponse>,
  ): Promise<void> {
    try {
      const response = new InterfaceResolveTypeResponse();
      const interfaceResolveType = await this.getHandler<InterfaceResolveTypeInput, InterfaceResolveTypeOutput>(
        call.request,
      );
      const info = this.mustGetInfo(call.request);
      const variables = this.mapVariables(info);
      const out = await interfaceResolveType({
        info: this.grpcInfoLikeToServerInfoLike(info, variables),
        value: this.getFromValue(call.request.getValue()),
      });
      this.setResponseType(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, InterfaceResolveTypeResponse, callback);
    }
  }

  public async scalarParse(
    call: grpc.ServerUnaryCall<ScalarParseRequest>,
    callback: grpc.sendUnaryData<ScalarParseResponse>,
  ): Promise<void> {
    try {
      const response = new ScalarParseResponse();
      const scalarParseHandler = await this.getHandler<ScalarParseInput, ScalarParseOutput>(call.request);
      const data = this.getFromValue(call.request.getValue());
      const out = await scalarParseHandler({
        value: data,
      });
      this.setResponseValue(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, ScalarParseResponse, callback);
    }
  }

  public async scalarSerialize(
    call: grpc.ServerUnaryCall<ScalarSerializeRequest>,
    callback: grpc.sendUnaryData<ScalarSerializeResponse>,
  ): Promise<void> {
    try {
      const response = new ScalarSerializeResponse();
      const scalarSerializeHandler = await this.getHandler<ScalarSerializeInput, ScalarSerializeOutput>(call.request);
      const data = this.getFromValue(call.request.getValue());
      const out = await scalarSerializeHandler({
        value: data,
      });
      this.setResponseValue(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, ScalarSerializeResponse, callback);
    }
  }

  public async unionResolveType(
    call: grpc.ServerUnaryCall<UnionResolveTypeRequest>,
    callback: grpc.sendUnaryData<UnionResolveTypeResponse>,
  ): Promise<void> {
    try {
      const response = new UnionResolveTypeResponse();
      const unionResolveType = await this.getHandler<UnionResolveTypeInput, UnionResolveTypeOutput>(call.request);
      const info = this.mustGetInfo(call.request);
      const variables = this.mapVariables(info);
      const out = await unionResolveType({
        info: this.grpcInfoLikeToServerInfoLike(info, variables),
        value: this.getFromValue(call.request.getValue()),
      });
      this.setResponseType(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, UnionResolveTypeResponse, callback);
    }
  }

  public setupIO(): [typeof process.stdout.write, typeof process.stderr.write] {
    const oldIO = this._hijackIO();
    this._hijackConsole();
    return oldIO;
  }

  public start(): void {
    // go-plugin does not read stdout
    // hijack io and send it through buffer
    const [stdoutWrite, stderrWrite] = this.setupIO();
    try {
      this.server.start();
    } catch (e) {
      if ('message' in e && typeof e.message === 'string') {
        stderrWrite.call(process.stderr, e.message);
      }
    } finally {
      this.closeStreams([stdoutWrite, stderrWrite]);
    }
  }

  public credentials(pluginMode: boolean): grpc.ServerCredentials {
    const { rootCerts, privateKey, certChain, checkClientCertificate } = this.serverOpts;
    if (pluginMode || (!rootCerts && !privateKey && !certChain)) {
      return grpc.ServerCredentials.createInsecure();
    }
    if (!rootCerts || !privateKey || !certChain) {
      // refuse to setup server with partial TLS setup
      throw new Error('TLS certificate chain defined partially');
    }
    const rootCert = readFileSync(rootCerts);
    /* eslint-disable @typescript-eslint/camelcase */
    const certs: grpc.KeyCertPair = {
      cert_chain: readFileSync(certChain),
      private_key: readFileSync(privateKey),
    };
    /* eslint-enable @typescript-eslint/camelcase */
    return grpc.ServerCredentials.createSsl(rootCert, [certs], checkClientCertificate);
  }

  public serve(): void {
    const { bindAddress = '0.0.0.0:1234', pluginMode = true } = this.serverOpts;
    const creds: grpc.ServerCredentials = this.credentials(pluginMode);
    this.server.bind(bindAddress, creds);
    if (pluginMode) {
      console.log('1|1|tcp|127.0.0.1:1234|grpc');
    }
    this.start();
  }

  public stop(): Promise<void> {
    return new Promise((resolve) =>
      this.server.tryShutdown(() => {
        resolve();
      }),
    );
  }

  private wrap<T, U>(srv: Server, fn: (call: T, callback: U) => void): (call: T, callback: U) => void {
    return fn.bind(srv);
  }

  private handlerFunc<T, U>(name: string, mod: { [k: string]: unknown }): (x: T) => Promise<U> | U {
    if (!name) {
      if ('handler' in mod && typeof mod.handler === 'function') {
        return mod.handler as (x: T) => Promise<U> | U;
      }
      if ('default' in mod && typeof mod.default === 'function') {
        return mod.default as (x: T) => Promise<U> | U;
      }
    } else if (name in mod) {
      return mod[name] as (x: T) => Promise<U> | U;
    }
    throw new TypeError('invalid handler module');
  }

  private async getHandler<T, U>(req: WithFunction): Promise<(x: T) => Promise<U | undefined>> {
    if (!req.hasFunction()) {
      throw new Error('missing function');
    }
    const fn = req.getFunction();
    if (typeof fn === 'undefined' || !fn.getName()) {
      throw new Error(`function name is empty`);
    }
    const fnName = fn.getName();
    const ext = extname(fnName) !== '.js' ? extname(fnName) : '';
    const mod = await import(`${process.cwd()}/${fnName.slice(0, fnName.length - ext.length)}`);
    const handler = this.handlerFunc<T, U>(ext.slice(1), mod);
    return (x: T): Promise<U> => Promise.resolve(handler(x));
  }

  private getFromValue(value?: Value, variables?: { [key: string]: Value }): unknown {
    if (typeof value === 'undefined') {
      return;
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
          obj[k] = this.getFromValue(v);
        });
      }
      return obj;
    }
    if (value.hasA()) {
      const arr: unknown[] = [];
      const a = value.getA();
      if (a) {
        a.getItemsList().forEach((v) => {
          arr.push(this.getFromValue(v));
        });
      }
      return arr;
    }
    if (value.hasAny()) {
      return value.getAny_asU8();
    }
    if (value.hasVariable()) {
      if (variables) {
        return this.getFromValue(variables[value.getVariable()]);
      }
      return undefined;
    }
    // null is marshaled to value without anything set.
    // To reflect that behaviour, we unmarshal empty value
    // also as null.
    return null;
  }

  private getRecordFromValueMap(
    m: jspb.Map<string, Value>,
    variables?: { [k: string]: Value },
  ): Record<string, unknown> {
    const mm: Record<string, unknown> = {};
    m.forEach((v, k) => {
      mm[k] = this.getFromValue(v, variables);
    });
    return mm;
  }

  private mustGetInfo<T>(req: { getInfo: () => T | undefined }): T {
    const info = req.getInfo();
    if (typeof info === 'undefined') {
      throw new Error('info is required');
    }
    return info;
  }

  private buildResponsePath(rp: ResponsePath | undefined): APIResponsePath | undefined {
    if (typeof rp === 'undefined') {
      return;
    }
    return {
      key: this.getFromValue(rp.getKey()),
      prev: this.buildResponsePath(rp.getPrev()),
    };
  }

  private buildTypeRef(tr: TypeRef | undefined): APITypeRef | undefined {
    let hTypeRef: APITypeRef | undefined;
    if (typeof tr !== 'undefined') {
      if (tr.getName() !== '') {
        hTypeRef = {
          name: tr.getName(),
        };
      } else if (typeof tr.getNonnull() !== 'undefined') {
        hTypeRef = {
          nonNull: this.buildTypeRef(tr.getNonnull()),
        };
      } else if (typeof tr.getList() !== 'undefined') {
        hTypeRef = {
          list: this.buildTypeRef(tr.getList()),
        };
      }
    }
    return hTypeRef;
  }

  private buildVariableDefinition(vd: VariableDefinition): APIVariableDefinition | undefined {
    const vr = vd.getVariable();
    if (typeof vr === 'undefined') {
      return;
    }
    return {
      defaultValue: this.getFromValue(vd.getDefaultvalue()),
      variable: {
        name: vr.getName(),
      },
    };
  }

  private buildVariableDefinitions(vds: VariableDefinition[]): APIVariableDefinitions {
    const defs: APIVariableDefinitions = [];
    for (const vd of vds) {
      const def = this.buildVariableDefinition(vd);
      if (typeof def === 'undefined') {
        continue;
      }
      defs.push(def);
    }
    return defs;
  }

  private buildDirective(dir: Directive, variables: { [k: string]: Value }): APIDirective {
    return {
      arguments: this.getRecordFromValueMap(dir.getArgumentsMap(), variables),
      name: dir.getName(),
    };
  }

  private buildDirectives(dirs: Directive[], variables: { [k: string]: Value }): APIDirectives {
    const hdirs: APIDirectives = [];
    for (const dir of dirs) {
      hdirs.push(this.buildDirective(dir, variables));
    }
    return hdirs;
  }

  private buildSelection(selection: Selection, variables: { [k: string]: Value }): APISelection {
    let outSelection: APISelection;
    const name = selection.getName();
    const def = selection.getDefinition();
    if (name !== '') {
      outSelection = {
        name: selection.getName(),
      };
      if (Object.keys(selection.getArgumentsMap()).length > 0) {
        outSelection.arguments = this.getRecordFromValueMap(selection.getArgumentsMap(), variables);
      }
      if (selection.getDirectivesList().length > 0) {
        outSelection.directives = this.buildDirectives(selection.getDirectivesList(), variables);
      }
      if (selection.getSelectionsetList().length > 0) {
        outSelection.selectionSet = this.buildSelections(selection.getSelectionsetList(), variables);
      }
    } else if (typeof def !== 'undefined') {
      outSelection = {
        definition: {
          selectionSet: this.buildSelections(def.getSelectionsetList(), variables),
          typeCondition: this.buildTypeRef(def.getTypecondition()),
        },
      };
      if (def.getDirectivesList().length > 0) {
        outSelection.definition.directives = this.buildDirectives(def.getDirectivesList(), variables);
      }
      if (def.getVariabledefinitionsList().length > 0) {
        outSelection.definition.variableDefinitions = this.buildVariableDefinitions(def.getVariabledefinitionsList());
      }
    } else {
      throw new Error('invalid selection');
    }
    return outSelection;
  }

  private buildSelections(selectionSet: Selection[], variables: { [k: string]: Value }): Selections {
    const selections: Selections = [];
    for (const sel of selectionSet) {
      selections.push(this.buildSelection(sel, variables));
    }
    return selections;
  }

  private buildOperationDefinition(
    od: OperationDefinition | undefined,
    variables: { [k: string]: Value },
  ): APIOperationDefinition | undefined {
    if (typeof od === 'undefined') {
      return;
    }
    return {
      directives: this.buildDirectives(od.getDirectivesList(), variables),
      name: od.getName(),
      operation: od.getOperation(),
      selectionSet: this.buildSelections(od.getSelectionsetList(), variables),
      variableDefinitions: this.buildVariableDefinitions(od.getVariabledefinitionsList()),
    };
  }

  private valueFromAny(data: unknown): Value {
    const val = new Value();
    if (Buffer.isBuffer(data)) {
      val.setAny(Uint8Array.from(data));
    } else if (ArrayBuffer.isView(data)) {
      val.setAny(new Uint8Array(data.buffer));
    } else if (Array.isArray(data)) {
      const arr = new ArrayValue();
      arr.setItemsList(data.map((v) => this.valueFromAny(v)));
      val.setA(arr);
    } else {
      switch (typeof data) {
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
              obj.getPropsMap().set(k, this.valueFromAny(keyData[k]));
            });
            val.setO(obj);
            break;
          }
      }
    }
    return val;
  }

  private mapVariables(infoLike: GRPCInfoLike): { [k: string]: Value } {
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

  private errorFromHandlerError(err: Error): DriverError | undefined {
    const grpcErr = new DriverError();
    grpcErr.setMsg(err.message || 'unknown error');
    return grpcErr;
  }

  private grpcInfoLikeToServerInfoLike(info: GRPCInfoLike, variables: { [k: string]: Value }): InfoLike {
    const newInfo: InfoLike = {
      fieldName: info.getFieldname(),
      returnType: this.buildTypeRef(info.getReturntype()),
    };

    if (info.hasOperation()) {
      newInfo.operation = this.buildOperationDefinition(info.getOperation(), variables);
    }
    if (info.hasParenttype()) {
      newInfo.parentType = this.buildTypeRef(info.getParenttype());
    }
    if (info.hasPath()) {
      newInfo.path = this.buildResponsePath(info.getPath());
    }
    const variableValues = this.getRecordFromValueMap(info.getVariablevaluesMap());
    if (Object.keys(variableValues).length > 0) {
      newInfo.variableValues = variableValues;
    }
    return newInfo;
  }

  private stdout(call: Writable): void {
    this.stdoutStreams.push(call);
  }

  private stderr(call: Writable): void {
    this.stderrStreams.push(call);
  }

  private _hijackIO(): [typeof process.stdout.write, typeof process.stderr.write] {
    const oldStdout = process.stdout.write;
    const oldStderr = process.stderr.write;
    const writeStdToGRPC = (data: string | Buffer | Uint8Array): boolean => {
      const msg = new ByteStream();
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      if (Buffer.isBuffer(data)) {
        data = Uint8Array.from(data);
      }
      msg.setData(data);
      this.stdoutStreams.forEach((v) => {
        v.write(msg, (e) => {
          if (e) {
            v.end();
            this.stdoutStreams = this.stdoutStreams.filter((stream) => stream !== v);
          }
        });
      });
      return true;
    };
    process.stdout.write = hijackWrite(oldStdout.bind(process.stdout), writeStdToGRPC.bind(this));
    const writeStderrToGRPC = (data: string | Buffer | Uint8Array): boolean => {
      const msg = new ByteStream();
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      if (Buffer.isBuffer(data)) {
        data = Uint8Array.from(data);
      }
      msg.setData(data);
      this.stderrStreams.forEach((v) => {
        v.write(msg, (e) => {
          if (e) {
            v.end();
            this.stderrStreams = this.stderrStreams.filter((stream) => stream !== v);
          }
        });
      });
      return true;
    };
    const { pluginMode = true } = this.serverOpts;
    if (pluginMode) {
      // stderr to pseudo null device, since we're already sending
      // stderr through grpc. No need to write it again through pipe
      const nullErr = new DevNull();
      process.stderr.write = hijackWrite(nullErr.write.bind(process.stderr), writeStderrToGRPC.bind(this));
    } else {
      process.stderr.write = hijackWrite(oldStderr.bind(process.stderr.write), writeStderrToGRPC.bind(this));
    }
    return [oldStdout, oldStderr];
  }

  public closeStreams([stdoutWrite, stderrWrite]: [typeof process.stdout.write, typeof process.stderr.write]): void {
    process.stderr.write = stderrWrite;
    process.stdout.write = stdoutWrite;
    this.stdoutStreams.forEach((v) => v.end());
    this.stderrStreams.forEach((v) => v.end());
  }

  private _hijackConsole(): void {
    console.log = ((oldLog) => (msg?: unknown, ...params: unknown[]): void => {
      oldLog('[INFO]' + msg, ...params);
    })(console.log);
    console.info = ((oldInfo) => (msg?: unknown, ...params: unknown[]): void => {
      oldInfo('[INFO]' + msg, ...params);
    })(console.info);
    console.debug = ((oldDebug) => (msg?: unknown, ...params: unknown[]): void => {
      oldDebug('[DEBUG]' + msg, ...params);
    })(console.debug);
    console.warn = ((oldWarn) => (msg?: unknown, ...params: unknown[]): void => {
      oldWarn('[WARN]' + msg, ...params);
    })(console.warn);
    console.error = ((oldError) => (msg?: unknown, ...params: unknown[]): void => {
      oldError('[ERROR]' + msg, ...params);
    })(console.error);
  }
}
