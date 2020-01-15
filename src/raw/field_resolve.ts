import { fieldResolve } from '../proto/driver';
import { FieldResolveRequest, FieldResolveResponse } from '../proto/driver_pb';
import { MessageType } from './message';
import { FieldResolveInput, FieldResolveOutput } from '../api';
import { handler } from './handler';

export async function fieldResolveHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<FieldResolveRequest, FieldResolveResponse, FieldResolveInput, FieldResolveOutput>(
    contentType,
    MessageType.FIELD_RESOLVE_REQUEST,
    FieldResolveRequest,
    FieldResolveResponse,
    body,
    fieldResolve,
  );
}
