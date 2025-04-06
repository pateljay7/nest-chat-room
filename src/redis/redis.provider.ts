// redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const redisUrl = process.env.REDIS_HOST;

    const redis = new Redis(redisUrl, {
      tls: {}, // Enables SSL connection (required for rediss://)
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err));

    return redis;
  },
};
