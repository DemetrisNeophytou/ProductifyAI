import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { stripe, SUBSCRIPTION_PLANS, TRIAL_DAYS, SubscriptionTier, SubscriptionStatus } from './stripe-config';

export async function initializeTrial(userId: string): Promise<void> {
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

  await db.update(users)
    .set({
      subscriptionTier: 'trial',
      subscriptionStatus: 'trialing',
      trialStartDate,
      trialEndDate,
    })
    .where(eq(users.id, userId));
}

export async function hasActiveAccess(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return false;

  if (user.subscriptionStatus === 'active') {
    return true;
  }

  if (user.subscriptionStatus === 'trialing' && user.trialEndDate) {
    return new Date() < new Date(user.trialEndDate);
  }

  return false;
}

export async function checkSubscriptionLimits(userId: string): Promise<{
  hasAccess: boolean;
  canCreateProject: boolean;
  canUseAI: boolean;
  projectsUsed: number;
  projectsLimit: number;
  aiTokensUsed: number;
  aiTokensLimit: number;
  tier: string;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return {
      hasAccess: false,
      canCreateProject: false,
      canUseAI: false,
      projectsUsed: 0,
      projectsLimit: 0,
      aiTokensUsed: 0,
      aiTokensLimit: 0,
      tier: 'expired',
    };
  }

  const hasAccess = await hasActiveAccess(userId);
  
  if (!hasAccess) {
    return {
      hasAccess: false,
      canCreateProject: false,
      canUseAI: false,
      projectsUsed: 0,
      projectsLimit: user.projectsLimit || 0,
      aiTokensUsed: user.aiTokensUsed || 0,
      aiTokensLimit: user.aiTokensLimit || 0,
      tier: user.subscriptionTier || 'expired',
    };
  }

  const projectsUsed = await db.query.projects.findMany({
    where: eq(users.id, userId),
  }).then(projects => projects.length);

  const projectsLimit = user.projectsLimit || 0;
  const aiTokensUsed = user.aiTokensUsed || 0;
  const aiTokensLimit = user.aiTokensLimit || 0;

  const canCreateProject = projectsLimit === -1 || projectsUsed < projectsLimit;
  const canUseAI = aiTokensLimit === -1 || aiTokensUsed < aiTokensLimit;

  return {
    hasAccess,
    canCreateProject,
    canUseAI,
    projectsUsed,
    projectsLimit,
    aiTokensUsed,
    aiTokensLimit,
    tier: user.subscriptionTier || 'trial',
  };
}

export async function updateSubscriptionFromStripe(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  tier: SubscriptionTier,
  priceId: string,
  periodEnd: Date,
): Promise<void> {
  const planConfig = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
  
  if (!planConfig) {
    throw new Error(`Invalid subscription tier: ${tier}`);
  }

  await db.update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      stripePriceId: priceId,
      subscriptionPeriodEnd: periodEnd,
      projectsLimit: planConfig.projectsLimit,
      aiTokensLimit: planConfig.aiTokensLimit,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
}

export async function cancelSubscriptionAccess(userId: string): Promise<void> {
  await db.update(users)
    .set({
      subscriptionStatus: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function expireTrialAccess(userId: string): Promise<void> {
  await db.update(users)
    .set({
      subscriptionStatus: 'expired',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
