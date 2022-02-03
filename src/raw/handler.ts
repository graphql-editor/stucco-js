import { MessageType, getMessageType, parseMIME } from './message';
import { getHandler, WithFunction } from '../handler';
import { messages } from 'stucco-ts-proto-gen';
import { makeProtoError } from '../proto/driver';

interface Deserializable<T extends WithFunction> {
  deserializeBinary(data: Uint8Array): T;
}

interface Constructible<T> {
  new (): T;
}

interface Serializable {
  serializeBinary(): Uint8Array;
}

interface WithError {
  setError(err: messages.Error): void;
}

export async function handler<T extends WithFunction, U extends Serializable & WithError, V, W>(
  contentType: string,
  msgType: MessageType,
  requestType: Deserializable<T>,
  responseType: Constructible<U>,
  body: Uint8Array,
  fn: (req: T, handler: (x: V) => Promise<W>) => Promise<U>,
): Promise<Uint8Array> {
  try {
    if (getMessageType(parseMIME(contentType)) !== msgType) {
      throw new Error(`"${contentType}" is not a valid content-type`);
    }
    const request = requestType.deserializeBinary(body);
    const handler = await getHandler<V, W>(request);
    const response = await fn(request, handler);
    return response.serializeBinary();
  } catch (e) {
    const response = new responseType();
    response.setError(makeProtoError(e));
    return response.serializeBinary();
  }
}
