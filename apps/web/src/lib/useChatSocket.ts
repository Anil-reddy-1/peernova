import { useEffect, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from './auth-context';
import { auth } from './firebase-client';

export function useChatSocket() {
  const { userProfile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;

    let socketInstance: Socket;

    const connect = async () => {
      let token = '';
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch {
        // proceed without token (will fail auth on server)
      }

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    connect();

    return () => {
      socketInstance?.disconnect();
    };
  }, [userProfile?.id]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:join', chatId);
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:leave', chatId);
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send', { roomId: chatId, text: content });
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
  };
}
