export interface ApiError {
  code: string;
  message: string;
  details: Record<string, string[]> | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: PaginationMeta | null;
}
