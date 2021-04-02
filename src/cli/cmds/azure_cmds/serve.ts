import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { Readable } from 'stream';
import { handleHTTPGrpc, UserError } from '../../../http/handle';
import { ClientCertAuth, createPEM } from '../../../security';
import { readFile } from 'fs';

export const command = 'serve';
export const describe = 'Serve Azure custom handler';
export const builder = {};

async function readBody(req: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: Buffer[] = [];
    req.on('readable', () => {
      const chunk = req.read();
      if (chunk) {
        data.push(Buffer.from(chunk));
      }
    });
    req.on('error', (err) => reject(err));
    req.on('end', () => resolve(Buffer.concat(data)));
  });
}

interface Auth {
  authorize(req: IncomingMessage): Promise<boolean>;
}

type HandlerFn = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
function customHandler(sec: Auth): HandlerFn {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const authorized = await sec.authorize(req);
      if (!authorized) {
        const body = 'FORBIDDEN';
        res
          .writeHead(403, {
            'Content-Length': body.length,
            'Content-Type': 'text/plain',
          })
          .end(body);
        return;
      }
      if (req?.method !== 'POST') {
        throw new UserError('only POST accepted');
      }
      const rContentType = (req?.headers || {})['content-type'] || '';
      if (!rContentType) {
        throw new UserError('invalid content type');
      }
      const [contentType, body] = await handleHTTPGrpc(rContentType, await readBody(req));
      res
        .writeHead(200, {
          'Content-Length': body.length,
          'Content-Type': contentType,
        })
        .end(Buffer.from(body));
    } catch (e) {
      const errResp =
        e instanceof UserError
          ? {
              status: 400,
              body: Buffer.from(e.message),
            }
          : {
              status: 500,
              body: Buffer.from(e.message || ''),
            };
      res
        .writeHead(errResp.status, {
          'Content-Length': errResp.body.length,
          'Content-Type': 'text/plain',
        })
        .end(errResp.body);
    }
  };
}

class AzureCertReader {
  async ReadCert(req: IncomingMessage): Promise<string> {
    const getAsString = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v.join(', ') : v);
    const header = getAsString(req.headers['x-arr-clientcert']);
    if (!header) throw new Error('missing certificate');
    return createPEM(header);
  }
}

class AzureCaReader {
  constructor(private caFile = './ca.pem') {}
  async ReadCa(): Promise<string> {
    return new Promise((resolve, reject) =>
      readFile(this.caFile, (err, data) => (err ? reject(err) : resolve(data.toString()))),
    );
  }
}

class AzureCertAuth extends ClientCertAuth {
  constructor() {
    super(new AzureCertReader(), { ca: new AzureCaReader() });
  }
  async authorize(req: IncomingMessage): Promise<boolean> {
    return process.env['AZURE_FUNCTIONS_ENVIRONMENT'] === 'Development' || super.authorize(req);
  }
}

export function handler(): void {
  const srv = createServer(customHandler(new AzureCertAuth()));
  let port = parseInt(process.env['FUNCTIONS_CUSTOMHANDLER_PORT'] || '');
  if (isNaN(port) || !port) {
    port = 8080;
  }
  srv.listen(port, () => {
    console.log('custom azure handler is running');
  });
  const sockets: Socket[] = [];
  srv.on('connection', (socket) => {
    sockets.push(socket);
    const removeSocket = () => {
      const at = sockets.indexOf(socket);
      if (at !== -1) {
        sockets.splice(at, 1);
      }
    };
    socket.on('close', removeSocket);
  });
  process.on('SIGTERM', () => {
    const wait = setTimeout(() => {
      sockets.forEach((s) => s.destroy());
    }, 10 * 1000);
    srv.close((err) => {
      if (err) {
        console.error(err);
      }
      clearTimeout(wait);
    });
  });
}
