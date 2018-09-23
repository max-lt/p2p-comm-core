import * as assert from 'assert';

import { AbstractPacket } from '../../src/core/parser/packets/abstract';

class MetaPacket extends AbstractPacket {

  static fromRaw(data: Buffer) {
    return (new this()).fromRaw(data);
  }

  static fromObject(obj: Object) {
    return (new this()).fromOptions(obj);
  }

  fromRaw(buf: Buffer) {
    super.fromRaw(buf);
    this.type = 0;
    return this;
  }

  fromOptions(opts) {
    super.fromOptions(opts);
    this.type = 0;
    return this;
  }

  toRaw(): Buffer {
    return this.encodeRawMeta();
  }

  toJSON() {
    return this.getMeta();
  }

  getSize(): number {
    return 0;
  }

}

describe('packets.meta tests', () => {
  const packet = MetaPacket.fromObject({});

  it('sould be able to encode/decode packet metadata', () => {
    const copy = MetaPacket.fromRaw(packet.toRaw());
    assert.equal(packet.toRaw().toString('hex'), copy.toRaw().toString('hex'));
  });

  it('should be able to return it\'s raw size', () => {
    assert.equal(packet.toRaw().length, packet.getTotalSize());
  });
});
