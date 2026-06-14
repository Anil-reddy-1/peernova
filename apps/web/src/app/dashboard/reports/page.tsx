'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Spinner, EmptyState } from '@peer-tutoring/ui';
import { format } from 'date-fns';
import { parseDate } from '@/lib/date-utils';

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: reportsRes, isLoading } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: async () => {
      const res = await api.admin.getReports({ page, limit: 20 });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.admin.updateReport(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    }
  });

  const reports = (reportsRes as any)?.data || [];
  
  const filteredReports = filter === 'all' ? reports : reports.filter((r: any) => r.status === filter);

  const pendingCount = reports.filter((r: any) => r.status === 'pending').length;
  const investigatingCount = reports.filter((r: any) => r.status === 'investigating').length;
  const resolvedCount = reports.filter((r: any) => r.status === 'resolved').length;

  return (
    <div className="animate-fade-up max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Moderation & Reports</h1>
        <p className="text-surface-500 mt-1">Review flagged users and resolve disputes.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'}`}
        >
          All ({reports.length})
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filter === 'pending' ? 'bg-error-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'}`}
        >
          Pending ({pendingCount})
        </button>
        <button 
          onClick={() => setFilter('investigating')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filter === 'investigating' ? 'bg-warning-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'}`}
        >
          Investigating ({investigatingCount})
        </button>
        <button 
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filter === 'resolved' ? 'bg-success-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'}`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>
      ) : filteredReports.length === 0 ? (
        <EmptyState title="No reports found" description="No reports match the selected filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report: any) => (
            <div key={report.id} className="glass-card rounded-2xl p-6 border border-surface-200 dark:border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-surface-900 dark:text-white">{report.reportedUserId || 'Unknown User'}</span>
                  <span className="text-surface-400 text-sm">reported by</span>
                  <span className="font-medium text-surface-700 dark:text-surface-300">{report.reporterId || 'Unknown'}</span>
                </div>
                <p className="text-surface-600 dark:text-surface-400 text-sm">
                  Reason: <span className="font-medium">{report.reason}</span>
                </p>
                <div className="text-xs text-surface-400 mt-2">
                  Report ID: {report.id} • {report.createdAt && parseDate(report.createdAt) ? format(parseDate(report.createdAt) as Date, 'MMM d, yyyy') : '-'}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <select 
                  value={report.status || 'pending'}
                  onChange={(e) => updateMutation.mutate({ id: report.id, status: e.target.value })}
                  disabled={updateMutation.isPending}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider outline-none border-none appearance-none cursor-pointer ${
                    report.status === 'pending' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
                    report.status === 'investigating' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                    'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
                
                <button className="px-4 py-2 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-xl text-sm font-medium transition-colors">
                  Review Case
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {reports.length > 0 && (
        <div className="flex items-center justify-between p-4 mt-6 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-800">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">Previous</button>
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={reports.length < 20} className="px-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
