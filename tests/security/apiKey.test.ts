import { ApiKeyAuth } from '../../src/security/apiKey';
import { IncomingMessage } from 'http';

describe('api key auth', () => {
  const mockRequest = (headers: Record<string, string>) => (({ headers } as unknown) as IncomingMessage);
  const xStuccoApiKey = 'x-stucco-api-key';
  test('test authorizes valid x-stucco-api-key', () =>
    expect(new ApiKeyAuth('xyz').authorize(mockRequest({ [xStuccoApiKey]: 'xyz' }))).resolves.toBeTruthy());
  test('test fails nvalid x-stucco-api-key', () =>
    expect(new ApiKeyAuth('xz').authorize(mockRequest({ [xStuccoApiKey]: 'xyz' }))).resolves.toBeFalsy());
  test('test authorizes valid authorize', () =>
    expect(new ApiKeyAuth('xyz').authorize(mockRequest({ authorization: 'bearer xyz' }))).resolves.toBeTruthy());
});
