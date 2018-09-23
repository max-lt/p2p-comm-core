import { PacketTypes, metaLength, types, writeUInt32, decodePeer, PeerInfo, encodePeer } from './util';
import { IAbstractPacket, OAbstractPacket, AbstractPacket } from './abstract';


type PeerInfoList = Array<PeerInfo>;

export interface ISendpeersPacket extends IAbstractPacket {
  peers: PeerInfoList;
}
export interface OSendpeersPacket extends OAbstractPacket {
  type: PacketTypes['SENDPEERS'];
  peers: PeerInfoList;
}
export class SendpeersPacket extends AbstractPacket implements OSendpeersPacket {

  public type = types.SENDPEERS;
  public peers: PeerInfoList;

  static fromObject(obj: ISendpeersPacket) {
    return (new this()).fromOptions(obj);
  }

  static fromRaw(buf: Buffer): SendpeersPacket {
    return (new this()).fromRaw(buf);
  }

  private decodePeers(buf: Buffer, offset: number): PeerInfoList {
    const len = buf.readUInt32BE(offset);
    const list = [];
    let _offset = offset + 4;
    for (let i = 0; i < len; i++) {
      const [peer, __offset] = decodePeer(buf, _offset);
      _offset = __offset;
      list.push(peer);
    }
    return list;
  }

  private encodePeers(): Buffer {
    const list: Buffer[] = [];
    for (const peer of this.peers) {
      list.push(encodePeer(peer));
    }
    return Buffer.concat(list);
  }

  protected fromRaw(buf: Buffer): SendpeersPacket {
    super.fromRaw(buf);
    this.peers = this.decodePeers(buf, metaLength);
    return this;
  }

  protected fromOptions(opts: ISendpeersPacket) {
    super.fromOptions({});
    this.peers = opts.peers;
    return this;
  }

  toJSON(): OSendpeersPacket {
    return Object.assign(this.getMeta(), {
      peers: this.peers,
      type: this.type
    });
  }

  toRaw(): Buffer {
    const meta = this.encodeRawMeta();
    const number = writeUInt32(this.peers.length);
    const peers = this.encodePeers();
    return Buffer.concat([meta, number, peers]);
  }

  getSize() {
    return 4 + this.peers.reduce((acc, peer) => acc + 4 + (4 + peer.host.length) + (4 + peer.peerId.length / 2), 0);
  }

}
