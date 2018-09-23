import { randomBytes } from 'crypto';
import { P2PNode as Node } from './core/node';
import { TCPTransport, TCPServer } from './transport/tcp';

Buffer.prototype.toJSON = function () {
  return this.toString();
};

const env = process.env;

const seed = process.argv.slice(2).map(e => parseInt(e));

const node = new Node({ seed }, TCPTransport, TCPServer);

const name = env.NAME || randomBytes(4).toString('hex');

node.listen(parseInt(env.PORT) || undefined);

node.on('data', (data) => {
  process.stdout.write(data.toString());
});

process.stdin.resume();
process.stdin.on('data', function (data: Buffer) {
  let message = data.toString();
  switch (message) {
    case '\n':
    message = '<empty>\n';
      break;
    case 'bourre!\n':
      let i = 100;
      while (i--) {
        node.send(Buffer.from(`${name} -> ${i} ${randomBytes(16).toString('base64')}\n`));
      }
      return;
  }

  node.send(Buffer.from(`${name} -> ${message}`));
});
