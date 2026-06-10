'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationDropdown } from '@/components/notification-dropdown';

const studentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: '📅' },
  { label: 'Find Tutors', href: '/dashboard/tutors', icon: '🔍' },
  { label: 'Messages', href: '/dashboard/messages', icon: '💬' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

const tutorNav = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: '📅' },
  { label: 'Availability', href: '/dashboard/availability', icon: '🕐' },
  { label: 'Earnings', href: '/dashboard/earnings', icon: '💰' },
  { label: 'Messages', href: '/dashboard/messages', icon: '💬' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

const adminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Users', href: '/dashboard/users', icon: '👥' },
  { label: 'Tutors', href: '/dashboard/tutors', icon: '🎓' },
  { label: 'Sessions', href: '/dashboard/sessions', icon: '📅' },
  { label: 'Payments', href: '/dashboard/payments', icon: '💳' },
  { label: 'Reports', href: '/dashboard/reports', icon: '🚨' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = role === 'admin' ? adminNav : role === 'tutor' ? tutorNav : studentNav;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Top Bar */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 glass-card border-b flex items-center px-6">
        <Link href="/dashboard" className="text-xl font-bold gradient-text">PeerNova</Link>
        <div className="ml-auto flex items-center gap-4">
          <NotificationDropdown />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300">
              {userProfile?.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-surface-900 dark:text-white">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs text-surface-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={signOut} className="text-sm text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors" aria-label="Sign out">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4">
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                  }`}>
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
