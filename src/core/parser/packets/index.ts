import { DataPacket, IDataPacket } from './data';
export { DataPacket, IDataPacket };

import { HandshakePacket, IHandshakePacket } from './handshake';
export { HandshakePacket, IHandshakePacket };

import { types } from './util';
export { types };

export type Packet = HandshakePacket | DataPacket;
export type IPacket = IHandshakePacket | IDataPacket;
