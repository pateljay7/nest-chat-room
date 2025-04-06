// redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    console.log('REDIS_HOST', process.env.REDIS_HOST);
    return new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
    });
  },
};
