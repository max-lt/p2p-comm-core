import { metaLength, encodePeer, decodePeer } from '@p2p-comm/base/src/packets/util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from '@p2p-comm/base/src';
import { PacketTypesI, types } from './types';

export interface IHandshakePacket extends IAbstractPacket {
  port: number;
  host?: string;
  peerId: string;
}
export interface OHandshakePacket extends OAbstractPacket {
  type: PacketTypesI['HANDSHAKE'];
  port: number;
  host: string;
  peerId: string;
}
export class HandshakePacket extends AbstractPacket implements OHandshakePacket {

  static type = types.HANDSHAKE;
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
    const [peer] = decodePeer(buf, metaLength);
    this.port = peer.port;
    this.host = peer.host;
    this.peerId = peer.peerId;
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
    const info = encodePeer(this);
    const meta = this.encodeRawMeta();
    return Buffer.concat([meta, info]);
  }

  getSize() {
    return 4 + (4 + this.host.length) + (4 + this.peerId.length / 2);
  }

}
