import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { getAuth, getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();

import { logger } from '../../../lib/pino';
import { v4 as uuidv4 } from 'uuid';

export let io: SocketIOServer;

export function initializeSocket(httpServer: HttpServer): void {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = await getAuth().verifyIdToken(token);
      (socket as any).user = decoded;
      next();
    } catch (error) {
      logger.error({ error }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info({ uid: user.uid, socketId: socket.id }, 'User connected via Socket.IO');

    // Join a personal room for direct messages/notifications
    socket.join(`user:${user.uid}`);

    // Join a specific session/chat room
    socket.on('chat:join', (roomId: string) => {
      // In a real app, verify user has access to this room
      socket.join(`room:${roomId}`);
      logger.info({ uid: user.uid, roomId }, 'User joined chat room');
    });

    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    // Chat Messages
    socket.on('chat:send', async (data: { roomId: string, text: string }) => {
      const { roomId, text } = data;
      if (!roomId || !text) return;

      const message = {
        id: uuidv4(),
        roomId,
        senderId: user.uid,
        text,
        createdAt: Date.now(),
        readBy: [user.uid]
      };

      // Broadcast to room
      io.to(`room:${roomId}`).emit('chat:message', message);

      // Persist to Firestore asynchronously
      try {
        const db = getFirestore();
        await db.collection('rooms').doc(roomId).collection('messages').doc(message.id).set({
          ...message,
          createdAt: FieldValue.serverTimestamp()
        });
        
        await db.collection('rooms').doc(roomId).set({
          lastMessageAt: FieldValue.serverTimestamp(),
          lastMessageText: text
        }, { merge: true });
      } catch (err) {
        logger.error({ err, roomId }, 'Failed to persist chat message');
      }
    });

    socket.on('chat:typing', (data: { roomId: string, isTyping: boolean }) => {
      socket.to(`room:${data.roomId}`).emit('chat:typing', {
        userId: user.uid,
        isTyping: data.isTyping
      });
    });

    // WebRTC Signaling
    socket.on('video:join', (roomId: string) => {
      socket.join(`video:${roomId}`);
      // Notify others in the video room
      socket.to(`video:${roomId}`).emit('video:user-joined', { userId: user.uid, socketId: socket.id });
    });

    socket.on('video:offer', (data: { targetSocketId: string, offer: any, roomId: string }) => {
      socket.to(data.targetSocketId).emit('video:offer', {
        offer: data.offer,
        senderSocketId: socket.id,
        senderId: user.uid
      });
    });

    socket.on('video:answer', (data: { targetSocketId: string, answer: any, roomId: string }) => {
      socket.to(data.targetSocketId).emit('video:answer', {
        answer: data.answer,
        senderSocketId: socket.id
      });
    });

    socket.on('video:ice-candidate', (data: { targetSocketId: string, candidate: any, roomId: string }) => {
      socket.to(data.targetSocketId).emit('video:ice-candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      logger.info({ uid: user.uid, socketId: socket.id }, 'User disconnected');
      // Notify video rooms that this user has left
      socket.rooms.forEach((room) => {
        if (room.startsWith('video:')) {
          socket.to(room).emit('video:user-left', { userId: user.uid, socketId: socket.id });
        }
      });
    });
  });
}
