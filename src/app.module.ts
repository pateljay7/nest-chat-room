import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat.gateway';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost', // Redis host
      port: 6379, // Redis port
      ttl: 0,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
