import { Router } from 'express';
import { authRouter } from './auth/auth.router';
import { usersRouter } from './users/users.router';
import { tutorsRouter } from './tutors/tutors.router';
import { studentsRouter } from './students/students.router';
import { sessionsRouter } from './sessions/sessions.router';
import { paymentsRouter } from './payments/payments.router';
import { reviewsRouter } from './reviews/reviews.router';
import { notificationsRouter } from './notifications/notifications.router';
import { chatRouter } from './chat/chat.router';
import { adminRouter } from './admin/admin.router';
import { aiRouter } from './ai/ai.router';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/tutors', tutorsRouter);
v1Router.use('/students', studentsRouter);
v1Router.use('/sessions', sessionsRouter);
v1Router.use('/payments', paymentsRouter);
v1Router.use('/reviews', reviewsRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/chat', chatRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/ai', aiRouter);
