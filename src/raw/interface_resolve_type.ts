import { interfaceResolveType } from '../proto/driver';
import { InterfaceResolveTypeRequest, InterfaceResolveTypeResponse } from '../proto/driver_pb';
import { MessageType } from './message';
import { InterfaceResolveTypeInput, InterfaceResolveTypeOutput } from '../api';
import { handler } from './handler';

export async function interfaceResolveTypeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<
    InterfaceResolveTypeRequest,
    InterfaceResolveTypeResponse,
    InterfaceResolveTypeInput,
    InterfaceResolveTypeOutput
  >(
    contentType,
    MessageType.INTERFACE_RESOLVE_TYPE_REQUEST,
    InterfaceResolveTypeRequest,
    InterfaceResolveTypeResponse,
    body,
    interfaceResolveType,
  );
}
