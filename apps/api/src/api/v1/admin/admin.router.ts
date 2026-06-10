import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { adminController } from './admin.controller';

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireRole(['admin']));

adminRouter.get('/dashboard', adminController.getDashboard);

adminRouter.get('/reports', adminController.getReports);

adminRouter.patch('/reports/:id', adminController.updateReport);

adminRouter.get('/payments', adminController.getPayments);

adminRouter.get('/payments/stats', adminController.getPaymentStats);

adminRouter.get('/audit-logs', (_req, res) => {
  res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Will be implemented in Prompt 2', details: null }, meta: null });
});
