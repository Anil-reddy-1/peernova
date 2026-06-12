import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TutorProfile, PaginationMeta } from '@peer-tutoring/types';

interface GetTutorsParams {
  subject?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
}

interface TutorsResponse {
  data: TutorProfile[];
  meta: PaginationMeta;
}

export function useTutors(params: GetTutorsParams = {}) {
  return useInfiniteQuery<TutorsResponse, Error>({
    queryKey: ['tutors', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<{ data: TutorProfile[], meta: PaginationMeta }>('/tutors', {
        params: { ...params, page: pageParam },
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
  });
}

export function useTutorProfile(id: string) {
  return useQuery({
    queryKey: ['tutors', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TutorProfile }>(`/tutors/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useTutorAvailability(id: string) {
  return useQuery({
    queryKey: ['tutors', id, 'availability'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: any[] }>(`/tutors/availability/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
