export { TCPServer, TCPTransport } from './transport/tcp';

import { DataModule } from './modules/data';
export { DataModule };
import { FilterModule } from './modules/filter';
export { FilterModule };
import { HandshakeModule } from './modules/handshake';
export { HandshakeModule };

export { DataPacket, IDataPacket } from './modules/data/packets';
export { HandshakePacket, IHandshakePacket } from './modules/handshake/packets';

import { CompoundModule } from '@p2p-comm/base';
export class CoreModule extends CompoundModule {
  constructor() {
    super([new HandshakeModule, new FilterModule, new DataModule]);
  }
}
