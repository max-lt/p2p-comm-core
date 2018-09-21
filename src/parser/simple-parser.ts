import * as uuid from 'uuid/v4';

import { EventEmitter } from 'events';
import { Parser, Packet, MetaPacket } from './parser';
import { Logger, SimpleLogger } from '../core/logger';

export class SimpleParser extends EventEmitter implements Parser {

  logger: Logger;

  constructor() {
    super();
    this.logger = new SimpleLogger('parser');
  }

  feed(data: Buffer): void {
    const decoded = this.decode(data);
    this.logger.log('decoded', decoded);

    if (!decoded) {
      this.logger.warn('received invalid packet', data.toString());
      return;
    }

    switch (decoded.type) {
      case 'message':
      case 'getpeers':
      case 'handshake':
        return void this.emit('packet', decoded);
      default:
    }

    this.logger.warn('received invalid packet', decoded);
  }

  decode(buf: Buffer): Packet & MetaPacket {
    try {
      const packet = JSON.parse(buf.toString());
      return Object.assign(packet, { date: new Date(packet.date) });
    } catch (e) {
      return null;
    }
  }

  encode(packet: Packet): Buffer {

    this.logger.log('encode', packet);
    const id = uuid();
    const date = +new Date;
    switch (packet.type) {
      case 'message':
      case 'getpeers':
      case 'handshake':
        return Buffer.from(JSON.stringify(Object.assign({ id, date }, packet)));
    }
  }

}
