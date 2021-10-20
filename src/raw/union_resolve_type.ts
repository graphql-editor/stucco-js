import { unionResolveType } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { UnionResolveTypeInput, UnionResolveTypeOutput } from '../api/index.js';
import { handler } from './handler.js';

export async function unionResolveTypeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<
    messages.UnionResolveTypeRequest,
    messages.UnionResolveTypeResponse,
    UnionResolveTypeInput,
    UnionResolveTypeOutput
  >(
    contentType,
    MessageType.UNION_RESOLVE_TYPE_REQUEST,
    messages.UnionResolveTypeRequest,
    messages.UnionResolveTypeResponse,
    body,
    unionResolveType,
  );
}
