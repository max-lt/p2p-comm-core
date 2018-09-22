import * as v4 from 'uuid/v4';
import { OMeta, metaLength, decodeRawMeta, metaLengths } from './util';

export interface IAbstractPacket {
  uuid?: string;
  date?: Date;
}
export interface OAbstractPacket {
  uuid: string;
  date: Date;
}
export abstract class AbstractPacket implements OAbstractPacket {

  uuid: string;
  date: Date;
  type = -1;

  static fromRaw(data: Buffer) { }

  static fromObject(obj: Object) { }

  abstract toRaw(): Buffer;

  protected fromOptions(opts: IAbstractPacket) {
    this.uuid = opts.uuid || v4();
    this.date = new Date(opts.date || +new Date);
  }

  protected fromRaw(buf: Buffer) {
    const meta = this.decodeRawMeta(buf);
    this.fromOptions({ uuid: meta.uuid, date: meta.date });
    this.type = meta.type;
  }

  protected encodeRawMeta(): Buffer {
    const meta = Buffer.alloc(metaLength);
    meta.writeUInt8(this.type, 0);
    meta.writeUInt32BE(this.getSize(), metaLengths.TYPE);
    meta.writeDoubleBE(+this.date, metaLengths.TYPE + metaLengths.LEN);
    const uuidHex = this.uuid.split('-').join('');
    meta.write(uuidHex, metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE, uuidHex.length / 2, 'hex');
    return meta;
  }

  protected decodeRawMeta(buf: Buffer): OMeta {
    return decodeRawMeta(buf);
  }

  protected getMeta(): OMeta {
    return {
      uuid: this.uuid,
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
