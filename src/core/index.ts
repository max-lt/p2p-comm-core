import { HandshakePacket, DataPacket } from './packets';
import { PacketTypesI, types } from './packets/types';

export { PacketTypesI, types };
export type Packet = HandshakePacket | DataPacket;
export type PacketTypes = typeof HandshakePacket | typeof DataPacket;
