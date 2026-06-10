import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  private service = new AuthService();

  /**
   * POST /api/v1/auth/register
   * Register a new user with email/password.
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/complete-profile
   * Complete profile for OAuth (Google) users.
   */
  completeProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user!.uid;
      const result = await this.service.completeProfile(uid, req.body);
      res.status(201).json({
        success: true,
        data: result,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/verify-token
   * Verify a Firebase ID token from the Authorization header.
   */
  verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or malformed Authorization header',
            details: null,
          },
          meta: null,
        });
        return;
      }

      const token = authHeader.slice(7);
      const claims = await this.service.verifyToken(token);

      res.status(200).json({
        success: true,
        data: claims,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/set-role
   * Admin only: set custom claims / role on a user.
   */
  setRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { uid, role } = req.body as { uid: string; role: string };
      const result = await this.service.setRole(uid, role);

      res.status(200).json({
        success: true,
        data: result,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Return the current authenticated user's profile from Firestore.
   */
  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user!.uid;
      const profile = await this.service.getProfile(uid);

      res.status(200).json({
        success: true,
        data: profile,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/delete-account
   * Soft-delete the current user's account.
   */
  deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user!.uid;
      const result = await this.service.deleteAccount(uid);

      res.status(200).json({
        success: true,
        data: result,
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
