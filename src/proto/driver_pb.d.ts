// package: proto
// file: proto/driver.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class ObjectValue extends jspb.Message {
  getPropsMap(): jspb.Map<string, Value>;
  clearPropsMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ObjectValue.AsObject;
  static toObject(includeInstance: boolean, msg: ObjectValue): ObjectValue.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ObjectValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ObjectValue;
  static deserializeBinaryFromReader(message: ObjectValue, reader: jspb.BinaryReader): ObjectValue;
}

export namespace ObjectValue {
  export type AsObject = {
    propsMap: Array<[string, Value.AsObject]>;
  };
}

export class ArrayValue extends jspb.Message {
  clearItemsList(): void;
  getItemsList(): Array<Value>;
  setItemsList(value: Array<Value>): void;
  addItems(value?: Value, index?: number): Value;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ArrayValue.AsObject;
  static toObject(includeInstance: boolean, msg: ArrayValue): ArrayValue.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ArrayValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ArrayValue;
  static deserializeBinaryFromReader(message: ArrayValue, reader: jspb.BinaryReader): ArrayValue;
}

export namespace ArrayValue {
  export type AsObject = {
    itemsList: Array<Value.AsObject>;
  };
}

export class Value extends jspb.Message {
  hasI(): boolean;
  clearI(): void;
  getI(): number;
  setI(value: number): void;

  hasU(): boolean;
  clearU(): void;
  getU(): number;
  setU(value: number): void;

  hasF(): boolean;
  clearF(): void;
  getF(): number;
  setF(value: number): void;

  hasS(): boolean;
  clearS(): void;
  getS(): string;
  setS(value: string): void;

  hasB(): boolean;
  clearB(): void;
  getB(): boolean;
  setB(value: boolean): void;

  hasO(): boolean;
  clearO(): void;
  getO(): ObjectValue | undefined;
  setO(value?: ObjectValue): void;

  hasA(): boolean;
  clearA(): void;
  getA(): ArrayValue | undefined;
  setA(value?: ArrayValue): void;

  hasAny(): boolean;
  clearAny(): void;
  getAny(): Uint8Array | string;
  getAny_asU8(): Uint8Array;
  getAny_asB64(): string;
  setAny(value: Uint8Array | string): void;

  getTestValueCase(): Value.TestValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Value.AsObject;
  static toObject(includeInstance: boolean, msg: Value): Value.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Value, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Value;
  static deserializeBinaryFromReader(message: Value, reader: jspb.BinaryReader): Value;
}

export namespace Value {
  export type AsObject = {
    i: number;
    u: number;
    f: number;
    s: string;
    b: boolean;
    o?: ObjectValue.AsObject;
    a?: ArrayValue.AsObject;
    any: Uint8Array | string;
  };

  export enum TestValueCase {
    TESTVALUE_NOT_SET = 0,

    I = 1,

    U = 2,

    F = 3,

    S = 4,

    B = 5,

    O = 6,

    A = 7,

    ANY = 8,
  }
}

export class Error extends jspb.Message {
  getMsg(): string;
  setMsg(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Error.AsObject;
  static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Error;
  static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
}

export namespace Error {
  export type AsObject = {
    msg: string;
  };
}

export class Function extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Function.AsObject;
  static toObject(includeInstance: boolean, msg: Function): Function.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Function, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Function;
  static deserializeBinaryFromReader(message: Function, reader: jspb.BinaryReader): Function;
}

export namespace Function {
  export type AsObject = {
    name: string;
  };
}

export class TypeRef extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string;
  setName(value: string): void;

  hasNonnull(): boolean;
  clearNonnull(): void;
  getNonnull(): TypeRef | undefined;
  setNonnull(value?: TypeRef): void;

  hasList(): boolean;
  clearList(): void;
  getList(): TypeRef | undefined;
  setList(value?: TypeRef): void;

  getTestTyperefCase(): TypeRef.TestTyperefCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TypeRef.AsObject;
  static toObject(includeInstance: boolean, msg: TypeRef): TypeRef.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: TypeRef, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TypeRef;
  static deserializeBinaryFromReader(message: TypeRef, reader: jspb.BinaryReader): TypeRef;
}

export namespace TypeRef {
  export type AsObject = {
    name: string;
    nonnull?: TypeRef.AsObject;
    list?: TypeRef.AsObject;
  };

  export enum TestTyperefCase {
    TESTTYPEREF_NOT_SET = 0,

    NAME = 1,

    NONNULL = 2,

    LIST = 3,
  }
}

export class ResponsePath extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  hasPrev(): boolean;
  clearPrev(): void;
  getPrev(): ResponsePath | undefined;
  setPrev(value?: ResponsePath): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResponsePath.AsObject;
  static toObject(includeInstance: boolean, msg: ResponsePath): ResponsePath.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ResponsePath, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResponsePath;
  static deserializeBinaryFromReader(message: ResponsePath, reader: jspb.BinaryReader): ResponsePath;
}

export namespace ResponsePath {
  export type AsObject = {
    key: string;
    prev?: ResponsePath.AsObject;
  };
}

export class Variable extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Variable.AsObject;
  static toObject(includeInstance: boolean, msg: Variable): Variable.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Variable, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Variable;
  static deserializeBinaryFromReader(message: Variable, reader: jspb.BinaryReader): Variable;
}

export namespace Variable {
  export type AsObject = {
    name: string;
  };
}

export class VariableDefinition extends jspb.Message {
  hasVariable(): boolean;
  clearVariable(): void;
  getVariable(): Variable | undefined;
  setVariable(value?: Variable): void;

  hasDefaultvalue(): boolean;
  clearDefaultvalue(): void;
  getDefaultvalue(): Value | undefined;
  setDefaultvalue(value?: Value): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VariableDefinition.AsObject;
  static toObject(includeInstance: boolean, msg: VariableDefinition): VariableDefinition.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: VariableDefinition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VariableDefinition;
  static deserializeBinaryFromReader(message: VariableDefinition, reader: jspb.BinaryReader): VariableDefinition;
}

export namespace VariableDefinition {
  export type AsObject = {
    variable?: Variable.AsObject;
    defaultvalue?: Value.AsObject;
  };
}

export class Directive extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getArgumentsMap(): jspb.Map<string, Value>;
  clearArgumentsMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Directive.AsObject;
  static toObject(includeInstance: boolean, msg: Directive): Directive.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Directive, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Directive;
  static deserializeBinaryFromReader(message: Directive, reader: jspb.BinaryReader): Directive;
}

export namespace Directive {
  export type AsObject = {
    name: string;

    argumentsMap: Array<[string, Value.AsObject]>;
  };
}

export class FragmentDefinition extends jspb.Message {
  clearDirectivesList(): void;
  getDirectivesList(): Array<Directive>;
  setDirectivesList(value: Array<Directive>): void;
  addDirectives(value?: Directive, index?: number): Directive;

  hasTypecondition(): boolean;
  clearTypecondition(): void;
  getTypecondition(): TypeRef | undefined;
  setTypecondition(value?: TypeRef): void;

  clearSelectionsetList(): void;
  getSelectionsetList(): Array<Selection>;
  setSelectionsetList(value: Array<Selection>): void;
  addSelectionset(value?: Selection, index?: number): Selection;

  clearVariabledefinitionsList(): void;
  getVariabledefinitionsList(): Array<VariableDefinition>;
  setVariabledefinitionsList(value: Array<VariableDefinition>): void;
  addVariabledefinitions(value?: VariableDefinition, index?: number): VariableDefinition;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FragmentDefinition.AsObject;
  static toObject(includeInstance: boolean, msg: FragmentDefinition): FragmentDefinition.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: FragmentDefinition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FragmentDefinition;
  static deserializeBinaryFromReader(message: FragmentDefinition, reader: jspb.BinaryReader): FragmentDefinition;
}

export namespace FragmentDefinition {
  export type AsObject = {
    directivesList: Array<Directive.AsObject>;
    typecondition?: TypeRef.AsObject;
    selectionsetList: Array<Selection.AsObject>;
    variabledefinitionsList: Array<VariableDefinition.AsObject>;
  };
}

export class Selection extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getArgumentsMap(): jspb.Map<string, Value>;
  clearArgumentsMap(): void;

  clearDirectivesList(): void;
  getDirectivesList(): Array<Directive>;
  setDirectivesList(value: Array<Directive>): void;
  addDirectives(value?: Directive, index?: number): Directive;

  clearSelectionsetList(): void;
  getSelectionsetList(): Array<Selection>;
  setSelectionsetList(value: Array<Selection>): void;
  addSelectionset(value?: Selection, index?: number): Selection;

  hasDefinition(): boolean;
  clearDefinition(): void;
  getDefinition(): FragmentDefinition | undefined;
  setDefinition(value?: FragmentDefinition): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Selection.AsObject;
  static toObject(includeInstance: boolean, msg: Selection): Selection.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Selection, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Selection;
  static deserializeBinaryFromReader(message: Selection, reader: jspb.BinaryReader): Selection;
}

export namespace Selection {
  export type AsObject = {
    name: string;

    argumentsMap: Array<[string, Value.AsObject]>;
    directivesList: Array<Directive.AsObject>;
    selectionsetList: Array<Selection.AsObject>;
    definition?: FragmentDefinition.AsObject;
  };
}

export class OperationDefinition extends jspb.Message {
  getOperation(): string;
  setOperation(value: string): void;

  getName(): string;
  setName(value: string): void;

  clearVariabledefinitionsList(): void;
  getVariabledefinitionsList(): Array<VariableDefinition>;
  setVariabledefinitionsList(value: Array<VariableDefinition>): void;
  addVariabledefinitions(value?: VariableDefinition, index?: number): VariableDefinition;

  clearDirectivesList(): void;
  getDirectivesList(): Array<Directive>;
  setDirectivesList(value: Array<Directive>): void;
  addDirectives(value?: Directive, index?: number): Directive;

  clearSelectionsetList(): void;
  getSelectionsetList(): Array<Selection>;
  setSelectionsetList(value: Array<Selection>): void;
  addSelectionset(value?: Selection, index?: number): Selection;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OperationDefinition.AsObject;
  static toObject(includeInstance: boolean, msg: OperationDefinition): OperationDefinition.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: OperationDefinition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OperationDefinition;
  static deserializeBinaryFromReader(message: OperationDefinition, reader: jspb.BinaryReader): OperationDefinition;
}

export namespace OperationDefinition {
  export type AsObject = {
    operation: string;
    name: string;
    variabledefinitionsList: Array<VariableDefinition.AsObject>;
    directivesList: Array<Directive.AsObject>;
    selectionsetList: Array<Selection.AsObject>;
  };
}

export class FieldResolveInfo extends jspb.Message {
  getFieldname(): string;
  setFieldname(value: string): void;

  hasPath(): boolean;
  clearPath(): void;
  getPath(): ResponsePath | undefined;
  setPath(value?: ResponsePath): void;

  hasReturntype(): boolean;
  clearReturntype(): void;
  getReturntype(): TypeRef | undefined;
  setReturntype(value?: TypeRef): void;

  hasParenttype(): boolean;
  clearParenttype(): void;
  getParenttype(): TypeRef | undefined;
  setParenttype(value?: TypeRef): void;

  hasOperation(): boolean;
  clearOperation(): void;
  getOperation(): OperationDefinition | undefined;
  setOperation(value?: OperationDefinition): void;

  getVariablevaluesMap(): jspb.Map<string, Value>;
  clearVariablevaluesMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FieldResolveInfo.AsObject;
  static toObject(includeInstance: boolean, msg: FieldResolveInfo): FieldResolveInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: FieldResolveInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FieldResolveInfo;
  static deserializeBinaryFromReader(message: FieldResolveInfo, reader: jspb.BinaryReader): FieldResolveInfo;
}

export namespace FieldResolveInfo {
  export type AsObject = {
    fieldname: string;
    path?: ResponsePath.AsObject;
    returntype?: TypeRef.AsObject;
    parenttype?: TypeRef.AsObject;
    operation?: OperationDefinition.AsObject;

    variablevaluesMap: Array<[string, Value.AsObject]>;
  };
}

export class FieldResolveRequest extends jspb.Message {
  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  hasSource(): boolean;
  clearSource(): void;
  getSource(): Value | undefined;
  setSource(value?: Value): void;

  getArgumentsMap(): jspb.Map<string, Value>;
  clearArgumentsMap(): void;

  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): FieldResolveInfo | undefined;
  setInfo(value?: FieldResolveInfo): void;

  getSecretsMap(): jspb.Map<string, string>;
  clearSecretsMap(): void;

  hasProtocol(): boolean;
  clearProtocol(): void;
  getProtocol(): Value | undefined;
  setProtocol(value?: Value): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FieldResolveRequest.AsObject;
  static toObject(includeInstance: boolean, msg: FieldResolveRequest): FieldResolveRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: FieldResolveRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FieldResolveRequest;
  static deserializeBinaryFromReader(message: FieldResolveRequest, reader: jspb.BinaryReader): FieldResolveRequest;
}

export namespace FieldResolveRequest {
  export type AsObject = {
    pb_function?: Function.AsObject;
    source?: Value.AsObject;

    argumentsMap: Array<[string, Value.AsObject]>;
    info?: FieldResolveInfo.AsObject;

    secretsMap: Array<[string, string]>;
    protocol?: Value.AsObject;
  };
}

export class FieldResolveResponse extends jspb.Message {
  hasResponse(): boolean;
  clearResponse(): void;
  getResponse(): Value | undefined;
  setResponse(value?: Value): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FieldResolveResponse.AsObject;
  static toObject(includeInstance: boolean, msg: FieldResolveResponse): FieldResolveResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: FieldResolveResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FieldResolveResponse;
  static deserializeBinaryFromReader(message: FieldResolveResponse, reader: jspb.BinaryReader): FieldResolveResponse;
}

export namespace FieldResolveResponse {
  export type AsObject = {
    response?: Value.AsObject;
    error?: Error.AsObject;
  };
}

export class InterfaceResolveTypeInfo extends jspb.Message {
  getFieldname(): string;
  setFieldname(value: string): void;

  hasPath(): boolean;
  clearPath(): void;
  getPath(): ResponsePath | undefined;
  setPath(value?: ResponsePath): void;

  hasReturntype(): boolean;
  clearReturntype(): void;
  getReturntype(): TypeRef | undefined;
  setReturntype(value?: TypeRef): void;

  hasParenttype(): boolean;
  clearParenttype(): void;
  getParenttype(): TypeRef | undefined;
  setParenttype(value?: TypeRef): void;

  hasOperation(): boolean;
  clearOperation(): void;
  getOperation(): OperationDefinition | undefined;
  setOperation(value?: OperationDefinition): void;

  getVariablevaluesMap(): jspb.Map<string, Value>;
  clearVariablevaluesMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InterfaceResolveTypeInfo.AsObject;
  static toObject(includeInstance: boolean, msg: InterfaceResolveTypeInfo): InterfaceResolveTypeInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: InterfaceResolveTypeInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InterfaceResolveTypeInfo;
  static deserializeBinaryFromReader(
    message: InterfaceResolveTypeInfo,
    reader: jspb.BinaryReader,
  ): InterfaceResolveTypeInfo;
}

export namespace InterfaceResolveTypeInfo {
  export type AsObject = {
    fieldname: string;
    path?: ResponsePath.AsObject;
    returntype?: TypeRef.AsObject;
    parenttype?: TypeRef.AsObject;
    operation?: OperationDefinition.AsObject;

    variablevaluesMap: Array<[string, Value.AsObject]>;
  };
}

export class InterfaceResolveTypeRequest extends jspb.Message {
  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): InterfaceResolveTypeInfo | undefined;
  setInfo(value?: InterfaceResolveTypeInfo): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InterfaceResolveTypeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InterfaceResolveTypeRequest): InterfaceResolveTypeRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: InterfaceResolveTypeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InterfaceResolveTypeRequest;
  static deserializeBinaryFromReader(
    message: InterfaceResolveTypeRequest,
    reader: jspb.BinaryReader,
  ): InterfaceResolveTypeRequest;
}

export namespace InterfaceResolveTypeRequest {
  export type AsObject = {
    pb_function?: Function.AsObject;
    value?: Value.AsObject;
    info?: InterfaceResolveTypeInfo.AsObject;
  };
}

export class InterfaceResolveTypeResponse extends jspb.Message {
  hasType(): boolean;
  clearType(): void;
  getType(): TypeRef | undefined;
  setType(value?: TypeRef): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InterfaceResolveTypeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: InterfaceResolveTypeResponse): InterfaceResolveTypeResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: InterfaceResolveTypeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InterfaceResolveTypeResponse;
  static deserializeBinaryFromReader(
    message: InterfaceResolveTypeResponse,
    reader: jspb.BinaryReader,
  ): InterfaceResolveTypeResponse;
}

export namespace InterfaceResolveTypeResponse {
  export type AsObject = {
    type?: TypeRef.AsObject;
    error?: Error.AsObject;
  };
}

export class ScalarParseRequest extends jspb.Message {
  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScalarParseRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ScalarParseRequest): ScalarParseRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ScalarParseRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScalarParseRequest;
  static deserializeBinaryFromReader(message: ScalarParseRequest, reader: jspb.BinaryReader): ScalarParseRequest;
}

export namespace ScalarParseRequest {
  export type AsObject = {
    value?: Value.AsObject;
    pb_function?: Function.AsObject;
  };
}

export class ScalarParseResponse extends jspb.Message {
  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScalarParseResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ScalarParseResponse): ScalarParseResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ScalarParseResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScalarParseResponse;
  static deserializeBinaryFromReader(message: ScalarParseResponse, reader: jspb.BinaryReader): ScalarParseResponse;
}

export namespace ScalarParseResponse {
  export type AsObject = {
    value?: Value.AsObject;
    error?: Error.AsObject;
  };
}

export class ScalarSerializeRequest extends jspb.Message {
  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScalarSerializeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ScalarSerializeRequest): ScalarSerializeRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ScalarSerializeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScalarSerializeRequest;
  static deserializeBinaryFromReader(
    message: ScalarSerializeRequest,
    reader: jspb.BinaryReader,
  ): ScalarSerializeRequest;
}

export namespace ScalarSerializeRequest {
  export type AsObject = {
    value?: Value.AsObject;
    pb_function?: Function.AsObject;
  };
}

export class ScalarSerializeResponse extends jspb.Message {
  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScalarSerializeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ScalarSerializeResponse): ScalarSerializeResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ScalarSerializeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScalarSerializeResponse;
  static deserializeBinaryFromReader(
    message: ScalarSerializeResponse,
    reader: jspb.BinaryReader,
  ): ScalarSerializeResponse;
}

export namespace ScalarSerializeResponse {
  export type AsObject = {
    value?: Value.AsObject;
    error?: Error.AsObject;
  };
}

export class UnionResolveTypeInfo extends jspb.Message {
  getFieldname(): string;
  setFieldname(value: string): void;

  hasPath(): boolean;
  clearPath(): void;
  getPath(): ResponsePath | undefined;
  setPath(value?: ResponsePath): void;

  hasReturntype(): boolean;
  clearReturntype(): void;
  getReturntype(): TypeRef | undefined;
  setReturntype(value?: TypeRef): void;

  hasParenttype(): boolean;
  clearParenttype(): void;
  getParenttype(): TypeRef | undefined;
  setParenttype(value?: TypeRef): void;

  hasOperation(): boolean;
  clearOperation(): void;
  getOperation(): OperationDefinition | undefined;
  setOperation(value?: OperationDefinition): void;

  getVariablevaluesMap(): jspb.Map<string, Value>;
  clearVariablevaluesMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnionResolveTypeInfo.AsObject;
  static toObject(includeInstance: boolean, msg: UnionResolveTypeInfo): UnionResolveTypeInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: UnionResolveTypeInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnionResolveTypeInfo;
  static deserializeBinaryFromReader(message: UnionResolveTypeInfo, reader: jspb.BinaryReader): UnionResolveTypeInfo;
}

export namespace UnionResolveTypeInfo {
  export type AsObject = {
    fieldname: string;
    path?: ResponsePath.AsObject;
    returntype?: TypeRef.AsObject;
    parenttype?: TypeRef.AsObject;
    operation?: OperationDefinition.AsObject;

    variablevaluesMap: Array<[string, Value.AsObject]>;
  };
}

export class UnionResolveTypeRequest extends jspb.Message {
  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  hasValue(): boolean;
  clearValue(): void;
  getValue(): Value | undefined;
  setValue(value?: Value): void;

  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): UnionResolveTypeInfo | undefined;
  setInfo(value?: UnionResolveTypeInfo): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnionResolveTypeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UnionResolveTypeRequest): UnionResolveTypeRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: UnionResolveTypeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnionResolveTypeRequest;
  static deserializeBinaryFromReader(
    message: UnionResolveTypeRequest,
    reader: jspb.BinaryReader,
  ): UnionResolveTypeRequest;
}

export namespace UnionResolveTypeRequest {
  export type AsObject = {
    pb_function?: Function.AsObject;
    value?: Value.AsObject;
    info?: UnionResolveTypeInfo.AsObject;
  };
}

export class UnionResolveTypeResponse extends jspb.Message {
  hasType(): boolean;
  clearType(): void;
  getType(): TypeRef | undefined;
  setType(value?: TypeRef): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnionResolveTypeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UnionResolveTypeResponse): UnionResolveTypeResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: UnionResolveTypeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnionResolveTypeResponse;
  static deserializeBinaryFromReader(
    message: UnionResolveTypeResponse,
    reader: jspb.BinaryReader,
  ): UnionResolveTypeResponse;
}

export namespace UnionResolveTypeResponse {
  export type AsObject = {
    type?: TypeRef.AsObject;
    error?: Error.AsObject;
  };
}

export class StreamInfo extends jspb.Message {
  getFieldname(): string;
  setFieldname(value: string): void;

  hasPath(): boolean;
  clearPath(): void;
  getPath(): ResponsePath | undefined;
  setPath(value?: ResponsePath): void;

  hasReturntype(): boolean;
  clearReturntype(): void;
  getReturntype(): TypeRef | undefined;
  setReturntype(value?: TypeRef): void;

  hasParenttype(): boolean;
  clearParenttype(): void;
  getParenttype(): TypeRef | undefined;
  setParenttype(value?: TypeRef): void;

  hasOperation(): boolean;
  clearOperation(): void;
  getOperation(): OperationDefinition | undefined;
  setOperation(value?: OperationDefinition): void;

  getVariablevaluesMap(): jspb.Map<string, Value>;
  clearVariablevaluesMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamInfo.AsObject;
  static toObject(includeInstance: boolean, msg: StreamInfo): StreamInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: StreamInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamInfo;
  static deserializeBinaryFromReader(message: StreamInfo, reader: jspb.BinaryReader): StreamInfo;
}

export namespace StreamInfo {
  export type AsObject = {
    fieldname: string;
    path?: ResponsePath.AsObject;
    returntype?: TypeRef.AsObject;
    parenttype?: TypeRef.AsObject;
    operation?: OperationDefinition.AsObject;

    variablevaluesMap: Array<[string, Value.AsObject]>;
  };
}

export class StreamRequest extends jspb.Message {
  hasFunction(): boolean;
  clearFunction(): void;
  getFunction(): Function | undefined;
  setFunction(value?: Function): void;

  getArgumentsMap(): jspb.Map<string, Value>;
  clearArgumentsMap(): void;

  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): StreamInfo | undefined;
  setInfo(value?: StreamInfo): void;

  getSecretsMap(): jspb.Map<string, string>;
  clearSecretsMap(): void;

  hasProtocol(): boolean;
  clearProtocol(): void;
  getProtocol(): Value | undefined;
  setProtocol(value?: Value): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamRequest): StreamRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: StreamRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamRequest;
  static deserializeBinaryFromReader(message: StreamRequest, reader: jspb.BinaryReader): StreamRequest;
}

export namespace StreamRequest {
  export type AsObject = {
    pb_function?: Function.AsObject;

    argumentsMap: Array<[string, Value.AsObject]>;
    info?: StreamInfo.AsObject;

    secretsMap: Array<[string, string]>;
    protocol?: Value.AsObject;
  };
}

export class StreamMessage extends jspb.Message {
  hasResponse(): boolean;
  clearResponse(): void;
  getResponse(): Value | undefined;
  setResponse(value?: Value): void;

  hasError(): boolean;
  clearError(): void;
  getError(): Error | undefined;
  setError(value?: Error): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamMessage.AsObject;
  static toObject(includeInstance: boolean, msg: StreamMessage): StreamMessage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: StreamMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamMessage;
  static deserializeBinaryFromReader(message: StreamMessage, reader: jspb.BinaryReader): StreamMessage;
}

export namespace StreamMessage {
  export type AsObject = {
    response?: Value.AsObject;
    error?: Error.AsObject;
  };
}

export class ByteStreamRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ByteStreamRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ByteStreamRequest): ByteStreamRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ByteStreamRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ByteStreamRequest;
  static deserializeBinaryFromReader(message: ByteStreamRequest, reader: jspb.BinaryReader): ByteStreamRequest;
}

export namespace ByteStreamRequest {
  export type AsObject = {};
}

export class ByteStream extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ByteStream.AsObject;
  static toObject(includeInstance: boolean, msg: ByteStream): ByteStream.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: ByteStream, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ByteStream;
  static deserializeBinaryFromReader(message: ByteStream, reader: jspb.BinaryReader): ByteStream;
}

export namespace ByteStream {
  export type AsObject = {
    data: Uint8Array | string;
  };
}
