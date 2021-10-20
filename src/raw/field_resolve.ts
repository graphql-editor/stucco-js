import { fieldResolve } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { FieldResolveInput, FieldResolveOutput } from '../api/index.js';
import { handler } from './handler.js';

export async function fieldResolveHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<messages.FieldResolveRequest, messages.FieldResolveResponse, FieldResolveInput, FieldResolveOutput>(
    contentType,
    MessageType.FIELD_RESOLVE_REQUEST,
    messages.FieldResolveRequest,
    messages.FieldResolveResponse,
    body,
    fieldResolve,
  );
}
