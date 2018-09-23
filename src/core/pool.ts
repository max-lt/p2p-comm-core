import { EventEmitter } from 'events';
import { SimplePeer, Peer } from './peer';
import { Logger, SimpleLogger } from './logger';
import { types as PACKET, DataPacket, Packet } from './parser/packets/';

import { AbstractServer, AbstractTransport } from '../transport/transport';
import { wait } from './util/wait';

export class Pool<T extends AbstractTransport> extends EventEmitter {

  nodeId: string;
  litening = false;

  // Defines either handshake is mandatory or not
  handshake: boolean;

  peers: PeerSet<T>;
  logger: Logger;
  server: AbstractServer<T>;

  port: number;
  seeds: number[];
  filter: Set<string>;

  constructor(
    opts: { seed: number[], nodeId },
    private TransportFactory: (port: number) => T,
    private ServerFactory: () => AbstractServer<T>
  ) {
    super();
    this.port = 0;
    this.handshake = true;
    this.filter = new Set();
    this.peers = new PeerSet;
    this.logger = new SimpleLogger('pool');
    this.server = this.ServerFactory();
    this.seeds = opts && opts.seed || [];
    this.nodeId = opts.nodeId;

    this.logger.info('Created pool');
    this.initServer();
  }

  initServer() {
    this.server.on('error', (err) => {
      this.emit('error', err);
    });

    // Inbound
    this.server.on('connection', (transport) => {
      this.addInbound(transport);
      this.emit('connection', transport);
      this.logger.debug('Peer connection');
    });

    this.server.on('listening', () => {
      const data: any = this.server.address();
      this.logger.info('Pool server listening on.', data);
      this.port = data.port;
      this.litening = true;
      this.emit('listening', data);
      this.discoverSeeds();
    });
  }

  addInbound(transport: T) {
    const opts = { filter: this.filter, handshake: this.handshake };
    const peer: Peer<T> = SimplePeer.fromInbound(opts, transport, this.TransportFactory);
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

  private async addOutbound(port: number) {
    const opts = { port, filter: this.filter, handshake: this.handshake };
    let i = 4;
    while (i--) {
      await wait(1000);
      const peer = SimplePeer.fromOutbound(opts, this.TransportFactory);
      this.logger.log('Outbound peer', peer.port);
      this.bindPeer(peer);
      try {
        await peer.connect();
        return;
      } catch (err) {
        this.logger.warn(`Failed to connect to peer: ${err.message}`);
      }
    }
  }

  private bindPeer(peer: Peer<T>) {
    this.peers.add(peer);

    // Outbound
    peer.once('connect', () => {
      this.logger.debug(`Connected to peer ${peer.port}, handshaking with ${this.port}`);
      peer.handshake(this.port, this.nodeId);
    });

    peer.once('handshake', (outbound) => {
      this.logger.debug(`Pool received handshake from ${outbound ? 'outbound' : 'inbound'} peer ${peer.port}`);
      this.logger.debug(`Peer ${peer.port} will now be known as ${peer.id}`);
      if (!outbound) {
        this.logger.debug(`Handskaking back with ${this.port}`);
        peer.handshake(this.port, this.nodeId);
      }
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

  private handlePacket(peer: Peer<T>, packet: Packet) {
    switch (packet.type) {
      case PACKET.HANDSHAKE:
        return;
      case PACKET.DATA:
        this.peers.broadcast(packet);
        this.emit('message', packet.data.toString(), peer);
        return;
    }
  }

  listen(port?: number) {
    this.server.listen(port);
  }

  sendMessage(message: string) {
    const data = DataPacket.fromObject({ data: Buffer.from(message) });
    this.peers.broadcast(data);
  }

  connect() {

  }

  disconnect() {

  }
}

class PeerSet<T extends AbstractTransport> extends Set<Peer<T>> {
  broadcast(packet: Packet, exceptions?: PeerSet<T>) {
    for (const peer of this) {
      if (exceptions && exceptions.has(peer)) {
        continue;
      }
      peer.send(packet);
    }
  }
}
