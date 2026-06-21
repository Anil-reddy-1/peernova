'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useChat } from '@/hooks/useChat';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  PhoneOff,
  X,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  WifiOff,
  AlertTriangle,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import type { Session } from '@peer-tutoring/types';

export default function VideoCallPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const { userProfile, user, role } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [joined, setJoined] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    connectionState,
    mediaError,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    switchDevice,
  } = useWebRTC(joined ? sessionId : '');

  const { messages, isTyping, sendMessage, sendTyping } = useChat(joined ? sessionId : '');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load session details
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await api.sessions.getById(sessionId);
        const data = res.data as { data: Session };
        setSession(data.data);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSession();
    }
  }, [sessionId, user]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn('Local video play failed:', e));
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.warn('Remote video play failed:', e));
    }
  }, [remoteStream]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, chatOpen]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!chatOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Call timer
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => setCallTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [joined]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleJoinCall = async () => {
    setJoined(true);
    // If the session hasn't started yet, update status to in_progress
    if (role === 'tutor' && ['confirmed', 'pending'].includes(session?.status as string)) {
      try {
        await api.sessions.updateStatus(sessionId, 'in_progress');
      } catch (err) {
        console.error('Failed to update session status to in_progress', err);
      }
    }
  };

  const handleEndCall = async () => {
    // Tutors can mark the session as completed when leaving
    if (role === 'tutor' && session?.status === 'in_progress') {
      if (confirm('Do you want to mark this session as completed?')) {
        try {
          await api.sessions.updateStatus(sessionId, 'completed');
        } catch (err) {
          console.error('Failed to mark session as completed', err);
        }
      }
    }
    router.push('/dashboard/sessions');
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(msgInput);
    setMsgInput('');
    sendTyping(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-500 animate-pulse';
      case 'disconnected':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-surface-500';
    }
  };

  const displayName = userProfile?.displayName || (role === 'tutor' ? 'Tutor' : 'Student');

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] animate-fade-in">
        <div className="glass-card rounded-3xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-surface-500 dark:text-surface-400 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] animate-fade-in px-4">
        <div className="glass-card max-w-md w-full p-8 text-center rounded-3xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <VideoOff size={32} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Room Not Found</h1>
          <p className="text-surface-500 dark:text-surface-400 mb-8">
            {error || 'The session you are looking for does not exist or you do not have access to it.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/sessions')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] animate-fade-in px-4">
        <div className="glass-card max-w-lg w-full p-10 text-center rounded-3xl">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary-500/30">
              <span className="text-3xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Ready to join?</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-2 text-lg">
            <strong>{session.subject}</strong> Session
          </p>
          <p className="text-surface-400 dark:text-surface-500 mb-8 text-sm">
            {role === 'tutor' ? 'You will be teaching this session' : 'You will be joining as a student'}
          </p>

          <div className="flex gap-4 justify-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mediaError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>
                <Video size={20} className={mediaError ? 'text-red-500' : 'text-primary-500'} />
              </div>
              <span className="text-xs text-surface-500">Camera</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mediaError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>
                <Mic size={20} className={mediaError ? 'text-red-500' : 'text-primary-500'} />
              </div>
              <span className="text-xs text-surface-500">Microphone</span>
            </div>
          </div>

          {mediaError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-left flex gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{mediaError}</p>
            </div>
          )}

          <button
            onClick={handleJoinCall}
            className="btn-primary text-lg px-12 py-4 rounded-2xl shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-1 w-full flex items-center justify-center gap-3"
          >
            <Video size={22} />
            Join Now
          </button>
          <button
            onClick={() => router.push('/dashboard/sessions')}
            className="mt-4 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
          >
            ← Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  // In-call UI
  return (
    <div ref={containerRef} className="h-[calc(100vh-8rem)] flex gap-3 animate-fade-in relative">
      {/* Main Video Area */}
      <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 bg-surface-950 ${chatOpen ? 'w-2/3' : 'w-full'}`}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface-900/95 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${getConnectionStatusColor()}`} />
            <div>
              <h2 className="font-semibold text-white text-sm leading-tight">{session.subject} Session</h2>
              <p className="text-xs text-surface-400">
                {role === 'tutor' ? 'Teaching' : 'Learning'} • {sessionId.substring(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-800/50 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-mono font-medium text-white">{formatTime(callTimer)}</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-400 hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black/95 overflow-hidden">
          {/* Remote Video (Full Screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* No remote stream placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface-900 to-surface-950">
              <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mb-4">
                <span className="text-3xl text-surface-500">👤</span>
              </div>
              <p className="text-white/60 text-lg font-medium">Waiting for other participant...</p>
              {connectionState === 'connecting' && (
                <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Connecting...
                </div>
              )}
              {connectionState === 'failed' && (
                <div className="flex flex-col items-center gap-2 mt-3 text-red-400 text-sm max-w-xs text-center">
                  <div className="flex items-center gap-2">
                    <WifiOff size={14} />
                    Connection failed
                  </div>
                  <p className="text-xs text-red-400/70">
                    If you&apos;re on different networks, this may be a TURN server issue. Try refreshing or contact support.
                  </p>
                </div>
              )}
              {connectionState === 'disconnected' && (
                <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
                  <AlertTriangle size={14} />
                  Disconnected. Attempting to reconnect...
                </div>
              )}
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-5 right-5 w-52 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-10 group hover:border-primary-500/50 transition-colors">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />
            {!isVideoEnabled && (
              <div className="w-full h-full flex items-center justify-center bg-surface-800">
                <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 text-xs text-white/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
              You
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-20 bg-surface-900/95 backdrop-blur-md flex items-center justify-center gap-3 px-6 border-t border-white/5">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isAudioEnabled
                ? 'bg-surface-700 hover:bg-surface-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            }`}
            title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVideoEnabled
                ? 'bg-surface-700 hover:bg-surface-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            }`}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-surface-700 hover:bg-surface-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          <button
            onClick={() => {
              setChatOpen(!chatOpen);
              if (!chatOpen) setUnreadCount(0);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              chatOpen
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-surface-700 hover:bg-surface-600 text-white'
            }`}
            title={chatOpen ? 'Close Chat' : 'Open Chat'}
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 bg-surface-700 hover:bg-surface-600 text-white"
            title="Device Settings"
          >
            <Settings size={20} />
          </button>

          <div className="w-px h-8 bg-surface-700 mx-1" />

          <button
            onClick={handleEndCall}
            className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 ml-1 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
            title="End Call"
          >
            <PhoneOff size={18} />
            <span className="text-sm font-semibold hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="w-96 flex flex-col overflow-hidden animate-fade-in rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
          {/* Chat Header */}
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-900/80">
            <h3 className="font-bold text-lg text-surface-900 dark:text-white">Session Chat</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-500 hover:text-surface-900 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-surface-400 dark:text-surface-500">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet. Say hi! 👋</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderId === userProfile?.id;
              return (
                <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                      isMe
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-surface-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-surface-500 italic">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Someone is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMsg}
            className="p-3 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/80 flex gap-2"
          >
            <input
              type="text"
              value={msgInput}
              onChange={(e) => {
                setMsgInput(e.target.value);
                sendTyping(e.target.value.length > 0);
              }}
              placeholder="Type a message..."
              className="flex-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-surface-900 dark:text-white placeholder:text-surface-400"
            />
            <button
              type="submit"
              disabled={!msgInput.trim()}
              className="btn-primary px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Device Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass-card max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-slide-up">
            <div className="h-14 bg-surface-800/80 border-b border-white/5 flex items-center justify-between px-6">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Settings size={18} className="text-primary-400" />
                Device Settings
              </h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-surface-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-300 flex items-center gap-2">
                  <Video size={16} /> Camera
                </label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => switchDevice('videoinput', e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all appearance-none"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                  {videoDevices.length === 0 && <option value="">No cameras found</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-300 flex items-center gap-2">
                  <Mic size={16} /> Microphone
                </label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => switchDevice('audioinput', e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all appearance-none"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                  {audioDevices.length === 0 && <option value="">No microphones found</option>}
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-surface-800/50 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="btn-primary py-2 px-6"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
