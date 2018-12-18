import { IBasePacketI, OBasePacketI, PacketMetaI, util } from '@p2p-comm/base';
import { BasePacket } from '@p2p-comm/base';

export interface PacketTypesI {
  DATA: 0x81;
}

export const types: PacketTypesI = {
  DATA: 0x81
};

export interface IDataPacket extends IBasePacketI {
  data: Buffer;
}
export interface ODataPacket extends OBasePacketI {
  type: PacketTypesI['DATA'];
  data: Buffer;
}
export class DataPacket extends BasePacket<IDataPacket, ODataPacket> implements ODataPacket {

  static type = types.DATA;
  public type = types.DATA;
  public data: Buffer;

  static fromObject(obj: IDataPacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): DataPacket {
    return (new this()).fromRaw(buf);
  }

  protected fromRaw(buf: Buffer) {
    super.fromRaw(buf);
    const packetLen = buf.readUInt32BE(util.metaLength);
    const offset = util.metaLength + 4;
    this.data = buf.slice(offset, offset + packetLen);
    return this;
  }

  protected fromOptions(opts: IDataPacket) {
    super.fromOptions(opts);
    this.type = types.DATA;
    this.data = opts.data;
    return this;
  }

  toJSON(): ODataPacket & PacketMetaI {
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

  getTypeName() {
    return 'DATA';
  }
}

