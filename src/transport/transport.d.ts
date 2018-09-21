export interface Protocol {
  on(event: "connect", listener: () => void): this;
  on(event: "data", listener: (data: Buffer) => void): this;
  on(event: "close", listener: (had_error: boolean) => void): this;
  on(event: "end", listener: () => void): void;
  on(event: "error", listener: (err: Error) => void): void;
}
