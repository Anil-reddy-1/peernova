'use client';

import { useState } from 'react';
import { useWallet, useTopup } from '@/hooks/usePayments';

import { auth } from '@/lib/firebase-client';

export default function WalletPage() {
  const { balance, currency, transactions, isLoading } = useWallet();
  const { mutate: topup, isPending } = useTopup();
  const [amount, setAmount] = useState<number | ''>('');

  const handleTopup = () => {
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    topup(Number(amount), {
      onSuccess: (data: any) => {
        alert('Top-up successful!');
        window.location.reload();
      },
      onError: () => {
        alert('Failed to initiate top-up');
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading wallet...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold">My Wallet</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <p className="text-surface-500 mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-primary mb-6">
            {currency === 'INR' ? '₹' : currency} {balance.toFixed(2)}
          </p>
          
          <div className="w-full max-w-xs space-y-4">
            <input 
              type="number" 
              className="input text-center text-lg" 
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
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
