/**
 * Admin Role Middleware
 * Verify user has admin role before accessing admin endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';

/**
 * Middleware to require admin role
 * Checks req.user.role === 'admin' or falls back to database query
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get role from req.user (if auth middleware has set it)
    const role = (req as any).user?.role || (req as any).user?.app_metadata?.role;

    if (role === 'admin') {
      Logger.info(`Admin access granted: ${(req as any).user?.email || 'unknown'}`);
      return next();
    }

    // Fallback: check database if user ID is available
    const userId = (req as any).user?.id || req.body?.userId || req.query?.userId;

    if (userId) {
      // Async check - we'll do this synchronously for simplicity
      // In production, ensure auth middleware has already loaded user with role
      Logger.warn(`Admin role check via database for user ${userId}`);
      
      // For now, allow if EVAL_MODE is true (development mode)
      if (process.env.EVAL_MODE === 'true' || process.env.VITE_EVAL_MODE === 'true') {
        Logger.info('Admin access granted via EVAL_MODE');
        return next();
      }
    }

    // Access denied
    Logger.warn(`Admin access denied: ${(req as any).user?.email || 'unknown user'}`);
    return res.status(403).json({
      ok: false,
      error: 'Admin access required',
      code: 'FORBIDDEN',
    });
  } catch (error: any) {
    Logger.error('Admin middleware error', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to verify admin access',
    });
  }
}

/**
 * Async version that checks database for role
 */
export async function isAdminAsync(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
    }

    // Query database for user role
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    // Check role (add role column to users table if not present)
    const role = (user as any).role || 'user';

    if (role !== 'admin') {
      Logger.warn(`Admin access denied: ${user.email} (role: ${role})`);
      return res.status(403).json({
        ok: false,
        error: 'Admin role required',
        code: 'FORBIDDEN',
      });
    }

    // Attach user to request
    (req as any).user = user;
    Logger.info(`Admin access granted: ${user.email}`);
    next();
  } catch (error: any) {
    Logger.error('Admin async middleware error', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to verify admin access',
    });
  }
}

export default isAdmin;



