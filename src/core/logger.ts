import * as Debug from 'debug';

export interface Logger {
  error(...params: any[]): any;
  debug(...params: any[]): any;
  info(...params: any[]): any;
  warn(...params: any[]): any;
  log(...params: any[]): any;
}

export class SimpleLogger implements Logger {

  private out;

  constructor(prefix: string) {
    this.out = Debug(this.align('p2p-comm:' + prefix, 15));
  }

  private color(s, c) {
    if (process.stdout.isTTY) {
      return '\x1B[' + c + 'm' + s + '\x1B[0m';
    }
    return s;
  }

  private align(s, n) {
    const l = n - s.length;
    return l > 0 ? s + '                      '.slice(-(n - s.length)) : s;
  }

  private _log(level: string, args) {
    // const prefix = this.align('', 7);
    const _level = this.align('[' + level + ']', 7);
    const date = this.color(/.*T(.*)Z/.exec((new Date).toISOString())[1], '30;1');
    // this.out.apply(null, [_level, date].concat(args));
    this.out.apply(null, [_level, date].concat(args));
  }

  error(...args) {
    this._log('error', args);
  }
  debug(...args) {
    this._log('debug', args);
  }
  info(...args) {
    this._log('info', args);
  }
  warn(...args) {
    this._log('warn', args);
  }
  log(...args) {
    this._log('debug', args);
  }
}
