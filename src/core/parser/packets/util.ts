export interface PacketTypes {
  DATA: 0x81;
  HANDSHAKE: 0x82;
  GETPEERS: 0x83;
}

export const types: PacketTypes = {
  DATA: 0x81,
  HANDSHAKE: 0x82,
  GETPEERS: 0x83
};

export const metaLengths = {
  TYPE: 1,
  LEN: 4,
  DATE: 8,
  UUID: 16
};

export const metaLength = metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE + metaLengths.UUID;

export function decodeRawMeta(buf: Buffer): OMeta {
  const type = buf.readUInt8(0);
  const size = buf.readUInt32BE(metaLengths.TYPE);
  const date = new Date(buf.readDoubleBE(metaLengths.TYPE + metaLengths.LEN));
  const uuidHex = buf.slice(metaLengths.TYPE + metaLengths.LEN + metaLengths.DATE, metaLength).toString('hex');
  const uuid = [uuidHex.slice(0, 8), uuidHex.slice(8, 12), uuidHex.slice(12, 16), uuidHex.slice(16, 20), uuidHex.slice(20)].join('-');
  return { type, size, date, uuid };
}

export interface OMeta {
  uuid: string;
  date: Date;
  type: number;
  size: number;
}

