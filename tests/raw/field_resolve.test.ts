import * as messages from '../../src/proto/driver/messages';
import { fieldResolveHandler } from '../../src/raw/field_resolve.js';
import { join } from 'path';
describe('raw field resolve handler', () => {
  const cwd = process.cwd();
  beforeEach(() => {
    process.chdir(join(cwd, 'tests', 'raw', 'testdata'));
  });
  afterEach(() => {
    process.chdir(cwd);
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
        const expectedResponse = new messages.FieldResolveResponse();
        const responseError = new messages.Error();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(expectedResponse.serializeBinary(), await fieldResolveHandler(tc.contentType, new Uint8Array()));
        return Promise.resolve();
      }),
    );
  });
  it('calls handler', async () => {
    const req = new messages.FieldResolveRequest();
    req.setInfo(new messages.FieldResolveInfo());
    const func = new messages.Function();
    func.setName('field_nil_resolve');
    req.setFunction(func);
    const expected = new messages.FieldResolveResponse();
    const nilObject = new messages.Value();
    nilObject.setNil(true);
    expected.setResponse(nilObject);
    const response = await fieldResolveHandler(
      'application/x-protobuf;message=FieldResolveRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
  });
});
