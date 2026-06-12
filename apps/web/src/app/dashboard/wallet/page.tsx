'use client';

import { useState } from 'react';
import { useWallet, useTopup } from '@/hooks/usePayments';

export default function WalletPage() {
  const { balance, currency, transactions, isLoading } = useWallet();
  const { mutate: topup, isPending } = useTopup();
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showMsg = (type: 'error' | 'success', msg: string) => {
    if (type === 'error') { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  const handleTopup = () => {
    if (!amount || Number(amount) <= 0) {
      showMsg('error', 'Please enter a valid amount greater than ₹0.');
      return;
    }
    topup(Number(amount), {
      onSuccess: () => {
        showMsg('success', 'Wallet topped up successfully!');
        setAmount('');
      },
      onError: () => {
        showMsg('error', 'Failed to initiate top-up. Please try again.');
      }
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold">My Wallet</h1>

      {/* Inline messages */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
          <span>⚠</span> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
          <span>✓</span> {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <p className="text-surface-500 mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-primary mb-6">
            {currency === 'INR' ? '₹' : currency} {balance.toFixed(2)}
          </p>
          
          <div className="w-full max-w-xs space-y-4">
            <input
              type="number"
              className={`input text-center text-lg ${error ? 'border-red-500' : ''}`}
              placeholder="Enter amount"
              min={1}
              value={amount}
              onChange={(e) => { setAmount(Number(e.target.value)); setError(null); }}
            />
            <button
              className="btn-primary w-full"
              onClick={handleTopup}
              disabled={isPending || !amount}
            >
              {isPending ? 'Processing...' : 'Top Up Wallet'}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
                  <div>
                    <p className="font-medium">{tx.description || 'Transaction'}</p>
                    <p className="text-xs text-surface-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
