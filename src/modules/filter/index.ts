import { Module, Peer, Pool, AbstractPacket } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';

class PoolFilter implements PoolPacketHandler {

  constructor(private pool: Pool, private ctx) {
    ctx.filter = new Set();
  }

  static create(pool: Pool, ctx) {
    return (new this(pool, ctx));
  }

  bindPeer(peer: Peer) { }

  beforeBroadcast(packet: AbstractPacket) {
    this.pool.logger.debug('m >>', packet.getTypeName(), packet.packetId, this.ctx.filter.has(packet.packetId));
    this.ctx.filter.add(packet.packetId);
    return false;
  }

}

class PeerFilter implements PeerPacketHandler {

  constructor(private peer: Peer, private ctx) { }

  static create(peer: Peer, ctx) {
    return (new this(peer, ctx));
  }

  handlePacket(packet: AbstractPacket) {
    const peer = this.peer;
    const filter = this.ctx.filter;

    if (peer.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    peer.logger.debug('h <-', packet.getTypeName(), packet.packetId, filter.has(packet.packetId));

    if (filter && filter.has(packet.packetId)) {
      return true;
    }

    filter.add(packet.packetId);

    return false;
  }
}

export class FilterModule extends Module {
  constructor() {
    super({
      Peer: PeerFilter,
      Pool: PoolFilter,
      packets: []
    });
  }
}
