import * as assert from 'assert';

import { HandshakePacket } from '../../src/core/parser/packets';

describe('packets.handshake tests', () => {
  it('sould be able to encode/decode handshake packet', () => {
    const meta = HandshakePacket.fromObject({ port: 80, peerId: '1234' });
    const copy = HandshakePacket.fromRaw(meta.toRaw());
    assert.equal(meta.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });
});
