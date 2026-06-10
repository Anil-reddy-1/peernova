import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { apiClient } from '@/lib/api-client';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export function useChat(roomId: string) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Load historical messages
    apiClient.get(`/v1/chat/${roomId}/messages`).then(res => {
      setMessages(res.data.data.reverse()); // Assuming desc from API
    });
  }, [roomId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('chat:join', roomId);

    const handleMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleTyping = (data: { userId: string, isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.emit('chat:leave', roomId);
    };
  }, [socket, isConnected, roomId]);

  const sendMessage = useCallback((text: string) => {
    if (!socket) return;
    socket.emit('chat:send', { roomId, text });
  }, [socket, roomId]);

  const sendTyping = useCallback((typing: boolean) => {
    if (!socket) return;
    socket.emit('chat:typing', { roomId, isTyping: typing });
  }, [socket, roomId]);

  return { messages, isTyping, sendMessage, sendTyping };
}
