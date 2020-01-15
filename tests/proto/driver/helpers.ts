import { ArrayValue, Value, ObjectValue } from '../../../src/proto/driver_pb';

export function anyValue(data: Uint8Array): Value {
  const v = new Value();
  v.setAny(data);
  return v;
}

export function nilValue(): Value {
  const v = new Value();
  v.setNil(true);
  return v;
}

export function variableValue(variable: string): Value {
  const v = new Value();
  v.setVariable(variable);
  return v;
}

export function stringValue(s: string): Value {
  const v = new Value();
  v.setS(s);
  return v;
}

export function intValue(i: number): Value {
  const v = new Value();
  v.setI(i);
  return v;
}

export function uintValue(u: number): Value {
  const v = new Value();
  v.setU(u);
  return v;
}

export function floatValue(f: number): Value {
  const v = new Value();
  v.setF(f);
  return v;
}

export function booleanValue(b: boolean): Value {
  const v = new Value();
  v.setB(b);
  return v;
}

export function arrValue(items: Value[]): Value {
  const v = new Value();
  v.setA(items.reduce((pv, cv) => (pv.addItems(cv) && pv) || pv, new ArrayValue()));
  return v;
}

export function objValue(items: Record<string, Value>): Value {
  const v = new Value();
  v.setO(Object.keys(items).reduce((pv, cv) => pv.getPropsMap().set(cv, items[cv]) && pv, new ObjectValue()));
  return v;
}
