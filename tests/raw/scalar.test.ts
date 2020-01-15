import {
  ScalarParseResponse,
  Error as ProtoError,
  ScalarParseRequest,
  Function,
  Value,
  ScalarSerializeResponse,
  ScalarSerializeRequest,
} from '../../src/proto/driver_pb';
import { scalarParseHandler, scalarSerializeHandler } from '../../src/raw/scalar';
describe('scalar', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('parse handler checks content type', async () => {
    const data: Array<{
      contentType: string;
      expectedErrorMessage: string;
      assertion: (expected: Uint8Array, actual: Uint8Array) => void;
    }> = [
      {
        contentType: 'application/x-protobuf',
        expectedErrorMessage: '"application/x-protobuf" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).toEqual(expected);
        },
      },
      {
        contentType: 'application/x-protobuf;message=ScalarParseRequest',
        expectedErrorMessage: '"application/x-protobuf;message=ScalarParseRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new ScalarParseResponse();
        const responseError = new ProtoError();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(expectedResponse.serializeBinary(), await scalarParseHandler(tc.contentType, new Uint8Array()));
        return Promise.resolve();
      }),
    );
  });
  it('parse handler calls handler', async () => {
    const req = new ScalarParseRequest();
    const func = new Function();
    func.setName('function');
    req.setFunction(func);
    const expected = new ScalarParseResponse();
    const nilObject = new Value();
    nilObject.setNil(true);
    expected.setValue(nilObject);
    const handler = jest.fn();
    jest.mock(
      `${process.cwd()}/function`,
      () => {
        return handler;
      },
      { virtual: true },
    );
    const response = await scalarParseHandler(
      'application/x-protobuf;message=ScalarParseRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('serialize handler checks content type', async () => {
    const data: Array<{
      contentType: string;
      expectedErrorMessage: string;
      assertion: (expected: Uint8Array, actual: Uint8Array) => void;
    }> = [
      {
        contentType: 'application/x-protobuf',
        expectedErrorMessage: '"application/x-protobuf" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).toEqual(expected);
        },
      },
      {
        contentType: 'application/x-protobuf;message=ScalarSerializeRequest',
        expectedErrorMessage: '"application/x-protobuf;message=ScalarSerializeRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new ScalarSerializeResponse();
        const responseError = new ProtoError();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(
          expectedResponse.serializeBinary(),
          await scalarSerializeHandler(tc.contentType, new Uint8Array()),
        );
        return Promise.resolve();
      }),
    );
  });
  it('serialize handler calls handler', async () => {
    const req = new ScalarSerializeRequest();
    const func = new Function();
    func.setName('function');
    req.setFunction(func);
    const expected = new ScalarSerializeResponse();
    const nilObject = new Value();
    nilObject.setNil(true);
    expected.setValue(nilObject);
    const handler = jest.fn();
    jest.mock(
      `${process.cwd()}/function`,
      () => {
        return handler;
      },
      { virtual: true },
    );
    const response = await scalarSerializeHandler(
      'application/x-protobuf;message=ScalarSerializeRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
