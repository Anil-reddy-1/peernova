import type { Request, Response, NextFunction } from 'express';
import { sessionsService } from './sessions.service';
import { CreateSessionRequestSchema } from '../../../types/shared';

export class SessionsController {

  async bookSession(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {
      const studentId = req.user!.uid;
      const parsedData = CreateSessionRequestSchema.parse(req.body);

      const result = await sessionsService.bookSession({
        studentId,
        tutorId: parsedData.tutorId,
        slotId: parsedData.slotId,
        subject: parsedData.subject,
        recordingConsent: parsedData.recordingConsent ?? false,
      });

      res.status(201).json({
        success: true,
        data: result,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentId } = req.body;
      const userId = req.user!.uid;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Missing payment details', details: null }
        });
        return;
      }

      await sessionsService.confirmPayment(id as string, paymentId, userId);

      res.status(200).json({
        success: true,
        data: { status: 'confirmed' },
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const role = req.user!.role || 'student';
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);

      const result = await sessionsService.listUserSessions(userId, role, page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const role = req.user!.role || 'student';
      const { id } = req.params as Record<string, string>;
      const session = await sessionsService.getSession(id, userId, role);

      res.status(200).json({
        success: true,
        data: session,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const role = req.user!.role || 'student';
      const { id } = req.params as Record<string, string>;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Cancellation reason is required', details: null }
        });
        return;
      }

      await sessionsService.cancelSession(id as string, userId, role, reason);

      res.status(200).json({
        success: true,
        data: { status: 'cancelled' },
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const role = req.user!.role || 'student';
      
      if (role !== 'tutor') {
        res.status(403).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'FORBIDDEN', message: 'Only tutors can update session status directly', details: null }
        });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['in_progress', 'completed'].includes(status)) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid status', details: null }
        });
        return;
      }

      await sessionsService.updateSessionStatus(id as string, userId, status);

      res.status(200).json({
        success: true,
        data: { status },
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sessionsController = new SessionsController();
