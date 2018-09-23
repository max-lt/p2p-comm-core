import { AddressInfo } from 'net';
import * as assert from 'assert';
import * as Debug from 'debug';

const debug = Debug('p2p-comm:test:node');

import { P2PNode } from '../../src/core/node';
import { TCPTransport, TCPServer } from '../../src/transport/tcp';
import { defer } from '../util';


function createNode(seed: number[]): P2PNode<TCPTransport> {
  return new P2PNode({ seed }, TCPTransport, TCPServer);
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

  const out = Buffer.from('test');

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

    A.on('peer', (peer) => {
      debug(`B (${B.id}) handshaked A (${A.id})`, peer.id);
      handshakeA.resolve(peer);
      sendData();
    });

    B.on('peer', (peer) => {
      debug(`A (${A.id}) handshaked B (${B.id})`, peer.id);
      handshakeB.resolve(peer);
      sendData();
    });

    B.on('data', (data) => {
      debug(`B (${B.id}) received`, data);
      dataReceived.resolve(data);
    });
  })();

  it('Inbound peer should handshake', () => handshakeA.promise.then((peer) => assert.equal(B.id, peer.id)));

  it('Outbound peer should handshake', () => handshakeB.promise.then((peer) => assert.equal(A.id, peer.id)));

  it('Node sould be able to send/receive data', () => dataReceived.promise.then((data) => assert.equal(out.toString(), data.toString())));

});
