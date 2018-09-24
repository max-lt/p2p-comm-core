import { metaLength } from '@p2p-comm/base/src/packets/util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from '@p2p-comm/base/src';
import { PacketTypesI, types } from './types';


export interface IDataPacket extends IAbstractPacket {
  data: Buffer;
}
export interface ODataPacket extends OAbstractPacket {
  type: PacketTypesI['DATA'];
  data: Buffer;
}
export class DataPacket extends AbstractPacket implements ODataPacket {

  static type = types.DATA;
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
    const data = Buffer.alloc(this.getSize());
    data.writeUInt32BE(this.data.length, 0);
    this.data.copy(data, 4, 0);

    const meta = this.encodeRawMeta();

    return Buffer.concat([meta, data]);
  }

  getSize() {
    return this.data.length + 4;
  }
}

