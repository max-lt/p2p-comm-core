import * as v4 from 'uuid/v4';

declare interface PacketTypes {
  DATA: 0x81;
  HANDSHAKE: 0x82;
  GETPEERS: 0x83;
}

export const types: PacketTypes = {
  DATA: 0x81,
  HANDSHAKE: 0x82,
  GETPEERS: 0x83
};

const metaLengths = {
  TYPE: 1,
  LEN: 4,
  DATE: 8,
  UUID: 16
};

const metaLength = metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE + metaLengths.UUID;

declare interface OMeta {
  uuid: string;
  date: Date;
  type: number;
  size: number;
}

declare interface IAbstractPacket {
  uuid?: string;
  date?: Date;
}
declare interface OAbstractPacket {
  uuid: string;
  date: Date;
}
abstract class AbstractPacket implements OAbstractPacket {

  uuid: string;
  date: Date;
  type = -1;

  static fromRaw(data: Buffer) { }

  static fromObject(obj: Object) { }

  static decodeRawMeta(buf: Buffer): OMeta {
    const type = buf.readUInt8(0);
    const size = buf.readUInt32BE(metaLengths.TYPE);
    const date = new Date(buf.readDoubleBE(metaLengths.TYPE + metaLengths.LEN));
    const uuidHex = buf.slice(metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE, metaLength).toString('hex');
    const uuid = [uuidHex.slice(0, 8), uuidHex.slice(8, 12), uuidHex.slice(12, 16), uuidHex.slice(16, 20), uuidHex.slice(20)].join('-');
    return { type, size, date, uuid };
  }

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
    return AbstractPacket.decodeRawMeta(buf);
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

export interface IDataPacket extends IAbstractPacket {
  data: Buffer;
}
export interface ODataPacket extends OAbstractPacket {
  type: PacketTypes['DATA'];
  data: Buffer;
}
export class DataPacket extends AbstractPacket implements ODataPacket {

  public type = types.DATA;
  public data: Buffer;

  static fromObject(obj: IDataPacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): DataPacket {
    return (new this()).fromRaw(buf);
  }

  protected fromRaw(buf: Buffer): DataPacket {
    super.fromRaw(buf);
    const packetLen = buf.readUInt32BE(metaLength);
    const offset = metaLength + 4;
    this.data = buf.slice(offset, offset + packetLen);
    return this;
  }

  protected fromOptions(opts: IDataPacket) {
    super.fromOptions(opts);
    this.type = types.DATA;
    this.data = opts.data;
    return this;
  }

  toJSON(): ODataPacket {
    return Object.assign(this.getMeta(), { data: this.data, type: this.type });
  }

  toRaw(): Buffer {
    const meta = this.encodeRawMeta();
    const data = Buffer.alloc(this.getSize());

    data.writeUInt32BE(this.data.length, 0);
    this.data.copy(data, 4, 0);

    return Buffer.concat([meta, data]);
  }

  getSize() {
    return this.data.length + 4;
  }
}


export interface IHandshakePacket extends IAbstractPacket {
  port: number;
}
export interface OHandshakePacket extends OAbstractPacket {
  type: PacketTypes['HANDSHAKE'];
  port: number;
}
export class HandshakePacket extends AbstractPacket implements OHandshakePacket {

  private size = 4;
  public type = types.HANDSHAKE;
  public port: number;

  static fromObject(obj: IHandshakePacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): HandshakePacket {
    return (new this()).fromRaw(buf);
  }

  protected fromRaw(buf: Buffer): HandshakePacket {
    super.fromRaw(buf);
    this.port = buf.readUInt32BE(metaLength);
    return this;
  }

  protected fromOptions(opts: IHandshakePacket) {
    super.fromOptions(opts);
    this.port = opts.port;
    return this;
  }

  toJSON(): OHandshakePacket {
    return Object.assign(this.getMeta(), { port: this.port, type: this.type });
  }

  toRaw(): Buffer {
    const port = Buffer.alloc(4);
    port.writeUInt32BE(this.port, 0);
    const meta = this.encodeRawMeta();
    return Buffer.concat([meta, port]);
  }

  getSize() {
    return this.size;
  }

}
