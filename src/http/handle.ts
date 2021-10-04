//import { isFunction } from 'util';
import { getMessageType, parseMIME, MessageType, messageTypeToMime } from '../raw/message';
import {
  fieldResolveHandler,
  interfaceResolveTypeHandler,
  scalarParseHandler,
  scalarSerializeHandler,
  setSecretsHandler,
  subscriptionConnectionHandler,
} from '../raw';

export class UserError extends Error {}

export async function handleHTTPGrpc(contentType: string, body: Buffer): Promise<[string, Uint8Array]> {
  const msgType = getMessageType(parseMIME(contentType));
  let data: Uint8Array;
  let responseMessageType: MessageType;
  switch (msgType) {
    case MessageType.FIELD_RESOLVE_REQUEST:
      data = await fieldResolveHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.FIELD_RESOLVE_RESPONSE;
      break;
    case MessageType.INTERFACE_RESOLVE_TYPE_REQUEST:
      data = await interfaceResolveTypeHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.INTERFACE_RESOLVE_TYPE_RESPONSE;
      break;
    case MessageType.SCALAR_PARSE_REQUEST:
      data = await scalarParseHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.SCALAR_PARSE_RESPONSE;
      break;
    case MessageType.SCALAR_SERIALIZE_REQUEST:
      data = await scalarSerializeHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.SCALAR_SERIALIZE_RESPONSE;
      break;
    case MessageType.SET_SECRETS_REQUEST:
      data = await setSecretsHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.SET_SECRETS_RESPONSE;
      break;
    case MessageType.SUBSCRIPTION_CONNECTION_REQUEST:
      data = await subscriptionConnectionHandler(contentType, Uint8Array.from(body));
      responseMessageType = MessageType.SUBSCRIPTION_CONNECTION_RESPONSE;
      break;
    default:
      throw new UserError('invalid message type');
  }
  return [messageTypeToMime(responseMessageType), data];
}
