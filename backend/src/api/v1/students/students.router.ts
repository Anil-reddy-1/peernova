import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';

export const studentsRouter = Router();

/**
 * @swagger
 * /api/v1/students/{id}:
 *   get:
 *     summary: Get student profile
 *     tags: [Students]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
studentsRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Will be implemented in Prompt 2', details: null }, meta: null });
});

/**
 * @swagger
 * /api/v1/students/{id}:
 *   patch:
 *     summary: Update student profile
 *     tags: [Students]
 *     security: [{ bearerAuth: [] }]
 */
studentsRouter.patch('/:id', authenticate, (_req, res) => {
  res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Will be implemented in Prompt 2', details: null }, meta: null });
});
