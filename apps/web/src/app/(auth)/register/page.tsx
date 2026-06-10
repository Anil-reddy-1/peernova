'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { api } from '@/lib/api-client';
import { setSessionCookie } from '@/lib/set-session-cookie';

const registerSchema = z
  .object({
    role: z.enum(['student', 'tutor']),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phoneNumber: z.string()
      .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +1234567890)')
      .optional()
      .or(z.literal('')),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student', acceptTerms: false as unknown as true },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await api.auth.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        role: data.role,
        phoneNumber: (data.phoneNumber ?? '').trim() || undefined,
      });

      // Sign the user in on the client side so auth.currentUser is set
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Send email verification
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }

      // Set __session cookie BEFORE navigating so the Next.js middleware allows /dashboard
      await setSessionCookie();
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setAuthError(axiosErr.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">PeerNova</h1>
      </div>

      <div className="glass-card rounded-2xl p-8 shadow-glass">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Create your account</h2>
          <p className="text-surface-500 mt-2">
            {step === 1 ? 'Choose how you want to use PeerNova' : 'Fill in your details'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary-600' : 'bg-surface-200'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary-600' : 'bg-surface-200'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <button
              type="button"
              onClick={() => { setValue('role', 'student'); setStep(2); }}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                selectedRole === 'student'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl">
                  📚
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">I want to learn</h3>
                  <p className="text-sm text-surface-500 mt-1">Find expert tutors and book sessions</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setValue('role', 'tutor'); setStep(2); }}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                selectedRole === 'tutor'
                  ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-950/30'
                  : 'border-surface-200 dark:border-surface-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/50 flex items-center justify-center text-2xl">
                  🎓
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">I want to teach</h3>
                  <p className="text-sm text-surface-500 mt-1">Share your expertise and earn money</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in" noValidate>
            {authError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm" role="alert">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Full name
              </label>
              <input
                id="displayName"
                type="text"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.displayName ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                }`}
                placeholder="John Doe"
                {...register('displayName')}
              />
              {errors.displayName && <p className="mt-1 text-sm text-error">{errors.displayName.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email address
              </label>
              <input id="reg-email" type="email" autoComplete="email"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.email ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                }`}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                <input id="reg-password" type="password" autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                    errors.password ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                  }`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirm</label>
                <input id="confirmPassword" type="password" autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                    errors.confirmPassword ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                  }`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone <span className="text-surface-400">(optional)</span></label>
              <input id="phoneNumber" type="tel"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.phoneNumber ? 'border-error' : 'border-surface-300 dark:border-surface-600'
                }`}
                placeholder="+919876543210"
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && <p className="mt-1 text-sm text-error">{errors.phoneNumber.message}</p>}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" {...register('acceptTerms')} />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </span>
            </label>
            {errors.acceptTerms && <p className="text-sm text-error">{errors.acceptTerms.message}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-all">
                Back
              </button>
              <button type="submit" disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
