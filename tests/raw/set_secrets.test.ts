import { messages } from 'stucco-ts-proto-gen';
import { setSecretsHandler } from '../../src/raw/set_secrets';
describe('raw setSecrets resolve type handler', () => {
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
        contentType: 'application/x-protobuf;message=SetSecretsRequest',
        expectedErrorMessage: '"application/x-protobuf;message=SetSecretsRequest" is not a valid content-type',
        assertion: (expected, actual: Uint8Array): void => {
          expect(actual).not.toEqual(expected);
        },
      },
    ];
    await Promise.all(
      data.map(async (tc) => {
        const expectedResponse = new messages.SetSecretsResponse();
        const responseError = new messages.Error();
        responseError.setMsg(tc.expectedErrorMessage);
        expectedResponse.setError(responseError);
        tc.assertion(expectedResponse.serializeBinary(), await setSecretsHandler(tc.contentType, new Uint8Array()));
        return Promise.resolve();
      }),
    );
  });
  it('sets environment', async () => {
    const data: Array<{
      body: Uint8Array;
      expected: Uint8Array;
    }> = [
      {
        body: ((): Uint8Array => {
          const req = new messages.SetSecretsRequest();
          const secrets: Array<[string, string]> = [['SECRET', 'VALUE']];
          req.setSecretsList(
            secrets.map(
              (secret): messages.Secret => {
                const protoSecret = new messages.Secret();
                protoSecret.setKey(secret[0]);
                protoSecret.setValue(secret[1]);
                return protoSecret;
              },
            ),
          );
          return req.serializeBinary();
        })(),
        expected: ((): Uint8Array => {
          const response = new messages.SetSecretsResponse();
          return response.serializeBinary();
        })(),
      },
    ];
    data.forEach(async (tc) => {
      const response = await setSecretsHandler('application/x-protobuf;message=SetSecretsRequest', tc.body);
      expect(process.env.SECRET).toEqual('VALUE');
      delete process.env.SECRET;
      expect(response).toEqual(tc.expected);
    });
  });
});
