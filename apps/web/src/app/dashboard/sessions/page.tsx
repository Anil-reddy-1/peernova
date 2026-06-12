'use client';

import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { useSessions, useSessionActions } from '@/hooks/useSessions';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Session } from '@peer-tutoring/types';

const SessionCard = memo(({
  session,
  role,
  cancelSession,
  updateStatus,
  onCancelClick,
  isLast,
  lastElementRef
}: {
  session: Session & { parsedStartTime: Date };
  role: string | null;
  cancelSession: any;
  updateStatus: any;
  onCancelClick: (id: string) => void;
  isLast: boolean;
  lastElementRef: (node: HTMLDivElement) => void;
}) => {
  const startTime = session.parsedStartTime;
  const now = new Date();
  
  const canJoin = ['confirmed', 'in_progress'].includes(session.status) &&
    now >= new Date(startTime.getTime() - 10 * 60 * 1000) &&
    now <= new Date(startTime.getTime() + session.durationMinutes * 60 * 1000);
    
  const canCancel = ['pending', 'confirmed'].includes(session.status) &&
    startTime.getTime() > now.getTime() + 2 * 60 * 60 * 1000;

  const isCancelling = cancelSession.isPending && cancelSession.variables?.sessionId === session.id;

  return (
    <div
      ref={isLast ? lastElementRef : null}
      className="glass-card rounded-2xl p-6 hover-lift flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{session.subject}</h3>
          <p className="text-sm text-surface-500">
            {format(startTime, 'MMM d, yyyy')} • {format(startTime, 'h:mm a')}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-md uppercase font-bold tracking-wider flex items-center gap-1 ${
          session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
          session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {session.status === 'confirmed' && '✓'}
          {session.status === 'pending' && '⏳'} 
          {session.status === 'cancelled' && '✕'}
          {session.status}
        </span>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
        {canJoin && (
          <Link href={`/call/${session.id}`} className="btn-primary w-full text-center block py-2">
            Join Video Call
          </Link>
        )}
        {canCancel && (
          <button 
            onClick={() => onCancelClick(session.id)}
            className="btn-ghost text-red-500 w-full py-2 disabled:opacity-50"
            disabled={cancelSession.isPending}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Session'}
          </button>
        )}
        {role === 'tutor' && session.status === 'in_progress' && (
          <button 
            onClick={() => updateStatus.mutate({ sessionId: session.id, status: 'completed' })}
            className="btn-secondary w-full py-2 disabled:opacity-50"
            disabled={updateStatus.isPending}
          >
            Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
});

SessionCard.displayName = 'SessionCard';

export default function SessionsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const { cancelSession, updateStatus } = useSessionActions();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useSessions();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  const allSessions = data?.pages.flatMap(p => p.data) || [];

  const filteredSessions = useMemo(() => {
    const now = new Date();
    
    const parsed = allSessions.map((session: any) => ({
      ...session,
      parsedStartTime: session.startTime?.seconds 
        ? new Date(session.startTime.seconds * 1000) 
        : new Date(session.startTime)
    })) as (Session & { parsedStartTime: Date })[];

    const filtered = parsed.filter(session => {
      const startTime = session.parsedStartTime;
      if (activeTab === 'cancelled') return session.status === 'cancelled';
      if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(session.status) && startTime >= now;
      if (activeTab === 'past') return session.status === 'completed' || (['pending', 'confirmed'].includes(session.status) && startTime < now);
      return true;
    });

    return filtered.sort((a, b) => {
      if (activeTab === 'upcoming') {
        return a.parsedStartTime.getTime() - b.parsedStartTime.getTime();
      }
      return b.parsedStartTime.getTime() - a.parsedStartTime.getTime();
    });
  }, [allSessions, activeTab]);

  useEffect(() => {
    if (filteredSessions.length < 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [filteredSessions.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCancelClick = useCallback((sessionId: string) => {
    setCancellingSessionId(sessionId);
    setCancelReason('');
    setCancelModalOpen(true);
  }, []);

  const submitCancel = () => {
    if (cancellingSessionId && cancelReason.trim()) {
      cancelSession.mutate({ sessionId: cancellingSessionId, reason: cancelReason.trim() }, {
        onSettled: () => {
          setCancelModalOpen(false);
          setCancellingSessionId(null);
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = ['upcoming', 'past', 'cancelled'] as const;
    const currentIndex = tabs.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
    } else if (e.key === 'ArrowLeft') {
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prevTab);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-3xl font-bold">My Sessions</h1>
        <div className="text-center py-12 glass-card rounded-2xl text-red-500">
          Failed to load sessions. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">My Sessions</h1>
        {role === 'student' && (
          <Link href="/discover" className="btn-primary">
            Find a Tutor
          </Link>
        )}
      </div>

      <div 
        className="flex gap-4 border-b border-surface-200 dark:border-surface-800 pb-2"
        role="tablist"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {(['upcoming', 'past', 'cancelled'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium mb-4">No {activeTab} sessions found</p>
          {role === 'student' && activeTab === 'upcoming' && (
            <Link href="/discover" className="btn-primary inline-block">
              Find a Tutor
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session, index) => {
            const isLast = index === filteredSessions.length - 1;
            return (
              <SessionCard
                key={session.id}
                session={session}
                role={role || null}
                cancelSession={cancelSession}
                updateStatus={updateStatus}
                onCancelClick={handleCancelClick}
                isLast={isLast}
                lastElementRef={lastElementRef}
              />
            );
          })}
        </div>
      )}

      {isFetchingNextPage && <div className="text-center py-4">Loading more...</div>}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Cancel Session</h2>
            <p className="text-sm text-surface-500 mb-4">
              Please provide a reason for cancelling this session.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
              className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-transparent mb-6 resize-none h-32 outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                disabled={cancelSession.isPending}
              >
                Keep Session
              </button>
              <button 
                onClick={submitCancel}
                className="px-4 py-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={!cancelReason.trim() || cancelSession.isPending}
              >
                {cancelSession.isPending ? 'Cancelling...' : 'Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
