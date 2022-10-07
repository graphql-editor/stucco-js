export interface NamedTypeRef {
  name: string;
}

export interface NonNullTypeRef {
  nonNull: TypeRef;
}

export interface ListTypeRef {
  list: TypeRef;
}

export type TypeRef = NamedTypeRef | NonNullTypeRef | ListTypeRef | undefined;

export const isNamedTypeRef = (tp: TypeRef): tp is NamedTypeRef => typeof tp !== 'undefined' && 'name' in tp;

export const isNonNullTypeRef = (tp: TypeRef): tp is NonNullTypeRef => typeof tp !== 'undefined' && 'nonNull' in tp;

export const isListTypeRef = (tp: TypeRef): tp is ListTypeRef => typeof tp !== 'undefined' && 'list' in tp;

export interface ResponsePath {
  prev?: ResponsePath;
  key: unknown;
}

export interface Directive {
  name: string;
  arguments?: Record<string, unknown>;
}

export type Directives = Directive[];

export interface Variable {
  name: string;
}

export interface VariableDefinition {
  variable: Variable;
  defaultValue?: unknown;
}

export type VariableDefinitions = VariableDefinition[];

export interface FieldSelection {
  name: string;
  arguments?: Record<string, unknown>;
  directives?: Directives;
  selectionSet?: Selections;
}

export interface FragmentDefitnion {
  typeCondition: TypeRef;
  directives?: Directives;
  variableDefinitions?: VariableDefinitions;
  selectionSet: Selections;
}

export interface FragmentSelection {
  definition: FragmentDefitnion;
}

export type Selection = FieldSelection | FragmentSelection;

export type Selections = Selection[];

export interface OperationDefinition {
  operation: string;
  name?: string;
  variableDefinitions?: VariableDefinitions;
  directives?: Directives;
  selectionSet?: Selections;
}

export interface HttpRequestURL {
  host?: string;
  path?: string;
  query?: string;
}

export interface HttpRequest {
  body?: Buffer;
  headers?: Record<string, string[]>;
  host?: string;
  method?: string;
  proto?: string;
  remoteAddress?: string;
  url?: HttpRequestURL;
}

export type Protocol = HttpRequest;

export interface FieldResolveInfo {
  fieldName: string;
  path?: ResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: OperationDefinition;
  variableValues?: Record<string, unknown>;
  rootValue?: unknown;
}

export interface FieldResolveInput<Arguments = Record<string, unknown> | undefined, Source = unknown | undefined> {
  source?: Source;
  arguments?: Arguments;
  info: FieldResolveInfo;
  protocol?: Protocol;
  environment?: unknown;
  subscriptionPayload?: unknown;
}

export type FieldResolveOutput<T = unknown | (() => unknown)> =
  | {
      response?: T;
      error?: Error;
    }
  | T;

export interface InterfaceResolveTypeInfo {
  fieldName: string;
  path?: ResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: OperationDefinition;
  variableValues?: Record<string, unknown>;
}

export interface InterfaceResolveTypeInput {
  value?: unknown;
  info: InterfaceResolveTypeInfo;
}

export type InterfaceResolveTypeOutput =
  | {
      type?: string | (() => string);
      error?: Error;
    }
  | (() => string)
  | string;

export interface SetSecretsInput {
  secrets: {
    [k: string]: string;
  };
}

export type SetSecretsOutput =
  | {
      error?: Error;
    }
  | (() => void)
  | undefined;

export interface ScalarParseInput {
  value: unknown;
}

export type ScalarParseOutput =
  | {
      response?: unknown | (() => unknown);
      error?: Error;
    }
  | (() => unknown)
  | unknown;

export interface ScalarSerializeInput {
  value: unknown;
}

export type ScalarSerializeOutput =
  | {
      response?: unknown | (() => unknown);
      error?: Error;
    }
  | (() => unknown)
  | unknown;

export interface UnionResolveTypeInfo {
  fieldName: string;
  path?: ResponsePath;
  returnType?: TypeRef;
  parentType?: TypeRef;
  operation?: OperationDefinition;
  variableValues?: Record<string, unknown>;
}

export interface UnionResolveTypeInput {
  value?: unknown;
  info: UnionResolveTypeInfo;
}

export type UnionResolveTypeOutput =
  | {
      type?: string | (() => string);
      error?: Error;
    }
  | (() => string)
  | string;

export interface SubscriptionConnectionInput {
  query: string;
  variableValues?: Record<string, unknown>;
  operationName?: string;
  protocol?: Protocol;
  operation?: OperationDefinition;
}

export type SubscriptionConnectionOutput<T = unknown | (() => unknown)> =
  | {
      response?: T;
      error?: Error;
    }
  | T;

export interface SubscriptionListenEmitter {
  emit: (v?: unknown) => Promise<void>;
  on(ev: 'close', handler: (err?: Error) => void): void;
  off(ev: 'close', handler: (err?: Error) => void): void;
}
export interface SubscriptionListenInput {
  query: string;
  variableValues?: Record<string, unknown>;
  operationName?: string;
  protocol?: Protocol;
  operation?: OperationDefinition;
}

export interface AuthorizeInput {
  query?: string;
  variableValues?: Record<string, unknown>;
  operationName?: string;
  protocol?: Protocol;
}
export type AuthorizeOutput = boolean | { error: Error };

export type FieldResolveHandler = (input: FieldResolveInput) => FieldResolveOutput;
export type InterfaceResolveTypeHandler = (input: InterfaceResolveTypeInput) => InterfaceResolveTypeOutput;
export type ScalarParseHandler = (input: ScalarParseInput) => ScalarParseOutput;
export type ScalarSerializeHandler = (input: ScalarSerializeInput) => ScalarSerializeOutput;
export type UnionResolveTypeHandler = (input: UnionResolveTypeInput) => UnionResolveTypeOutput;
export type SubscriptionConnectionHandler = (input: SubscriptionConnectionInput) => SubscriptionConnectionOutput;
export type SubscriptionListenHandler = (input: SubscriptionListenInput, emitter: SubscriptionListenEmitter) => void;

export type AuthorizeHandler = (input: AuthorizeInput) => AuthorizeOutput;
