import { Module, Peer, Pool } from '@p2p-comm/base';
import { PoolPacketHandler, PeerPacketHandler } from '@p2p-comm/base';
import { types } from '../packets/types';
import { HandshakePacket } from '../packets';

import { Timer } from '@p2p-comm/base/src/util/timer';

const ppphSymbol = Symbol('Peer to PeerHandshakePacketHandler');

interface Context extends Object {
  [ppphSymbol]: WeakMap<Peer, PeerHandshakePacketHandler>;
}

class PoolHandshakePacketHandler implements PoolPacketHandler {

  constructor(private parent: Pool, private ctx: Context) {

    const ppphMap = new WeakMap;
    ctx[ppphSymbol] = ppphMap;
  }

  static create(parent: Pool, ctx: Context) {
    return (new this(parent, ctx));
  }

  expectHandshake(peer: Peer) {
    peer.logger.log(`starting handshake timeout`);
    const peerHandler = this.ctx[ppphSymbol].get(peer);
    peerHandler.expectHandshake();
  }

  private handshake(peer) {
    const pool = this.parent;
    peer.logger.log(`handshaking: ${pool.port} -> ${peer.port}`);
    peer.send(HandshakePacket.fromObject({ port: pool.port, peerId: pool.nodeId }));

    // Expecting HS from outbound peer in return
    if (peer.outbound) {
      this.expectHandshake(peer);
    }
  }

  bindPeer(peer: Peer) {
    const pool = this.parent;
    // Expecting HS from inbound peer first
    if (!peer.outbound) {
      this.expectHandshake(peer);
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

  constructor(private parent: Peer, private ctx: Context) {
    this.handshakeTimeout = new Timer(5 * 1000);

    // Linking peer with module's PeerPacketHandler
    ctx[ppphSymbol].set(parent, this);

    parent.on('destroy', () => this.handshakeTimeout.clear());
  }

  static create(parent: Peer, ctx: Context) {
    return (new this(parent, ctx));
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
