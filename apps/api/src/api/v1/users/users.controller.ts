import type { Request, Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
      const updates = req.body;
      const db = getFirestore();
      
      await db.collection('users').doc(id).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      const updated = await db.collection('users').doc(id).get();

      res.status(200).json({
        success: true,
        data: updated.data(),
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
