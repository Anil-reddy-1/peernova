import type { Request, Response, NextFunction } from 'express';
import { getFirestore, getAuth } from '../../../lib/firebase-admin';
import { logger } from '../../../lib/pino';

export class UsersController {
  
  async exportMyData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const db = getFirestore();
      
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      const sessionsSnap = await db.collection('sessions')
        .where('studentId', '==', userId)
        .get();
        
      const sessions = sessionsSnap.docs.map(d => d.data());
      
      // Additional data fetching logic would go here
      
      res.status(200).json({
        success: true,
        data: {
          profile: userData,
          sessions,
          exportedAt: new Date().toISOString()
        },
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMyData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const db = getFirestore();
      
      // 1. Anonymize user profile
      await db.collection('users').doc(userId).update({
        displayName: 'Deleted User',
        email: 'deleted@example.com',
        photoURL: '',
        phoneNumber: '',
        isVerified: false,
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      
      // 2. Delete Firebase Auth user
      await getAuth().deleteUser(userId);
      
      logger.info({ userId }, 'User requested GDPR data deletion');
      
      res.status(200).json({
        success: true,
        data: { message: 'Data successfully anonymized and account deleted' },
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const db = getFirestore();
      const offset = (page - 1) * limit;

      const snapshot = await db.collection('users').orderBy('createdAt', 'desc').offset(offset).limit(limit).get();
      const totalSnapshot = await db.collection('users').count().get();

      const users = snapshot.docs.map(doc => doc.data());
      const total = totalSnapshot.data().count;

      res.status(200).json({
        success: true,
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const db = getFirestore();

      // Only the user themselves or an admin may update a profile
      if (req.user?.uid !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions', details: null },
        });
        return;
      }

      // Strip fields that must never be updated directly via this endpoint
      const { role, email, status, emailVerified, createdAt, deletedAt, id: _id, ...safeUpdates } = req.body;
      void role; void email; void status; void emailVerified; void createdAt; void deletedAt; void _id;

      if (Object.keys(safeUpdates).length === 0) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'No updatable fields provided', details: null },
        });
        return;
      }

      await db.collection('users').doc(id).update({
        ...safeUpdates,
        updatedAt: new Date().toISOString(),
      });

      if (safeUpdates.displayName) {
        try {
          await getAuth().updateUser(id, { displayName: safeUpdates.displayName });
        } catch (e) {
          logger.error({ error: e, userId: id }, 'Failed to update displayName in Firebase Auth');
        }
      }

      const updated = await db.collection('users').doc(id).get();

      res.status(200).json({
        success: true,
        data: updated.data(),
        meta: null,
        error: null,
      });
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to update user profile');
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query || query.length < 2) {
        res.status(200).json({ success: true, data: [], meta: null, error: null });
        return;
      }

      const db = getFirestore();
      
      // Since Firestore doesn't support case-insensitive substring search natively,
      // we'll fetch a batch of users and filter in-memory. For a larger production app, 
      // we would use Algolia/Elasticsearch or add a `displayName_lowercase` array/field.
      const snapshot = await db.collection('users').limit(300).get();
      
      const queryLower = query.toLowerCase();

      const users = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
            displayName: data.displayName || '',
            role: data.role || 'user',
            photoURL: data.photoURL || ''
          };
        })
        .filter(user => user.displayName.toLowerCase().includes(queryLower))
        .slice(0, 15); // Return max 15 results

      res.status(200).json({
        success: true,
        data: users,
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async reportUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reporterId = req.user!.uid;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Reason is required', details: null }
        });
        return;
      }

      const db = getFirestore();
      const reportRef = db.collection('reports').doc();
      
      await reportRef.set({
        id: reportRef.id,
        reportedUserId: id,
        reporterId,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        data: { message: 'User reported successfully', reportId: reportRef.id },
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
