import { PacketTypes, metaLength, types, writeUInt32 } from './util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from './abstract';

export interface IGetpeersPacket extends IAbstractPacket {
  number: number;
}
export interface OGetpeersPacket extends OAbstractPacket {
  type: PacketTypes['GETPEERS'];
  number: number;
}
export class GetpeersPacket extends AbstractPacket implements OGetpeersPacket {

  public type = types.GETPEERS;
  public number: number;

  static fromObject(obj: IGetpeersPacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): GetpeersPacket {
    return (new this()).fromRaw(buf);
  }

  protected fromRaw(buf: Buffer): GetpeersPacket {
    super.fromRaw(buf);
    this.number = buf.readUInt32BE(metaLength);
    return this;
  }

  protected fromOptions(opts: IGetpeersPacket) {
    super.fromOptions({});
    this.number = opts.number;
    return this;
  }

  toJSON(): OGetpeersPacket {
    return Object.assign(this.getMeta(), {
      number: this.number,
      type: this.type
    });
  }

  toRaw(): Buffer {
    const number = writeUInt32(this.number);
    const meta = this.encodeRawMeta();
    return Buffer.concat([meta, number]);
  }

  getSize() {
    return 4;
  }

}
