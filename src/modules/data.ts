
import { Module, Peer, Pool } from '@p2p-comm/base';
import { DataPacket } from '../packets';
import { types } from '../packets/types';


class PoolDataPacketHandler {
  constructor(private parent: Pool) { }

  static create(parent: Pool) {
    return (new this(parent));
  }

  handlePacket(packet: DataPacket, next) {
    switch (packet.type) {
      case types.DATA:
        this.parent.broadcast(packet);
        this.parent.emit('data', packet.data);
        return;
    }
  }

  bindPeer(peer: Peer, next) { }
}

class PeerDataPacketHandler {

  constructor(private parent: Peer) {

  }

  static create(parent: Peer) {
    return (new this(parent));
  }

  handlePacket(packet: DataPacket, next) {
    const parent = this.parent;

    if (parent.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    parent.logger.debug('d <-', packet.getTypeName(), packet.packetId, parent.filter.has(packet.packetId));

    switch (packet.type) {
      case types.DATA:
        break;
      default:
        return;
    }

    parent.emit('packet', packet);
  }
}


const mod = Module.create({
  Peer: PeerDataPacketHandler,
  Pool: PoolDataPacketHandler,
  packets: [DataPacket]
});

export default mod;
