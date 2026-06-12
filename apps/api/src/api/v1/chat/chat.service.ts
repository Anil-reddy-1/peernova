import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();

import crypto from 'crypto';
import { NotFoundError } from '../../../lib/errors';

export class ChatService {
  getTurnCredentials(userId: string) {
    const turnSecret = process.env.TURN_SECRET || 'dummy_turn_secret';
    const ttl = 24 * 60 * 60; // 24 hours
    const unixTimeStamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${unixTimeStamp}:${userId}`;
    const hmac = crypto.createHmac('sha1', turnSecret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    const credential = hmac.read() as string;

    return {
      username,
      credential,
      ttl
    };
  }

  async createRoom(userId: string, participantId: string, _initialMessage?: string) {
    const db = getFirestore();
    const roomId = [ userId, participantId ].sort().join('_');
    
    await db.collection('rooms').doc(roomId).set({
      participants: [userId, participantId],
      lastMessageAt: new Date().toISOString()
    }, { merge: true });

    return { roomId };
  }

  async getConversations(userId: string, page: number, limit: number) {
    const db = getFirestore();
    const snapshot = await db.collection('rooms')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    // Fetch participant profile info for each room
    const rooms = await Promise.all(snapshot.docs.map(async (doc) => {
      const roomData = doc.data();
      const participantIds: string[] = roomData.participants || [];

      const participantProfiles = await Promise.all(
        participantIds.map(async (pid) => {
          try {
            const userDoc = await db.collection('users').doc(pid).get();
            if (userDoc.exists) {
              const u = userDoc.data()!;
              return { id: pid, displayName: u.displayName || 'Unknown', role: u.role || 'user', avatarUrl: u.avatarUrl || null };
            }
          } catch {}
          return { id: pid, displayName: 'Unknown', role: 'user', avatarUrl: null };
        })
      );

      return {
        id: doc.id,
        ...roomData,
        participants: participantProfiles,
        updatedAt: roomData.lastMessageAt,
        lastMessage: roomData.lastMessageText ? { content: roomData.lastMessageText } : null,
        unreadCount: roomData.unreadCount || {},
      };
    }));

    return {
      data: rooms,
      meta: { page, limit, total: rooms.length, hasMore: false }
    };
  }

  async getMessages(roomId: string, userId: string, page: number, limit: number) {
    const db = getFirestore();
    // Validate room access
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) throw new NotFoundError('Room', roomId);

    const roomData = roomDoc.data()!;
    if (!roomData.participants?.includes(userId)) {
      throw new NotFoundError('Room', roomId);
    }

    const snapshot = await db.collection('rooms').doc(roomId).collection('messages')
      .orderBy('createdAt', 'asc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    // Mark messages as read
    try {
      await db.collection('rooms').doc(roomId).set({
        [`unreadCount.${userId}`]: 0
      }, { merge: true });
    } catch {}

    return {
      data: messages,
      meta: { page, limit, total: messages.length, hasMore: false }
    };
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    const db = getFirestore();
    const { v4: uuidv4 } = await import('uuid');

    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) throw new NotFoundError('Room', roomId);

    const roomData = roomDoc.data()!;
    if (!roomData.participants?.includes(senderId)) {
      throw new NotFoundError('Room', roomId);
    }

    const messageId = uuidv4();
    const message = {
      id: messageId,
      roomId,
      senderId,
      content,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('rooms').doc(roomId).collection('messages').doc(messageId).set(message);
    await db.collection('rooms').doc(roomId).set({
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageText: content,
    }, { merge: true });

    return {
      id: messageId,
      roomId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    };
  }
}

export const chatService = new ChatService();
