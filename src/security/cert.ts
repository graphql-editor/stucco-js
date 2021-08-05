import LRU from 'lru-cache';
import { pki } from 'node-forge';
import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';
import { v4 } from 'uuid';

const maxAge = 1000 * 60 * 5;
const cache = new LRU<string, boolean>({
  max: 30,
  maxAge: 1000 * 60 * 5,
});

interface WithTLSSocket extends IncomingMessage {
  socket: TLSSocket;
}

function isWithTLSSocket(r: IncomingMessage): r is WithTLSSocket {
  const s = r.socket as TLSSocket;
  return typeof s.getPeerCertificate === 'function';
}

function chunkPEM(pem: string): string {
  return Array.apply('', Array(Math.ceil(pem.length / 64)))
    .map((_, idx) => pem.slice(idx * 64, (idx + 1) * 64))
    .join('\n');
}

const pemData = new RegExp(/^\s*[:A-Za-z0-9+/=\s]+[:A-Za-z0-9+/=\s][:A-Za-z0-9+/=\s]$/);
export function createPEM(data: string): string {
  // try to fix missing headers
  const match = pemData.test(data);
  if (match) {
    data = `\n-----BEGIN CERTIFICATE-----\n${chunkPEM(data)}\n-----END CERTIFICATE-----`;
  }
  return data;
}

export class HttpCertReader {
  async ReadCert(req: IncomingMessage): Promise<string> {
    if (isWithTLSSocket(req)) {
      return createPEM(req.socket.getPeerCertificate(false).raw.toString('base64'));
    }
    throw new Error('request missing cert data');
  }
}

export interface CaReader {
  ReadCa(): Promise<string>;
}

export interface CertReader {
  ReadCert(req: IncomingMessage): Promise<string>;
}

const envCA = process.env['STUCCO_CA'] || '';
interface ClientCertAuthOpts {
  ca?: string | CaReader;
  uuid?: string;
}
export class ClientCertAuth {
  private _store?: pki.CAStore;
  private ca: string | CaReader;
  private uuid: string;
  constructor(private certReader: CertReader, opts: ClientCertAuthOpts = {}) {
    const { ca = envCA, uuid = v4() } = opts;
    this.ca = ca;
    this.uuid = uuid;
  }
  private async store(): Promise<pki.CAStore> {
    let { _store, ca } = this;
    if (!_store) {
      if (!ca) {
        throw new Error('empty certifacte authority');
      }
      if (typeof ca !== 'string') {
        ca = await ca.ReadCa();
      }
      const pem = pki.certificateFromPem(ca);
      this._store = _store = pki.createCaStore([pem]);
    }
    return _store;
  }
  async authorize(req: IncomingMessage): Promise<boolean> {
    try {
      const cert = await this.certReader.ReadCert(req);
      const now = Date.now();
      const cacheKey = `${this.uuid}-${cert}-${now - (now % maxAge)}`;
      if (cache.get(cacheKey)) return true;
      const pem = pki.certificateFromPem(cert);
      const store = await this.store();
      const verified = pki.verifyCertificateChain(store, [pem]);
      if (verified) return cache.set(cacheKey, true);
      return verified;
    } catch (e) {
      if (process.env['DEBUG'] === '1') {
        console.debug(e);
      }
      return false;
    }
  }
}
