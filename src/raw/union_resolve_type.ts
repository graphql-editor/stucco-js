import { unionResolveType } from '../proto/driver';
import { UnionResolveTypeRequest, UnionResolveTypeResponse } from '../proto/driver_pb';
import { MessageType } from './message';
import { UnionResolveTypeInput, UnionResolveTypeOutput } from '../api';
import { handler } from './handler';

export async function unionResolveTypeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<UnionResolveTypeRequest, UnionResolveTypeResponse, UnionResolveTypeInput, UnionResolveTypeOutput>(
    contentType,
    MessageType.UNION_RESOLVE_TYPE_REQUEST,
    UnionResolveTypeRequest,
    UnionResolveTypeResponse,
    body,
    unionResolveType,
  );
}
