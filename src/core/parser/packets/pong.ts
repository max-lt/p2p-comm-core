import { PacketTypes, types } from './util';
import { OAbstractPacket, EmptyPacket } from './abstract';

export interface OPongPacket extends OAbstractPacket {
  type: PacketTypes['PONG'];
}
export class PongPacket extends EmptyPacket implements OPongPacket {

  public type = types.PONG;

  static fromObject() {
    return (new this()).fromOptions();
  }

  static fromRaw(buf: Buffer): PongPacket {
    return (new this()).fromRaw(buf);
  }

}
