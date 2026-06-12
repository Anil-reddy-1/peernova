import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { tutorsController } from './tutors.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const tutorsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Tutors
 *   description: Tutor profile management & search
 */

/**
 * @swagger
 * /api/v1/tutors:
 *   get:
 *     tags: [Tutors]
 *     summary: Search / list tutors
 *     description: Public endpoint to search and list tutors with optional filters for subject, rating, and price.
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject name
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum hourly rate filter (INR)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum hourly rate filter (INR)
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
 *         description: Paginated list of tutors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       501:
 *         description: Not implemented
 */
tutorsRouter.get('/', tutorsController.getTutors);

// NOTE: Specific named routes MUST come BEFORE /:id to avoid being shadowed by the param route.

/**
 * @swagger
 * /api/v1/tutors/availability/{id}:
 *   get:
 *     tags: [Tutors]
 *     summary: Get tutor availability
 *     description: Retrieve a tutor's future availability slots.
 */
tutorsRouter.get('/availability/:id', tutorsController.getAvailability);

/**
 * @swagger
 * /api/v1/tutors/availability:
 *   post:
 *     tags: [Tutors]
 *     summary: Create availability slot
 */
tutorsRouter.post(
  '/availability',
  authenticate,
  requireRole(['tutor']),
  tutorsController.createAvailability,
);

/**
 * @swagger
 * /api/v1/tutors/availability/{slotId}:
 *   delete:
 *     tags: [Tutors]
 *     summary: Delete availability slot
 */
tutorsRouter.delete(
  '/availability/:slotId',
  authenticate,
  requireRole(['tutor']),
  tutorsController.deleteAvailability,
);

/**
 * @swagger
 * /api/v1/tutors/verification:
 *   post:
 *     tags: [Tutors]
 *     summary: Upload verification documents
 *     description: Tutors can upload ID and degree certificates to get verified.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
tutorsRouter.post(
  '/verification',
  authenticate,
  requireRole(['tutor']),
  upload.single('document'),
  tutorsController.uploadVerificationDocument,
);

// ─── Parameterised routes — must come AFTER all fixed-path routes ───────────

/**
 * @swagger
 * /api/v1/tutors/{id}:
 *   get:
 *     tags: [Tutors]
 *     summary: Get tutor profile
 */
tutorsRouter.get('/:id', tutorsController.getTutorById);

/**
 * @swagger
 * /api/v1/tutors/{id}:
 *   patch:
 *     tags: [Tutors]
 *     summary: Update tutor profile
 *     description: Update a tutor's profile. Only the tutor themselves or an admin can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 maxLength: 2000
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     level:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *               hourlyRate:
 *                 type: number
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               availabilityTimezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tutor profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not the profile owner or admin
 *       404:
 *         description: Tutor not found
 */
tutorsRouter.patch('/:id', authenticate, tutorsController.updateProfile);

/**
 * @swagger
 * /api/v1/tutors/{id}/verify:
 *   post:
 *     tags: [Tutors]
 *     summary: Verify a tutor (admin only)
 *     description: Admin endpoint to verify or reject a tutor's identity and credentials.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if status is rejected)
 *     responses:
 *       200:
 *         description: Tutor verification status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Tutor not found
 */
tutorsRouter.post(
  '/:id/verify',
  authenticate,
  requireRole(['admin']),
  tutorsController.verifyTutor,
);
