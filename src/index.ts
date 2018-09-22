import { Pool } from './core/pool';
import { randomBytes } from 'crypto';
import { TCPTransport, TCPServer } from './transport/tcp';

const seed = process.argv.slice(2).map(e => parseInt(e));

console.log({ seed });

const pool = new Pool({ seed }, TCPTransport.connect, TCPServer.create);

pool.listen(parseInt(process.env.PORT) || undefined);

pool.on('message', (m) => {
  process.stdout.write('> ' + m);
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
        pool.sendMessage(i + ' ' + randomBytes(64).toString('base64') + '\n');
      }
      return;
  }

  pool.sendMessage(data.toString());
});
