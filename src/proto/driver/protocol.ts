import { HttpRequest, HttpRequestURL } from 'src/api';
import { RecordOfUnknown, getFromValue } from './value';
import { messages } from 'stucco-ts-proto-gen';

type Headers = Record<string, string[]>;

const newOptionalCheck =
  <T>(check: (v: unknown) => v is T) =>
  (v: unknown | undefined | null): v is T | undefined | null =>
    v === undefined || v === null || check(v);

const checkOptionalUint8Array = newOptionalCheck((v: unknown): v is Uint8Array => v instanceof Uint8Array);
const checkOptionalString = newOptionalCheck((v: unknown): v is string => typeof v === 'string');
const checkOptionalHeaders = newOptionalCheck((v: unknown): v is Headers => {
  if (typeof v !== 'object' || v === null) return false;
  const nv = v as RecordOfUnknown;
  return (
    Object.keys(nv).find((k) => {
      const header = nv[k];
      if (!Array.isArray(header)) {
        return true;
      }
      return header.find((el) => typeof el !== 'string');
    }) === undefined
  );
});

function isHttpRequestURL(url: unknown): url is HttpRequestURL {
  if (typeof url !== 'object') {
    return false;
  }
  const { host, path, query } = url as {
    host?: unknown;
    path?: unknown;
    query?: unknown;
  };
  return checkOptionalString(host) && checkOptionalString(path) && checkOptionalString(query);
}

const checkOptionalHttpRequestURL = newOptionalCheck((v: unknown): v is HttpRequestURL => isHttpRequestURL(v));

function isHttpRequestProtocol(protocol: unknown): protocol is HttpRequest {
  if (typeof protocol !== 'object' || protocol === null) {
    return false;
  }
  if (!('headers' in protocol)) {
    return false;
  }
  const { headers, body, host, method, proto, remoteAddress, url } = protocol as {
    headers?: unknown;
    body?: unknown;
    host?: unknown;
    method?: unknown;
    proto?: unknown;
    remoteAddress?: unknown;
    url?: unknown;
  };
  // If none of the properties are present, return false
  if (!headers && !body && !host && !method && !proto && !remoteAddress && !url) {
    return false;
  }
  return (
    checkOptionalUint8Array(body) ||
    checkOptionalString(host) ||
    checkOptionalString(method) ||
    checkOptionalString(proto) ||
    checkOptionalString(remoteAddress) ||
    checkOptionalHttpRequestURL(url) ||
    checkOptionalHeaders(headers)
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
