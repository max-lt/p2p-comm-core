import { EventEmitter } from "events";
import { AddressInfo } from "net";

export interface Protocol {
  on(event: "connect", listener: () => void): this;
  on(event: "data", listener: (data: Buffer) => void): this;
  on(event: "close", listener: (had_error: boolean) => void): this;
  on(event: "end", listener: () => void): void;
  on(event: "error", listener: (err: Error) => void): void;
}

/**
 * socket
 */
export abstract class AbstractTransport {
  static connect(port: number): AbstractTransport;

  abstract write(data: Buffer);

  abstract destroy();

  on(event: "close", listener: (had_error: boolean) => void): this;
  on(event: "connect", listener: () => void): this;
  on(event: "data", listener: (data: Buffer) => void): this;
  on(event: "error", listener: (err: Error) => void): this;

  once(event: "close", listener: (had_error: boolean) => void): this;
  once(event: "connect", listener: () => void): this;
  once(event: "data", listener: (data: Buffer) => void): this;
  once(event: "error", listener: (err: Error) => void): this;
}

/**
 * net.server
 */
export abstract class AbstractServer<T extends AbstractTransport> {

  static create();

  listen(port?: number, hostname?: string, listeningListener?: Function);
  address(): AddressInfo | string;

  on(event: "close", listener: () => void): this;
  on(event: "connection", listener: (socket: T) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "listening", listener: () => void): this;

  once(event: "close", listener: () => void): this;
  once(event: "connection", listener: (socket: T) => void): this;
  once(event: "error", listener: (err: Error) => void): this;
  once(event: "listening", listener: () => void): this;
}
