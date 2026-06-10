'use client';

import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { userProfile, role } = useAuth();

  return (
    <div className="animate-fade-up space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          Welcome back, <span className="gradient-text">{userProfile?.displayName || 'User'}</span> 👋
        </h1>
        <p className="text-surface-500 mt-1">
          {role === 'tutor' ? 'Manage your tutoring sessions and earnings' : role === 'admin' ? 'Platform overview and management' : 'Track your learning progress'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(role === 'student'
          ? [
              { label: 'Total Sessions', value: '0', icon: '📅', color: 'primary' },
              { label: 'Hours Learned', value: '0h', icon: '⏱️', color: 'secondary' },
              { label: 'Active Tutors', value: '0', icon: '🎓', color: 'accent' },
              { label: 'Avg Rating Given', value: 'N/A', icon: '⭐', color: 'primary' },
            ]
          : role === 'tutor'
            ? [
                { label: 'Total Sessions', value: '0', icon: '📅', color: 'primary' },
                { label: 'Hours Taught', value: '0h', icon: '⏱️', color: 'secondary' },
                { label: 'Earnings', value: '₹0', icon: '💰', color: 'accent' },
                { label: 'Rating', value: 'N/A', icon: '⭐', color: 'primary' },
              ]
            : [
                { label: 'Total Users', value: '0', icon: '👥', color: 'primary' },
                { label: 'Active Sessions', value: '0', icon: '📅', color: 'secondary' },
                { label: 'Revenue', value: '₹0', icon: '💰', color: 'accent' },
                { label: 'Reports', value: '0', icon: '🚨', color: 'primary' },
              ]
        ).map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-surface-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No recent activity</p>
          <p className="text-sm mt-1">Your sessions and activities will appear here</p>
        </div>
      </div>
    </div>
  );
}
