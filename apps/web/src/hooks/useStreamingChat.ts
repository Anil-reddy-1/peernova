import { useState, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function useStreamingChat(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!user) return;
    
    const userMsgId = Date.now().toString();
    const newMsg: Message = { id: userMsgId, role: 'user', content };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);
    setError(null);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: content, conversationId, context })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to chat stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No stream available');

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === assistantMsgId 
                        ? { ...msg, content: msg.content + parsed.content }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  setError(parsed.error);
                }
              } catch (e) {
                // Ignore incomplete JSON chunks, wait for next
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setIsTyping(false);
    }
  }, [user, conversationId]);

  return { messages, isTyping, error, sendMessage, setMessages };
}
