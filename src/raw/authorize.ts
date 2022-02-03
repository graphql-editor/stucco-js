import { authorize } from '../proto/driver';
import { messages } from 'stucco-ts-proto-gen';
import { MessageType } from './message';
import { AuthorizeInput, AuthorizeOutput } from '../api/index';
import { handler } from './handler';

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
