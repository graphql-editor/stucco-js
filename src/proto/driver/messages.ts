import { messages } from 'stucco-ts-proto-gen';

export class ObjectValue extends messages.ObjectValue {}
export class ArrayValue extends messages.ArrayValue {}
export class Value extends messages.Value {}
export class Error extends messages.Error {}
export class Function extends messages.Function {}
export class TypeRef extends messages.TypeRef {}
export class ResponsePath extends messages.ResponsePath {}
export class Variable extends messages.Variable {}
export class VariableDefinition extends messages.VariableDefinition {}
export class Directive extends messages.Directive {}
export class FragmentDefinition extends messages.FragmentDefinition {}
export class Selection extends messages.Selection {}
export class OperationDefinition extends messages.OperationDefinition {}
export class FieldResolveInfo extends messages.FieldResolveInfo {}
export class FieldResolveRequest extends messages.FieldResolveRequest {}
export class FieldResolveResponse extends messages.FieldResolveResponse {}
export class InterfaceResolveTypeInfo extends messages.InterfaceResolveTypeInfo {}
export class InterfaceResolveTypeRequest extends messages.InterfaceResolveTypeRequest {}
export class InterfaceResolveTypeResponse extends messages.InterfaceResolveTypeResponse {}
export class ScalarParseRequest extends messages.ScalarParseRequest {}
export class ScalarParseResponse extends messages.ScalarParseResponse {}
export class ScalarSerializeRequest extends messages.ScalarSerializeRequest {}
export class ScalarSerializeResponse extends messages.ScalarSerializeResponse {}
export class UnionResolveTypeInfo extends messages.UnionResolveTypeInfo {}
export class UnionResolveTypeRequest extends messages.UnionResolveTypeRequest {}
export class UnionResolveTypeResponse extends messages.UnionResolveTypeResponse {}
export class Secret extends messages.Secret {}
export class SetSecretsRequest extends messages.SetSecretsRequest {}
export class SetSecretsResponse extends messages.SetSecretsResponse {}
export class StreamInfo extends messages.StreamInfo {}
export class StreamRequest extends messages.StreamRequest {}
export class StreamMessage extends messages.StreamMessage {}
export class ByteStreamRequest extends messages.ByteStreamRequest {}
export class ByteStream extends messages.ByteStream {}
export class SubscriptionConnectionRequest extends messages.SubscriptionConnectionRequest {}
export class SubscriptionConnectionResponse extends messages.SubscriptionConnectionResponse {}
export class SubscriptionListenRequest extends messages.SubscriptionListenRequest {}
export class SubscriptionListenMessage extends messages.SubscriptionListenMessage {}
export class AuthorizeRequest extends messages.AuthorizeRequest {}
export class AuthorizeResponse extends messages.AuthorizeResponse {}

export function anyValue(data: Uint8Array): messages.Value {
  const v = new messages.Value();
  v.setAny(data);
  return v;
}

export function nilValue(): messages.Value {
  const v = new messages.Value();
  v.setNil(true);
  return v;
}

export function variableValue(variable: string): messages.Value {
  const v = new messages.Value();
  v.setVariable(variable);
  return v;
}

export function stringValue(s: string): messages.Value {
  const v = new messages.Value();
  v.setS(s);
  return v;
}

export function intValue(i: number): messages.Value {
  const v = new messages.Value();
  v.setI(i);
  return v;
}

export function uintValue(u: number): messages.Value {
  const v = new messages.Value();
  v.setU(u);
  return v;
}

export function floatValue(f: number): messages.Value {
  const v = new messages.Value();
  v.setF(f);
  return v;
}

export function booleanValue(b: boolean): messages.Value {
  const v = new messages.Value();
  v.setB(b);
  return v;
}

export function arrValue(items: messages.Value[]): messages.Value {
  const v = new messages.Value();
  v.setA(items.reduce((pv, cv) => (pv.addItems(cv) && pv) || pv, new messages.ArrayValue()));
  return v;
}

export function objValue(items: Record<string, messages.Value>): messages.Value {
  const v = new messages.Value();
  v.setO(Object.keys(items).reduce((pv, cv) => pv.getPropsMap().set(cv, items[cv]) && pv, new messages.ObjectValue()));
  return v;
}
