
import { HandshakePacket, DataPacket } from './packets';
import { Module } from '@p2p-comm/base';
import { types } from './packets/types';

// TODO: ??
import { Packet } from '.';

function poolhandlePacket(packet: Packet) {
  switch (packet.type) {
    case types.HANDSHAKE:
      return;
    case types.DATA:
      this.broadcast(packet);
      this.emit('data', packet.data);
      return;
  }
}

function peerHandlePacket(packet: Packet) {
  if (this.destroyed) {
    throw new Error('Destroyed peer sent a packet.');
  }

  this.pingTimeout.reset();

  this.logger.debug('m <-', packet.getTypeName(), packet.packetId, this.filter.has(packet.packetId));

  if (this.filter && this.filter.has(packet.packetId)) {
    return;
  }

  this.filter.add(packet.packetId);

  switch (packet.type) {
    case types.HANDSHAKE:
      if (this.outbound && packet.port !== this.port) {
        this.error(`Outbound peer gave a different port: expected ${this.port} got ${packet.port}`);
      }
      this.id = packet.peerId;
      this.host = packet.host;
      this.port = packet.port;
      this.handshaked = true;
      this.handshakeTimeout.clear();
      this.emit('handshake', this.outbound);
      return;
  }

  if (!this.handshaked) {
    return;
  }

  this.emit('packet', packet);
}

const mod: Module = {
  node: null,
  pool: { handlePacket: poolhandlePacket },
  peer: { handlePacket: peerHandlePacket },
  packets: [DataPacket, HandshakePacket]
};

export default mod;
