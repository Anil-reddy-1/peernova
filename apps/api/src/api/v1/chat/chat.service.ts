import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();


import { NotFoundError } from '../../../lib/errors';

export class ChatService {
  async getTurnCredentials(_userId: string) {
    const domain = process.env.METERED_DOMAIN;
    const secretKey = process.env.METERED_SECRET_KEY;
    const staticUsername = process.env.METERED_STATIC_USERNAME;
    const staticPassword = process.env.METERED_STATIC_PASSWORD;
    const credentialApiKey = process.env.METERED_API_KEY;

    // 1. Use static credentials if provided (fastest, no API call needed)
    if (domain && staticUsername && staticPassword) {
      return {
        iceServers: [
          { urls: `stun:${domain}:80` },
          { urls: `turn:${domain}:80`, username: staticUsername, credential: staticPassword },
          { urls: `turn:${domain}:443`, username: staticUsername, credential: staticPassword },
          { urls: `turn:${domain}:443?transport=tcp`, username: staticUsername, credential: staticPassword },
        ],
      };
    }

    // 2. Fetch using an existing static credential API Key (bypasses creation limits)
    if (domain && credentialApiKey) {
      try {
        const turnRes = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${credentialApiKey}`);
        if (turnRes.ok) {
          const iceServers = await turnRes.json();
          return { iceServers };
        }
      } catch (e) {
        console.warn('Failed to fetch static API key credentials:', e);
      }
    }

    if (!domain || !secretKey) {
      // Fallback to public STUN only
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };
    }

    try {
      // First generate a temporary credential using the secretKey
      const createRes = await fetch(
        `https://${domain}/api/v1/turn/credential?secretKey=${secretKey}`,
        { method: 'POST' }
      );

      if (!createRes.ok) {
        throw new Error(`Metered API error: ${createRes.status} ${createRes.statusText}`);
      }

      const { apiKey } = (await createRes.json()) as any;

      // Then fetch the full iceServers array using the generated apiKey
      const turnRes = await fetch(
        `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`
      );

      if (!turnRes.ok) {
        throw new Error(`Metered API error: ${turnRes.status} ${turnRes.statusText}`);
      }

      const iceServers = await turnRes.json();
      return { iceServers };
    } catch (err) {
      console.warn('Failed to fetch TURN credentials, falling back to STUN:', err);
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };
    }
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
    // If room doesn't exist, it means no messages have been sent yet.
    // We can just return an empty array.
    if (!roomDoc.exists) {
      return {
        data: [],
        meta: { page, limit, total: 0, hasMore: false }
      };
    }

    const roomData = roomDoc.data()!;
    if (roomData.participants && !roomData.participants.includes(userId)) {
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

  async sendMessage(roomId: string, senderId: string, content: string, type?: string, fileURL?: string, fileType?: string) {
    const db = getFirestore();
    const { v4: uuidv4 } = await import('uuid');

    const roomDoc = await db.collection('rooms').doc(roomId).get();
    let roomData = roomDoc.data();
    if (!roomDoc.exists) {
      // Create the room implicitly if it doesn't exist
      roomData = { participants: [senderId] };
      await db.collection('rooms').doc(roomId).set(roomData);
    } else {
      if (roomData?.participants && !roomData.participants.includes(senderId)) {
        throw new NotFoundError('Room', roomId);
      }
    }

    const messageId = uuidv4();
    const message: any = {
      id: messageId,
      roomId,
      senderId,
      content,
      type: type || 'text',
      createdAt: FieldValue.serverTimestamp(),
    };
    
    if (fileURL) message.fileURL = fileURL;
    if (fileType) message.fileType = fileType;

    await db.collection('rooms').doc(roomId).collection('messages').doc(messageId).set(message);
    await db.collection('rooms').doc(roomId).set({
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageText: type === 'file' ? 'Sent a file' : content,
    }, { merge: true });

    const responseData: any = {
      id: messageId,
      roomId,
      senderId,
      content,
      type: type || 'text',
      createdAt: new Date().toISOString(),
    };
    
    if (fileURL) responseData.fileURL = fileURL;
    if (fileType) responseData.fileType = fileType;

    // Broadcast to connected socket clients
    try {
      const { io } = await import('./socket');
      if (io) {
        io.to(`room:${roomId}`).emit('chat:message', responseData);
      }
    } catch (e) {
      console.error('Failed to broadcast message via socket', e);
    }

    return responseData;
  }
}

export const chatService = new ChatService();
