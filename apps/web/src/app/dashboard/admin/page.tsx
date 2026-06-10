'use client';

import { useAdminStats, useAdminReports } from '@/hooks/useAdmin';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role !== 'admin') {
      router.push('/dashboard');
    }
  }, [role, router]);

  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const { data: reports, isLoading: isReportsLoading } = useAdminReports();

  if (role !== 'admin') return null;

  return (
    <div className="space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-surface-500 mb-2">Total Users</p>
          <p className="text-4xl font-bold">{isStatsLoading ? '-' : stats?.totalUsers || 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-surface-500 mb-2">Total Tutors</p>
          <p className="text-4xl font-bold text-primary">{isStatsLoading ? '-' : stats?.totalTutors || 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-surface-500 mb-2">Total Sessions</p>
          <p className="text-4xl font-bold text-secondary">{isStatsLoading ? '-' : stats?.totalSessions || 0}</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
        {isReportsLoading ? (
          <p>Loading reports...</p>
        ) : reports?.length === 0 ? (
          <p className="text-surface-500">No reports to show.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="py-3 px-4 font-semibold text-surface-500">Reported Entity</th>
                  <th className="py-3 px-4 font-semibold text-surface-500">Reason</th>
                  <th className="py-3 px-4 font-semibold text-surface-500">Status</th>
                  <th className="py-3 px-4 font-semibold text-surface-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {reports?.map((report: any) => (
                  <tr key={report.id} className="border-b border-surface-200 dark:border-surface-800 last:border-0">
                    <td className="py-3 px-4 font-medium">{report.reportedId}</td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{report.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-md uppercase font-bold tracking-wider ${
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        report.status === 'dismissed' ? 'bg-surface-200 text-surface-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
