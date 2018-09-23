import { PacketTypes, types } from './util';
import { OAbstractPacket, EmptyPacket } from './abstract';

export interface OPingPacket extends OAbstractPacket {
  type: PacketTypes['PING'];
}
export class PingPacket extends EmptyPacket implements OPingPacket {

  public type = types.PING;

  static fromObject() {
    return (new this()).fromOptions();
  }

  static fromRaw(buf: Buffer): PingPacket {
    return (new this()).fromRaw(buf);
  }

}
