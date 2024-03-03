import Redis from './providers/Redis';
const getRedisInstance = Redis.getRedisInstance(6379, 'localhost');
getRedisInstance.setKey('name', 'John Doe');
