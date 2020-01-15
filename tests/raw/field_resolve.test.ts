import {
  FieldResolveResponse,
  Error as ProtoError,
  FieldResolveRequest,
  Function,
  Value,
  FieldResolveInfo,
} from '../../src/proto/driver_pb';
import { fieldResolveHandler } from '../../src/raw/field_resolve';
describe('raw field resolve handler', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('checks content type', async () => {
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
        contentType: 'application/x-protobuf;message=FieldResolveRequest',
        expectedErrorMessage: '"application/x-protobuf;message=FieldResolveRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new FieldResolveResponse();
        const responseError = new ProtoError();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(expectedResponse.serializeBinary(), await fieldResolveHandler(tc.contentType, new Uint8Array()));
        return Promise.resolve();
      }),
    );
  });
  it('calls handler', async () => {
    const req = new FieldResolveRequest();
    req.setInfo(new FieldResolveInfo());
    const func = new Function();
    func.setName('function');
    req.setFunction(func);
    const expected = new FieldResolveResponse();
    const nilObject = new Value();
    nilObject.setNil(true);
    expected.setResponse(nilObject);
    const handler = jest.fn();
    jest.mock(
      `${process.cwd()}/function`,
      () => {
        return handler;
      },
      { virtual: true },
    );
    const response = await fieldResolveHandler(
      'application/x-protobuf;message=FieldResolveRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
