export type PaymentStatus = 'created' | 'captured' | 'failed' | 'refunded';

export type WalletTransactionType = 'credit' | 'debit' | 'hold' | 'release';

export interface Payment {
  id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type?: string;
  idempotencyKey: string;
  webhookProcessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  referenceId: string;
  description: string;
  createdAt: Date;
}
