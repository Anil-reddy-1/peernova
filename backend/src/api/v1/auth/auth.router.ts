import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { validate } from '../../../middleware/validate';
import { RegisterRequestSchema, CompleteProfileRequestSchema } from '../../../types/shared';
import { z } from 'zod';

export const authRouter = Router();
const controller = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & account management
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new Firebase Auth user, sets custom claims, and creates Firestore profile documents.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, displayName, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecureP@ss123
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Jane Doe
 *               role:
 *                 type: string
 *                 enum: [student, tutor]
 *                 example: student
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: User already exists
 *       422:
 *         description: Validation error
 */
authRouter.post(
  '/register',
  validate({ body: RegisterRequestSchema }),
  controller.register,
);

/**
 * @swagger
 * /api/v1/auth/complete-profile:
 *   post:
 *     tags: [Auth]
 *     summary: Complete profile for OAuth users
 *     description: Sets custom claims and creates Firestore profile documents for a Google Sign-In user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, tutor]
 *                 example: student
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       201:
 *         description: Profile completed successfully
 *       409:
 *         description: Profile already exists
 *       422:
 *         description: Validation error
 */
authRouter.post(
  '/complete-profile',
  authenticate,
  validate({ body: CompleteProfileRequestSchema }),
  controller.completeProfile,
);

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a Firebase ID token
 *     description: Extracts the token from the Authorization header, verifies it, and returns the decoded claims including role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         email:
 *                           type: string
 *                         emailVerified:
 *                           type: boolean
 *                         role:
 *                           type: string
 *                           enum: [student, tutor, admin]
 *                         iat:
 *                           type: integer
 *                         exp:
 *                           type: integer
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 */
authRouter.post('/verify-token', controller.verifyToken);

/**
 * @swagger
 * /api/v1/auth/set-role:
 *   post:
 *     tags: [Auth]
 *     summary: Set a user's role (admin only)
 *     description: Sets custom claims on a Firebase Auth user and updates the Firestore user document.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uid, role]
 *             properties:
 *               uid:
 *                 type: string
 *                 description: Firebase UID of the target user
 *                 example: abc123def456
 *               role:
 *                 type: string
 *                 enum: [student, tutor, admin]
 *                 example: tutor
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
authRouter.post(
  '/set-role',
  authenticate,
  requireRole(['admin']),
  validate({
    body: z.object({
      uid: z.string(),
      role: z.enum(['student', 'tutor', 'admin']),
    }),
  }),
  controller.setRole,
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile from Firestore.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                         photoURL:
 *                           type: string
 *                           nullable: true
 *                         role:
 *                           type: string
 *                           enum: [student, tutor, admin]
 *                         status:
 *                           type: string
 *                           enum: [active, suspended, pending_verification, deleted]
 *                         emailVerified:
 *                           type: boolean
 *                         phoneNumber:
 *                           type: string
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: User not found
 */
authRouter.get('/me', authenticate, controller.getMe);

/**
 * @swagger
 * /api/v1/auth/delete-account:
 *   post:
 *     tags: [Auth]
 *     summary: Delete current user's account
 *     description: >
 *       Soft-deletes the authenticated user's account by setting deletedAt,
 *       changing status to 'deleted', and revoking all Firebase refresh tokens.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         deleted:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: User not found
 */
authRouter.post('/delete-account', authenticate, controller.deleteAccount);
