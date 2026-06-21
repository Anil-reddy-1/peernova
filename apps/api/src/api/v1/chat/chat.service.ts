import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();


import { NotFoundError } from '../../../lib/errors';

export class ChatService {
  // In-memory cache for the Metered API key obtained via secretKey
  private cachedApiKey: string | null = null;
  private cachedApiKeyExpiry: number = 0;

  async getTurnCredentials(_userId: string) {
    const domain = process.env.METERED_DOMAIN;
    const secretKey = process.env.METERED_SECRET_KEY;
    const staticUsername = process.env.METERED_STATIC_USERNAME;
    const staticPassword = process.env.METERED_STATIC_PASSWORD;
    const credentialApiKey = process.env.METERED_API_KEY;

    // --- Environment Variable Checks ---
    if (!domain) {
      console.error('🚨 WebRTC CRITICAL: METERED_DOMAIN is missing in environment variables!');
    }
    if (!staticUsername && !credentialApiKey && !secretKey) {
      console.error('🚨 WebRTC CRITICAL: Missing Metered Auth! You must provide METERED_API_KEY, METERED_STATIC_USERNAME/PASSWORD, or METERED_SECRET_KEY.');
    }

    // Helper: fetch with timeout to avoid hanging requests
    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
      } finally {
        clearTimeout(timer);
      }
    };

    // 1. Use static credentials if provided (fastest, no API call needed)
    if (domain && staticUsername && staticPassword) {
      console.log('✅ WebRTC: Using static TURN credentials');
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
        console.log('🔄 WebRTC: Fetching TURN credentials using METERED_API_KEY...');
        const turnRes = await fetchWithTimeout(`https://${domain}/api/v1/turn/credentials?apiKey=${credentialApiKey}`);
        if (turnRes.ok) {
          const iceServers = (await turnRes.json()) as any[];
          console.log(`✅ WebRTC: Got ${iceServers.length} ICE servers from Metered API key`);
          return { iceServers };
        } else {
          const body = await turnRes.text().catch(() => '');
          console.error(`🚨 WebRTC CRITICAL: METERED_API_KEY fetch failed: ${turnRes.status} ${turnRes.statusText} - ${body}`);
        }
      } catch (e: any) {
        console.error('🚨 WebRTC CRITICAL: Failed to fetch TURN credentials with API key:', e.message);
      }
    }

    // 3. Use secretKey to get/reuse an API key (caches to avoid exhausting free tier)
    if (domain && secretKey) {
      try {
        let apiKey = this.cachedApiKey;

        // Only create a new credential if we don't have a cached one or it expired
        // Cache for 23 hours (Metered credentials are valid for 24h)
        if (!apiKey || Date.now() > this.cachedApiKeyExpiry) {
          console.log('🔄 WebRTC: Creating new TURN credential via METERED_SECRET_KEY (will be cached)...');
          const createRes = await fetchWithTimeout(
            `https://${domain}/api/v1/turn/credential?secretKey=${secretKey}`,
            { method: 'POST' }
          );

          if (!createRes.ok) {
            const body = await createRes.text().catch(() => '');
            console.error(`🚨 WebRTC CRITICAL: Failed to create TURN credential: ${createRes.status} ${createRes.statusText} - ${body}`);
            console.error('🚨 This usually means the Metered free tier credential limit is exhausted.');
            console.error('🚨 FIX: Go to https://dashboard.metered.ca → TURN Servers → Your App → API Key, and set METERED_API_KEY in your .env.local');
            throw new Error(`Metered credential creation failed: ${createRes.status} - ${body}`);
          }

          const result = (await createRes.json()) as any;
          apiKey = result.apiKey;
          this.cachedApiKey = apiKey;
          // Cache for 23 hours
          this.cachedApiKeyExpiry = Date.now() + 23 * 60 * 60 * 1000;
          console.log('✅ WebRTC: Created and cached new TURN API key');
        } else {
          console.log('✅ WebRTC: Using cached TURN API key');
        }

        // Fetch the full iceServers array using the API key
        const turnRes = await fetchWithTimeout(
          `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`
        );

        if (!turnRes.ok) {
          const body = await turnRes.text().catch(() => '');
          // If cached key is stale, clear it and retry once
          if (this.cachedApiKey === apiKey) {
            this.cachedApiKey = null;
            this.cachedApiKeyExpiry = 0;
          }
          throw new Error(`Metered credentials fetch failed: ${turnRes.status} - ${body}`);
        }

        const iceServers = (await turnRes.json()) as any[];
        console.log(`✅ WebRTC: Got ${iceServers.length} ICE servers from Metered`);
        return { iceServers };
      } catch (err: any) {
        console.error('🚨 WebRTC: TURN credential flow failed:', err.message);
        console.error('🚨 Falling back to STUN-only. Video calls will NOT work across different networks!');
      }
    }

    // 4. Final fallback: public STUN only (same-network only!)
    console.warn('⚠️ WebRTC WARNING: Using STUN-only fallback. Calls across different networks will FAIL!');
    console.warn('⚠️ To fix: Set METERED_API_KEY in your .env.local (get it from https://dashboard.metered.ca)');
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
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
