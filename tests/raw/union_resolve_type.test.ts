import { messages } from 'stucco-ts-proto-gen';
import { unionResolveTypeHandler } from '../../src/raw/union_resolve_type';
describe('raw union resolve type handler', () => {
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
        contentType: 'application/x-protobuf;message=UnionResolveTypeRequest',
        expectedErrorMessage: '"application/x-protobuf;message=UnionResolveTypeRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new messages.UnionResolveTypeResponse();
        const responseError = new messages.Error();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(
          expectedResponse.serializeBinary(),
          await unionResolveTypeHandler(tc.contentType, new Uint8Array()),
        );
        return Promise.resolve();
      }),
    );
  });
  it('calls handler', async () => {
    const req = new messages.UnionResolveTypeRequest();
    req.setInfo(new messages.UnionResolveTypeInfo());
    const func = new messages.Function();
    func.setName('function');
    req.setFunction(func);
    const expected = new messages.UnionResolveTypeResponse();
    const typeRef = new messages.TypeRef();
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
    const response = await unionResolveTypeHandler(
      'application/x-protobuf;message=UnionResolveTypeRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
