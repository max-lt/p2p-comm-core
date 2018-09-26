
import { Module, Peer, Pool } from '@p2p-comm/base';
import { DataPacket } from '../packets';
import { types } from '../packets/types';


class PoolDataPacketHandler {
  constructor(private parent: Pool) { }

  static create(parent: Pool) {
    return (new this(parent));
  }

  bindPeer(peer: Peer) {
    peer.on('packet-data', (packet: DataPacket) => {
      this.parent.emit('packet-data', packet);
      this.parent.broadcast(packet);
    });
  }
}

class PeerDataPacketHandler {

  constructor(private parent: Peer) { }

  static create(parent: Peer) {
    return (new this(parent));
  }

  handlePacket(packet: DataPacket) {
    if (packet.type === types.DATA) {
      this.parent.emit('packet-data', packet);
      return true;
    }
    return false;
  }
}


const mod = Module.create({
  Peer: PeerDataPacketHandler,
  Pool: PoolDataPacketHandler,
  packets: [DataPacket]
});

export default mod;
