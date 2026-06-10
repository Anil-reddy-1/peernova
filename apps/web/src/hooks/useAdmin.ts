import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/admin/dashboard');
      return data.data;
    }
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/admin/reports');
      return data.data; // Array of reports
    }
  });
}
