import type { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

export class AdminController {
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({ success: true, data: stats, meta: null, error: null });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const result = await adminService.getReports(page, limit);
      res.status(200).json({ success: true, data: result.data, meta: result.meta, error: null });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as Record<string, string>;
      const { status, resolutionNotes } = req.body;
      await adminService.updateReportStatus(id as string, status, resolutionNotes);
      res.status(200).json({ success: true, data: { status }, meta: null, error: null });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const result = await adminService.getPayments(page, limit);
      res.status(200).json({ success: true, data: result.data, meta: result.meta, error: null });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getPaymentStats();
      res.status(200).json({ success: true, data: stats, meta: null, error: null });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
