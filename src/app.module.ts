import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat.gateway';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    CacheModule.register(), // <-- this registers CACHE_MANAGER
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
