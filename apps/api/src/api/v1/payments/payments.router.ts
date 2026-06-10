import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { paymentsController } from './payments.controller';

export const paymentsRouter = Router();

/** @swagger
 * /api/v1/payments/create-order:
 *   post:
 *     summary: Create a topup order
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
paymentsRouter.post('/create-order', authenticate, paymentsController.createTopupOrder);

/** @swagger
 * /api/v1/payments/wallet:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
paymentsRouter.get('/wallet', authenticate, paymentsController.getWalletBalance);

/** @swagger
 * /api/v1/payments/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
paymentsRouter.get('/wallet/transactions', authenticate, paymentsController.getWalletTransactions);
