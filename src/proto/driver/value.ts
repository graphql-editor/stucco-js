import * as jspb from 'google-protobuf';
import { messages } from 'stucco-ts-proto-gen';

export type RecordOfValues = Record<string, messages.Value>;
export type RecordOfUnknown = Record<string, unknown>;

export function valueFromAny(data: unknown): messages.Value {
  const val = new messages.Value();
  if (data === null || typeof data === 'undefined') {
    val.setNil(true);
  } else if (Buffer.isBuffer(data)) {
    val.setAny(Uint8Array.from(data));
  } else if (ArrayBuffer.isView(data)) {
    val.setAny(new Uint8Array(data.buffer));
  } else if (Array.isArray(data)) {
    val.setA(data.reduce((pv, cv) => pv.addItems(valueFromAny(cv)) && pv, new messages.ArrayValue()));
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
        val.setO(
          Object.keys(data as RecordOfUnknown).reduce(
            (pv, cv) => pv.getPropsMap().set(cv, valueFromAny((data as RecordOfUnknown)[cv])) && pv,
            new messages.ObjectValue(),
          ),
        );
        break;
    }
  }
  return val;
}

export function getFromValue(value?: messages.Value, variables?: RecordOfValues): unknown | undefined {
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
    const props = value?.getO()?.getPropsMap();
    if (props) {
      return getRecordFromValueMap(props);
    }
    return;
  }
  if (value.hasA()) {
    const items = value?.getA()?.getItemsList();
    if (items) {
      return items.map((v) => getFromValue(v));
    }
    return;
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

const jspbMapReducer = (variables?: RecordOfValues) => (
  m: jspb.Map<string, messages.Value>,
  out: RecordOfUnknown,
): RecordOfUnknown => {
  m.forEach((v, k) => (out[k] = getFromValue(v, variables)));
  return out;
};

export const getRecordFromValueMap = (
  m: jspb.Map<string, messages.Value>,
  variables?: RecordOfValues,
): RecordOfUnknown => jspbMapReducer(variables)(m, {});
