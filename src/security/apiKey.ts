import { IncomingMessage } from 'http';
const envApiKey = process.env['STUCCO_FUNCION_KEY'] || '';
const bearerPrefix = 'bearer ';
const bearerPrefixLen = bearerPrefix.length;

const xStuccoApiKey = 'x-stucco-api-key';

function getAsString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v.join(', ') : v;
}

function acceptBearer(key: string | undefined): string | undefined {
  if (key?.trim()?.slice(0, bearerPrefixLen)?.toLowerCase() === bearerPrefix) {
    key = key.trim().slice(bearerPrefixLen).trim();
  }
  return key;
}

export class ApiKeyAuth {
  constructor(private apiKey: string = envApiKey) {
    if (!this.apiKey) {
      throw new Error('empty api key');
    }
  }
  async authorize(req: IncomingMessage): Promise<boolean> {
    const key = acceptBearer(getAsString(req.headers[xStuccoApiKey] || req.headers['authorization']));
    return this.apiKey === key;
  }
}
