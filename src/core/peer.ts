import { EventEmitter } from 'events';
import { Socket } from 'net';
import * as net from 'net';
import { format } from 'util';
import * as assert from 'assert';
import { SimpleLogger, Logger } from './logger';
import { Timer } from './timer';
import { BufferParser, Packet, IPacket } from './parser/buffer-parser';
import { HandshakePacket, types as PACKET, DataPacket } from './parser/packets';

export interface Peer {
  port: number;

  outbound: boolean;
  connected: boolean;
  destroyed: boolean;
  handshaked: boolean;

  // Defines either handshake is mandatory or not
  handshake: boolean;

  on(event: 'connect', listener: () => void): this;
  on(event: 'handshake', listener: (arg: void) => void): this;
  on(event: 'packet', listener: (data: Packet) => void): this;
  on(event: 'close', listener: (had_error: boolean) => void): this;
  on(event: 'error', listener: (err: Error) => void): void;

  once(event: 'connect', listener: () => void): this;
  once(event: 'handshake', listener: (arg: void) => void): this;
  once(event: 'packet', listener: (data: Packet) => void): this;
  once(event: 'close', listener: (had_error: boolean) => void): this;
  once(event: 'error', listener: (err: Error) => void): void;

  destroy();

  write(data: Buffer);

  send(packet: Packet);

  sendMessage(str: string);
}


export class SPeer extends EventEmitter implements Peer {

  // debug
  private static counter = 0;

  logger: Logger;
  socket: Socket;
  parser: BufferParser;

  outbound = false;
  connected = false;
  destroyed = false;
  handshaked = false;

  // Defines either handshake is mandatory or not
  handshake: boolean;

  version = -1;

  port: number;
  filter: Set<string>;

  connectTimeout: Timer;
  handshakeTimeout: Timer;

  constructor({ port, filter, handshake = true }) {
    super();
    this.port = port;
    this.handshake = handshake;
    this.connectTimeout = new Timer(2000);
    this.handshakeTimeout = new Timer(2000);
    this.logger = new SimpleLogger('peer:' + SPeer.counter++);
    this.filter = filter;
    this.parser = new BufferParser();
    this.init();
  }

  static fromInbound(options, socket) {
    const peer = new this(options);
    peer.accept(socket);
    return peer;
  }

  static fromOutbound(options, publicPort) {
    const peer = new this(options);
    peer.connect(options.port, publicPort);
    return peer;
  }

  /**
   * Accept an inbound socket.
   */
  private accept(socket: Socket) {
    this.connected = true;
    this.outbound = false;
    this.bind(socket);

    if (this.handshake) {
      this.handshakeTimeout.start(() => {
        this.logger.warn('Peer did not handshaked');
        this.destroy();
      });
    }
  }

  /**
   * Create an outbound socket.
   */
  private async connect(port: number, publicPort): Promise<void> {
    const socket = net.connect(port);
    this.logger.debug('Connecting to', port);
    this.outbound = true;
    this.connected = false;

    const error = await new Promise<Error | null>((resolve) => {
      this.connectTimeout.start(() => resolve(new Error('timeout')));
      socket.once('connect', () => resolve(null));
      socket.once('error', (err) => resolve(err));
    });

    this.connectTimeout.clear();

    if (error) {
      this.logger.debug('Failed to connect to', port);
      this.error(error);
      this.destroy();
      return;
    }

    this.connected = true;
    this.bind(socket);
    this.logger.log('Peer connect', this.connected, error);
    this.emit('connect');

    this.logger.log('handshaking with', port, publicPort);
    this.send(HandshakePacket.fromObject({ port: publicPort }));
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

  private bind(socket: Socket) {
    assert(!this.socket, 'already bound');
    this.socket = socket;

    this.socket.on('error', (err: Error) => {
      this.logger.error('Peer error', err);
      this.error(err);
      this.destroy();
    });

    this.socket.on('data', (data: Buffer) => {
      this.feedParser(data);
    });

    this.socket.once('close', () => {
      console.log('socket close');
      this.destroy();
    });
  }

  private feedParser(data) {
    return this.parser.feed(data);
  }

  private handlePacket(packet: Packet) {
    if (this.destroyed) {
      throw new Error('Destroyed peer sent a packet.');
    }

    this.logger.debug('m?=', packet.uuid, this.filter.has(packet.uuid));

    if (this.filter && this.filter.has(packet.uuid)) {
      return;
    }

    this.filter.add(packet.uuid);

    switch (packet.type) {
      case PACKET.HANDSHAKE:
        this.port = packet.port;
        this.handshaked = true;
        this.handshakeTimeout.clear();
        this.emit('handshake');
        return;
      case PACKET.DATA:
        break;
    }

    if (!this.outbound && this.handshake && !this.handshaked) {
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
    if (this.destroyed) {
      return;
    }

    this.connectTimeout.clear();
    this.handshakeTimeout.clear();

    this.emit('close', this.connected);

    if (this.connected) {
      this.socket.destroy();
    }

    this.destroyed = true;
    this.connected = false;
  }

  write(data: Buffer) {
    this.socket.write(data);
  }

  send(packet: Packet) {
    this.logger.debug('m+=', packet.uuid, this.filter.has(packet.uuid));
    this.filter.add(packet.uuid);
    this.write(this.parser.encode(packet));
  }

  sendMessage(message: string) {
    this.write(this.parser.encode(DataPacket.fromObject({ data: Buffer.from(message) })));
  }

}
