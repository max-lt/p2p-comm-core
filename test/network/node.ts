import { AddressInfo } from 'net';
import * as assert from 'assert';
import * as Debug from 'debug';

const debug = Debug('p2p-comm:test:node');

import { TCPTransport, TCPServer } from '../../src/transport/tcp';
import { BaseNode, BasePool, CompoundModule } from '@p2p-comm/base';
import { DataPacket } from '../../src/modules/data/packets';
import { HandshakePacket } from '../../src/modules/handshake/packets';
import { defer } from '../util';

import { HandshakeModule } from '../../src/modules/handshake';
import { DataModule } from '../../src/modules/data';

const mod = new CompoundModule([new HandshakeModule, new DataModule]);

class P2PNode extends BaseNode<TCPTransport> {
  constructor({ seed }) {
    super();
    this.pool = new BasePool({ seed, nodeId: this.id }, TCPTransport, TCPServer, mod);
    this.pool.on('packet-data', (p: DataPacket) => this.emit('data', p));
    this.pool.on('packet-handshake', (p: HandshakePacket) => this.emit('handshake', p));
    this.pool.on('listening', (data) => this.emit('listening', data));
  }
}

function createNode(seed: number[]): P2PNode {
  return new P2PNode({ seed });
}

async function startNode(node): Promise<AddressInfo | any> {
  const p = new Promise((resolve, reject) => {
    node.once('listening', resolve);
    node.once('error', reject);
  });

  node.listen();

  return p;
}

describe('node tests', () => {

  const handshakeA = defer<any>();
  const handshakeB = defer<any>();
  const dataReceived = defer<any>();

  const out = DataPacket.fromObject({ data: Buffer.from('test') });

  let A, B;

  (async () => {
    A = createNode([]);
    const a = await startNode(A);

    debug(`A (${A.id}) listening on`, a.port);

    B = createNode([a.port]);
    const b = await startNode(B);

    debug(`B (${B.id}) listening on`, b.port);

    let lock = 0;

    const sendData = () => (++lock === 2) && A.send(out);

    A.on('handshake', (peer) => {
      debug(`B (${B.id}) handshaked A (${A.id})`, peer.id);
      handshakeA.resolve(peer);
      sendData();
    });

    B.on('handshake', (peer) => {
      debug(`A (${A.id}) handshaked B (${B.id})`, peer.id);
      handshakeB.resolve(peer);
      sendData();
    });

    B.on('data', (data) => {
      debug(`B (${B.id}) received`, data, data.toString());
      dataReceived.resolve(data);
    });
  })();

  it('Inbound peer should handshake', () => handshakeA.promise.then((p: HandshakePacket) => assert.equal(B.id, p.peerId)));

  it('Outbound peer should handshake', () => handshakeB.promise.then((p: HandshakePacket) => assert.equal(A.id, p.peerId)));

  it('Node sould be able to send/receive data', () => {
    return dataReceived.promise.then((p: DataPacket) => assert.equal(out.data.toString(), p.data.toString()));
  });

});
