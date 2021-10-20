import { MultiAuth, DefaultSecurity } from '../../src/security/index.js';
import { IncomingMessage } from 'http';

describe('multi auth', () => {
  test('can create default security', () => {
    process.env['STUCCO_FUNCTION_KEY'] = 'xyz';
    const sec = DefaultSecurity();
    expect(sec && sec.authHandlers).toHaveLength(1);
    delete process.env['STUCCO_FUNCTION_KEY'];
  });
  test('multi auth requries handlers', () => expect(() => new MultiAuth([])).toThrow());
  const mockOkHandler = {
    authorize: () => Promise.resolve(true),
  };
  const mockNotOkHandler = {
    authorize: () => Promise.resolve(false),
  };
  const mockReq = {} as unknown as IncomingMessage;
  test('sets user handlers', () => expect(new MultiAuth([mockOkHandler]).authHandlers).toHaveLength(1));
  test('passes with one success', () =>
    expect(new MultiAuth([mockNotOkHandler, mockOkHandler]).authorize(mockReq)).toBeTruthy());
  test('fails with no success', () =>
    expect(new MultiAuth([mockNotOkHandler, mockNotOkHandler]).authorize(mockReq)).toBeTruthy());
});
