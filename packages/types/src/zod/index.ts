import { z } from 'zod';

// ─── Enum Schemas ───────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(['student', 'tutor', 'admin']);
export const UserStatusSchema = z.enum([
  'active',
  'suspended',
  'pending_verification',
  'deleted',
]);
export const SubjectLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);
export const VerificationStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
]);
export const SessionStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
]);
export const PaymentStatusSchema = z.enum([
  'created',
  'captured',
  'failed',
  'refunded',
]);
export const WalletTransactionTypeSchema = z.enum([
  'credit',
  'debit',
  'hold',
  'release',
]);
export const MessageTypeSchema = z.enum(['text', 'file']);
export const NotificationTypeSchema = z.enum([
  'session_booked',
  'session_confirmed',
  'session_cancelled',
  'session_started',
  'session_completed',
  'payment_received',
  'payment_failed',
  'review_received',
  'message_received',
  'tutor_verified',
  'tutor_rejected',
  'wallet_credited',
  'wallet_debited',
  'system_announcement',
]);

// ─── User Schemas ───────────────────────────────────────────────────────────

export const BaseUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerified: z.boolean(),
  phoneNumber: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

// ─── Tutor Schemas ──────────────────────────────────────────────────────────

export const SubjectSchema = z.object({
  name: z.string(),
  level: SubjectLevelSchema,
  tags: z.array(z.string()),
});

export const VerificationDocumentSchema = z.object({
  type: z.string(),
  fileURL: z.string().url(),
  uploadedAt: z.coerce.date(),
  status: VerificationStatusSchema,
});

export const TutorProfileSchema = z.object({
  userId: z.string(),
  bio: z.string(),
  subjects: z.array(SubjectSchema),
  hourlyRate: z.number().positive(),
  currency: z.literal('INR'),
  languages: z.array(z.string()),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  totalSessions: z.number().int().min(0),
  isVerified: z.boolean(),
  verificationDocuments: z.array(VerificationDocumentSchema),
  availabilityTimezone: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

// ─── Student Schemas ────────────────────────────────────────────────────────

export const StudentProfileSchema = z.object({
  userId: z.string(),
  gradeLevel: z.string(),
  subjects: z.array(z.string()),
  learningGoals: z.array(z.string()),
  preferredLanguage: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Session Schemas ────────────────────────────────────────────────────────

export const SessionSchema = z.object({
  id: z.string(),
  tutorId: z.string(),
  studentId: z.string(),
  subject: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  durationMinutes: z.number().int().positive(),
  status: SessionStatusSchema,
  roomId: z.string().nullable(),
  paymentId: z.string().nullable(),
  amount: z.number().min(0),
  currency: z.string(),
  cancellationReason: z.string().nullable(),
  recordingConsent: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AvailabilitySlotSchema = z.object({
  id: z.string(),
  tutorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isBooked: z.boolean(),
  bookedSessionId: z.string().nullable(),
  timezone: z.string(),
});

// ─── Payment Schemas ────────────────────────────────────────────────────────

export const PaymentSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  tutorId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string().nullable(),
  razorpaySignature: z.string().nullable(),
  amount: z.number().min(0),
  currency: z.string(),
  status: PaymentStatusSchema,
  idempotencyKey: z.string(),
  webhookProcessedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const WalletTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: WalletTransactionTypeSchema,
  amount: z.number().min(0),
  referenceId: z.string(),
  description: z.string(),
  createdAt: z.coerce.date(),
});

// ─── Review Schemas ─────────────────────────────────────────────────────────

export const ReviewSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  tutorId: z.string(),
  studentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  isVisible: z.boolean(),
  createdAt: z.coerce.date(),
});

// ─── Message Schemas ────────────────────────────────────────────────────────

export const MessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  type: MessageTypeSchema,
  fileURL: z.string().nullable(),
  fileType: z.string().nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

// ─── Notification Schemas ───────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.string()).nullable(),
  isRead: z.boolean(),
  fcmMessageId: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// ─── API Schemas ────────────────────────────────────────────────────────────

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.array(z.string())).nullable(),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().min(0),
  hasMore: z.boolean(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: ApiErrorSchema.nullable(),
    meta: PaginationMetaSchema.nullable(),
  });

// ─── Request Body Schemas ───────────────────────────────────────────────────

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
  role: z.enum(['student', 'tutor']),
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +1234567890)')
    .optional()
    .or(z.literal('')),
});

export const CompleteProfileRequestSchema = z.object({
  role: z.enum(['student', 'tutor']),
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format')
    .optional()
    .or(z.literal('')),
});

export const CreateSessionRequestSchema = z.object({
  tutorId: z.string(),
  slotId: z.string(),
  subject: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  recordingConsent: z.boolean(),
});

export const CreateReviewRequestSchema = z.object({
  sessionId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export const UpdateTutorProfileRequestSchema = z.object({
  bio: z.string().max(2000).optional(),
  subjects: z.array(SubjectSchema).optional(),
  hourlyRate: z.number().positive().optional(),
  languages: z.array(z.string()).optional(),
  availabilityTimezone: z.string().optional(),
});

export const CreateAvailabilitySlotRequestSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string(),
});

export const SendMessageRequestSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'file']),
  fileURL: z.string().url().optional(),
  fileType: z.string().optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type CompleteProfileRequest = z.infer<typeof CompleteProfileRequestSchema>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;
export type UpdateTutorProfileRequest = z.infer<
  typeof UpdateTutorProfileRequestSchema
>;
export type CreateAvailabilitySlotRequest = z.infer<
  typeof CreateAvailabilitySlotRequestSchema
>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
