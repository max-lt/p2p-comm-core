import * as assert from 'assert';

export class Timer {

  private timer: NodeJS.Timer = null;

  constructor(private timeout = 1000) { }

  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  getTimeout(timeout: number) {
    return this.timeout;
  }

  start(cb: (...args: any[]) => void, ...args: any[]) {
    assert(!this.timer);
    this.timer = setTimeout(cb, this.timeout, ...args);
  }

  running() {
    return this.timer != null;
  }

  clear() {
    clearTimeout(this.timer);
    this.timer = null;
  }

}
