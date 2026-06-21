'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Search, 
  Bot, 
  MessageSquare, 
  Settings, 
  Clock, 
  Banknote, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Flag,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const studentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: CalendarDays },
  { label: 'Find Tutors', href: '/dashboard/tutors', icon: Search },
  { label: 'Study Assistant', href: '/dashboard/study-assistant', icon: Bot },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const tutorNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: CalendarDays },
  { label: 'Availability', href: '/dashboard/availability', icon: Clock },
  { label: 'Earnings', href: '/dashboard/earnings', icon: Banknote },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const adminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Tutors', href: '/dashboard/tutors', icon: GraduationCap },
  { label: 'Sessions', href: '/dashboard/sessions', icon: CalendarDays },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Reports', href: '/dashboard/reports', icon: Flag },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 flex items-center px-4 sm:px-6">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden mr-4 p-2 -ml-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <Link href="/dashboard" className="text-xl font-bold gradient-text tracking-tight">PeerNova</Link>
        
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <NotificationDropdown />
          <div className="h-6 w-px bg-surface-200 dark:bg-surface-800 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 shadow-sm border border-primary-200/50 dark:border-primary-800/50">
              {userProfile?.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs text-surface-500 font-medium capitalize">{role}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-r border-surface-200 dark:border-surface-800 transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4 px-3">
              Menu
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-surface-200'
                    }`}>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
                    )}
                    <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300 transition-colors'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t border-surface-200 dark:border-surface-800">
            <button 
              onClick={signOut} 
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
            >
              <LogOut size={18} className="text-surface-400 group-hover:text-red-500 transition-colors" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
