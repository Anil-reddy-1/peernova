import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { usersController } from './users.controller';

export const usersRouter = Router();

const notImplemented = (_req: Request, res: Response): void => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'This endpoint will be implemented in Prompt 2',
      details: null,
    },
    meta: null,
  });
};

/**
 * @swagger
 * /api/v1/users/export-my-data:
 *   get:
 *     tags: [Users]
 *     summary: Export user data (GDPR)
 *     description: Export all data associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 */
usersRouter.get('/export-my-data', authenticate, usersController.exportMyData);

/**
 * @swagger
 * /api/v1/users/delete-my-data:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user data (GDPR)
 *     description: Anonymize user profile and delete Firebase Auth account.
 *     security:
 *       - bearerAuth: []
 */
usersRouter.delete('/delete-my-data', authenticate, usersController.deleteMyData);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin)
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin only)
 *     description: Retrieve a paginated list of all users. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
 *       501:
 *         description: Not implemented
 */
usersRouter.get(
  '/',
  authenticate,
  requireRole(['admin']),
  usersController.listUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve a single user's profile by their ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       501:
 *         description: Not implemented
 */
usersRouter.get('/:id', authenticate, notImplemented);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update a user's profile. Users can update their own profile; admins can update any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               photoURL:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       501:
 *         description: Not implemented
 */
usersRouter.patch('/:id', authenticate, usersController.updateUser);


