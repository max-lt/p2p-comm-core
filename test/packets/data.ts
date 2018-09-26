import * as assert from 'assert';
import { randomBytes } from 'crypto';

import { DataPacket } from '../../src/packets';

describe('packets.data tests', () => {
  const packet = DataPacket.fromObject({ data: randomBytes(64) });

  it('sould be able to encode/decode data packet', () => {
    const copy = DataPacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });

  it('should have static property "type"', () => {
    assert.notEqual(-1, DataPacket.type);
  });
});
