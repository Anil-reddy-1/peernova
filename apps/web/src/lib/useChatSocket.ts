import { useEffect, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from './auth-context';

export function useChatSocket() {
  const { userProfile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;

    // Use environment variable for WebSocket URL, fallback to localhost
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    const socketInstance = io(socketUrl, {
      auth: {
        userId: userProfile.id,
      },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userProfile?.id]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('joinChat', { chatId });
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveChat', { chatId });
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { chatId, content });
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
