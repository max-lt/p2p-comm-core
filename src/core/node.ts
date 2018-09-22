import { EventEmitter } from 'events';
import { Pool } from './pool';
import { TCPTransport } from '../transport/tcp';

export class Node extends EventEmitter {

  private pool: Pool<TCPTransport>;

  constructor() {
    super();
  }

  connect() {
    return this.pool.connect();
  }

  disconnect() {
    return this.pool.disconnect();
  }
}
