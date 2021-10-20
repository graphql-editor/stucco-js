import { interfaceResolveType } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { InterfaceResolveTypeInput, InterfaceResolveTypeOutput } from '../api/index.js';
import { handler } from './handler.js';

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
