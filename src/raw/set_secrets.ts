import { setSecrets, makeProtoError } from '../proto/driver/index.js';
import { SetSecretsRequest, SetSecretsResponse } from '../proto/driver/messages.js';
import { getMessageType, parseMIME, MessageType } from './message.js';
import { SetSecretsOutput, SetSecretsInput } from '../api/index.js';

export async function setSecretsEnvironment(secrets: SetSecretsInput): Promise<SetSecretsOutput> {
  Object.keys(secrets.secrets).forEach((k) => {
    process.env[k] = secrets.secrets[k];
  });
  return;
}

export async function setSecretsHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  try {
    if (getMessageType(parseMIME(contentType)) !== MessageType.SET_SECRETS_REQUEST) {
      throw new Error(`"${contentType}" is not a valid content-type`);
    }
    const request = SetSecretsRequest.deserializeBinary(body);
    const response = await setSecrets(request, setSecretsEnvironment);
    return response.serializeBinary();
  } catch (e) {
    const response = new SetSecretsResponse();
    response.setError(makeProtoError(e));
    return response.serializeBinary();
  }
}
