'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema as any),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSuccess(true);
    } catch {
      setError('Unable to send reset email. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="glass-card rounded-2xl p-8 shadow-glass">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-3xl">
            🔐
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Reset your password</h2>
          <p className="text-surface-500 mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {success ? (
          <div className="animate-scale-in text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center text-3xl">✅</div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Check your email</h3>
            <p className="text-surface-500 mb-6">We&apos;ve sent a password reset link to your email address.</p>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm" role="alert">{error}</div>
            )}
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email address</label>
              <input id="reset-email" type="email" autoComplete="email"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.email ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                }`}
                placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
            <p className="text-center text-sm text-surface-500">
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">← Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
