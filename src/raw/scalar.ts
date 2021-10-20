import { scalarParse, scalarSerialize } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { ScalarParseInput, ScalarParseOutput, ScalarSerializeInput, ScalarSerializeOutput } from '../api/index.js';
import { handler } from './handler.js';

export async function scalarParseHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<messages.ScalarParseRequest, messages.ScalarParseResponse, ScalarParseInput, ScalarParseOutput>(
    contentType,
    MessageType.SCALAR_PARSE_REQUEST,
    messages.ScalarParseRequest,
    messages.ScalarParseResponse,
    body,
    scalarParse,
  );
}

export async function scalarSerializeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<
    messages.ScalarSerializeRequest,
    messages.ScalarSerializeResponse,
    ScalarSerializeInput,
    ScalarSerializeOutput
  >(
    contentType,
    MessageType.SCALAR_SERIALIZE_REQUEST,
    messages.ScalarSerializeRequest,
    messages.ScalarSerializeResponse,
    body,
    scalarSerialize,
  );
}
