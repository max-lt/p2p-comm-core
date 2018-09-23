import * as assert from 'assert';
import { randomBytes } from 'crypto';

import { DataPacket } from '../../src/core/parser/packets';

describe('packets.data tests', () => {
  it('sould be able to encode/decode data packet', () => {
    const meta = DataPacket.fromObject({ data: randomBytes(64) });
    const copy = DataPacket.fromRaw(meta.toRaw());
    assert.equal(meta.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });
});
