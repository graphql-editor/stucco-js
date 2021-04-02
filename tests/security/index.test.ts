import { CertReader } from '../../src/security/cert';
import { MultiAuth, DefaultSecurity } from '../../src/security';
import { IncomingMessage } from 'http';

describe('multi auth', () => {
  test('can create default security', () => {
    process.env['STUCCO_FUNCTION_KEY'] = 'xyz';
    const sec = DefaultSecurity();
    expect(sec && sec.authHandlers).toHaveLength(1);
    delete process.env['STUCCO_FUNCTION_KEY'];
  });
  test('multi auth can handle cert and api key', () =>
    expect(
      new MultiAuth({
        certAuth: { certReader: ({} as unknown) as CertReader },
        keyAuth: 'xyz',
      }).authHandlers,
    ).toHaveLength(2));
  const mockOkHandler = {
    authorize: () => Promise.resolve(true),
  };
  const mockNotOkHandler = {
    authorize: () => Promise.resolve(false),
  };
  const mockReq = ({} as unknown) as IncomingMessage;
  test('overwrite with user handlers', () =>
    expect(new MultiAuth({ authHandlers: [mockOkHandler] }).authHandlers).toHaveLength(1));
  test('passes with one success', () =>
    expect(new MultiAuth({ authHandlers: [mockNotOkHandler, mockOkHandler] }).authorize(mockReq)).toBeTruthy());
  test('fails with no success', () =>
    expect(new MultiAuth({ authHandlers: [mockNotOkHandler, mockNotOkHandler] }).authorize(mockReq)).toBeTruthy());
});
