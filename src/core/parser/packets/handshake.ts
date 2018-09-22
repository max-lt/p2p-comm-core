import { PacketTypes, metaLength, types } from './util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from './abstract';

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
