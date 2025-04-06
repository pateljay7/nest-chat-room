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

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.server.to(data.room).emit('message', {
      username: 'System',
      message: `${data.username} has joined the room.`,
    });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { room: string; username: string; message: string },
  ) {
    this.server.to(data.room).emit('message', {
      username: data.username,
      message: data.message,
    });
  }
}
