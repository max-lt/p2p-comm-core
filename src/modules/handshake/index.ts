import { Module, Peer, Pool } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';
import { HandshakePacket, types } from './packets';

import { TimerUtil as Timer } from '@p2p-comm/base';

interface Context extends Object {
  PPPHMAP: WeakMap<Peer, PeerHandshakePacketHandler>;
}

class PoolHandshakePacketHandler implements PoolPacketHandler {

  constructor(private pool: Pool, private ctx: Context) {
    ctx.PPPHMAP = new WeakMap;
  }

  static create(pool: Pool, ctx: Context) {
    return (new this(pool, ctx));
  }

  expectHandshake(peer: Peer) {
    peer.logger.log(`starting handshake timeout`);
    const peerHandler = this.ctx.PPPHMAP.get(peer);
    peerHandler.expectHandshake();
  }

  private handshake(peer) {
    const pool = this.pool;
    peer.logger.log(`handshaking: ${pool.port} -> ${peer.port}`);
    peer.send(HandshakePacket.fromObject({ port: pool.port, peerId: pool.nodeId }));

    // Expecting HS from outbound peer in return
    if (peer.outbound) {
      this.expectHandshake(peer);
    }
  }

  bindPeer(peer: Peer) {
    const pool = this.pool;
    // Expecting HS from inbound peer first
    if (!peer.outbound) {
      this.expectHandshake(peer);
    }

    peer.on('packet-handshake', (p: HandshakePacket) => pool.emit('packet-handshake', p));

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

  constructor(private peer: Peer, private ctx: Context) {
    this.handshakeTimeout = new Timer(5 * 1000);

    // Linking peer with module's PeerPacketHandler
    ctx.PPPHMAP.set(peer, this);

    peer.on('destroy', () => this.handshakeTimeout.clear());
  }

  static create(peer: Peer, ctx: Context) {
    return (new this(peer, ctx));
  }

  expectHandshake() {
    const peer = this.peer;
    this.handshakeTimeout.start(() => {
      peer.logger.warn(`${peer.outbound ? 'Outbound' : 'Inbound'} peer did not handshaked`);
      peer.destroy();
    });
  }

  handlePacket(packet: HandshakePacket): boolean {
    const peer = this.peer;
    switch (packet.type) {
      case types.HANDSHAKE:
        if (peer.outbound && packet.port !== peer.port) {
          peer.error(`Outbound peer gave a different port: expected ${peer.port} got ${packet.port}`);
        }
        peer.id = packet.peerId;
        peer.host = packet.host;
        peer.port = packet.port;
        this.handshaked = true;
        this.handshakeTimeout.clear();
        peer.emit('packet-handshake', packet);
        return true;
      default:
        if (!this.handshaked) {
          return true;
        }
        return false;
    }
  }
}

export class HandshakeModule extends Module {
  constructor() {
    super({
      Peer: PeerHandshakePacketHandler,
      Pool: PoolHandshakePacketHandler,
      packets: [HandshakePacket]
    });
  }
}
