'use client';

import { useState, useRef, useCallback } from 'react';
import { useSessions, useSessionActions } from '@/hooks/useSessions';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SessionsPage() {
  const { userProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const { cancelSession, updateStatus } = useSessionActions();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
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

  const filterSessions = (sessions: any[]) => {
    const now = new Date();
    return sessions.filter(session => {
      const startTime = new Date(session.startTime);
      if (activeTab === 'cancelled') return session.status === 'cancelled';
      if (activeTab === 'upcoming') return session.status !== 'cancelled' && session.status !== 'completed' && startTime >= now;
      if (activeTab === 'past') return session.status === 'completed' || (session.status !== 'cancelled' && startTime < now);
      return true;
    });
  };

  const handleCancel = (sessionId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (reason) cancelSession.mutate({ sessionId, reason });
  };

  const allSessions = data?.pages.flatMap(p => p.data) || [];
  const filteredSessions = filterSessions(allSessions);

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

      <div className="flex gap-4 border-b border-surface-200 dark:border-surface-800 pb-2">
        {(['upcoming', 'past', 'cancelled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
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
          <p className="font-medium">No {activeTab} sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session, index) => {
            const isLast = index === filteredSessions.length - 1;
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const canJoin = session.status === 'confirmed' || session.status === 'in_progress';

            return (
              <div
                ref={isLast ? lastElementRef : null}
                key={session.id}
                className="glass-card rounded-2xl p-6 hover-lift flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{session.subject}</h3>
                    <p className="text-sm text-surface-500">
                      {format(startTime, 'MMM d, yyyy')} • {format(startTime, 'h:mm a')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-md uppercase font-bold tracking-wider ${
                    session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="mt-auto space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
                  {canJoin && (
                    <Link href={`/call/${session.id}`} className="btn-primary w-full text-center block py-2">
                      Join Video Call
                    </Link>
                  )}
                  {session.status !== 'cancelled' && session.status !== 'completed' && (
                    <button 
                      onClick={() => handleCancel(session.id)}
                      className="btn-ghost text-red-500 w-full py-2"
                      disabled={cancelSession.isPending}
                    >
                      Cancel Session
                    </button>
                  )}
                  {role === 'tutor' && session.status === 'in_progress' && (
                    <button 
                      onClick={() => updateStatus.mutate({ sessionId: session.id, status: 'completed' })}
                      className="btn-secondary w-full py-2"
                      disabled={updateStatus.isPending}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {session.status === 'completed' && role === 'student' && (
                    <button className="btn-secondary w-full py-2">
                      Write a Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFetchingNextPage && <div className="text-center py-4">Loading more...</div>}
    </div>
  );
}
