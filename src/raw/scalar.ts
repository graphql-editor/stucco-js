import { scalarParse, scalarSerialize } from '../proto/driver';
import {
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
} from '../proto/driver_pb';
import { MessageType } from './message';
import { ScalarParseInput, ScalarParseOutput, ScalarSerializeInput, ScalarSerializeOutput } from '../api';
import { handler } from './handler';

export async function scalarParseHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<ScalarParseRequest, ScalarParseResponse, ScalarParseInput, ScalarParseOutput>(
    contentType,
    MessageType.SCALAR_PARSE_REQUEST,
    ScalarParseRequest,
    ScalarParseResponse,
    body,
    scalarParse,
  );
}

export async function scalarSerializeHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<ScalarSerializeRequest, ScalarSerializeResponse, ScalarSerializeInput, ScalarSerializeOutput>(
    contentType,
    MessageType.SCALAR_SERIALIZE_REQUEST,
    ScalarSerializeRequest,
    ScalarSerializeResponse,
    body,
    scalarSerialize,
  );
}
