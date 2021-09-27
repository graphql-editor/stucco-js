import { HttpCertReader } from '../../src/security';
import { ClientCertAuth } from '../../src/security/cert';
import { IncomingMessage } from 'http';

// Password to CA abcdef
const certs = {
  cert: `
-----BEGIN CERTIFICATE-----
MIIDETCCAfkCFEZa663fPA1euZ+yUq8ishBuQ0rQMA0GCSqGSIb3DQEBCwUAMEUx
CzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRl
cm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMjEwNDAyMTMyNzMyWhcNMzEwMzMxMTMy
NzMyWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UE
CgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOC
AQ8AMIIBCgKCAQEA35N4wpb6CqtOfeq7q85reMeDtlz5r9+M6jhcVp+xEdDVLoXK
6wWb/lu3lsLNX+Eezakq+O7cNBRSTGn/APAaaCUKHvqmdoztYMtbP00BU67qBQSh
x5DVn9x8pD6JDWGq9U334rmi4bPPIxw5dgtsl24Et5pw/Ef545aBwlaH/96y/sER
xDZghP2pwMzgI5VG2HU+tJTpWLA3H8u6VHhQq+0s9dnmoVHjk0aLhU7KZsIx9VoA
ao+O816PAXSJfD2+Qqb4QHvAsSna7Bt6NL1aCE7oR+Vvmwve5sE1j/0KhG/zy6wN
1kE1TK9gOjpxunYPzSuqlJA7E6iLuG+mW0ylcwIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQAVZKhJlWMAvOkKoZCVWCmbeNDesQF2x+uHG8WlAw/MnaxLcLhKXXMomYCL
YQTawKzpMF5nH3vJZ57W8UpWmVkXPX+ZH/hdmX3BzLscoBfuLbbAALTPwrPuPBZB
BPckDvB6gHJPqCl3l07KW+pBcRkJ2x6sHbxjkDxpS7aVPnZQjLRLL9NnDMK+OcRD
WkWAseHuqlt/ZICG4bUgXZrO5+fOEU4jck4EVB9noIqQBEfRGJ94X2TJ5tFHNoJs
OExToo82rWe3KO9m6+MU88Y8lVVY7RYOtW5i0K8Rt6KHvFpR7eJBDI5J2BXEDb2D
sHg0g/fw3+XO3kHRl8CQeCTU1c7z
-----END CERTIFICATE-----`,
  key: `
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfk3jClvoKq059
6rurzmt4x4O2XPmv34zqOFxWn7ER0NUuhcrrBZv+W7eWws1f4R7NqSr47tw0FFJM
af8A8BpoJQoe+qZ2jO1gy1s/TQFTruoFBKHHkNWf3HykPokNYar1TffiuaLhs88j
HDl2C2yXbgS3mnD8R/njloHCVof/3rL+wRHENmCE/anAzOAjlUbYdT60lOlYsDcf
y7pUeFCr7Sz12eahUeOTRouFTspmwjH1WgBqj47zXo8BdIl8Pb5CpvhAe8CxKdrs
G3o0vVoITuhH5W+bC97mwTWP/QqEb/PLrA3WQTVMr2A6OnG6dg/NK6qUkDsTqIu4
b6ZbTKVzAgMBAAECggEAI59RnF+F03Fb/kAKSuOGyCWx3LqPpfAOebslK0AibF5D
uTfkDvJD2pEufTzokCBEUixkBmm4eCvMuRQiZznaW0GbjTgOkdD+eW+tSDaywWyb
KNWGGVAAWYo96cV0/MbVAGS93EgLpb6KgGOc3CwRz0beRYq7+dZWAGcYoag73w6G
OsQulNHg3d/ZDAbMD8sy7+RUSKdpMcTQyVrBoJgVtjK1EdaS6RLI19l2Ux6Bjzo3
NF8VppLmXdG/08r9zOvhr869OR8w+jsVK01jRN73wHsB0lRxNcyFFdCjPA1Y+Kkf
QnR+wRgDjiVsmGxqG53nkvdxbGT0uXV5mqgDybocMQKBgQD/qsAJAQhSK4Y5dtR/
e5NKxEybrMO5WZOP0uoL6eB7jQ4Jc7cSr20WcAK6ExCu63j5Y1BZIOo4yagiO65x
vjeiWVvaIfo33aZyDOI5yerrh1u/UyxLdlmA0sXkho1b3rtqZNWDcF58PquYDW83
nSlComSUwzasjEoidqsTfGIttQKBgQDf3gVqBNLQVEBmuwsnqm2xFLdRXe0XQU5P
YWNyao0WOqm2ATzYkAgn7k1ThBH2E3078He7QJw+EfpYCvzr3C/SLHU2JgwAIxeN
ZFV7AUw2t8yDx+abF0S1Za1UKHWwKscfQZREiVFGm76UGx4Hwc35OedjZD4euVQK
CDZ3RYs/hwKBgHJmaClfQebqvNPHvUwR8pV5AsKB6s5sK6Amgz2zeBQwyMAn/Bor
TwfENSQn1cY/bVFCRDithsDEUyyGQgd5UxGdJIGVxI3s60aLR0sOc8TSO5Z/1Aks
Ot5u8cfRAT3Di18PIY7/3/d+X2/ZSxO6ijTbz1/Vfgh1edK0ANbmSFQlAoGBAK4t
Ie1A33zzcD/9m0o7UakLQy3tdEA5sWIVlbg5qpf3AH/5KowcVBwtTsCB6y+YLkHq
cF2igW3RswO5WNtxr0tJB9EffQrGQtbhj5hqhA+2pUqKx6M3UWAJQfhOmnJ8dfyd
m2xPoorbNkYpaw4B/e3A3YT5Q1PIQdikVywpUZQVAoGBALnHYjP6oMQWov0hQYXD
FUhC+E5VGg4dSDKFXAtFQo/YdZsRs3Bi04v2XBmNlO4FUWcwuly2Tt57MZnhC2+w
5E3qNEUfkYrl+Cu1cAN0Qi8KtOe76gTA/VKQgxeW05dh51oobPFPs3ogINzPwHka
KbbDc2AFvxw8mKZFvpaF7HCx
-----END PRIVATE KEY-----`,
  ca: `
-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUaJ/lmg0L28ddlpK3coV5NMwj4NAwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMTA0MDIxMzI2MjRaFw0zMTAz
MzExMzI2MjRaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCXw33B8dpCtAAWjO8vWYvushsRkLrpVHVfG6ALeNcu
MoOt6m3IOGIqx7u36OQoTJZP1qx7NoX3Ohic52PihZoASsCB/JDDZdSWQ+Ej3TCq
ZI6LrmtRvV9r6hg5gm/BshzKl+RTqau7UyApSh2emZy7Q6sQ/4hR8Jyr3mBrfBL4
aABcGgwMAE/u5IjuoT/Qfk8AhLGAUwRDtiwsgQlSrWuA6K/CjUMvWqSce0ylJnEN
2zWaXryKsDLru3/GoX/OGZqzPH1/5sosePd7gr9b54qMKCLgHS/F/QEL93KX8UyX
q8UZhLbrgOKMCaNHTMvbilyuD6Wry3dq4R0QBHkq3NGrAgMBAAGjUzBRMB0GA1Ud
DgQWBBS/T9gzaW20LjX8ZRQlMSeGi0BltzAfBgNVHSMEGDAWgBS/T9gzaW20LjX8
ZRQlMSeGi0BltzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQB5
jkgUVlCHcMfWLxAGXlt58ZGLj79/NNkbKFS1vqd1p/l37s5bxpcrxtWW5aRhueMx
ginR7XcSHmWhkuibKRlrwO8fvk9wbOGCWP5F6quMlsgxhboqKQPDKUzrOXlcGcXi
uM72C7iAMdcbtPOGUtCudMzk8/tIN98wfGXXXlOa+yY55/6KttpHMBY+Giw2hre5
gMEQbeP9OaP9g5Hlt6VzFrWLMVWJfkuZq4lR1Pj+zk+G7cxaedIcYfN+kI9C6Ywt
ekho35AKRDg7b9iCr6L2XRuxN0DM30Oc7g5IJeL4IMoM6CzgwoAWOFg9G0ZpY+61
8K1JMAY4iq/436Q+7VFK
-----END CERTIFICATE-----`,
  otherCa: `
-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUapafjD5q5/YECs5PZsaoY82eM0UwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMTA0MDIxMzMwMTNaFw0zMTAz
MzExMzMwMTNaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQD1ylNt1dJFvxWliUP4x/trZ57ufQSKsmnr05ATy7aw
lOgRmwsODNLZGUH+IX94A2uDlZci59bAuIaA29vuhB+kLnJbbOs/ZIYbOk0EPdao
4OsRopI4d81gm2QHIYMatR5GrVmUmlR/ar8Hw32CoAjIpXXuGRFsjPZwfyZltLM9
PS9UaWgqor89BAsDkTPVN1Ifa0frgZt4TJjocmug2b642z+icme3e3KJ4c6w5G2S
vDqvBqXiLtox6eOEfpKhFdNGvJrFklBuCBf96FYtUj1eCj8QgRHuIz7V13houM+T
dqLm/p8L0LsPVoUtCkrsO2aEd4cBofOkyTA05ZLwOkd5AgMBAAGjUzBRMB0GA1Ud
DgQWBBR5ngq+xskfzBW5K36ZiSAU5oRBDTAfBgNVHSMEGDAWgBR5ngq+xskfzBW5
K36ZiSAU5oRBDTAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQDC
HAyKYG8ilOfB3X2+uEpn3EoONE6vVMpgFG8Jb6TRtpQIwyfi663dVG5+8t2z9Km+
Mfzjd4yLCc3fAy6JEbXEogtjo3QjCq4tdjj5VH4zHwA6UNGpBGQETOuQfDIBVcq3
gbS7qcfVHeUsS9GoOTqV2E1nGzrugpeNbtaS7Aksy0fWXY654JUIVLNGU98UXV9B
4wy5ZPwCkrO/E0xaVFQBIU536/H+wj+SQ/J6eZmEzqzVlsj26nKsO0FrjPRZa5UH
bDNPPic3GJNH6RLErVRppoFSyLcgFeZyQIjBmQmMOdOFn9+VtaUGrkLRb1FoPUlD
xajuhMHbEElSy3jjbncl
-----END CERTIFICATE-----`,
};

describe('test http cert reader', () => {
  jest.setTimeout(1000 * 360);
  test('http cert reader', async () => {
    const CERT_LINES = certs.cert.split('\n');
    const START_SLICE = 2;
    const END_SLICE = CERT_LINES.length - 1;
    const BASE_64_CERT_LINES = CERT_LINES.slice(START_SLICE, END_SLICE);
    const reqMock = [
      {
        socket: {
          getPeerCertificate: () => ({
            raw: certs.cert,
          }),
        },
      },
      {
        socket: {
          getPeerCertificate: () => ({
            raw: BASE_64_CERT_LINES.join(''),
          }),
        },
      },
      {
        socket: {
          getPeerCertificate: () => ({
            raw: Buffer.from(BASE_64_CERT_LINES.join(''), 'base64'),
          }),
        },
      },
      {
        socket: {
          getPeerCertificate: () => ({
            raw: Buffer.from(BASE_64_CERT_LINES.join('\n'), 'base64'),
          }),
        },
      },
    ];
    const reader = new HttpCertReader();
    await Promise.all(
      reqMock.map((req) => expect(reader.ReadCert(req as unknown as IncomingMessage)).resolves.toEqual(certs.cert)),
    );
  });
  describe('client cert auth', () => {
    const mockRequest = {} as unknown as IncomingMessage;
    const mockCertReader = {
      ReadCert: () => Promise.resolve(certs.cert),
    };
    test('requires ca', async () => {
      const clientCaAuth = new ClientCertAuth(mockCertReader);
      await expect(clientCaAuth.authorize(mockRequest)).resolves.toBeFalsy();
    });
    test('validates self signed', async () => {
      const clientCaAuth = new ClientCertAuth(mockCertReader, certs);
      await expect(clientCaAuth.authorize(mockRequest)).resolves.toBeTruthy();
    });
    test('fails self signed with other ca', async () => {
      const clientCaAuth = new ClientCertAuth(mockCertReader, { ca: certs.otherCa });
      await expect(clientCaAuth.authorize(mockRequest)).resolves.toBeFalsy();
    });
  });
});
