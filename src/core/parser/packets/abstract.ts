import * as crypto from 'crypto';
import { OMeta, metaLength, decodeRawMeta, metaLengths } from './util';

// tslint:disable-next-line:no-empty-interface
export interface IAbstractPacket { }
export interface OAbstractPacket {
  packetId: string;
  date: Date;
}
export abstract class AbstractPacket implements OAbstractPacket {

  packetId: string;
  date: Date;
  type = -1;

  static fromRaw(data: Buffer) {
    throw new Error('Not overwrited');
  }

  static fromObject(obj: Object) {
    throw new Error('Not overwrited');
  }

  abstract toRaw(): Buffer;

  abstract toJSON(): Object;

  protected fromOptions(opts: IAbstractPacket) {
    this.packetId = crypto.randomBytes(8).toString('hex');
    this.date = new Date();
  }

  protected fromRaw(buf: Buffer) {
    const meta = this.decodeRawMeta(buf);
    this.packetId = meta.packetId;
    this.date = meta.date;
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
