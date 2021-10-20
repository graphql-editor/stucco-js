import { jest } from '@jest/globals';
import { getHandler } from '../../src/handler/index.js';
import { join } from 'path';

import * as messages from '../../src/proto/driver/messages.js';
import { unionResolveTypeHandler } from '../../src/raw/union_resolve_type.js';
describe('raw union resolve type handler', () => {
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
    func.setName('union_handler');
    req.setFunction(func);
    const expected = new messages.UnionResolveTypeResponse();
    const typeRef = new messages.TypeRef();
    typeRef.setName('SomeType');
    expected.setType(typeRef);
    const response = await unionResolveTypeHandler(
      'application/x-protobuf;message=UnionResolveTypeRequest',
      req.serializeBinary(),
    );
    expect(response).toEqual(expected.serializeBinary());
  });
});
