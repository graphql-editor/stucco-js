import {
  InterfaceResolveTypeResponse,
  Error as ProtoError,
  InterfaceResolveTypeRequest,
  Function,
  InterfaceResolveTypeInfo,
  TypeRef,
} from '../../src/proto/driver_pb';
import { interfaceResolveTypeHandler } from '../../src/raw/interface_resolve_type';
describe('raw interface resolve type handler', () => {
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
        contentType: 'application/x-protobuf;message=InterfaceResolveTypeRequest',
        expectedErrorMessage:
          '"application/x-protobuf;message=InterfaceResolveTypeRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new InterfaceResolveTypeResponse();
        const responseError = new ProtoError();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(
          expectedResponse.serializeBinary(),
          await interfaceResolveTypeHandler(tc.contentType, new Uint8Array()),
        );
        return Promise.resolve();
      }),
    );
  });
  it('calls handler', async () => {
    const req = new InterfaceResolveTypeRequest();
    req.setInfo(new InterfaceResolveTypeInfo());
    const func = new Function();
    func.setName('function');
    req.setFunction(func);
    const expected = new InterfaceResolveTypeResponse();
    const typeRef = new TypeRef();
    typeRef.setName('SomeType');
    expected.setType(typeRef);
    const handler = jest.fn(() => 'SomeType');
    jest.mock(
      `${process.cwd()}/function`,
      () => {
        return handler;
      },
      { virtual: true },
    );
    const response = await interfaceResolveTypeHandler(
      'application/x-protobuf;message=InterfaceResolveTypeRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
