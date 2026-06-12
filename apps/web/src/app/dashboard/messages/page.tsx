'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useChatSocket } from '@/lib/useChatSocket';
import { Spinner, Input, Button } from '@peer-tutoring/ui';
import { Search, Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { socket, joinChat, leaveChat } = useChatSocket();

  // Fetch conversations
  const { data: convRes, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.chat.getConversations();
      return res.data;
    },
  });

  const conversations = (convRes as any)?.data || [];

  // Fetch messages for active chat
  const { data: msgRes, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', activeChatId],
    queryFn: async () => {
      if (!activeChatId) return null;
      const res = await api.chat.getMessages(activeChatId);
      return res.data;
    },
    enabled: !!activeChatId,
  });

  const [messages, setMessages] = useState<any[]>([]);

  // Sync React Query data to local state for optimistic updates
  useEffect(() => {
    if (msgRes?.data) {
      setMessages((msgRes.data as any[]) || []);
    } else {
      setMessages([]);
    }
  }, [activeChatId, msgRes?.data]);

  // Setup Socket.IO listeners
  useEffect(() => {
    if (activeChatId) {
      joinChat(activeChatId);
      
      const handleNewMessage = (message: any) => {
        // Normalize message: socket sends 'text', REST sends 'content'
        const normalized = { ...message, content: message.content || message.text };
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.find(m => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      if (socket) {
        socket.on('chat:message', handleNewMessage);
      }

      return () => {
        if (socket) socket.off('chat:message', handleNewMessage);
        leaveChat(activeChatId);
      };
    }
  }, [activeChatId, joinChat, leaveChat, socket, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeChatId) throw new Error('No active chat');
      return api.chat.sendMessage(activeChatId, { content });
    },
    onSuccess: (res: any) => {
      setMessageInput('');
      const newMsg = res.data.data;
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;
    sendMutation.mutate(messageInput.trim());
  };

  const activeChat = conversations.find((c: any) => c.id === activeChatId);
  const otherParticipant = activeChat?.participants?.find((p: any) => p.id !== userProfile?.id);

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden glass-card rounded-2xl border border-surface-200 dark:border-surface-800 animate-fade-up">
      
      {/* Sidebar: Contacts */}
      <div className="w-1/3 min-w-[280px] max-w-[350px] border-r border-surface-200 dark:border-surface-800 flex flex-col bg-white/50 dark:bg-surface-950/50">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Messages</h2>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            <Input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-surface-500 text-sm">No conversations yet</div>
          ) : (
            conversations.map((chat: any) => {
              const participant = chat.participants.find((p: any) => p.id !== userProfile?.id) || chat.participants[0];
              const isUnread = chat.unreadCount?.[userProfile?.id || ''] > 0;
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 border-b border-surface-100 dark:border-surface-800/50 cursor-pointer transition-colors hover:bg-surface-100 dark:hover:bg-surface-800 ${
                    activeChatId === chat.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold ${activeChatId === chat.id ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white'}`}>
                      {participant?.displayName || 'Unknown User'}
                    </h3>
                    <span className="text-xs text-surface-400">
                      {chat.updatedAt ? format(new Date(chat.updatedAt), 'MMM d') : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-4 ${isUnread ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                      {chat.lastMessage?.content || 'Started a conversation'}
                    </p>
                    {isUnread && (
                      <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shrink-0"></span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-50/50 dark:bg-surface-900/20">
        {activeChatId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-950/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold overflow-hidden">
                  {otherParticipant?.avatarUrl ? (
                    <img src={otherParticipant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    otherParticipant?.displayName?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-white">
                    {otherParticipant?.displayName || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {otherParticipant?.role || 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgLoading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-surface-400 text-sm">
                  Send a message to start the conversation
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.senderId === userProfile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe 
                          ? 'rounded-tr-sm bg-primary-600 text-white' 
                          : 'rounded-tl-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700'
                      }`}>
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 bg-white/50 dark:bg-surface-950/50 border-t border-surface-200 dark:border-surface-800">
              <div className="flex gap-2 items-center">
                <button type="button" className="p-2 text-surface-400 hover:text-primary-600 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sendMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <Button type="submit" disabled={!messageInput.trim() || sendMutation.isPending} className="px-6 rounded-xl">
                  {sendMutation.isPending ? <Spinner className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
            <div className="text-6xl mb-4 opacity-50">💬</div>
            <h3 className="text-xl font-semibold text-surface-600 dark:text-surface-300">Your Messages</h3>
            <p className="mt-2 text-sm">Select a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
