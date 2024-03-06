import { createServer, Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PersonalMessage, OneToOneTypingIndicator } from '../types';
import { ExtendedError } from 'socket.io/dist/namespace';
import Redis from './Redis';
import type { ChatNexusConfig } from '../types';
class ChatNexus {
  static keyPrefix = 'NEXUS_CHAT_USERNAME_TO_SOCKETID:';
  static ONE_TO_ONE_CHAT_REDIS_CHANNEL = 'NEXUS_CHAT_ONE_TO_ONE_CHAT';
  static ONE_TO_ONE_TYPING_INDICATOR_REDIS_CHANNEL =
    'ONE_TO_ONE_TYPING_INDICATOR';
  static instance: ChatNexus;
  private io: Server;
  private redisClient: Redis;
  public httpServer: HTTPServer;
  private constructor({
    origin,
    app,
    redisPort,
    redisHost,
    redisPath,
    redisOptions
  }: ChatNexusConfig) {
    if (app) this.httpServer = createServer(app);
    else this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: origin
      }
    });
    this.redisClient = Redis.getRedisInstance(
      redisPort,
      redisHost,
      redisPath,
      redisOptions
    );
    this.publisherHelper();
  }
  static chatNexusINIT(config: ChatNexusConfig) {
    const _config = {
      origin: config.origin || '*',
      app: config.app,
      redisPort: config.redisPort || 6379,
      redisHost: config.redisHost || 'localhost',
      redisPath: config.redisPath,
      redisOptions: config.redisOptions
    };
    if (!ChatNexus.instance) ChatNexus.instance = new ChatNexus(_config);
    return ChatNexus.instance;
  }
  private subscriptionHandler(channel: string) {
    this.redisClient.subscribe(channel);
  }
  private publisherHelper() {
    this.redisClient.on(
      async (channel: string, message_from_channel: string) => {
        switch (channel) {
          case ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL: {
            const { senderUsername, reciverId, message } =
              JSON.parse(message_from_channel);
            this.io
              .to(reciverId)
              .emit('PRIVATE_CHAT_RESPONSE', { senderUsername, message });
            break;
          }
          case ChatNexus.ONE_TO_ONE_TYPING_INDICATOR_REDIS_CHANNEL: {
            const { senderUsername, reciverId, isTyping } =
              JSON.parse(message_from_channel);
            this.io
              .to(reciverId)
              .emit('ONE_TO_ONE_TYPING_RESPONSE', { senderUsername, isTyping });
            break;
          }
          default:
            break;
        }
      }
    );
  }
  async listen(port: number, callback: () => void) {
    this.httpServer.listen(port, callback);
  }
  enableAuth(
    cb: (
      socket: Socket,
      next: (err?: ExtendedError | undefined) => void
    ) => void
  ) {
    this.io.use(cb);
  }
  privateChat() {
    this.subscriptionHandler(ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL);
    this.io.on('connection', async (socket) => {
      const currentUsername = socket.handshake.query.username;
      const socketId = socket.id;
      await this.redisClient.setKey(
        ChatNexus.keyPrefix + currentUsername,
        socketId
      );
      if (!currentUsername)
        throw new Error('username is required while setting up socket');
      socket.on('PRIVATE_CHAT', async (data: PersonalMessage) => {
        const { reciverUsername, message } = data;
        if (!reciverUsername || !message)
          throw new Error('reciverUsername and message are required');
        const key = ChatNexus.keyPrefix + reciverUsername;
        const reciverId = await this.redisClient.getKey(key);
        if (!reciverId) return;
        this.redisClient.publish(
          ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL,
          JSON.stringify({
            reciverId,
            senderUsername: currentUsername,
            message
          })
        );
      });
    });
  }
  oneToOneTypingIndicator() {
    this.subscriptionHandler(
      ChatNexus.ONE_TO_ONE_TYPING_INDICATOR_REDIS_CHANNEL
    );
    this.io.on('connection', async (socket) => {
      const currentUsername = socket.handshake.query.username;
      const socketId = socket.id;
      await this.redisClient.setKey(
        ChatNexus.keyPrefix + currentUsername,
        socketId
      );
      if (!currentUsername)
        throw new Error('username is required while setting up socket');
      socket.on('ONE_TO_ONE_TYPING', async (data: OneToOneTypingIndicator) => {
        const { reciverUsername, isTyping } = data;
        if (!reciverUsername) throw new Error('reciverUsername is required');
        const key = ChatNexus.keyPrefix + reciverUsername;
        const reciverId = await this.redisClient.getKey(key);
        if (!reciverId) return;
        this.redisClient.publish(
          ChatNexus.ONE_TO_ONE_TYPING_INDICATOR_REDIS_CHANNEL,
          JSON.stringify({
            reciverId,
            senderUsername: currentUsername,
            isTyping
          })
        );
      });
    });
  }
}
export default ChatNexus;
