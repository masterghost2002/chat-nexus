import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { PersonalMessage } from '../types';
import Redis from './Redis';
class ChatNexus {
  static keyPrefix = 'NEXUS_CHAT_USERNAME_TO_SOCKETID:';
  static ONE_TO_ONE_CHAT_REDIS_CHANNEL = 'NEXUS_CHAT_ONE_TO_ONE_CHAT';
  static instance: ChatNexus;
  private io: Server;
  private redisClient: Redis;
  public httpServer: HTTPServer;
  private constructor(
    origin: string,
    app: any,
    redisPort: number = 6379,
    redisHost: string = 'localhost'
  ) {
    if (app) this.httpServer = createServer(app);
    else this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: origin
      }
    });
    this.redisClient = Redis.getRedisInstance(redisPort, redisHost);
    this.redisClient.subscribe(ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL);
    this.redisClient.on(
      async (channel: string, message_from_channel: string) => {
        if (channel !== ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL) return;
        const { senderUsername, reciverId, message } =
          JSON.parse(message_from_channel);
        console.log(senderUsername, reciverId, message);
        this.io
          .to(reciverId)
          .emit('PRIVATE_CHAT_RESPONSE', { senderUsername, message });
      }
    );
  }
  static chatNexusINIT(
    origin: string = '*',
    app: any = undefined,
    redisPort: number = 6379,
    redisHost: string = 'localhost'
  ) {
    if (!ChatNexus.instance)
      ChatNexus.instance = new ChatNexus(origin, app, redisPort, redisHost);
    return ChatNexus.instance;
  }
  async listen(port: number, callback: () => void) {
    this.httpServer.listen(port, callback);
  }
  privateChat() {
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
        const { senderUsername, reciverUsername, message } = data;
        if (!senderUsername || !reciverUsername || !message)
          throw new Error(
            'senderUsername, reciverUsername and message are required'
          );
        const key = ChatNexus.keyPrefix + reciverUsername;
        const reciverId = await this.redisClient.getKey(key);
        if (!reciverId) return;
        this.redisClient.publish(
          ChatNexus.ONE_TO_ONE_CHAT_REDIS_CHANNEL,
          JSON.stringify({ reciverId, senderUsername, message })
        );
      });
    });
  }
}
export default ChatNexus;
