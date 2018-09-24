import { HandshakePacket, DataPacket } from './packets';
import { PacketTypesI, types } from './packets/types';
export { PacketTypesI, types };
export declare type Packet = HandshakePacket | DataPacket;
export declare type PacketTypes = typeof HandshakePacket | typeof DataPacket;
