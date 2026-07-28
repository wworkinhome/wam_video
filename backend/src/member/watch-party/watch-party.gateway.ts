import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { WatchPartyService } from './watch-party.service';

interface SocketUser {
  id: string;
  name: string;
}

const MAX_MESSAGE_LENGTH = 500;

// Chat en vivo del watch party. Cada socket se une a una room `party:<id>` recién
// después de que el backend confirma que el usuario es host o participante (mismo
// chequeo que ya hace el REST). El historial se sirve por REST (GET :id/messages);
// este gateway solo maneja el "en vivo": mensajes nuevos y presencia.
@WebSocketGateway({
  namespace: '/watch-party',
  cors: {
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:3005').split(',').map((url) => url.trim()),
    credentials: true,
  },
})
export class WatchPartyGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WatchPartyGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly watchPartyService: WatchPartyService,
  ) {}

  // Middleware de namespace en vez de handleConnection: Socket.IO garantiza que esto
  // termine (llame next()) ANTES de que el cliente vea el evento 'connect'. Si la auth
  // viviera en handleConnection (que corre EN PARALELO, no bloquea la conexión), un
  // cliente que emite 'join' apenas conecta puede llegar antes de que el lookup async
  // del usuario termine, y quedarse pegado silenciosamente sin unirse a la room.
  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) throw new Error('No token');
        const payload = this.jwtService.verify<{ sub: string }>(token);
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.status !== 'ACTIVE') throw new Error('Invalid user');
        (socket.data as { user: SocketUser }).user = { id: user.id, name: user.name ?? user.email };
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleDisconnect(client: Socket) {
    const room = (client.data as { room?: string }).room;
    const user = (client.data as { user?: SocketUser }).user;
    if (room && user) {
      client.to(room).emit('presence', { type: 'left', userId: user.id, name: user.name });
    }
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { partyId: string }) {
    const user = (client.data as { user?: SocketUser }).user;
    if (!user) return;

    const allowed = await this.watchPartyService.isMember(payload.partyId, user.id);
    if (!allowed) {
      client.emit('error', { message: 'No sos participante de este watch party' });
      return;
    }

    const room = `party:${payload.partyId}`;
    (client.data as { room: string }).room = room;
    await client.join(room);
    client.to(room).emit('presence', { type: 'joined', userId: user.id, name: user.name });
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { body: string }) {
    const user = (client.data as { user?: SocketUser }).user;
    const room = (client.data as { room?: string }).room;
    if (!user || !room) return;

    const body = payload?.body?.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!body) return;

    const watchPartyId = room.replace('party:', '');
    try {
      const message = await this.prisma.watchPartyMessage.create({
        data: { watchPartyId, userId: user.id, body },
      });
      this.server.to(room).emit('message', {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        userId: user.id,
        userName: user.name,
      });
    } catch (error) {
      this.logger.error(`No se pudo guardar el mensaje del watch party ${watchPartyId}`, error as Error);
    }
  }
}
