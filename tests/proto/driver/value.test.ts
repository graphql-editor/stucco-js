import * as value from '../../../src/proto/driver/value.js';
import * as messages from '../../../src/proto/driver/messages.js';
const {
  nilValue,
  anyValue,
  arrValue,
  stringValue,
  intValue,
  uintValue,
  floatValue,
  booleanValue,
  objValue,
  variableValue,
} = messages;

describe('value marshaling/unmarshaling', () => {
  it('marshals undefined and null', () => {
    expect(value.valueFromAny(undefined)).toEqual(nilValue());
    expect(value.valueFromAny(null)).toEqual(nilValue());
  });
  it('marshals bytes', () => {
    const expected8 = anyValue(Uint8Array.from(Buffer.from('data')));
    const expected16 = anyValue(new Uint8Array(Uint16Array.from(Buffer.from('data')).buffer));
    const expected32 = anyValue(new Uint8Array(Uint32Array.from(Buffer.from('data')).buffer));
    expect(value.valueFromAny(Buffer.from('data'))).toEqual(expected8);
    expect(value.valueFromAny(Uint8Array.from(Buffer.from('data')))).toEqual(expected8);
    expect(value.valueFromAny(Uint16Array.from(Buffer.from('data')))).toEqual(expected16);
    expect(value.valueFromAny(Uint32Array.from(Buffer.from('data')))).toEqual(expected32);
  });
  it('marshals array', () => {
    expect(value.valueFromAny(['a', 'b'])).toEqual(arrValue([stringValue('a'), stringValue('b')]));
  });
  it('marshals integral', () => {
    expect(value.valueFromAny(1)).toEqual(intValue(1));
  });
  it('marshals floating point', () => {
    expect(value.valueFromAny(1.1)).toEqual(floatValue(1.1));
  });
  it('marshals boolean', () => {
    expect(value.valueFromAny(true)).toEqual(booleanValue(true));
  });
  it('marshals object', () => {
    expect(
      value.valueFromAny({
        prop: 'value',
      }),
    ).toEqual(objValue({ prop: stringValue('value') }));
  });
  it('handles undefined and bad value', () => {
    expect(value.getFromValue(undefined)).toBeUndefined();
    expect(value.getFromValue(new messages.Value())).toBeUndefined();
  });
  it('unmarshals nil', () => {
    expect(value.getFromValue(nilValue())).toEqual(null);
  });
  it('unmarshals integral', () => {
    expect(value.getFromValue(intValue(1))).toEqual(1);
  });
  it('unmarshals unsigned integral', () => {
    expect(value.getFromValue(uintValue(1))).toEqual(1);
  });
  it('unmarshals floating point', () => {
    expect(value.getFromValue(floatValue(1.1))).toEqual(1.1);
  });
  it('unmarshals string', () => {
    expect(value.getFromValue(stringValue('string'))).toEqual('string');
  });
  it('unmarshals boolean', () => {
    expect(value.getFromValue(booleanValue(true))).toEqual(true);
  });
  it('unmarshals object', () => {
    expect(
      value.getFromValue(
        objValue({
          prop: stringValue('value'),
        }),
      ),
    ).toEqual({ prop: 'value' });
  });
  it('unmarshals array', () => {
    expect(value.getFromValue(arrValue([stringValue('value')]))).toEqual(['value']);
  });
  it('unmarshals bytes', () => {
    expect(value.getFromValue(anyValue(Uint8Array.from(Buffer.from('data'))))).toEqual(
      Uint8Array.from(Buffer.from('data')),
    );
  });
  it('unmarshals variable to value', () => {
    expect(
      value.getFromValue(variableValue('variable'), {
        variable: stringValue('value'),
      }),
    ).toEqual('value');
    expect(value.getFromValue(variableValue('variable'))).toEqual(undefined);
  });
});
