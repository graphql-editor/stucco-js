import { authorize } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { AuthorizeInput, AuthorizeOutput } from '../api/index.js';
import { handler } from './handler.js';

export async function fieldResolveHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<messages.AuthorizeRequest, messages.AuthorizeResponse, AuthorizeInput, AuthorizeOutput>(
    contentType,
    MessageType.FIELD_RESOLVE_REQUEST,
    messages.AuthorizeRequest,
    messages.AuthorizeResponse,
    body,
    authorize,
  );
}
