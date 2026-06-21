'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Popover, PopoverTrigger, PopoverContent, Spinner } from '@/components/ui';
import { Bell, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await api.notifications.list();
      return result.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const notifications = (res as any)?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-error border-2 border-white dark:border-surface-950" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 border-surface-200 dark:border-surface-800">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
          <h3 className="font-semibold text-surface-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllReadMutation.mutate()} 
              disabled={markAllReadMutation.isPending}
              className="text-xs text-primary hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-surface-500 text-sm">
              You have no notifications.
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
              {notifications.map((notification: any) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                  onClick={() => {
                    if (!notification.isRead) markReadMutation.mutate(notification.id);
                  }}
                >
                  <p className={`text-sm ${!notification.isRead ? 'font-medium text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
