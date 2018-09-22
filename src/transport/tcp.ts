import { createServer, Server, Socket, connect } from 'net';
import { AbstractServer, AbstractTransport } from './transport';


export class TCPTransport extends Socket implements AbstractTransport {

  static connect(port: number): TCPTransport {
    return connect(port);
  }

}

export class TCPServer extends Server implements AbstractServer<TCPTransport> {

  static create() {
    return createServer();
  }

}
