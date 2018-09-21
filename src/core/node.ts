import { EventEmitter } from 'events';
import { Pool } from './pool';

export class Node extends EventEmitter {

  private pool: Pool;

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
