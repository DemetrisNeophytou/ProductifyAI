/**
 * Plan Gating Middleware
 * Restrict access to features based on user's subscription plan
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hasFeatureAccess, hasExceededLimits } from '../config/stripe';
import { Logger } from '../utils/logger';

export type PlanTier = 'free' | 'plus' | 'pro';

/**
 * Middleware to require specific plan tier
 */
export function requirePlan(minPlan: PlanTier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId || req.query.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          ok: false,
          error: 'Authentication required',
          upgradeUrl: '/login',
        });
      }

      // Fetch user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({
          ok: false,
          error: 'User not found',
        });
      }

      const userPlan = (user.plan || 'free') as PlanTier;

      // Check if user's plan meets minimum requirement
      const planHierarchy: Record<PlanTier, number> = {
        free: 0,
        plus: 1,
        pro: 2,
      };

      if (planHierarchy[userPlan] < planHierarchy[minPlan]) {
        Logger.warn(`Access denied: user ${userId} (${userPlan}) attempted to access ${minPlan} feature`);
        
        return res.status(403).json({
          ok: false,
          error: `This feature requires ${minPlan.charAt(0).toUpperCase() + minPlan.slice(1)} plan or higher`,
          userPlan,
          requiredPlan: minPlan,
          upgradeUrl: `/upgrade?plan=${minPlan}`,
        });
      }

      // Attach user to request for downstream use
      (req as any).user = user;
      next();
    } catch (error: any) {
      Logger.error('Plan gating middleware error', error);
      res.status(500).json({
        ok: false,
        error: 'Failed to verify plan access',
      });
    }
  };
}

/**
 * Middleware to check feature access
 */
export function requireFeature(feature: 'ai' | 'marketplace' | 'community_creators' | 'community_pro' | 'unlimited_projects') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId || req.query.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          ok: false,
          error: 'Authentication required',
        });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({
          ok: false,
          error: 'User not found',
        });
      }

      const userPlan = (user.plan || 'free') as PlanTier;

      if (!hasFeatureAccess(userPlan, feature)) {
        const requiredPlan = feature === 'community_pro' ? 'pro' : 'plus';
        
        return res.status(403).json({
          ok: false,
          error: `This feature requires ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan`,
          userPlan,
          requiredPlan,
          upgradeUrl: `/upgrade?plan=${requiredPlan}`,
        });
      }

      (req as any).user = user;
      next();
    } catch (error: any) {
      Logger.error('Feature access middleware error', error);
      res.status(500).json({
        ok: false,
        error: 'Failed to verify feature access',
      });
    }
  };
}

/**
 * Middleware to check usage limits
 */
export function checkUsageLimits(limitType: 'projects' | 'tokens' | 'credits') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          ok: false,
          error: 'User not authenticated',
        });
      }

      // For Pro plan, skip limits (unlimited)
      if (user.plan === 'pro') {
        next();
        return;
      }

      // Check specific limit
      let currentUsage = 0;
      let limitExceeded = false;

      switch (limitType) {
        case 'projects':
          // TODO: Count user's projects when needed
          currentUsage = 0;
          limitExceeded = hasExceededLimits(user, 'projects', currentUsage);
          break;
        case 'tokens':
          currentUsage = user.aiTokensUsed || 0;
          limitExceeded = hasExceededLimits(user, 'tokens', currentUsage);
          break;
        case 'credits':
          currentUsage = user.credits || 0;
          limitExceeded = user.credits <= 0;
          break;
      }

      if (limitExceeded) {
        return res.status(429).json({
          ok: false,
          error: `You've reached your ${limitType} limit`,
          userPlan: user.plan,
          currentUsage,
          limit: limitType === 'projects' ? user.projectsLimit 
                : limitType === 'tokens' ? user.aiTokensLimit 
                : user.credits,
          upgradeUrl: '/upgrade',
        });
      }

      next();
    } catch (error: any) {
      Logger.error('Usage limits middleware error', error);
      res.status(500).json({
        ok: false,
        error: 'Failed to check usage limits',
      });
    }
  };
}

/**
 * Middleware to track AI usage
 */
export async function trackAIUsage(userId: string, tokensUsed: number) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return;

    // Update token usage
    await db
      .update(users)
      .set({
        aiTokensUsed: (user.aiTokensUsed || 0) + tokensUsed,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    Logger.info(`AI usage tracked: user ${userId}, tokens ${tokensUsed}`);
  } catch (error) {
    Logger.error('Failed to track AI usage', error);
  }
}

/**
 * Middleware to deduct credits
 */
export async function deductCredits(userId: string, amount: number) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    // Check if user has enough credits
    if (user.credits < amount && user.plan !== 'pro') {
      return false;
    }

    // Pro users have unlimited credits
    if (user.plan === 'pro') {
      return true;
    }

    // Deduct credits
    await db
      .update(users)
      .set({
        credits: user.credits - amount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    Logger.info(`Credits deducted: user ${userId}, amount ${amount}`);
    return true;
  } catch (error) {
    Logger.error('Failed to deduct credits', error);
    return false;
  }
}

export default {
  requirePlan,
  requireFeature,
  checkUsageLimits,
  trackAIUsage,
  deductCredits,
};



