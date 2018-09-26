import { randomBytes } from 'crypto';
import { BaseNode, BasePool, mergeModules } from '@p2p-comm/base';
import { TCPTransport, TCPServer } from './transport/tcp';

import handshakeModule from './modules/handshake';
import filterModule from './modules/filter';
import dataModule from './modules/data';
import { DataPacket } from './packets';

const mod = mergeModules([filterModule, handshakeModule, dataModule]);

Buffer.prototype.toJSON = function () {
  return this.toString();
};

class CoreNode extends BaseNode<TCPTransport> {
  // tslint:disable-next-line:no-shadowed-variable
  constructor({ seed }) {
    super();
    this.pool = new BasePool({ seed, nodeId: this.id }, TCPTransport, TCPServer, mod);
    this.pool.on('packet-data', (p: DataPacket) => this.emit('data', p.data));
  }

  send(data) {
    this.pool.broadcast(DataPacket.fromObject({ data }));
  }
}

const env = process.env;

const seed = process.argv.slice(2).map(e => parseInt(e));

const node = new CoreNode({ seed });

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
