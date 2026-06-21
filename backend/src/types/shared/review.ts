export interface Review {
  id: string;
  sessionId: string;
  tutorId: string;
  studentId: string;
  /** Rating from 1 to 5 */
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
