import * as assert from 'assert';

import { HandshakePacket } from '../../src/core/packets';

describe('packets.handshake tests', () => {
  const packet = HandshakePacket.fromObject({ port: 80, peerId: '1234' });

  it('sould be able to encode/decode handshake packet', () => {
    const copy = HandshakePacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });
});
