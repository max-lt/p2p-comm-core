import { EventEmitter } from 'events';
import { format } from 'util';
import * as assert from 'assert';

import { SimpleLogger, Logger } from './logger';
import { Timer } from './util/timer';
import { BufferParser } from './parser/parser';
import { HandshakePacket, types as PACKET, DataPacket, Packet } from './parser/packets';
import { AbstractTransport } from '../transport/transport';

export interface Peer<T> {

  id: string;
  port: number;

  outbound: boolean;
  connected: boolean;
  destroyed: boolean;
  handshaked: boolean;

  on(event: 'connect', listener: () => void): this;
  on(event: 'handshake', listener: (outbound: boolean) => void): this;
  on(event: 'packet', listener: (data: Packet) => void): this;
  on(event: 'close', listener: (had_error: boolean) => void): this;
  on(event: 'error', listener: (err: Error) => void): void;

  once(event: 'connect', listener: () => void): this;
  once(event: 'handshake', listener: (outbound: boolean) => void): this;
  once(event: 'packet', listener: (data: Packet) => void): this;
  once(event: 'close', listener: (had_error: boolean) => void): this;
  once(event: 'error', listener: (err: Error) => void): void;

  destroy();

  connect(transport: T);

  handshake(port: number, nodeId: string);

  write(data: Buffer);

  send(packet: Packet);

  sendMessage(str: string);
}


export class SimplePeer<T extends AbstractTransport> extends EventEmitter implements Peer<T> {

  // debug
  private static counter = 0;

  logger: Logger;
  transport: T;
  parser: BufferParser;

  outbound = false;
  connected = false;
  destroyed = false;
  handshaked = false;

  version = -1;

  id: string;
  port: number;
  host: string;
  filter: Set<string>;

  connectTimeout: Timer;
  handshakeTimeout: Timer;

  constructor({ port, filter }) {
    super();
    this.port = port;
    this.connectTimeout = new Timer(2000);
    this.handshakeTimeout = new Timer(2000);
    this.logger = new SimpleLogger('peer:' + SimplePeer.counter++);
    this.filter = filter;
    this.parser = new BufferParser();
    this.init();
  }

  static fromInbound(options, transport) {
    const peer = new this(options);
    peer.accept(transport);
    return peer;
  }

  static fromOutbound(options) {
    return new this(options);
  }

  /**
   * Accept an inbound transport.
   */
  private accept(transport: T) {
    this.connected = true;
    this.outbound = false;
    this.bind(transport);
    this.expectHandshake();
  }

  /**
   * Create an outbound transport.
   */
  async connect(transport: T): Promise<void> {
    const port = this.port;
    this.logger.debug('Connecting to', port);
    this.outbound = true;
    this.connected = false;

    const error = await new Promise<Error | null>((resolve) => {
      this.connectTimeout.start(() => resolve(new Error('timeout')));
      transport.once('connect', () => resolve(null));
      transport.once('error', (err) => resolve(err));
    });

    this.connectTimeout.clear();

    if (error) {
      this.logger.debug('Failed to connect to', port);
      this.destroy();
      throw error;
    }

    this.port = port;
    this.connected = true;
    this.bind(transport);
    this.logger.log('EMIT CONNECT');
    this.emit('connect');
  }

  handshake(publicPort, nodeId) {
    this.logger.log(`handshaking: ${publicPort} -> ${this.port}`);
    const p = HandshakePacket.fromObject({ port: publicPort, peerId: nodeId });
    this.send(p);

    if (this.outbound) {
      this.expectHandshake();
    }
  }

  expectHandshake() {
    this.handshakeTimeout.start(() => {
      this.logger.warn(`${this.outbound ? 'Outbound' : 'Inbound'} peer did not handshaked`);
      this.destroy();
    });
  }

  private init() {

    this.parser.on('packet', (packet) => {
      try {
        this.handlePacket(packet);
      } catch (e) {
        this.error(e);
        this.destroy();
      }
    });

    this.parser.on('error', (err) => {
      this.error(err);
    });

  }

  private bind(transport: T) {
    assert(!this.transport, 'already bound');
    this.transport = transport;

    this.transport.on('error', (err: Error) => {
      this.logger.error('Peer error', err);
      this.error(err);
      this.destroy();
    });

    this.transport.on('data', (data: Buffer) => {
      this.feedParser(data);
    });

    this.transport.once('close', () => {
      console.log('transport close');
      this.destroy();
    });
  }

  private feedParser(data: Buffer) {
    return this.parser.feed(data);
  }

  private handlePacket(packet: Packet) {
    if (this.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    // this.logger.debug('m?=', packet.packetId, this.filter.has(packet.packetId));
    // this.logger.debug('m?=', this.id);

    if (this.filter && this.filter.has(packet.packetId)) {
      return;
    }

    this.filter.add(packet.packetId);
    // const peerId = this.peerId || '???';
    // this.logger.debug(`H<${peerId}>`, JSON.stringify(packet.toJSON(), null, 2));

    switch (packet.type) {
      case PACKET.HANDSHAKE:
        if (this.outbound && packet.port !== this.port) {
          this.error(`Outbound peer gave a different port: expected ${this.port} got ${packet.port}`);
        }
        this.id = packet.peerId;
        this.host = packet.host;
        this.port = packet.port;
        this.handshaked = true;
        this.handshakeTimeout.clear();
        this.emit('handshake', this.outbound);
        return;
      case PACKET.DATA:
        break;
    }

    if (!this.handshaked) {
      return;
    }

    this.emit('packet', packet);
  }

  private error(err: Error | string) {
    if (typeof err === 'string') {
      const msg = format.apply(null, arguments);
      err = new Error(msg);
    }
    this.emit('error', err);
  }

  destroy() {
    this.logger.debug('destroying');
    if (this.destroyed) {
      this.logger.debug('already destroyed!');
      return;
    }

    this.connectTimeout.clear();
    this.handshakeTimeout.clear();

    this.emit('close', this.connected);

    if (this.connected) {
      this.transport.destroy();
    }

    this.destroyed = true;
    this.connected = false;
  }

  write(data: Buffer) {
    this.transport.write(data);
  }

  send(packet: Packet) {
    // this.logger.debug('m+=', packet.packetId, this.filter.has(packet.packetId));
    this.filter.add(packet.packetId);
    this.write(this.parser.encode(packet));
  }

  sendMessage(message: string) {
    this.write(this.parser.encode(DataPacket.fromObject({ data: Buffer.from(message) })));
  }

}
