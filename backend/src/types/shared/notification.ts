export type NotificationType =
  | 'session_booked'
  | 'session_confirmed'
  | 'session_cancelled'
  | 'session_started'
  | 'session_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'review_received'
  | 'message_received'
  | 'tutor_verified'
  | 'tutor_rejected'
  | 'wallet_credited'
  | 'wallet_debited'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  fcmMessageId: string | null;
  createdAt: Date;
}
