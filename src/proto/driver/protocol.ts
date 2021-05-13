import { HttpRequest } from 'src/api';
import { RecordOfUnknown, getFromValue } from './value';
import { messages } from 'stucco-ts-proto-gen';

function isHttpRequestProtocol(protocol: unknown): protocol is HttpRequest {
  if (typeof protocol !== 'object' || protocol === null) {
    return false;
  }
  if (!('headers' in protocol)) {
    return false;
  }
  const unknownHeaders = (protocol as { headers: unknown }).headers;
  if (typeof unknownHeaders !== 'object' || unknownHeaders === null) {
    return false;
  }
  const headers = unknownHeaders as RecordOfUnknown;
  return (
    Object.keys(headers).find((k) => {
      const header = headers[k];
      if (!Array.isArray(header)) {
        return true;
      }
      return header.find((el) => typeof el !== 'string');
    }) === undefined
  );
}

interface WithProtocol {
  hasProtocol(): boolean;
  getProtocol(): messages.Value | undefined;
}
export function getProtocol(req: WithProtocol): HttpRequest | undefined {
  if (!req.hasProtocol()) {
    return undefined;
  }
  const protocol = getFromValue(req.getProtocol());
  return isHttpRequestProtocol(protocol) ? protocol : undefined;
}
