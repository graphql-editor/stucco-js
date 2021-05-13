import { interfaceResolveType } from '../proto/driver';
import { messages } from 'stucco-ts-proto-gen';
import { MessageType } from './message';
import { InterfaceResolveTypeInput, InterfaceResolveTypeOutput } from '../api';
import { handler } from './handler';

export async function interfaceResolveTypeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<
    messages.InterfaceResolveTypeRequest,
    messages.InterfaceResolveTypeResponse,
    InterfaceResolveTypeInput,
    InterfaceResolveTypeOutput
  >(
    contentType,
    MessageType.INTERFACE_RESOLVE_TYPE_REQUEST,
    messages.InterfaceResolveTypeRequest,
    messages.InterfaceResolveTypeResponse,
    body,
    interfaceResolveType,
  );
}
