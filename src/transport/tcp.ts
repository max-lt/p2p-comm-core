import { createServer, Server, Socket } from 'net';
import * as net from 'net';
import { AbstractServer, AbstractTransport } from './transport';


export class TCPTransport extends Socket implements AbstractTransport {

  static connect(port: number): TCPTransport {
    return net.connect(port);
  }

}

export class TCPServer extends Server implements AbstractServer<TCPTransport> {

  static create() {
    return createServer();
  }

}
