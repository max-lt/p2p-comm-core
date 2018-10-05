import { Module, Peer, Pool } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';
import { types } from '../packets/types';
import { HandshakePacket } from '../packets';

import { Timer } from '@p2p-comm/base/src/util/timer';

class PoolHandshakePacketHandler implements PoolPacketHandler {

  constructor(private parent: Pool, private ctx) { }

  static create(parent: Pool, ctx) {
    return (new this(parent, ctx));
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

  expectHandshake() {
    /*
    const parent = this.parent;
    const peerCtx = this.ctx[this.parent];
    this.handshakeTimeout.start(() => {
      parent.logger.warn(`${parent.outbound ? 'Outbound' : 'Inbound'} peer did not handshaked`);
      parent.destroy();
    });
    */
  }

  bindPeer(peer: Peer) {
    const pool = this.parent;
    // Expecting HS from inbound peer first
    if (!peer.outbound) {
      // this.expectHandshake();
    }

    peer.on('packet-handshake', (p: HandshakePacket) => this.parent.emit('packet-handshake', p));

    // Outbound peer connected
    peer.once('connect', () => {
      pool.logger.debug(`Connected to peer ${peer.port}, handshaking with ${pool.port}`);
      this.handshake(peer);
    });

    peer.once('packet-handshake', (p: HandshakePacket) => {
      pool.logger.debug(`Pool received handshake from ${peer.outbound ? 'outbound' : 'inbound'} peer ${peer.port}`);
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

class PeerHandshakePacketHandler implements PeerPacketHandler {

  private handshaked = false;
  private handshakeTimeout: Timer;

  constructor(private parent: Peer, private ctx) {
    this.handshakeTimeout = new Timer(5 * 1000);
    parent.on('destroy', () => this.handshakeTimeout.clear());
  }

  static create(parent: Peer, ctx) {
    return (new this(parent, ctx));
  }

  handlePacket(packet: HandshakePacket): boolean {
    const parent = this.parent;
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
        parent.emit('packet-handshake', packet);
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
