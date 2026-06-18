'use client';

import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Spinner } from '@peer-tutoring/ui';
import { Calendar, Clock, Users, IndianRupee, Star, AlertCircle, Inbox, GraduationCap, Video, Flag } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { parseDate } from '@/lib/date-utils';

export default function DashboardPage() {
  const { userProfile, role } = useAuth();

  // Fetch sessions for student/tutor
  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ['dashboard-sessions'],
    queryFn: async () => {
      const res = await api.sessions.list();
      return res.data;
    },
    enabled: role === 'student' || role === 'tutor',
  });

  // Fetch admin stats
  const { data: adminStatsRes, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.admin.getDashboard();
      return res.data;
    },
    enabled: role === 'admin',
  });

  // Fetch recent reports for admin
  const { data: recentReportsRes, isLoading: recentReportsLoading } = useQuery({
    queryKey: ['admin-recent-reports'],
    queryFn: async () => {
      const res = await api.admin.getReports({ page: 1, limit: 5 });
      return res.data;
    },
    enabled: role === 'admin',
  });

  if ((role === 'admin' && adminLoading) || (role !== 'admin' && sessionsLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const sessions = Array.isArray((sessionsRes as any)?.data) ? (sessionsRes as any).data : [];
  const adminStats = (adminStatsRes as any)?.data || { totalUsers: 0, totalTutors: 0, totalSessions: 0 };

  // Calculate dynamic stats
  let statsConfig = [];

  if (role === 'student') {
    const totalSessions = sessions.length;
    const hoursLearned = sessions.reduce((acc: number, s: any) => acc + (s.duration || 60), 0) / 60;
    const activeTutors = new Set(sessions.map((s: any) => s.tutorId)).size;
    
    statsConfig = [
      { label: 'Total Sessions', value: totalSessions.toString(), icon: <Calendar className="w-6 h-6 text-primary-500" /> },
      { label: 'Hours Learned', value: `${hoursLearned.toFixed(1)}h`, icon: <Clock className="w-6 h-6 text-secondary-500" /> },
      { label: 'Active Tutors', value: activeTutors.toString(), icon: <GraduationCap className="w-6 h-6 text-accent-500" /> },
      { label: 'Avg Rating Given', value: 'N/A', icon: <Star className="w-6 h-6 text-yellow-500" /> },
    ];
  } else if (role === 'tutor') {
    const totalSessions = sessions.length;
    const hoursTaught = sessions.reduce((acc: number, s: any) => acc + (s.duration || 60), 0) / 60;
    const earnings = sessions.reduce((acc: number, s: any) => acc + (s.price || 0), 0);
    const rating = (userProfile as any)?.rating?.toFixed(1) || 'N/A';

    statsConfig = [
      { label: 'Total Sessions', value: totalSessions.toString(), icon: <Calendar className="w-6 h-6 text-primary-500" /> },
      { label: 'Hours Taught', value: `${hoursTaught.toFixed(1)}h`, icon: <Clock className="w-6 h-6 text-secondary-500" /> },
      { label: 'Earnings', value: `₹${earnings.toLocaleString()}`, icon: <IndianRupee className="w-6 h-6 text-green-500" /> },
      { label: 'Rating', value: rating, icon: <Star className="w-6 h-6 text-yellow-500" /> },
    ];
  } else {
    // Admin
    statsConfig = [
      { label: 'Total Users', value: adminStats.totalUsers?.toString() || '0', icon: <Users className="w-6 h-6 text-primary-500" /> },
      { label: 'Total Tutors', value: adminStats.totalTutors?.toString() || '0', icon: <GraduationCap className="w-6 h-6 text-secondary-500" /> },
      { label: 'Total Sessions', value: adminStats.totalSessions?.toString() || '0', icon: <Calendar className="w-6 h-6 text-accent-500" /> },
      { label: 'Total Reports', value: adminStats.totalReports?.toString() || '0', icon: <AlertCircle className="w-6 h-6 text-red-500" /> },
    ];
  }

  const now = new Date();

  // Get recent 5 sessions
  const recentSessions = sessions
    .sort((a: any, b: any) => (parseDate(b.startTime)?.getTime() || 0) - (parseDate(a.startTime)?.getTime() || 0))
    .slice(0, 5);

  return (
    <div className="animate-fade-up space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          Welcome back, <span className="gradient-text">{userProfile?.displayName || 'User'}</span> 👋
        </h1>
        <p className="text-surface-500 mt-1">
          {role === 'tutor' ? 'Manage your tutoring sessions and earnings' : role === 'admin' ? 'Platform overview and management' : 'Track your learning progress'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-6 hover-lift transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-xl">
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
            <p className="text-sm font-medium text-surface-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">{role === 'admin' ? 'Recent Reports' : 'Recent Activity'}</h2>
        
        {role === 'admin' ? (
           recentReportsLoading ? (
             <div className="flex justify-center py-8"><Spinner className="w-6 h-6 text-primary" /></div>
           ) : (recentReportsRes as any)?.data?.length > 0 ? (
             <div className="space-y-4">
               {((recentReportsRes as any)?.data).map((report: any) => (
                 <div key={report.id} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-white dark:bg-surface-800 shadow-sm rounded-lg border border-surface-200 dark:border-surface-700">
                       <Flag className="w-5 h-5 text-red-500" />
                     </div>
                     <div>
                       <h3 className="font-semibold text-surface-900 dark:text-white">User: {report.reportedUserId || 'Unknown'}</h3>
                       <p className="text-sm text-surface-500">{report.reason}</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                       report.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                       report.status === 'investigating' ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400' :
                       'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
                     }`}>
                       {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1)}
                     </span>
                     <Link href="/dashboard/reports" className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                       View Reports
                     </Link>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-surface-400">
               <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p className="font-medium text-surface-900 dark:text-white">Platform running smoothly</p>
               <p className="text-sm mt-1">No urgent activity to report</p>
             </div>
           )
        ) : recentSessions.length > 0 ? (
          <div className="space-y-4">
            {recentSessions.map((session: any) => {
              const startTime = parseDate(session.startTime);
              const canJoin = 
                (role === 'tutor' && ['pending', 'confirmed', 'in_progress'].includes(session.status)) ||
                (session.status === 'in_progress') ||
                (startTime && ['pending', 'confirmed'].includes(session.status) &&
                  now >= new Date(startTime.getTime() - 10 * 60 * 1000));
              
              return (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-surface-800 shadow-sm rounded-lg border border-surface-200 dark:border-surface-700">
                    <Calendar className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{session.subject} Session</h3>
                    <p className="text-sm text-surface-500">{startTime ? format(startTime, 'MMM d, yyyy • h:mm a') : '-'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                    session.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                    'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                  {canJoin && (
                    <Link href={`/dashboard/call/${session.id}`} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                      <Video size={14} /> Join Call
                    </Link>
                  )}
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-12 text-surface-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-surface-900 dark:text-white">No recent sessions</p>
            <p className="text-sm mt-1">Your sessions and activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
