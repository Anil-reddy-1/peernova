import type { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';

export class PaymentsController {
  async getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const balance = await paymentsService.getWalletBalance(userId);

      res.status(200).json({
        success: true,
        data: balance,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWalletTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);

      const result = await paymentsService.getWalletTransactions(userId, page, limit);

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

  async createTopupOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const amount = parseFloat(req.body.amount);

      const order = await paymentsService.createTopupOrder(userId, amount);

      res.status(201).json({
        success: true,
        data: order,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
