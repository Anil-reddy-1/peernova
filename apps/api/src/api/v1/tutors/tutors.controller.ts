import type { Request, Response, NextFunction } from 'express';
import { tutorsService } from './tutors.service';
import { 
  UpdateTutorProfileRequestSchema, 
  CreateAvailabilitySlotRequestSchema
} from '@peer-tutoring/types';

export class TutorsController {
  async getTutors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);
      const subject = ((req.query.subject as string)) || undefined;
      const minRating = req.query.minRating ? parseFloat((req.query.minRating as string)) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat((req.query.maxPrice as string)) : undefined;
      const minPrice = req.query.minPrice ? parseFloat((req.query.minPrice as string)) : undefined;

      const result = await tutorsService.getTutors({
        subject,
        minRating,
        maxPrice,
        minPrice,
        page,
        limit,
      });

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

  async getTutorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as Record<string, string>;
      const tutor = await tutorsService.getTutorById(id);

      res.status(200).json({
        success: true,
        data: tutor,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Ensure caller is the tutor or an admin
      if (req.user?.uid !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions', details: null }
        });
        return;
      }

      const parsedData = UpdateTutorProfileRequestSchema.parse(req.body);
      const updatedTutor = await tutorsService.updateProfile(id as string, parsedData);

      res.status(200).json({
        success: true,
        data: updatedTutor,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyTutor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Verification logic placeholder
      // update isVerified status
      const updatedTutor = await tutorsService.updateProfile(id as string, { 
        isVerified: status === 'approved' 
      });

      res.status(200).json({
        success: true,
        data: updatedTutor,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const slots = await tutorsService.getAvailability(id as string);

      res.status(200).json({
        success: true,
        data: slots,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tutorId = req.user!.uid;
      const parsedData = CreateAvailabilitySlotRequestSchema.parse(req.body);
      
      const slot = await tutorsService.createAvailability(tutorId, {
        startTime: new Date(parsedData.startTime),
        endTime: new Date(parsedData.endTime),
        timezone: parsedData.timezone
      });

      res.status(201).json({
        success: true,
        data: slot,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tutorId = req.user!.uid;
      const { id } = req.params;
      
      await tutorsService.deleteAvailability(tutorId, id as string);

      res.status(200).json({
        success: true,
        data: null,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadVerificationDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tutorId = req.user!.uid;
      const file = req.file;
      const { type } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'No file uploaded', details: null }
        });
        return;
      }

      if (!type) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Document type is required', details: null }
        });
        return;
      }

      const document = await tutorsService.uploadVerificationDocument(tutorId, file.buffer, file.mimetype, type);

      res.status(200).json({
        success: true,
        data: document,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tutorsController = new TutorsController();
