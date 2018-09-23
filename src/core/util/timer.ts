import * as assert from 'assert';

export class Timer {

  private timer: NodeJS.Timer = null;
  private args: any[];
  private cb: (...args: any[]) => void;

  constructor(private timeout = 1000) { }

  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  getTimeout() {
    return this.timeout;
  }

  start(cb: (...args: any[]) => void, ...args: any[]) {
    assert(!this.timer);
    this.cb = cb;
    this.args = args;
    this.timer = setTimeout(cb, this.timeout, ...args);
  }

  running() {
    return this.timer != null;
  }

  clear() {
    clearTimeout(this.timer);
    this.timer = null;
  }

  reset() {
    if (!this.timer) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(this.cb, this.timeout);
  }

}
