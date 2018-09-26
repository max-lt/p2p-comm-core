
import { Module, Peer, Pool } from '@p2p-comm/base';
import { DataPacket } from '../packets';

class PoolFilter {

  constructor(private parent: Pool, ctx) {
    ctx.filter = new Set();
  }

  static create(parent: Pool, ctx) {
    return (new this(parent, ctx));
  }

  bindPeer(peer: Peer) { }
}

class PeerFilter {

  constructor(private parent: Peer, private ctx) { }

  static create(parent: Peer, ctx) {
    return (new this(parent, ctx));
  }

  handlePacket(packet: DataPacket) {
    const parent = this.parent;
    const filter = this.ctx.filter;

    if (parent.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    parent.logger.debug('h <-', packet.getTypeName(), packet.packetId, filter.has(packet.packetId));

    if (filter && filter.has(packet.packetId)) {
      return true;
    }

    filter.add(packet.packetId);

    return false;
  }
}


const mod = Module.create({
  Peer: PeerFilter,
  Pool: PoolFilter,
  packets: [DataPacket]
});

export default mod;
