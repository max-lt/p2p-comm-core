import * as assert from 'assert';

import { SendpeersPacket } from '../../src/core/parser/packets';
import { PeerInfo } from '../../src/core/parser/packets/util';

describe('packets.getpeers tests', () => {

  const peers: PeerInfo[] = [
    { host: 'localhost', port: 123, peerId: '784512' },
    { host: '127.0.0.1', port: 8080, peerId: '895623' },
    { host: 'example.com', port: 13070, peerId: '748596' }
  ];

  const packet = SendpeersPacket.fromObject({ peers });

  it('sould be able to encode/decode handshake packet', () => {
    const copy = SendpeersPacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });
});
