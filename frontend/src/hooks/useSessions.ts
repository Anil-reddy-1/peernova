import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Session, PaginationMeta } from '@/types/shared';

interface SessionsResponse {
  data: Session[];
  meta: PaginationMeta;
}

export function useSessions() {
  return useInfiniteQuery<SessionsResponse, Error>({
    queryKey: ['sessions'],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<{ data: Session[], meta: PaginationMeta }>('/sessions', {
        params: { page: pageParam },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasMore) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useSessionActions() {
  const queryClient = useQueryClient();

  const cancelSession = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string, reason: string }) => {
      const { data } = await apiClient.post(`/sessions/${sessionId}/cancel`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string, status: string }) => {
      const { data } = await apiClient.patch(`/sessions/${sessionId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  return { cancelSession, updateStatus };
}
