import { EventEmitter } from 'events';

import { Logger, SimpleLogger } from './logger';
import { decodeRawMeta, metaLength } from '@p2p-comm/base/src/packets/util';
import { AbstractPacket } from '@p2p-comm/base/src/packets/abstract';

const EMPTY = Buffer.alloc(0);

let safe = 20000;

export class BufferParser extends EventEmitter /* implements Parser */ {

  acceptedTypes: number[];
  packets: Map<number, typeof AbstractPacket>;
  logger: Logger;
  lock = false;
  buf: Buffer;

  constructor(modules: Array<typeof AbstractPacket>) {
    super();
    this.buf = EMPTY;
    this.packets = [].concat.apply([], modules).reduce((acc, e) => (acc.set(e.type, e), acc), new Map);
    this.acceptedTypes = Array.from(this.packets.keys());
    this.logger = new SimpleLogger('parser');
    this.logger.debug({ p: this.packets });
  }

  feed(data: Buffer): void {

    if (this.lock) {
      this.logger.warn('locked');
      return;
    }

    this.lock = true;

    let buf = Buffer.concat([this.buf, data]);

    let packet: AbstractPacket = null;

    while (buf.length >= metaLength) {
      if (safe < 0) {
        return;
      }

      const meta = decodeRawMeta(buf);

      // this.logger.log('meta', meta && meta.size + metaLength, buf.length);
      this.logger.log('meta', meta && meta.type, this.acceptedTypes);
      if (!this.acceptedTypes.includes(meta.type)) {
        throw new Error('Invalid types');
      }

      if (meta.size + metaLength > buf.length) {
        break;
      }

      packet = this.decode(buf);

      safe--;

      // this.logger.log('decoded', safe, packet && packet.toJSON());

      if (!packet) {
        this.logger.warn('received invalid packet', buf);
        buf = EMPTY;
        break;
      }

      buf = buf.slice(packet.getTotalSize());

      if (buf.length) {
        this.logger.debug('left', buf.length);
      }

      this.emit('packet', packet);
    }

    this.buf = Buffer.concat([buf]);
    this.lock = false;
  }

  decode(buf: Buffer): AbstractPacket {
    const offset = 0;
    let packet: AbstractPacket = null;

    // while (MIN_SIZE + offset < buf.length && Buffer.compare(MAGIC, buf.slice(offset, MAGIC.length + offset)) !== 0) {
    //   offset++;
    // }

    // offset += MAGIC.length;

    // if (buf.length < MIN_SIZE) {
    //   this.buf = buf.slice(offset);
    //   return;
    // }

    const type = buf[offset];

    // const raw = buf.slice(offset, stop + END.length);

    const PacketClass: typeof AbstractPacket = this.packets.get(type);

    if (!PacketClass) {
      throw new Error(`Undlandled packet type ${type}`);
    }

    packet = PacketClass.fromRaw(buf);

    if (!packet) {
      return;
    }

    return packet;
  }
}
