import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { NotFoundError } from '../../../lib/errors';

export class ChatService {
  private get db() {
    return getFirestore();
  }

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

  async getConversations(_userId: string, page: number, limit: number) {
    // Basic implementation: fetch rooms where user is participant
    const snapshot = await this.db.collection('rooms')
      .where('participants', 'array-contains', _userId)
      .orderBy('lastMessageAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      meta: { page, limit, total: 0, hasMore: false }
    };
  }

  async getMessages(roomId: string, _userId: string, page: number, limit: number) {
    // Validate room access
    const roomDoc = await this.db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) throw new NotFoundError('Room', roomId);

    const snapshot = await this.db.collection('rooms').doc(roomId).collection('messages')
      .orderBy('createdAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    return {
      data: snapshot.docs.map(doc => doc.data()),
      meta: { page, limit, total: 0, hasMore: false }
    };
  }
}

export const chatService = new ChatService();
