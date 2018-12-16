import { Module, Peer, Pool, AbstractPacket } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';

class PoolFilter implements PoolPacketHandler {

  constructor(private parent: Pool, private ctx) {
    ctx.filter = new Set();
  }

  static create(parent: Pool, ctx) {
    return (new this(parent, ctx));
  }

  bindPeer(peer: Peer) { }

  beforeBroadcast(packet: AbstractPacket) {
    this.parent.logger.debug('m >>', packet.getTypeName(), packet.packetId, this.ctx.filter.has(packet.packetId));
    this.ctx.filter.add(packet.packetId);
    return false;
  }

}

class PeerFilter implements PeerPacketHandler {

  constructor(private parent: Peer, private ctx) { }

  static create(parent: Peer, ctx) {
    return (new this(parent, ctx));
  }

  handlePacket(packet: AbstractPacket) {
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

export class FilterModule extends Module {
  constructor() {
    super({
      Peer: PeerFilter,
      Pool: PoolFilter,
      packets: []
    });
  }
}
