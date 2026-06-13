'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { ArrowLeft, Loader2, VideoOff } from 'lucide-react';
import type { Session } from '@peer-tutoring/types';

export default function CallRoom({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;
  
  const { user, role } = useAuth();
  const router = useRouter();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

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

  const handleJoinCall = async () => {
    setJoined(true);
    // If the session hasn't started yet, maybe update the status to in_progress
    if (role === 'tutor' && ['confirmed', 'pending'].includes(session?.status as string)) {
      try {
        await api.sessions.updateStatus(sessionId, 'in_progress');
      } catch (err) {
        console.error('Failed to update session status to in_progress', err);
      }
    }
  };

  const handleLeaveCall = async () => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-surface-500 font-medium">Entering session room...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4">
        <div className="glass-card max-w-md w-full p-8 text-center rounded-3xl">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Room Not Found</h1>
          <p className="text-surface-500 mb-8">{error || 'The session you are looking for does not exist or you do not have access to it.'}</p>
          <button onClick={() => router.push('/dashboard/sessions')} className="btn-primary w-full">
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const roomName = `peernova-${sessionId}`;
  const displayName = user?.displayName || (role === 'tutor' ? 'Tutor' : 'Student');

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden">
      {/* Call Header */}
      <header className="flex items-center justify-between p-4 bg-surface-900 border-b border-surface-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeaveCall}
            className="p-2 hover:bg-surface-800 rounded-full transition-colors flex items-center justify-center"
            title="Leave Call"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{session.subject} Session</h1>
            <p className="text-xs text-surface-400">
              {role === 'tutor' ? 'Teaching' : 'Learning'} • Room ID: {sessionId.substring(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-400 mr-2">Live</span>
          <button 
            onClick={handleLeaveCall}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Call Area */}
      <main className="flex-1 relative bg-black flex flex-col">
        {!joined ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col p-6 z-10 bg-surface-950">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Ready to join?</h2>
            <p className="text-surface-400 mb-8 max-w-sm text-center">
              You are about to join the session for <strong>{session.subject}</strong>.
            </p>
            <button 
              onClick={handleJoinCall}
              className="btn-primary text-lg px-12 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1"
            >
              Join Now
            </button>
          </div>
        ) : (
          <div className="w-full h-full">
            <iframe
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              src={`https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"`}
              style={{ width: '100%', height: '100%', border: 0 }}
              title="Session Video Call"
            />
          </div>
        )}
      </main>
    </div>
  );
}
