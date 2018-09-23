import * as assert from 'assert';

import { GetpeersPacket } from '../../src/core/parser/packets';

describe('packets.getpeers tests', () => {
  const packet = GetpeersPacket.fromObject({ number: 80 });

  it('sould be able to encode/decode handshake packet', () => {
    const copy = GetpeersPacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });
});
