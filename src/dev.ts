import { Pool } from './core/pool';
import { randomBytes } from 'crypto';
import { TCPTransport, TCPServer } from './transport/tcp';

Buffer.prototype.toJSON = function () {
  return this.toString();
};

const env = process.env;

const seed = process.argv.slice(2).map(e => parseInt(e));

const nodeId = randomBytes(16).toString('hex');

console.log({ seed, nodeId });
const pool = new Pool({ seed, nodeId }, TCPTransport.connect, TCPServer.create);

pool.listen(parseInt(env.PORT) || undefined);

pool.on('message', (m, p) => {
  process.stdout.write(p.id + ' > ' + m);
});

process.stdin.resume();
process.stdin.on('data', function (data) {

  switch (data.toString()) {
    case '\n':
      data = Buffer.from('<empty>\n');
      break;
    case 'bourre!\n':
      let i = 100;
      while (i--) {
        pool.sendMessage(i + ' ' + randomBytes(16).toString('base64') + '\n');
      }
      return;
  }

  pool.sendMessage(data.toString());
});
