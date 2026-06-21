'use client';

import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { useSessions, useSessionActions } from '@/hooks/useSessions';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Session } from '@/types/shared';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  AlertCircle, 
  Search, 
  CalendarX2,
  CalendarCheck,
  CalendarClock
} from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'confirmed':
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
          <CheckCircle2 size={14} /> Confirmed
        </span>
      );
    case 'pending':
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50">
          <Clock3 size={14} /> Pending
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
          <XCircle size={14} /> Cancelled
        </span>
      );
    case 'in_progress':
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
          <Video size={14} className="animate-pulse" /> In Progress
        </span>
      );
    case 'completed':
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
          <CheckCircle2 size={14} /> Completed
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 text-xs rounded-full font-semibold flex items-center gap-1.5 bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300">
          <AlertCircle size={14} /> {status}
        </span>
      );
  }
};

const SkeletonCard = () => (
  <div className="glass-card rounded-2xl p-6 animate-pulse flex flex-col h-[220px]">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-3 w-2/3">
        <div className="h-6 bg-surface-200 dark:bg-surface-800 rounded-md w-full"></div>
        <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded-md w-3/4"></div>
      </div>
      <div className="h-6 w-20 bg-surface-200 dark:bg-surface-800 rounded-full"></div>
    </div>
    <div className="mt-auto space-y-3 pt-4 border-t border-surface-100 dark:border-surface-800/50">
      <div className="h-10 bg-surface-200 dark:bg-surface-800 rounded-xl w-full"></div>
    </div>
  </div>
);

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
  
  const canJoin = 
    (role === 'tutor' && ['pending', 'confirmed', 'in_progress'].includes(session.status)) ||
    (session.status === 'in_progress') ||
    (['pending', 'confirmed'].includes(session.status) &&
      now >= new Date(startTime.getTime() - 10 * 60 * 1000));
    
  const canCancel = ['pending', 'confirmed'].includes(session.status) &&
    startTime.getTime() > now.getTime() + 2 * 60 * 60 * 1000;

  const isCancelling = cancelSession.isPending && cancelSession.variables?.sessionId === session.id;

  return (
    <div
      ref={isLast ? lastElementRef : null}
      className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm border border-surface-200 dark:border-surface-800 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col group"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-lg text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">{session.subject}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-surface-500 dark:text-surface-400 font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(startTime, 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {format(startTime, 'h:mm a')}</span>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="mt-auto space-y-3 pt-5 border-t border-surface-100 dark:border-surface-800">
        {canJoin && (
          <Link href={`/dashboard/call/${session.id}`} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 shadow-sm hover:shadow">
            <Video size={18} />
            {role === 'tutor' ? 'Start Session' : 'Join Video Call'}
          </Link>
        )}
        {canCancel && (
          <button 
            onClick={() => onCancelClick(session.id)}
            className="w-full py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={cancelSession.isPending}
          >
            {isCancelling ? (
              <span className="flex items-center gap-2"><Clock3 size={16} className="animate-spin" /> Cancelling...</span>
            ) : (
              <span className="flex items-center gap-2"><XCircle size={16} /> Cancel Session</span>
            )}
          </button>
        )}
        {role === 'tutor' && session.status === 'in_progress' && (
          <button 
            onClick={() => updateStatus.mutate({ sessionId: session.id, status: 'completed' })}
            className="w-full py-2.5 text-sm font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 dark:text-surface-300 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={updateStatus.isPending}
          >
            <CheckCircle2 size={16} /> Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
});

SessionCard.displayName = 'SessionCard';

const EmptyState = ({ tab, role }: { tab: string, role: string | null }) => {
  const Icon = tab === 'upcoming' ? CalendarClock : tab === 'past' ? CalendarCheck : CalendarX2;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border border-surface-200 dark:border-surface-800 rounded-3xl border-dashed">
      <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No {tab} sessions found</h3>
      <p className="text-surface-500 dark:text-surface-400 text-center max-w-sm mb-6">
        {tab === 'upcoming' ? "You don't have any upcoming sessions scheduled at the moment." : 
         tab === 'past' ? "You haven't completed any sessions yet." : 
         "You don't have any cancelled sessions."}
      </p>
      {role === 'student' && tab === 'upcoming' && (
        <Link href="/discover" className="btn-primary flex items-center gap-2 shadow-sm">
          <Search size={18} /> Find a Tutor
        </Link>
      )}
    </div>
  );
};

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
      const endTime = new Date(startTime.getTime() + (session.durationMinutes || 60) * 60 * 1000);
      if (activeTab === 'cancelled') return session.status === 'cancelled';
      if (activeTab === 'upcoming') return ['pending', 'confirmed', 'in_progress'].includes(session.status) && (endTime >= now || session.status === 'in_progress');
      if (activeTab === 'past') return session.status === 'completed' || (['pending', 'confirmed', 'in_progress'].includes(session.status) && endTime < now);
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
      <div className="space-y-8 animate-fade-up">
        <h1 className="text-3xl font-extrabold tracking-tight">My Sessions</h1>
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-3xl">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Failed to load sessions</h3>
          <p className="text-red-600/80 dark:text-red-400/80">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">My Sessions</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your tutoring appointments</p>
        </div>
        {role === 'student' && (
          <Link href="/dashboard/tutors" className="btn-primary flex items-center gap-2 shadow-sm shadow-primary-500/20">
            <Search size={18} /> Find a Tutor
          </Link>
        )}
      </div>

      <div className="bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-surface-200 dark:border-surface-800 inline-flex w-full sm:w-auto overflow-x-auto hide-scrollbar">
        <div 
          className="flex gap-1 min-w-max w-full"
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
              className={`px-5 py-2.5 text-sm font-semibold capitalize rounded-lg outline-none transition-all duration-200 flex-1 sm:flex-none text-center ${
                activeTab === tab 
                  ? 'bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-surface-200 dark:ring-surface-700' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState tab={activeTab} role={role} />
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

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setCancelModalOpen(false)}></div>
          <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-surface-200 dark:border-surface-800 relative z-10 animate-fade-up">
            <div className="flex items-center gap-3 mb-2 text-red-600 dark:text-red-500">
              <AlertCircle size={24} />
              <h2 className="text-xl font-bold">Cancel Session</h2>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
              Please provide a reason for cancelling this session. This will be shared with the other participant.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="E.g., I have a scheduling conflict..."
              className="w-full p-4 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950/50 mb-6 resize-none h-32 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                disabled={cancelSession.isPending}
              >
                Keep Session
              </button>
              <button 
                onClick={submitCancel}
                className="px-5 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!cancelReason.trim() || cancelSession.isPending}
              >
                {cancelSession.isPending ? (
                  <><Clock3 size={18} className="animate-spin" /> Cancelling...</>
                ) : (
                  <><XCircle size={18} /> Cancel Session</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
