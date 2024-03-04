import { StringDecoder } from 'string_decoder';

export interface PersonalMessage {
  senderUsername: string;
  reciverUsername: string;
  message: string;
}
export type ChatNexusConfig = {
  origin: string;
  app: any;
  redisPort: number;
  redisHost: string;
};
