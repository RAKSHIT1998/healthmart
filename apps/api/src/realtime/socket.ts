import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { Role } from '@healthmart/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { verifyAccessToken } from '../utils/jwt';
import { orderRepository } from '../repositories';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: Role;
  };
}

let io: Server | null = null;

export function getSocketServer(): Server | null {
  return io;
}

/** Server -> client only: customers subscribe to `order:<id>` rooms and receive driver-location + status push events. Driver location still arrives via the existing REST endpoint, which fans the update out from here. */
export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()), credentials: true },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error('Authentication token required'));
        return;
      }
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).data = { userId: payload.sub, role: payload.role as Role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    logger.debug({ userId: authSocket.data.userId }, 'Socket connected');

    socket.on('order:subscribe', async (orderId: string) => {
      try {
        const order = await orderRepository.findById(orderId);
        const isOwner = order && String(order.userId) === authSocket.data.userId;
        const isStaff = authSocket.data.role !== Role.CUSTOMER;
        if (!order || (!isOwner && !isStaff)) {
          socket.emit('order:subscribe:error', { orderId, message: 'Not authorized to track this order' });
          return;
        }
        socket.join(`order:${orderId}`);
        socket.emit('order:subscribe:ok', { orderId });
      } catch (err) {
        logger.error({ err, orderId }, 'order:subscribe failed');
      }
    });

    socket.on('order:unsubscribe', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: authSocket.data.userId }, 'Socket disconnected');
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

export function emitDriverLocation(orderId: string, location: { lat: number; lng: number }): void {
  io?.to(`order:${orderId}`).emit('driver:location', { orderId, ...location, timestamp: new Date().toISOString() });
}

export function emitOrderStatus(orderId: string, status: string): void {
  io?.to(`order:${orderId}`).emit('order:status', { orderId, status, timestamp: new Date().toISOString() });
}

export function emitDriverAssigned(orderId: string, driver: { name: string; phone?: string; vehicleNumber?: string }): void {
  io?.to(`order:${orderId}`).emit('order:driver-assigned', { orderId, driver, timestamp: new Date().toISOString() });
}
