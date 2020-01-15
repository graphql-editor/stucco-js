import * as jspb from 'google-protobuf';
import { Value, ArrayValue, ObjectValue } from "../driver_pb";

export type RecordOfValues = Record<string, Value>
export type RecordOfUnknown = Record<string, unknown>


export function valueFromAny(data: unknown): Value {
  const val = new Value();
  if (data === null || typeof data === 'undefined') {
    val.setNil(true)
  } else if (Buffer.isBuffer(data)) {
    val.setAny(Uint8Array.from(data));
  } else if (ArrayBuffer.isView(data)) {
    val.setAny(new Uint8Array(data.buffer));
  } else if (Array.isArray(data)) {
    val.setA(data.reduce(
      (pv, cv) => pv.addItems(valueFromAny(cv)) && pv,
      new ArrayValue(),
    ));
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
      const obj = data as RecordOfUnknown;
      val.setO(Object.keys(obj).reduce(
        (pv, cv) => pv.getPropsMap().set(cv, valueFromAny(obj[cv])) && pv,
        new ObjectValue(),
      ));
      break;
    }
  }
  return val;
}

export function getFromValue(value?: Value, variables?: RecordOfValues): unknown {
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
    return getRecordFromValueMap(value.getO().getPropsMap())
  }
  if (value.hasA()) {
    return value.getA().getItemsList().map(v => getFromValue(v));
  }
  if (value.hasAny()) {
    return value.getAny_asU8();
  }
  if (value.hasVariable()) {
    if (variables) {
      return getFromValue(variables[value.getVariable()]);
    }
  }
  return;
}

const jspbMapReducer = (variables?: RecordOfValues) =>
  (m: jspb.Map<string, Value>, out: RecordOfUnknown): RecordOfUnknown => {
    m.forEach((v, k) => out[k] = getFromValue(v, variables));
    return out;
  }

export const getRecordFromValueMap = (
  m: jspb.Map<string, Value>,
  variables?: RecordOfValues,
) => jspbMapReducer(variables)(m, {});