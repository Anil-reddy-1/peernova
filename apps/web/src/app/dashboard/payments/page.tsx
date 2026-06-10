'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Spinner, EmptyState } from '@peer-tutoring/ui';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: async () => {
      const res = await api.admin.getPaymentStats();
      return res.data;
    },
  });

  const { data: paymentsRes, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const res = await api.admin.getPayments({ page, limit: 20 });
      return res.data;
    },
  });

  const stats = (statsRes as any)?.data || { totalVolume: 0, platformRevenue: 0, pendingPayouts: 0, failedTransactions: 0 };
  const payments = (paymentsRes as any)?.data || [];

  if (isStatsLoading || isPaymentsLoading) {
    return <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="animate-fade-up max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Payments & Revenue</h1>
        <p className="text-surface-500 mt-1">Monitor all transactions, revenue, and tutor payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Total Platform Volume</p>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white">₹{stats.totalVolume}</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-surface-500 mb-1">Platform Revenue (10%)</p>
          <h2 className="text-3xl font-bold text-success-600 dark:text-success-400">₹{stats.platformRevenue}</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-surface-500 mb-1">Pending Payouts</p>
          <h2 className="text-3xl font-bold text-warning-600 dark:text-warning-400">₹{stats.pendingPayouts}</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-surface-500 mb-1">Failed Transactions</p>
          <h2 className="text-3xl font-bold text-error">{stats.failedTransactions}</h2>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-950/50">
          <h2 className="font-semibold text-surface-900 dark:text-white">Recent Transactions</h2>
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700">Export CSV</button>
        </div>
        {payments.length === 0 ? (
          <EmptyState title="No transactions" description="No transactions found on the platform." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-800 text-xs uppercase tracking-wider text-surface-500">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {payments.map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-surface-900 dark:text-white">{pay.id}</td>
                    <td className="p-4 text-sm text-surface-600 dark:text-surface-300">{pay.studentId || 'N/A'}</td>
                    <td className="p-4 text-sm text-surface-500">{pay.type}</td>
                    <td className={`p-4 text-sm font-bold text-right ${pay.amount > 0 ? 'text-surface-900 dark:text-white' : 'text-primary-600 dark:text-primary-400'}`}>
                      {pay.amount > 0 ? '+' : ''}₹{Math.abs(pay.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        pay.status === 'captured' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' :
                        pay.status === 'processing' || pay.status === 'created' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                        'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                      }`}>
                        {(pay.status || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-surface-500">{pay.createdAt ? format(new Date(pay.createdAt), 'MMM d, yyyy h:mm a') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {payments.length > 0 && (
          <div className="p-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-800">Previous</button>
            <span className="text-sm text-surface-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={payments.length < 20} className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-800">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
