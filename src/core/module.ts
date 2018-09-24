
import { HandshakePacket, DataPacket } from './packets';
import { Module } from '@p2p-comm/base/src';

const mod: Module = {
  node: null,
  pool: null,
  peer: null,
  packets: [DataPacket, HandshakePacket]
};

export default mod;
