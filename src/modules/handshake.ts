
import { Module, Peer, Pool } from '@p2p-comm/base';
import { types } from '../packets/types';
import { HandshakePacket } from '../packets';

import { Timer } from '@p2p-comm/base/src/util/timer';

class PoolHandshakePacketHandler {

  constructor(private parent: Pool) { }

  static create(parent: Pool) {
    return (new this(parent));
  }

  private handshake(peer) {
    const pool = this.parent;
    peer.logger.log(`handshaking: ${pool.port} -> ${peer.port}`);
    peer.send(HandshakePacket.fromObject({ port: pool.port, peerId: pool.nodeId }));

    // Expecting HS from outbound peer in return
    if (peer.outbound) {
      // this.expectHandshake();

    }
  }

  bindPeer(peer: Peer) {
    const pool = this.parent;
    // Expecting HS from inbound peer first
    if (!peer.outbound) {
      // this.expectHandshake();
    }

    peer.once('connect', () => {
      pool.logger.debug(`Connected to peer ${peer.port}, handshaking with ${pool.port}`);
      this.handshake(peer);
    });

    peer.once('packet-handshake', (outbound) => {
      pool.logger.debug(`Pool received handshake from ${outbound ? 'outbound' : 'inbound'} peer ${peer.port}`);
      pool.logger.debug(`Peer ${peer.port} will now be known as ${peer.id}`);
      pool.emit('peer', peer);

      // Inbound peer handshaked, handshaking in return
      if (!peer.outbound) {
        pool.logger.debug(`Handskaking back with ${pool.port}`);
        this.handshake(peer);
      }
    });
  }
}

class PeerHandshakePacketHandler {

  private handshaked = false;
  private handshakeTimeout: Timer;

  constructor(private parent: Peer) {
    this.handshakeTimeout = new Timer(5 * 1000);
    parent.on('destroy', () => this.handshakeTimeout.clear());
  }

  static create(parent: Peer) {
    return (new this(parent));
  }

  expectHandshake() {
    const parent = this.parent;
    this.handshakeTimeout.start(() => {
      parent.logger.warn(`${parent.outbound ? 'Outbound' : 'Inbound'} peer did not handshaked`);
      parent.destroy();
    });
  }

  handlePacket(packet: HandshakePacket): boolean {
    const parent = this.parent;

    if (parent.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    parent.logger.debug('h <-', packet.getTypeName(), packet.packetId, parent.filter.has(packet.packetId));

    if (parent.filter && parent.filter.has(packet.packetId)) {
      return true;
    }

    parent.filter.add(packet.packetId);

    switch (packet.type) {
      case types.HANDSHAKE:
        if (parent.outbound && packet.port !== parent.port) {
          parent.error(`Outbound peer gave a different port: expected ${parent.port} got ${packet.port}`);
        }
        parent.id = packet.peerId;
        parent.host = packet.host;
        parent.port = packet.port;
        this.handshaked = true;
        this.handshakeTimeout.clear();
        parent.emit('packet-handshake', parent.outbound);
        return true;
      default:
        if (!this.handshaked) {
          return true;
        }
        return false;
    }
  }
}


const mod = Module.create({
  Peer: PeerHandshakePacketHandler,
  Pool: PoolHandshakePacketHandler,
  packets: [HandshakePacket]
});

export default mod;
