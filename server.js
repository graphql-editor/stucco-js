const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  rejectUnauthorized: false,
  requestCert: true,
};

const server = https.createServer(options, (req, res) => {
  console.log(req.socket.getPeerCertificate(false));
  res.writeHead(200).end('OK');
});
server.listen(8443, () => {
  console.log('server bound');
});
