
import { Module, Peer, Pool } from '@p2p-comm/base';
import { DataPacket } from '../packets';
import { types } from '../packets/types';


class PoolDataPacketHandler {
  constructor(private parent: Pool) { }

  static create(parent: Pool) {
    return (new this(parent));
  }

  handlePacket(packet: DataPacket) {
    console.log('poll', packet);
    if (packet.type === types.DATA) {
      this.parent.broadcast(packet);
      this.parent.emit('packet-data', packet.data);
      return true;
    }
    return false;
  }

  bindPeer(peer: Peer) {
    peer.on('packet-data', (data) => this.parent.emit('packet-data', data));
  }
}

class PeerDataPacketHandler {

  constructor(private parent: Peer) {

  }

  static create(parent: Peer) {
    return (new this(parent));
  }

  handlePacket(packet: DataPacket) {
    const parent = this.parent;

    if (parent.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    parent.logger.debug('d <-', packet.getTypeName(), packet.packetId, parent.filter.has(packet.packetId));

    if (packet.type === types.DATA) {
      this.parent.emit('packet-data', packet.data);
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
