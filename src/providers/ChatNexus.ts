import { createServer, Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import Redis from './Redis';
import { v4 as uuidv4 } from 'uuid';
import type {
  PersonalMessage,
  OneToOneTypingIndicator,
  CreateRoom,
  JoinRoom,
  ChatNexusConfig,
  RoomMessage
} from '../types';
class ChatNexus {
  static keyPrefix = 'NEXUS_CHAT_USERNAME_TO_SOCKETID:';
  static roomKeyPrefix = 'NEXUS_CHAT_ROOMNAME_TO_ROOM_ID:';
  static ONE_TO_ONE_CHAT_REDIS_CHANNEL = 'NEXUS_CHAT_ONE_TO_ONE_CHAT';
  static ONE_TO_ONE_TYPING_INDICATOR_REDIS_CHANNEL =
    'ONE_TO_ONE_TYPING_INDICATOR';
  static ROOM_CHAT_REDIS_CHANNEL = 'NEXUS_CHAT_ROOM_CHANNEL';
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
    this.useMapUsernameToSocketId();
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
  private useMapUsernameToSocketId = async () => {
    this.io.use(
      async (
        socket: Socket,
        next: (err?: ExtendedError | undefined) => void
      ) => {
        const username = socket.handshake.query.username;
        if (!username)
          next(
            new Error('username is required while setting up socket connection')
          );
        const socketId = socket.id;
        await this.redisClient.setKey(ChatNexus.keyPrefix + username, socketId);
        await this.redisClient.setKey(ChatNexus.keyPrefix + username, socketId);
        next();
      }
    );
  };
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
          case ChatNexus.ROOM_CHAT_REDIS_CHANNEL: {
            const { roomId, senderUsername, message } =
              JSON.parse(message_from_channel);
            this.io
              .to(roomId)
              .emit('ROOM_MESSAGE_RESPONSE', { senderUsername, message });
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

  //create room function
  roomChat() {
    this.subscriptionHandler(ChatNexus.ROOM_CHAT_REDIS_CHANNEL);
    this.io.on('connection', async (socket: Socket) => {
      const currentUsername = socket.handshake.query.username;
      // Handle room creation
      socket.on('CREATE_ROOM', async (data: CreateRoom) => {
        const roomId = uuidv4();
        const { roomname } = data;
        socket.join(roomId);
        socket.emit('CREATE_ROOM_RESPONSE', {
          creator: currentUsername,
          roomId,
          roomname
        });
        await this.redisClient.setKey(
          ChatNexus.roomKeyPrefix + roomname,
          roomId
        );
      });

      // handle join room
      socket.on('JOIN_ROOM', async (data: JoinRoom) => {
        const { roomname, username } = data;
        const roomId = await this.redisClient.getKey(
          ChatNexus.roomKeyPrefix + roomname
        );
        if (!roomId) {
          socket.emit('JOIN_ROOM_ERROR', 'Room does not exist');
          return;
        }
        socket.join(roomId);
        socket.emit('JOIN_ROOM_RESPONSE', { roomId, roomname, username });
      });

      // handle room message
      socket.on('ROOM_MESSAGE', async (data: RoomMessage) => {
        const { message, roomname } = data;
        const roomId = await this.redisClient.getKey(
          ChatNexus.roomKeyPrefix + roomname
        );
        if (!roomId) {
          socket.emit('ROOM_MESSAGE_ERROR', 'Room does not exist');
          return;
        }
        this.redisClient.publish(
          ChatNexus.ROOM_CHAT_REDIS_CHANNEL,
          JSON.stringify({
            roomId,
            senderUsername: currentUsername,
            message
          })
        );
      });
    });
  }
}
export default ChatNexus;
