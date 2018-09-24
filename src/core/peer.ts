import { EventEmitter } from 'events';
import { format } from 'util';
import * as assert from 'assert';

import { SimpleLogger, Logger } from './logger';
import { Timer } from './util/timer';
import { BufferParser } from './parser';
import { HandshakePacket } from './packets';
import { types } from './packets/types';
import { AbstractTransport } from '../transport/transport';

import { Packet } from '.';
import { Module } from '@p2p-comm/base/src';

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

  activate();

  connect(transport: T);

  handshake(port: number, nodeId: string);

  write(data: Buffer);

  send(packet: Packet);
}


export class SimplePeer<T extends AbstractTransport, P> extends EventEmitter implements Peer<T> {

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

  pingTimeout: Timer;
  pongTimeout: Timer;

  constructor({ port, filter }, mod: Module) {
    super();
    this.port = port;

    this.connectTimeout = new Timer(5 * 1000);
    this.handshakeTimeout = new Timer(5 * 1000);
    this.logger = new SimpleLogger('peer:' + SimplePeer.counter++);
    this.filter = filter;
    this.parser = new BufferParser(mod.packets);
    this.init();

    this.pingTimeout = new Timer(60 * 1000);
    this.pongTimeout = new Timer(10 * 1000);
  }

  static fromInbound(options, transport, mod) {
    const peer = new this(options, mod);
    peer.accept(transport);
    return peer;
  }

  static fromOutbound(options, mod) {
    return new this(options, mod);
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
    this.send(HandshakePacket.fromObject({ port: publicPort, peerId: nodeId }));

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

  expectPong() {
    this.pongTimeout.start(() => {
      this.logger.warn(`${this.outbound ? 'Outbound' : 'Inbound'} peer did not pong`);
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

  private async handlePacket(packet: Packet) {
    if (this.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    this.pingTimeout.reset();

    this.logger.debug('m <-', packet.getTypeName(), packet.packetId, this.filter.has(packet.packetId));

    if (this.filter && this.filter.has(packet.packetId)) {
      return;
    }

    this.filter.add(packet.packetId);

    switch (packet.type) {
      case types.HANDSHAKE:
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
      case types.DATA:
        // await wait(Math.random() * 3 * 1000);
        break;
      // TODO:
      // case PACKET.PONG:
      //   this.pongTimeout.clear();
      //   break;
      // case PACKET.PING:
      //   await wait(Math.random() * 3 * 1000);
      //   this.send(PongPacket.fromObject());
      //   break;
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

  activate() {
    // TODO:
    // this.pingTimeout.start(() => this.ping());
  }

  // TODO:
  // ping() {
  //   this.send(PingPacket.fromObject());
  //   this.expectPong();
  // }

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
    assert(!this.filter.has(packet.packetId), 'Send should not be used to braodcast');
    this.logger.debug('m ->', packet.getTypeName(), packet.packetId);
    this.write(packet.toRaw());
  }
}
