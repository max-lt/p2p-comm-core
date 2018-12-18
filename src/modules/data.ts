import { Module, Peer, Pool } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';
import { DataPacket } from '../packets';
import { types } from '../packets/types';

class PoolDataPacketHandler implements PoolPacketHandler {
  constructor(private pool: Pool) { }

  static create(pool: Pool) {
    return (new this(pool));
  }

  bindPeer(peer: Peer) {
    peer.on('packet-data', (packet: DataPacket) => {
      this.pool.emit('packet-data', packet);
      this.pool.broadcast(packet);
    });
  }
}

class PeerDataPacketHandler implements PeerPacketHandler {

  constructor(private peer: Peer, private ctx) { }

  static create(peer: Peer, ctx) {
    return (new this(peer, ctx));
  }

  handlePacket(packet: DataPacket) {
    if (packet.type === types.DATA) {
      this.peer.emit('packet-data', packet);
      return true;
    }
    return false;
  }
}

export class DataModule extends Module {
  constructor() {
    super({
      Peer: PeerDataPacketHandler,
      Pool: PoolDataPacketHandler,
      packets: [DataPacket]
    });
  }
}
