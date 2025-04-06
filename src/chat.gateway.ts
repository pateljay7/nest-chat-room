import { Inject } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

interface ChatMessage {
  username: string;
  message: string;
  timestamp?: number;
}

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  private getRoomUsersKey(room: string): string {
    return `room:${room}:users`;
  }

  private getRoomMessagesKey(room: string): string {
    return `room:${room}:messages`;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { username, room } = data;
    client.join(room);

    const usersKey = this.getRoomUsersKey(room);
    const currentUsers =
      (await this.cacheManager.get<string[]>(usersKey)) || [];

    if (!currentUsers.includes(username)) {
      currentUsers.push(username);
      await this.cacheManager.set(usersKey, currentUsers);
    }

    const messages = await this.getPreviousMessages(room);
    client.emit('previousMessages', messages);

    this.broadcastSystemMessage(room, `${username} has joined the room.`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { room: string; username: string; message: string },
  ) {
    const { username, room, message } = data;

    const chatMessage: ChatMessage = {
      username,
      message,
      timestamp: Date.now(),
    };

    await this.saveMessageToRoom(room, chatMessage);
    this.server.to(room).emit('message', chatMessage);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { room: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('typing', { username: data.username });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('stopTyping');
  }

  private async saveMessageToRoom(room: string, message: ChatMessage) {
    const messagesKey = this.getRoomMessagesKey(room);
    await this.redisClient.lpush(messagesKey, JSON.stringify(message));
    await this.redisClient.ltrim(messagesKey, 0, 99); // Keep latest 100
  }

  private async getPreviousMessages(room: string): Promise<ChatMessage[]> {
    const messagesKey = this.getRoomMessagesKey(room);
    const messages = await this.redisClient.lrange(messagesKey, 0, -1);
    return messages.map((msg) => JSON.parse(msg));
  }

  private broadcastSystemMessage(room: string, message: string) {
    this.server.to(room).emit('message', {
      username: 'System',
      message,
    });
  }
}
