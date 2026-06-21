'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Spinner, EmptyState } from '@/components/ui';
import { Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function EarningsPage() {
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.payments.getWallet();
      return res.data;
    },
  });

  const { data: txnsData, isLoading: isTxnsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.payments.getTransactions();
      return res.data;
    },
  });

  const wallet = (walletData as any)?.data || { balance: 0, pendingBalance: 0, totalEarned: 0 };
  const transactions = (txnsData as any)?.data || [];

  if (isWalletLoading || isTxnsLoading) {
    return <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Earnings</h1>
          <p className="text-surface-500 mt-1">Track your revenue and manage payouts.</p>
        </div>
        <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm">
          Withdraw Funds
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Available Balance</p>
          <h2 className="text-4xl font-bold text-surface-900 dark:text-white">₹{wallet.balance}</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-surface-500 mb-1">Pending Clearance</p>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white">₹{wallet.pendingBalance || 0}</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-surface-500 mb-1">Total Earned</p>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white">₹{wallet.totalEarned || wallet.balance}</h2>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Your completed tutoring sessions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-800 text-sm font-medium text-surface-500">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {transactions.map((txn: any) => (
                  <tr key={txn.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-surface-900 dark:text-white">{txn.id.slice(0, 8)}...</td>
                    <td className="p-4 text-sm text-surface-500">{format(new Date(txn.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-4 text-sm text-surface-900 dark:text-white">{txn.description || txn.type}</td>
                    <td className={`p-4 text-sm font-bold text-right ${txn.amount > 0 ? 'text-success-600' : 'text-surface-900 dark:text-white'}`}>
                      {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'completed' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' 
                          : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                      }`}>
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
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
