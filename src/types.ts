import type { RedisOptions } from 'ioredis';

export interface PersonalMessage {
  senderUsername: string;
  reciverUsername: string;
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
