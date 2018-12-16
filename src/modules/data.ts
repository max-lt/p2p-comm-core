import { Module, Peer, Pool } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';
import { DataPacket } from '../packets';
import { types } from '../packets/types';


class PoolDataPacketHandler implements PoolPacketHandler {
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

class PeerDataPacketHandler implements PeerPacketHandler {

  constructor(private parent: Peer, private ctx) { }

  static create(parent: Peer, ctx) {
    return (new this(parent, ctx));
  }

  handlePacket(packet: DataPacket) {
    if (packet.type === types.DATA) {
      this.parent.emit('packet-data', packet);
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
