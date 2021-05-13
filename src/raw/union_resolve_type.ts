import { unionResolveType } from '../proto/driver';
import { messages } from 'stucco-ts-proto-gen';
import { MessageType } from './message';
import { UnionResolveTypeInput, UnionResolveTypeOutput } from '../api';
import { handler } from './handler';

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
