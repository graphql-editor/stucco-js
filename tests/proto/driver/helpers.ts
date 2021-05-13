import { messages } from 'stucco-ts-proto-gen';

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
