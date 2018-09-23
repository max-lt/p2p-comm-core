import { PacketTypes, metaLength, types, readData, writeData, writeUInt32 } from './util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from './abstract';

export interface IHandshakePacket extends IAbstractPacket {
  port: number;
  host?: string;
  peerId: string;
}
export interface OHandshakePacket extends OAbstractPacket {
  type: PacketTypes['HANDSHAKE'];
  port: number;
  host: string;
  peerId: string;
}
export class HandshakePacket extends AbstractPacket implements OHandshakePacket {

  public type = types.HANDSHAKE;
  public port: number;
  public host: string;
  public peerId: string;

  static fromObject(obj: IHandshakePacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): HandshakePacket {
    return (new this()).fromRaw(buf);
  }

  protected fromRaw(buf: Buffer): HandshakePacket {
    super.fromRaw(buf);
    this.port = buf.readUInt32BE(metaLength);
    const [host, hostOffset] = readData(buf, metaLength + 4);
    this.host = host.toString();
    const [peerId] = readData(buf, hostOffset);
    this.peerId = peerId.toString('hex');
    return this;
  }

  protected fromOptions(opts: IHandshakePacket) {
    super.fromOptions({});
    this.port = opts.port;
    this.host = opts.host || 'localhost';
    this.peerId = opts.peerId;
    return this;
  }

  toJSON(): OHandshakePacket {
    return Object.assign(this.getMeta(), {
      peerId: this.peerId,
      port: this.port,
      host: this.host,
      type: this.type
    });
  }

  toRaw(): Buffer {
    const port = writeUInt32(this.port);
    const host = writeData(Buffer.from(this.host));
    const peerId = writeData(Buffer.from(this.peerId, 'hex'));
    const meta = this.encodeRawMeta();
    return Buffer.concat([meta, port, host, peerId]);
  }

  getSize() {
    return 4 + (4 + this.host.length) + (4 + this.peerId.length / 2);
  }

}
