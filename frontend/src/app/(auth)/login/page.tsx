'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { api } from '@/lib/api-client';
import { setSessionCookie } from '@/lib/set-session-cookie';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

import { Suspense } from 'react';

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'tutor'>('student');
  const [phoneNumber, setPhoneNumber] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      await setSessionCookie();
      router.push(redirect);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      switch (firebaseErr.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setAuthError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many attempts. Please try again later.');
          break;
        default:
          setAuthError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      
      if (additionalInfo?.isNewUser) {
        setNeedsRoleSelection(true);
      } else {
        await setSessionCookie();
        router.push(redirect);
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code !== 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      await api.auth.completeProfile({
        role: selectedRole,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await setSessionCookie();
      router.push(redirect);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setAuthError(axiosErr.response?.data?.error?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Mobile branding */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">PeerNova</h1>
        <p className="text-surface-500 mt-1">Peer Tutoring Marketplace</p>
      </div>

      <div className="glass-card rounded-2xl p-8 shadow-glass">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            {needsRoleSelection ? 'Complete your profile' : 'Welcome back'}
          </h2>
          <p className="text-surface-500 mt-2">
            {needsRoleSelection ? 'Choose how you want to use PeerNova' : 'Sign in to continue your learning journey'}
          </p>
        </div>

        {/* Auth Error */}
        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-scale-in" role="alert">
            {authError}
          </div>
        )}

        {needsRoleSelection ? (
          <form onSubmit={handleCompleteProfile} className="space-y-5 animate-fade-in">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                  selectedRole === 'student'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl">📚</div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">I want to learn</h3>
                    <p className="text-sm text-surface-500 mt-1">Find expert tutors and book sessions</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('tutor')}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                  selectedRole === 'tutor'
                    ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-950/30'
                    : 'border-surface-200 dark:border-surface-700 hover:border-secondary-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/50 flex items-center justify-center text-2xl">🎓</div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">I want to teach</h3>
                    <p className="text-sm text-surface-500 mt-1">Share your expertise and earn money</p>
                  </div>
                </div>
              </button>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone <span className="text-surface-400">(optional)</span></label>
              <input id="phoneNumber" type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-surface-300 dark:border-surface-600 px-4 py-3 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="+91 98765 43210"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completing profile...' : 'Complete Profile'}
            </button>
          </form>
        ) : (
          <>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200 font-medium disabled:opacity-50"
          aria-label="Sign in with Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
          <span className="text-sm text-surface-400">or</span>
          <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
        </div>



        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`w-full rounded-xl border px-4 py-3 text-surface-900 dark:text-white bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 ${
                errors.email ? 'border-error focus:ring-error/20' : 'border-surface-300 dark:border-surface-600'
              }`}
              placeholder="you@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`w-full rounded-xl border px-4 py-3 text-surface-900 dark:text-white bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 ${
                errors.password ? 'border-error focus:ring-error/20' : 'border-surface-300 dark:border-surface-600'
              }`}
              placeholder="••••••••"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="mt-1.5 text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                {...register('rememberMe')}
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Create account
          </Link>
        </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
