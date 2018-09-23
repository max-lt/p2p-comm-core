import * as crypto from 'crypto';
import { OMeta, metaLength, decodeRawMeta, metaLengths } from './util';

export interface IAbstractPacket {
  packetId?: string;
  date?: Date;
}
export interface OAbstractPacket {
  packetId: string;
  date: Date;
}
export abstract class AbstractPacket implements OAbstractPacket {

  packetId: string;
  date: Date;
  type = -1;

  static fromRaw(data: Buffer) { }

  static fromObject(obj: Object) { }

  abstract toRaw(): Buffer;

  protected fromOptions(opts: IAbstractPacket) {
    this.packetId = opts.packetId || crypto.randomBytes(8).toString('hex');
    this.date = new Date(opts.date || +new Date);
  }

  protected fromRaw(buf: Buffer) {
    const meta = this.decodeRawMeta(buf);
    this.fromOptions({ packetId: meta.packetId, date: meta.date });
    this.type = meta.type;
  }

  protected encodeRawMeta(): Buffer {
    const meta = Buffer.alloc(metaLength);
    meta.writeUInt8(this.type, 0);
    meta.writeUInt32BE(this.getSize(), metaLengths.TYPE);
    meta.writeDoubleBE(+this.date, metaLengths.TYPE + metaLengths.LEN);
    meta.write(this.packetId, metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE, this.packetId.length / 2, 'hex');
    return meta;
  }

  protected decodeRawMeta(buf: Buffer): OMeta {
    return decodeRawMeta(buf);
  }

  protected getMeta(): OMeta {
    return {
      packetId: this.packetId,
      date: this.date,
      type: this.type,
      size: this.getSize(),
    };
  }

  abstract getSize(): number;

  getTotalSize() {
    return this.getSize() + metaLength;
  }
}
