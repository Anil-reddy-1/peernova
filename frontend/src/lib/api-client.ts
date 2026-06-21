import axios from 'axios';
import type { ApiResponse } from '@/types/shared';
import { auth } from './firebase-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Firebase ID token
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // silently fail — request proceeds without auth
  }
  return config;
});

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  },
);

// ─── Typed API methods ─────────────────────────────────────

export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string; role: 'student' | 'tutor'; phoneNumber?: string }) =>
      apiClient.post<ApiResponse<unknown>>('/auth/register', data),
    completeProfile: (data: { role: 'student' | 'tutor'; phoneNumber?: string }) =>
      apiClient.post<ApiResponse<unknown>>('/auth/complete-profile', data),
    verifyToken: () => apiClient.post<ApiResponse<unknown>>('/auth/verify-token'),
    getMe: () => apiClient.get<ApiResponse<unknown>>('/auth/me'),
    deleteAccount: () => apiClient.post<ApiResponse<null>>('/auth/delete-account'),
  },
  tutors: {
    list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/tutors', { params }),
    getById: (id: string) => apiClient.get<ApiResponse<unknown>>(`/tutors/${id}`),
    update: (id: string, data: unknown) => apiClient.patch<ApiResponse<unknown>>(`/tutors/${id}`, data),
    getAvailability: (id: string) => apiClient.get<ApiResponse<unknown>>(`/tutors/availability/${id}`),
    createAvailability: (data: { startTime: string; endTime: string; timezone: string }) => apiClient.post<ApiResponse<unknown>>('/tutors/availability', data),
    deleteAvailability: (slotId: string) => apiClient.delete<ApiResponse<unknown>>(`/tutors/availability/${slotId}`),
  },
  sessions: {
    create: (data: unknown) => apiClient.post<ApiResponse<unknown>>('/sessions', data),
    list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/sessions', { params }),
    getById: (id: string) => apiClient.get<ApiResponse<unknown>>(`/sessions/${id}`),
    updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<unknown>>(`/sessions/${id}/status`, { status }),
    cancel: (id: string, reason?: string) => apiClient.post<ApiResponse<unknown>>(`/sessions/${id}/cancel`, { reason }),
    confirmPayment: (id: string, paymentId: string) => apiClient.post<ApiResponse<unknown>>(`/sessions/${id}/confirm-payment`, { paymentId }),
  },
  payments: {
    createOrder: (sessionId: string) => apiClient.post<ApiResponse<unknown>>('/payments/create-order', { sessionId }),
    verify: (data: unknown) => apiClient.post<ApiResponse<unknown>>('/payments/verify', data),
    getWallet: () => apiClient.get<ApiResponse<unknown>>('/payments/wallet'),
    getTransactions: (params?: Record<string, unknown>) =>
      apiClient.get<ApiResponse<unknown>>('/payments/wallet/transactions', { params }),
  },
  reviews: {
    create: (data: unknown) => apiClient.post<ApiResponse<unknown>>('/reviews', data),
    getByTutor: (tutorId: string, params?: Record<string, unknown>) =>
      apiClient.get<ApiResponse<unknown>>(`/reviews/tutor/${tutorId}`, { params }),
  },
  notifications: {
    list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/notifications', { params }),
    markRead: (id: string) => apiClient.patch<ApiResponse<null>>(`/notifications/${id}/read`),
    markAllRead: () => apiClient.post<ApiResponse<null>>('/notifications/mark-all-read'),
  },
  chat: {
    createRoom: (data: unknown) => apiClient.post<ApiResponse<unknown>>('/chat/rooms', data),
    getConversations: () => apiClient.get<ApiResponse<unknown>>('/chat/conversations'),
    getMessages: (chatId: string, params?: Record<string, unknown>) =>
      apiClient.get<ApiResponse<unknown>>(`/chat/${chatId}/messages`, { params }),
    sendMessage: (chatId: string, data: unknown) =>
      apiClient.post<ApiResponse<unknown>>(`/chat/${chatId}/messages`, data),
    getUploadSignature: () => apiClient.get<ApiResponse<{ timestamp: number; signature: string; apiKey: string; cloudName: string }>>('/chat/upload-signature'),
    getTurnCredentials: () => apiClient.get<ApiResponse<{ iceServers: RTCIceServer[] }>>('/chat/turn-credentials'),
  },
  users: {
    search: (q: string) => apiClient.get<ApiResponse<unknown>>('/users/search', { params: { q } }),
    list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/users', { params }),
    update: (id: string, data: unknown) => apiClient.patch<ApiResponse<unknown>>(`/users/${id}`, data),
    report: (id: string, reason: string) => apiClient.post<ApiResponse<unknown>>(`/users/${id}/report`, { reason }),
  },
  admin: {
    getDashboard: () => apiClient.get<ApiResponse<unknown>>('/admin/dashboard'),
    getReports: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/admin/reports', { params }),
    updateReport: (id: string, data: unknown) => apiClient.patch<ApiResponse<unknown>>(`/admin/reports/${id}`, data),
    getPayments: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/admin/payments', { params }),
    getPaymentStats: () => apiClient.get<ApiResponse<unknown>>('/admin/payments/stats'),
  },
};
