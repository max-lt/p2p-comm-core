export { PacketTypesI, types } from './packets/types';
export { TCPServer, TCPTransport } from './transport/tcp';

import { DataModule } from './modules/data';
export { DataModule };
import { FilterModule } from './modules/filter';
export { FilterModule };
import { HandshakeModule } from './modules/handshake';
export { HandshakeModule };

export { DataPacket, IDataPacket } from './packets';
export { HandshakePacket, IHandshakePacket } from './packets';

import { CompoundModule } from '@p2p-comm/base';
export class CoreModule extends CompoundModule {
  constructor() {
    super([new HandshakeModule, new FilterModule, new DataModule]);
  }
}
