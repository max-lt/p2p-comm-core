export interface PacketTypes {
  DATA: 0x81;
  HANDSHAKE: 0x82;
  GETPEERS: 0x83;
  SENDPEERS: 0x84;
  PING: 0x85;
  PONG: 0x86;
}

export const types: PacketTypes = {
  DATA: 0x81,
  HANDSHAKE: 0x82,
  GETPEERS: 0x83,
  SENDPEERS: 0x84,
  PING: 0x85,
  PONG: 0x86
};

export const metaLengths = {
  TYPE: 1,
  LEN: 4,
  DATE: 8,
  PACKET_ID: 8
};

export const metaLength = metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE + metaLengths.PACKET_ID;

export function decodeRawMeta(buf: Buffer): OMeta {
  const type = buf.readUInt8(0);
  const size = buf.readUInt32BE(metaLengths.TYPE);
  const date = new Date(buf.readDoubleBE(metaLengths.TYPE + metaLengths.LEN));
  const packetId = buf.slice(metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE, metaLength).toString('hex');
  return { type, size, date, packetId };
}

export function readData(data: Buffer, offset: number): [Buffer, number] {
  const packetLen = data.readUInt32BE(offset);
  return [data.slice(offset + 4, offset + 4 + packetLen), offset + 4 + packetLen];
}

export function writeData(src: Buffer): Buffer {
  const dest = Buffer.alloc(src.length + 4);
  dest.writeUInt32BE(src.length, 0);
  src.copy(dest, 4, 0);
  return dest;
}

export function writeUInt32(n: number): Buffer {
  const dest = Buffer.alloc(4);
  dest.writeUInt32BE(n, 0);
  return dest;
}

export interface OMeta {
  packetId: string;
  date: Date;
  type: number;
  size: number;
}

export interface PeerInfo { host: string; port: number; peerId: string; }

export function encodePeer(peer: PeerInfo): Buffer {
  const port = writeUInt32(peer.port);
  const host = writeData(Buffer.from(peer.host));
  const peerId = writeData(Buffer.from(peer.peerId, 'hex'));
  return Buffer.concat([port, host, peerId]);
}

export function decodePeer(buf: Buffer, offset: number): [PeerInfo, number] {
  const port = buf.readUInt32BE(offset);
  const [_host, hostOffset] = readData(buf, offset + 4);
  const host = _host.toString();
  const [_peerId, peerIdOffset] = readData(buf, hostOffset);
  const peerId = _peerId.toString('hex');
  return [{ port, host, peerId }, peerIdOffset];
}
