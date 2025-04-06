import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);

    const users =
      (await this.cacheManager.get<string[]>(`room:${data.room}:users`)) || [];
    if (!users.includes(data.username)) {
      users.push(data.username);
      await this.cacheManager.set(`room:${data.room}:$users`, users);
    }
    const messages =
      (await this.cacheManager.get<{ username: string; message: string }[]>(
        `room:${data.room}:messages`,
      )) || [];
    client.emit('previousMessages', messages);
    this.server.to(data.room).emit('message', {
      username: 'System',
      message: `${data.username} has joined the room.`,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { room: string; username: string; message: string },
  ) {
    const message = {
      username: data.username,
      message: data.message,
    };
    this.server.to(data.room).emit('message', message);

    const messages =
      (await this.cacheManager.get<{ username: string; message: string }[]>(
        `room:${data.room}:messages`,
      )) || [];
    messages.push(message);
    await this.cacheManager.set(`room:${data.room}:messages`, messages);
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
}
