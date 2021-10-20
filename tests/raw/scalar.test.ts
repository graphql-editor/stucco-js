import * as messages from '../../src/proto/driver/messages';
import { scalarParseHandler, scalarSerializeHandler } from '../../src/raw/scalar.js';
import { join } from 'path';
describe('scalar', () => {
  const cwd = process.cwd();
  beforeEach(() => {
    process.chdir(join(cwd, 'tests', 'raw', 'testdata'));
  });
  afterEach(() => {
    process.chdir(cwd);
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
        const expectedResponse = new messages.ScalarParseResponse();
        const responseError = new messages.Error();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(expectedResponse.serializeBinary(), await scalarParseHandler(tc.contentType, new Uint8Array()));
        return Promise.resolve();
      }),
    );
  });
  it('parse handler calls handler', async () => {
    const req = new messages.ScalarParseRequest();
    const func = new messages.Function();
    func.setName('scalar_nil_parse');
    req.setFunction(func);
    const expected = new messages.ScalarParseResponse();
    const nilObject = new messages.Value();
    nilObject.setNil(true);
    expected.setValue(nilObject);
    const response = await scalarParseHandler(
      'application/x-protobuf;message=ScalarParseRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
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
        const expectedResponse = new messages.ScalarSerializeResponse();
        const responseError = new messages.Error();
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
    const req = new messages.ScalarSerializeRequest();
    const func = new messages.Function();
    func.setName('scalar_nil_serialize');
    req.setFunction(func);
    const expected = new messages.ScalarSerializeResponse();
    const nilObject = new messages.Value();
    nilObject.setNil(true);
    expected.setValue(nilObject);
    const response = await scalarSerializeHandler(
      'application/x-protobuf;message=ScalarSerializeRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
  });
});
