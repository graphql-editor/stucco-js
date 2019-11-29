import { readFileSync } from "fs";
import * as jspb from "google-protobuf";
import * as grpc from "grpc";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService,
} from "grpc-ts-health-check";
import { extname } from "path";
import {
  IDirective,
  IDirectives,
  IFieldResolveInput,
  IFieldResolveOutput,
  IInterfaceResolveTypeInput,
  IInterfaceResolveTypeOutput,
  IOperationDefinition,
  IResponsePath,
  IScalarParseInput,
  IScalarParseOutput,
  IScalarSerializeInput,
  IScalarSerializeOutput,
  ISelections,
  IUnionResolveTypeInput,
  IUnionResolveTypeOutput,
  IVariableDefinition,
  IVariableDefinitions,
  Selection as HandlerSelection,
  TypeRef as HandlerTypeRef,
} from "../api";
import { DriverService } from "../proto/driver_grpc_pb";
import {
  ArrayValue,
  ByteStream,
  ByteStreamRequest,
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
} from "../proto/driver_pb";
import { DevNull } from "./devnull";

interface IWithFunction {
  hasFunction(): boolean;
  getFunction(): DriverFunction | undefined;
}

interface IWriteOverload {
  (buffer: string | Buffer | Uint8Array, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
  (str: string, encoding?: string | undefined, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
}

function hijackWrite(w: IWriteOverload, to: IWriteOverload): IWriteOverload {
  const hijack: IWriteOverload = (
    first: string | Buffer | Uint8Array,
    second: ((err?: Error | null | undefined) => void) | string | undefined,
    cb?: ((err?: Error | null | undefined) => void) | undefined,
  ): boolean => {
    if (typeof first === "string" && (typeof second === "string" || typeof second === "undefined")) {
      to(first, second, cb);
      return w(first, second, cb);
    } else if ((
      typeof first === "string" ||
      Buffer.isBuffer(first) ||
      ArrayBuffer.isView(first)
    ) && typeof second === "function") {
      to(first, second);
      return w(first, second);
    }
    return false;
  };
  return hijack;
}

interface IServerOptions {
  bindAddress?: string;
  pluginMode?: boolean;
  rootCerts?: string;
  privateKey?: string;
  certChain?: string;
  checkClientCertificate?: boolean;
  grpcServerOpts?: object;
  server?: IGRPCServer;
}

interface IGRPCServer {
  start: typeof grpc.Server.prototype.start;
  addService: typeof grpc.Server.prototype.addService;
  tryShutdown: typeof grpc.Server.prototype.tryShutdown;
  bind: typeof grpc.Server.prototype.bind;
}

interface IGRPCInfoLike {
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

interface IInfoLike {
  fieldName: string;
  path?: IResponsePath;
  returnType?: HandlerTypeRef;
  parentType?: HandlerTypeRef;
  operation?: IOperationDefinition;
  variableValues?: Record<string, any>;
}

interface IResponse {
  response: any;
}

function isResponse(v: {
  response?: any,
} | unknown): v is IResponse {
  return typeof v === "object" &&
    !!v &&
    "response" in v &&
    typeof (v as {response?: any}).response !== "undefined";
}

interface IType {
  type: string | (() => string);
}

function isType(v: {
  type?: any,
} | unknown): v is IType {
  return typeof v === "object" &&
    !!v &&
    "type" in v &&
    (
      typeof (v as {type?: any}).type === "string" ||
      typeof (v as {type?: any}).type === "function"
    );
}

interface IHasError {
  error: Error;
}

function hasError(v: {
  error?: Error,
} | unknown): v is IHasError {
  return typeof v === "object" &&
    !!v &&
    "error" in v;
}

export class Server {
  private server: IGRPCServer;
  private stdoutStreams: Array<grpc.ServerWritableStream<ByteStreamRequest>>;
  private stderrStreams: Array<grpc.ServerWritableStream<ByteStreamRequest>>;
  constructor(private serverOpts: IServerOptions = {}) {
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

  public doError<T extends {
    setError: (value?: DriverError) => any,
  }>(
    e: any,
    ctor: new () => T,
    cb: (e: any, resp: T,
  ) => void) {
    console.error(e);
    const response = new ctor();
    const grpcErr = new DriverError();
    grpcErr.setMsg(e.message || "unknown error");
    response.setError(grpcErr);
    cb(null, response);
  }

  public valueFromResponse(out?: {
    [k: string]: any;
    response: any;
    error?: Error;
  } | (() => string) | unknown) {
    if (typeof out === "function") {
      out = { response: out() };
    } else if (!isResponse(out) && !hasError(out)) {
      out = { response: out };
    }
    let responseData: any;
    if (isResponse(out) && !hasError(out)) {
      if (typeof out.response === "function") {
        out.response = out.response();
      }
      responseData = out.response;
    }
    if (hasError(out) && !responseData) {
      return;
    }
    return this.valueFromAny(responseData);
  }

  public setResponseResponse<T extends {
    setResponse: (value?: Value) => void,
  }>(resp: T, out?: {
      response?: any
      error?: Error,
    } | (() => any) | unknown) {
    const val = this.valueFromResponse(out);
    if (val) {
      resp.setResponse(this.valueFromResponse(out));
    }
  }

  public setResponseType<T extends {
    setType: (value?: TypeRef) => void,
  }>(resp: T, out?: {
    type?: string | (() => string)
    error?: Error,
  } | string | (() => string)) {
    if (typeof out === "function") {
      out = { type: out() };
    } else if (typeof out === "string") {
      out = { type: out };
    }
    let type = "";
    if (isType(out)) {
      if (typeof out.type === "function") {
        out.type = out.type();
      }
      type = out.type;
    }
    if (!type) {
      if (hasError(out)) {
        return;
      }
      throw new Error("type cannot be empty");
    }
    const t = new TypeRef();
    t.setName(type);
    resp.setType(t);
  }

  public setResponseValue<T extends {
    setValue: (value?: Value) => void,
  }>(resp: T, out?: {
      response?: any
      error?: Error,
    }) {
    const val = this.valueFromResponse(out);
    if (val) {
      resp.setValue(this.valueFromResponse(out));
    }
  }

  public setResponseError<T extends {
    setError: (value?: DriverError) => void,
  }, U extends {
    error?: Error,
  }>(resp: T, out?: U) {
    if (out && out.error) {
      resp.setError(this.errorFromHandlerError(out.error));
    }
  }

  public async fieldResolve(
    call: grpc.ServerUnaryCall<FieldResolveRequest>,
    callback: grpc.sendUnaryData<FieldResolveResponse>,
  ) {
    try {
      const response = new FieldResolveResponse();
      const fieldResolve = this.getHandler<
        IFieldResolveInput,
        IFieldResolveOutput
      >(call.request);
      const info = this.mustGetInfo(call.request);
      const fieldResolveInput: IFieldResolveInput = {
        info: this.grpcInfoLikeToServerInfoLike(info),
      };
      const args = this.getRecordFromValueMap(call.request.getArgumentsMap());
      if (Object.keys(args).length > 0) {
        fieldResolveInput.arguments = args;
      }
      if (call.request.hasProtocol()) {
        const headers = this.getFromValue(call.request.getProtocol());
        fieldResolveInput.protocol = {headers};
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
  ) {
    try {
      const response = new InterfaceResolveTypeResponse();
      const interfaceResolveType = this.getHandler<
        IInterfaceResolveTypeInput,
        IInterfaceResolveTypeOutput
      >(call.request);
      const info = this.mustGetInfo(call.request);
      const out = await interfaceResolveType({
        info: this.grpcInfoLikeToServerInfoLike(info),
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
  ) {
    try {
      const response = new ScalarParseResponse();
      const scalarParseHandler = this.getHandler<IScalarParseInput, IScalarParseOutput>(call.request);
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
  ) {
    try {
      const response = new ScalarSerializeResponse();
      const scalarSerializeHandler = this.getHandler<IScalarSerializeInput, IScalarSerializeOutput>(call.request);
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
  ) {
    try {
      const response = new UnionResolveTypeResponse();
      const unionResolveType = this.getHandler<IUnionResolveTypeInput, IUnionResolveTypeOutput>(call.request);
      const info = this.mustGetInfo(call.request);
      const out = await unionResolveType({
        info: this.grpcInfoLikeToServerInfoLike(info),
        value: this.getFromValue(call.request.getValue()),
      });
      this.setResponseType(response, out);
      this.setResponseError(response, out);
      callback(null, response);
    } catch (e) {
      this.doError(e, UnionResolveTypeResponse, callback);
    }
  }

  public serve() {
    const {
      bindAddress = "0.0.0.0:1234",
      pluginMode = true,
      rootCerts,
      privateKey,
      certChain,
      checkClientCertificate,
    } = this.serverOpts;
    let creds: grpc.ServerCredentials;
    if (pluginMode || (!rootCerts && !privateKey && !certChain)) {
      creds = grpc.ServerCredentials.createInsecure();
    } else {
      if (!rootCerts || !privateKey || !certChain) {
        // refuse to setup server with partial TLS setup
        console.error("TLS certificate chain defined partially");
        return;
      }
      const rootCert = readFileSync(rootCerts);
      creds = grpc.ServerCredentials.createSsl(rootCert, [{
        cert_chain: readFileSync(certChain),
        private_key: readFileSync(privateKey),
      }], checkClientCertificate);
    }
    this.server.bind(bindAddress, creds);
    if (pluginMode) {
      console.log("1|1|tcp|127.0.0.1:1234|grpc");
    }
    // go-plugin does not read stdout
    // hijack io and send it through buffer
    const [stdoutWrite, stderrWrite] = this._hijackIO();
    this._hijackConsole();
    try {
      this.server.start();
    } catch (e) {
      process.stderr.write = stderrWrite;
      process.stdout.write = stdoutWrite;
      console.error(e);
    } finally {
      this.closeStreams();
    }
  }

  public stop() {
    return new Promise((resolve) => this.server.tryShutdown(() => {
      resolve();
    }));
  }

  private wrap<T, U>(srv: Server, fn: (call: T, callback: U) => void): (call: T, callback: U) => void {
    return fn.bind(srv);
  }

  private getHandler<T, U extends { error?: Error }>(req: IWithFunction): (x: T) => Promise<U | undefined> {
    if (!req.hasFunction()) {
      throw new Error("missing function");
    }
    const fn = req.getFunction();
    if (typeof (fn) === "undefined" || !fn.getName()) {
      throw new Error(`function name is empty`);
    }
    const fnName = fn.getName();
    const ext = extname(fnName) !== ".js" ? extname(fnName) : "";
    const mod = require(`${process.cwd()}/${fnName.slice(0, fnName.length - ext.length)}`);
    const handler: (x: T) => U | Promise<U> =
      !ext && typeof (mod) === "function" ?
        mod :
        mod[ext.slice(1) || "handler"];
    return (x: T) => Promise.resolve(handler(x));
  }

  private getFromValue(value?: Value): any {
    if (typeof (value) === "undefined") {
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
      const obj: { [k: string]: any } = {};
      const o = value.getO();
      o!.getPropsMap().forEach((v: Value, k: string) => {
        obj[k] = this.getFromValue(v);
      });
      return obj;
    }
    if (value.hasA()) {
      const arr: any[] = [];
      const a = value.getA();
      a!.getItemsList().forEach((v) => {
        arr.push(this.getFromValue(v));
      });
      return arr;
    }
    if (value.hasAny()) {
      return value.getAny_asU8();
    }
    // null is marshaled to value without anything set.
    // To reflect that behaviour, we unmarshal empty value
    // also as null.
    return null;
  }

  private getRecordFromValueMap(m: jspb.Map<string, Value>) {
    const mm: Record<string, any> = {};
    m.forEach((v, k) => {
      mm[k] = this.getFromValue(v);
    });
    return mm;
  }

  private mustGetInfo<T>(req: {
    getInfo: () => T | undefined,
  }): T {
    const info = req.getInfo();
    if (typeof (info) === "undefined") {
      throw new Error("info is required");
    }
    return info;
  }

  private buildResponsePath(rp: ResponsePath | undefined): IResponsePath | undefined {
    if (typeof (rp) === "undefined") {
      return;
    }
    return {
      key: rp.getKey(),
      prev: this.buildResponsePath(rp.getPrev()),
    };
  }

  private buildTypeRef(tr: TypeRef | undefined): HandlerTypeRef | undefined {
    let hTypeRef: HandlerTypeRef | undefined;
    if (typeof (tr) !== "undefined") {
      if (tr.getName() !== "") {
        hTypeRef = {
          name: tr.getName(),
        };
      } else if (typeof (tr.getNonnull()) !== "undefined") {
        hTypeRef = {
          nonNull: this.buildTypeRef(tr.getNonnull()),
        };
      } else if (typeof (tr.getList()) !== "undefined") {
        hTypeRef = {
          list: this.buildTypeRef(tr.getList()),
        };
      }
    }
    return hTypeRef;
  }

  private buildVariableDefinition(vd: VariableDefinition): IVariableDefinition | undefined {
    const vr = vd.getVariable();
    if (typeof (vr) === "undefined") {
      return;
    }
    return {
      defaultValue: this.getFromValue(vd.getDefaultvalue()),
      variable: {
        name: vr.getName(),
      },
    };
  }

  private buildVariableDefinitions(vds: VariableDefinition[]): IVariableDefinitions {
    const defs: IVariableDefinitions = [];
    for (const vd of vds) {
      const def = this.buildVariableDefinition(vd);
      if (typeof (def) === "undefined") {
        continue;
      }
      defs.push(def);
    }
    return defs;
  }

  private buildDirective(dir: Directive): IDirective {
    return {
      arguments: this.getRecordFromValueMap(dir.getArgumentsMap()),
      name: dir.getName(),
    };
  }

  private buildDirectives(dirs: Directive[]): IDirectives {
    const hdirs: IDirectives = [];
    for (const dir of dirs) {
      hdirs.push(this.buildDirective(dir));
    }
    return hdirs;
  }

  private buildSelection(selection: Selection): HandlerSelection {
    let outSelection: HandlerSelection;
    const name = selection.getName();
    const def = selection.getDefinition();
    if (name !== "") {
      outSelection = {
        name: selection.getName(),
      };
      if (Object.keys(selection.getArgumentsMap()).length > 0 ) {
        outSelection.arguments = this.getRecordFromValueMap(selection.getArgumentsMap());
      }
      if (selection.getDirectivesList().length > 0) {
        outSelection.directives = this.buildDirectives(selection.getDirectivesList());
      }
      if (selection.getSelectionsetList().length > 0) {
        outSelection.selectionSet = this.buildSelections(selection.getSelectionsetList());
      }
    } else if (typeof (def) !== "undefined") {
      outSelection = {
        definition: {
          selectionSet: this.buildSelections(def.getSelectionsetList()),
          typeCondition: this.buildTypeRef(def.getTypecondition()),
        },
      };
      if (def.getDirectivesList().length > 0) {
        outSelection.definition.directives = this.buildDirectives(def.getDirectivesList());
      }
      if (def.getVariabledefinitionsList().length > 0 ) {
        outSelection.definition.variableDefinitions = this.buildVariableDefinitions(def.getVariabledefinitionsList());
      }
    } else {
      throw new Error("invalid selection");
    }
    return outSelection;
  }

  private buildSelections(selectionSet: Selection[]): ISelections {
    const selections: ISelections = [];
    for (const sel of selectionSet) {
      selections.push(this.buildSelection(sel));
    }
    return selections;
  }

  private buildOperationDefinition(od: OperationDefinition | undefined): IOperationDefinition | undefined {
    if (typeof (od) === "undefined") {
      return;
    }
    return {
      directives: this.buildDirectives(od.getDirectivesList()),
      name: od.getName(),
      operation: od.getOperation(),
      selectionSet: this.buildSelections(od.getSelectionsetList()),
      variableDefinitions: this.buildVariableDefinitions(od.getVariabledefinitionsList()),
    };
  }

  private valueFromAny(data: any): Value {
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
      switch (typeof (data)) {
        case "number":
          if (data % 1 === 0) {
            val.setI(data);
          } else {
            val.setF(data);
          }
          break;
        case "string":
          val.setS(data);
          break;
        case "boolean":
          val.setB(data);
          break;
        case "object":
          if (data !== null) {
            const obj = new ObjectValue();
            for (const k of Object.keys(data)) {
              obj.getPropsMap().set(k, this.valueFromAny(data[k]));
            }
            val.setO(obj);
            break;
          }
      }
    }
    return val;
  }

  private errorFromHandlerError(err: Error | IHasError | undefined): DriverError | undefined {
    if (typeof (err) === "undefined") {
      return;
    }
    const grpcErr = new DriverError();
    if (hasError(err)) {
      grpcErr.setMsg(err.error.message || "unknown error");
    } else {
      grpcErr.setMsg(err.message || "unknown error");
    }
    return grpcErr;
  }

  private grpcInfoLikeToServerInfoLike(info: IGRPCInfoLike): IInfoLike {
    const newInfo: IInfoLike = {
      fieldName: info.getFieldname(),
      returnType: this.buildTypeRef(info.getReturntype()),
    };

    if (info.hasOperation()) {
      newInfo.operation = this.buildOperationDefinition(info.getOperation());
    }
    if (info.hasParenttype()) {
      newInfo.parentType = this.buildTypeRef(info.getParenttype()) ;
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

  private stdout(call: grpc.ServerWritableStream<ByteStreamRequest>) {
    this.stdoutStreams.push(call);
  }

  private stderr(call: grpc.ServerWritableStream<ByteStreamRequest>) {
    this.stderrStreams.push(call);
  }

  private _hijackIO() {
    const oldStdout = process.stdout.write;
    const oldStderr = process.stderr.write;
    const writeStdToGRPC = (data: string | Buffer | Uint8Array) => {
      const msg = new ByteStream();
      if (typeof data === "string") {
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
    const writeStderrToGRPC = (data: string | Buffer | Uint8Array) => {
      const msg = new ByteStream();
      if (typeof data === "string") {
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
    // stderr to pseudo null device, since we're already sending
    // stderr through grpc. No need to write it again through pipe
    const nullErr = new DevNull();
    process.stderr.write = hijackWrite(nullErr.write.bind(process.stderr), writeStderrToGRPC.bind(this));
    return [oldStdout, oldStderr];
  }

  private closeStreams() {
    this.stdoutStreams.forEach((v) => v.end());
    this.stderrStreams.forEach((v) => v.end());
  }

  private _hijackConsole() {
    console.log = ((oldLog) => (msg?: any, ...params: any[]): void => {
      oldLog("[INFO]" + msg, ...params);
    })(console.log);
    console.info = ((oldInfo) => (msg?: any, ...params: any[]): void => {
      oldInfo("[INFO]" + msg, ...params);
    })(console.info);
    console.debug = ((oldDebug) => (msg?: any, ...params: any[]): void => {
      oldDebug("[DEBUG]" + msg, ...params);
    })(console.debug);
    console.warn = ((oldWarn) => (msg?: any, ...params: any[]): void => {
      oldWarn("[WARN]" + msg, ...params);
    })(console.warn);
    console.error = ((oldError) => (msg?: any, ...params: any[]): void => {
      oldError("[ERROR]" + msg, ...params);
    })(console.error);
  }
}
