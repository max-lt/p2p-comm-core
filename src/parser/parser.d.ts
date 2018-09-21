interface MetaPacket {
  date?: Date;
  id?: string;
}

export interface HandShakePacket {
  type: 'handshake';
  port: number;
}

export interface MessagePacket {
  type: 'message';
  message: string;
}

export interface GetPeersPacket {
  type: 'getpeers';
}

export type Packet = HandShakePacket | MessagePacket | GetPeersPacket;

export abstract class Parser {

  emit(event: "packet", data: Packet): boolean;
  on(event: 'packet', listener: (data: Packet & MetaPacket) => void): this;
  on(event: 'error', listener: (err: Error) => void): void;

  feed(data: Buffer): void;
  decode(data: Buffer): Packet & MetaPacket;
  encode(data: Packet): Buffer;
  encode(data: Packet & MetaPacket): Buffer;
}
