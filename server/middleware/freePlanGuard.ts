/**
 * Free Plan Guard Middleware
 * Enforce strict restrictions on Free plan users
 * Free = Marketplace-only (buy/sell), no creation tools, read-only community
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';

/**
 * Block Free users from creation tools
 * Apply to: /api/editor/**, /api/canvas/**, /api/ai/**, /api/media/**
 */
export function blockFreeCreation(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id || req.body?.userId || req.query?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
    });
  }

  // Check user plan
  db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(([user]) => {
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }

      if (user.plan === 'free') {
        Logger.warn(`Free user blocked from creation tool: ${userId}`);
        return res.status(403).json({
          ok: false,
          error: 'This feature requires Plus or Pro plan',
          userPlan: 'free',
          requiredPlan: 'plus',
          upgradeUrl: '/upgrade?feature=creation',
          message: 'Upgrade to Plus to access creation tools (Editor, AI Builder, Media Library)',
        });
      }

      // Attach user to request
      (req as any).user = user;
      next();
    })
    .catch((error) => {
      Logger.error('Free plan guard error', error);
      res.status(500).json({ ok: false, error: 'Failed to verify plan access' });
    });
}

/**
 * Block Free users from posting in community
 * Allow Free users to READ, but not POST/PUT/PATCH/DELETE
 */
export function blockFreeCommunityWrite(req: Request, res: Response, next: NextFunction) {
  // Only block write operations
  const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!writeOperations.includes(req.method)) {
    return next(); // Allow GET requests
  }

  const userId = (req as any).user?.id || req.body?.userId || req.query?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
    });
  }

  db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(([user]) => {
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }

      if (user.plan === 'free') {
        Logger.warn(`Free user blocked from community posting: ${userId}`);
        return res.status(403).json({
          ok: false,
          error: 'Community posting requires Plus or Pro plan',
          userPlan: 'free',
          requiredPlan: 'plus',
          upgradeUrl: '/upgrade?feature=community',
          message: 'Free users can read community messages. Upgrade to Plus to post and participate.',
        });
      }

      (req as any).user = user;
      next();
    })
    .catch((error) => {
      Logger.error('Community write guard error', error);
      res.status(500).json({ ok: false, error: 'Failed to verify plan access' });
    });
}

/**
 * Validate ownership for resource updates
 * Ensure users can only modify their own listings/products
 */
export async function validateOwnership(
  req: Request,
  res: Response,
  next: NextFunction,
  resourceType: 'listing' | 'product'
) {
  const userId = (req as any).user?.id || req.body?.userId || req.query?.userId;
  const resourceId = req.params.id || req.params.listingId || req.params.productId;

  if (!userId || !resourceId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing userId or resource ID',
    });
  }

  try {
    // TODO: Query actual resource table when implemented
    // For now, assume ownership is valid
    // In production:
    // const [resource] = await db.select().from(listings).where(eq(listings.id, resourceId));
    // if (resource.userId !== userId) { return 403 }

    next();
  } catch (error) {
    Logger.error('Ownership validation error', error);
    res.status(500).json({ ok: false, error: 'Failed to validate ownership' });
  }
}

/**
 * Helper to check if user is Free plan
 */
export async function isFreePlan(userId: string): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user?.plan === 'free' || !user?.plan;
  } catch (error) {
    Logger.error('Check free plan error', error);
    return true; // Fail closed - assume free if error
  }
}

export default {
  blockFreeCreation,
  blockFreeCommunityWrite,
  validateOwnership,
  isFreePlan,
};



