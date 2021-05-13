import { fieldResolve } from '../proto/driver';
import { messages } from 'stucco-ts-proto-gen';
import { MessageType } from './message';
import { FieldResolveInput, FieldResolveOutput } from '../api';
import { handler } from './handler';

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
