import ioredis, { RedisOptions } from 'ioredis';
export default class Redis {
  static instance: Redis;
  private redisClient: ioredis;
  private pub: ioredis;
  private sub: ioredis;
  private constructor(
    port: number = 6379,
    host: string = 'localhost',
    path?: string,
    options?: RedisOptions
  ) {
    if (!host) throw new Error('host address is required');
    if (options) {
      this.redisClient = new ioredis(options);
      this.pub = new ioredis(options);
      this.sub = new ioredis(options);
    } else if (path) {
      this.redisClient = new ioredis(path);
      this.pub = new ioredis(path);
      this.sub = new ioredis(path);
    } else {
      this.redisClient = new ioredis(port, host);
      this.pub = new ioredis(port, host);
      this.sub = new ioredis(port, host);
    }
  }
  static getRedisInstance(
    port: number = 6379,
    host: string = 'localhost',
    path?: string,
    options?: RedisOptions
  ) {
    if (!Redis.instance) Redis.instance = new Redis(port, host, path, options);
    return Redis.instance;
  }
  async setKey(key: string, value: string) {
    return await this.redisClient.set(key, value);
  }
  async getKey(key: string) {
    return await this.redisClient.get(key);
  }
  async subscribe(channel: string) {
    return await this.sub.subscribe(channel);
  }
  async publish(channel: string, message: string) {
    return await this.pub.publish(channel, message);
  }
  async on(callback: (channel: string, message: string) => void) {
    return this.sub.on('message', callback);
  }
}
