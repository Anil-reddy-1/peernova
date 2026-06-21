'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Spinner, EmptyState } from '@/components/ui';
import { format } from 'date-fns';
import { parseDate } from '@/lib/date-utils';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const res = await api.users.list({ page, limit: 20 });
      return res.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.users.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    suspendMutation.mutate({ id, status: newStatus });
  };

  const users = (usersRes as any)?.data || [];

  return (
    <div className="animate-fade-up max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">User Management</h1>
          <p className="text-surface-500 mt-1">View and manage all registered users on the platform.</p>
        </div>
        <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors">
          Invite User
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex gap-4 bg-surface-50/50 dark:bg-surface-950/50">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2 text-surface-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select className="px-4 py-1.5 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 outline-none">
            <option>All Roles</option>
            <option>Students</option>
            <option>Tutors</option>
            <option>Admins</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="No users match the current criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-800 text-xs uppercase tracking-wider text-surface-500">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {users.map((user: any) => (
                  <tr key={user.id || user.email} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-surface-900 dark:text-white">{user.displayName || 'Unknown'}</div>
                          <div className="text-sm text-surface-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-sm font-medium px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' 
                          : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                      }`}>
                        {(user.status || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-surface-500">{user.createdAt && parseDate(user.createdAt) ? format(parseDate(user.createdAt) as Date, 'MMM d, yyyy') : '-'}</td>
                    <td className="p-4 text-right">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm mr-3">Edit</button>
                      <button 
                        className={`${user.status === 'suspended' ? 'text-success-600 hover:text-success-700' : 'text-error hover:text-error-600'} font-medium text-sm disabled:opacity-50`}
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={suspendMutation.isPending}
                      >
                        {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {users.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-800">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">Previous</button>
            <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} className="px-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-medium disabled:opacity-50 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
