import type { RedisOptions } from 'ioredis';
export interface PersonalMessage {
  reciverUsername: string;
  message: string;
}
export interface OneToOneTypingIndicator {
  reciverUsername: string;
  isTyping: boolean;
}
export interface CreateRoom {
  roomname: string;
}
export interface JoinRoom extends CreateRoom {
  username: string;
}
export interface RoomMessage extends CreateRoom {
  message: string;
}
export type RedisConfig = {
  port?: number;
  path?: string;
  host?: string;
  options: RedisOptions;
};
export type ChatNexusConfig = {
  origin?: string;
  app?: any;
  redisPort?: number;
  redisHost?: string;
  redisOptions?: RedisOptions;
  redisPath?: string;
};
