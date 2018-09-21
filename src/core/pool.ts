import { EventEmitter } from 'events';
import { Packet, MessagePacket } from '../parser/parser';
import { createServer, Server, Socket, AddressInfo } from 'net';
import { SPeer, Peer } from './peer';
import { Logger, SimpleLogger } from './logger';

export class Pool extends EventEmitter {

  // Defines either handshake is mandatory or not
  handshake: boolean;

  peers: PeerSet;
  logger: Logger;
  server: Server;

  port: number;
  seeds: number[];
  filter: Set<string>;

  constructor(opts?: { seed: number[] }) {
    super();

    this.port = 0;
    this.handshake = true;
    this.filter = new Set();
    this.peers = new PeerSet;
    this.logger = new SimpleLogger('pool');
    this.server = createServer();
    this.seeds = opts && opts.seed || [];

    this.logger.info('Created pool');
    this.initServer();
  }

  initServer() {
    this.server.on('error', (err) => {
      this.emit('error', err);
    });

    this.server.on('connection', (socket) => {
      this.addInbound(socket);
      this.emit('connection', socket);
      this.logger.debug('Peer connection');
    });

    this.server.on('listening', () => {
      const data: any = this.server.address();
      this.logger.info('Pool server listening on.', data);
      this.port = data.port;
      this.emit('listening', data);
      this.discoverSeeds();
    });
  }

  addInbound(socket: Socket) {
    const peer: Peer = SPeer.fromInbound({ filter: this.filter, handshake: this.handshake }, socket);
    this.bindPeer(peer);
  }

  discoverSeeds(seeds?: number[]) {
    (seeds || this.seeds).forEach((seed) => {
      try {
        this.addOutbound(seed);
      } catch (err) {
        this.logger.error('Failed to connect to seed', seed, err.message);
      }
    });
  }

  addOutbound(port: number) {
    const peer = SPeer.fromOutbound({ port, filter: this.filter, handshake: this.handshake }, this.port);
    this.bindPeer(peer);
  }

  bindPeer(peer: Peer) {
    this.peers.add(peer);

    // Outbound
    peer.once('connect', () => {
      this.logger.debug('Peer connected', peer.port);
    });

    peer.on('handshake', () => {
      this.logger.log('Pool received handshake');
    });

    peer.on('error', (err) => {
      this.logger.debug(err);
    });

    peer.once('close', (connected) => {
      this.logger.debug(`Peer close, was ${connected ? 'connected' : 'disconnected'}`);
      this.peers.delete(peer);
      this.logger.log(`${this.peers.size} peers connected.`);
    });

    peer.on('packet', (packet) => {
      this.handlePacket(peer, packet);
    });
  }

  private handlePacket(peer: Peer, packet: Packet) {
    switch (packet.type) {
      case 'handshake':
        // this.port = packet.port;
        return;
      case 'message':
        this.handleMessage(packet);
        return;
      case 'getpeers':
        break;
    }
  }

  handleMessage(packet: MessagePacket) {
    this.peers.broadcast(packet);
    this.emit('message', packet.message);
  }

  listen(port?: number) {
    this.server.listen(port);
  }

  sendMessage(message: string) {
    this.peers.broadcastMessage(message);
  }

  connect() {

  }

  disconnect() {

  }
}

class PeerSet extends Set<Peer> {

  broadcast(packet: Packet, exceptions?: PeerSet) {
    for (const peer of this) {
      if (exceptions && exceptions.has(peer)) {
        continue;
      }
      peer.send(packet);
    }
  }

  broadcastMessage(message: string, exceptions?: PeerSet) {
    for (const peer of this) {
      if (exceptions && exceptions.has(peer)) {
        continue;
      }
      peer.sendMessage(message);
    }
  }

}
