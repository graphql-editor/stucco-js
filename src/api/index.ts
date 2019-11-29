export interface INamedTypeRef {
  name: string;
}

export interface INonNullTypeRef {
  nonNull: TypeRef;
}

export interface IListTypeRef {
  list: TypeRef;
}

export type TypeRef = INamedTypeRef | INonNullTypeRef | IListTypeRef | undefined;

export function isNamedTypeRef(tp: TypeRef): tp is INamedTypeRef {
  return typeof tp !== "undefined" && "name" in tp;
}

export function isNonNullTypeRef(tp: TypeRef): tp is INonNullTypeRef {
  return typeof tp !== "undefined" && "nonNull" in tp;
}

export function isListTypeRef(tp: TypeRef): tp is IListTypeRef {
  return typeof tp !== "undefined" && "list" in tp;
}

export interface IResponsePath {
  prev?: IResponsePath;
  key: string;
}

export interface IDirective {
  name: string;
  arguments?: Record<string, any>;
}

export interface IDirectives extends Array<IDirective> { }

export interface IVariable {
  name: string;
}

export interface IVariableDefinition {
  variable: IVariable;
  defaultValue?: any;
}

export interface IVariableDefinitions extends Array<IVariableDefinition> { }

export interface IFieldSelection {
  name: string;
  arguments?: Record<string, any>;
  directives?: IDirectives;
  selectionSet?: ISelections;
}

export interface IFragmentDefitnion {
  typeCondition: TypeRef;
  directives?: IDirectives;
  variableDefinitions?: IVariableDefinitions;
  selectionSet: ISelections;
}

export interface IFragmentSelection {
  definition: IFragmentDefitnion;
}

export type Selection = IFieldSelection | IFragmentSelection;

export interface ISelections extends Array<Selection> { }

export interface IOperationDefinition {
  operation: string;
  name?: string;
  variableDefinitions?: IVariableDefinitions;
  directives?: IDirectives;
  selectionSet?: ISelections;
}

export interface IHttpRequest {
  headers?: Record<string, string[]>;
}

export type Protocol = IHttpRequest;

export interface IFieldResolveInfo {
  fieldName: string;
  path?: IResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: IOperationDefinition;
  variableValues?: Record<string, any>;
}

export interface IFieldResolveInput {
  source?: any;
  arguments?: Record<string, any>;
  info: IFieldResolveInfo;
  protocol?: Protocol;
  environment?: any;
}

export interface IFieldResolveOutput {
  response?: any;
  error?: Error;
}

export interface IInterfaceResolveTypeInfo {
  fieldName: string;
  path?: IResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: IOperationDefinition;
  variableValues?: Record<string, any>;
}

export interface IInterfaceResolveTypeInput {
  value?: any;
  info: IInterfaceResolveTypeInfo;
}

export interface IInterfaceResolveTypeOutput {
  type?: string;
  error?: Error;
}

export interface IScalarParseInput {
  value: any;
}

export interface IScalarParseOutput {
  response?: any;
  error?: Error;
}

export interface IScalarSerializeInput {
  value: any;
}

export interface IScalarSerializeOutput {
  response?: any;
  error?: Error;
}

export interface IUnionResolveTypeInfo {
  fieldName: string;
  path?: IResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: IOperationDefinition;
  variableValues?: Record<string, any>;
}

export interface IUnionResolveTypeInput {
  value?: any;
  info: IUnionResolveTypeInfo;
}

export interface IUnionResolveTypeOutput {
  type?: string;
  error?: Error;
}

export type FieldResolveHandler = (input: IFieldResolveInput) => IFieldResolveOutput;
export type InterfaceResolveTypeHandler = (input: IInterfaceResolveTypeInput) => IInterfaceResolveTypeOutput;
export type ScalarParseHandler = (input: IScalarParseInput) => IScalarParseOutput;
export type ScalarSerializeHandler = (input: IScalarSerializeInput) => IScalarSerializeOutput;
export type UnionResolveTypeHandler = (input: IUnionResolveTypeInput) => IUnionResolveTypeOutput;
