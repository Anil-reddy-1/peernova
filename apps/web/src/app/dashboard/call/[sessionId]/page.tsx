'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useChat } from '@/hooks/useChat';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function VideoCallPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const { userProfile } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [msgInput, setMsgInput] = useState('');

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare
  } = useWebRTC(sessionId);

  const { messages, isTyping, sendMessage, sendTyping } = useChat(sessionId);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleEndCall = () => {
    if (confirm('Are you sure you want to leave the session?')) {
      router.push('/sessions');
    }
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(msgInput);
    setMsgInput('');
    sendTyping(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in relative">
      {/* Main Video Area */}
      <div className={`flex-1 flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 ${chatOpen ? 'w-2/3' : 'w-full'}`}>
        <div className="flex-1 relative bg-black/90">
          {/* Remote Video (Full Screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xl font-medium">
              Waiting for other participant...
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-20 bg-surface-900/95 dark:bg-black/95 flex items-center justify-center gap-4 px-6 border-t border-white/10 backdrop-blur-md">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? 'bg-surface-700 hover:bg-surface-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? 'bg-surface-700 hover:bg-surface-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            {isVideoEnabled ? '📹' : '🚫'}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-primary text-white' : 'bg-surface-700 hover:bg-surface-600 text-white'}`}
          >
            💻
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${chatOpen ? 'bg-primary text-white' : 'bg-surface-700 hover:bg-surface-600 text-white'}`}
          >
            💬
          </button>
          <button
            onClick={handleEndCall}
            className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center ml-4"
          >
            📞
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="w-96 glass-card rounded-2xl flex flex-col overflow-hidden animate-fade-in-right">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-900/50">
            <h3 className="font-bold text-lg">Session Chat</h3>
            <button onClick={() => setChatOpen(false)} className="text-surface-500 hover:text-surface-900 dark:hover:text-white">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => {
              const isMe = msg.senderId === userProfile?.id;
              return (
                <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface-200 dark:bg-surface-800 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-surface-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {isTyping && (
              <div className="text-xs text-surface-500 italic animate-pulse">
                Someone is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMsg} className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 flex gap-2">
            <input
              type="text"
              value={msgInput}
              onChange={(e) => {
                setMsgInput(e.target.value);
                sendTyping(e.target.value.length > 0);
              }}
              placeholder="Type a message..."
              className="input flex-1 bg-white dark:bg-black"
            />
            <button type="submit" className="btn-primary px-4">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
