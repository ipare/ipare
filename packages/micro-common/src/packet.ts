export interface ServerPacket<T = any> {
  pattern: string;
  data: T;
  id?: string;
}

export interface ClientPacket<T = any> {
  id?: string;
  data?: T;
  error?: string;
}
