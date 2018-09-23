import * as assert from 'assert';

import { PingPacket } from '../../src/core/parser/packets';

describe('packets.ping tests', () => {
  const packet = PingPacket.fromObject();

  it('sould be able to encode/decode handshake packet', () => {
    const copy = PingPacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });
});
