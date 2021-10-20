import { IncomingMessage } from 'http';
import { HttpCertReader, ClientCertAuth } from './cert.js';
import { ApiKeyAuth } from './apiKey.js';

interface Auth {
  authorize(req: IncomingMessage): Promise<boolean>;
}

export class MultiAuth {
  constructor(public authHandlers: Auth[]) {
    if (this.authHandlers.length === 0) throw new Error('no handlers');
  }
  async authorize(req: IncomingMessage): Promise<boolean> {
    const authResults = await Promise.all(this.authHandlers.map((h) => h.authorize(req)));
    return authResults.find((b) => b === true) !== undefined;
  }
}

export function DefaultSecurity(secRequired = false): MultiAuth | void {
  const authHandlers: Auth[] = [];
  if (process.env['STUCCO_CA']) {
    authHandlers.push(new ClientCertAuth(new HttpCertReader()));
  }
  if (process.env['STUCCO_FUNCTION_KEY']) {
    authHandlers.push(new ApiKeyAuth(process.env['STUCCO_FUNCTION_KEY']));
  }
  if (authHandlers.length == 0) {
    if (secRequired) throw new Error('could not create default funciton security');
    return;
  }
  return new MultiAuth(authHandlers);
}

export { ClientCertAuth, HttpCertReader, createPEM } from './cert.js';
export { ApiKeyAuth } from './apiKey.js';
