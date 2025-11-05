/**
 * Stripe Configuration
 * Centralized configuration for Stripe subscriptions, pricing, and Connect
 */

import Stripe from 'stripe';

// Check if Stripe is configured
const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;
const MOCK_STRIPE = !STRIPE_ENABLED;

// Initialize Stripe with fallback for development
export const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null;

// Log Stripe status
if (MOCK_STRIPE) {
  console.log('⚠️  STRIPE_SECRET_KEY not configured - using mock mode');
}

// Plan Configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Marketplace access only',
      '3 projects',
      '0 AI tokens',
      '7% marketplace commission',
      'Community: Public chat only',
    ],
    limits: {
      projects: 3,
      aiTokens: 0,
      credits: 0,
      commissionRate: 7,
    },
  },
  PLUS: {
    name: 'Plus',
    price: 24, // €24/mo
    priceId: process.env.STRIPE_PRICE_ID_PLUS,
    trialDays: 3,
    features: [
      'Full AI features',
      '10 projects',
      '20,000 AI tokens/month',
      '500 AI credits',
      '4% marketplace commission',
      'Community: Creators Hub',
      'Email support',
    ],
    limits: {
      projects: 10,
      aiTokens: 20000,
      credits: 500,
      commissionRate: 4,
    },
  },
  PRO: {
    name: 'Pro',
    price: 49, // €49/mo
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      'Unlimited AI access',
      'Unlimited projects',
      'Unlimited AI tokens',
      '2,000 AI credits',
      '1% marketplace commission',
      'Community: Pro Founders Lounge',
      'Priority 24/7 support',
      'White-label options',
      'API access',
    ],
    limits: {
      projects: -1, // -1 = unlimited
      aiTokens: -1,
      credits: 2000,
      commissionRate: 1,
    },
  },
} as const;

// Plan tier type
export type PlanTier = 'free' | 'plus' | 'pro';

/**
 * Get plan configuration by tier
 */
export function getPlanConfig(tier: PlanTier) {
  const planMap = {
    free: PLANS.FREE,
    plus: PLANS.PLUS,
    pro: PLANS.PRO,
  };
  return planMap[tier] || PLANS.FREE;
}

/**
 * Calculate marketplace commission based on plan
 */
export function calculateCommission(amount: number, plan: PlanTier): number {
  const config = getPlanConfig(plan);
  return Math.round((amount * config.limits.commissionRate) / 100);
}

/**
 * Check if user has access to feature based on plan
 */
export function hasFeatureAccess(
  userPlan: PlanTier,
  feature: 'ai' | 'marketplace' | 'community_creators' | 'community_pro' | 'unlimited_projects'
): boolean {
  switch (feature) {
    case 'ai':
      return userPlan === 'plus' || userPlan === 'pro';
    case 'marketplace':
      return true; // All plans have marketplace access
    case 'community_creators':
      return userPlan === 'plus' || userPlan === 'pro';
    case 'community_pro':
      return userPlan === 'pro';
    case 'unlimited_projects':
      return userPlan === 'pro';
    default:
      return false;
  }
}

/**
 * Check if user has exceeded usage limits
 */
export function hasExceededLimits(user: {
  plan: string;
  projectsLimit: number;
  aiTokensUsed: number;
  aiTokensLimit: number;
  credits: number;
}, type: 'projects' | 'tokens' | 'credits', currentUsage: number): boolean {
  const plan = user.plan as PlanTier;
  const config = getPlanConfig(plan);

  switch (type) {
    case 'projects':
      return config.limits.projects !== -1 && currentUsage >= config.limits.projects;
    case 'tokens':
      return config.limits.aiTokens !== -1 && user.aiTokensUsed >= config.limits.aiTokens;
    case 'credits':
      return config.limits.credits !== -1 && user.credits <= 0;
    default:
      return false;
  }
}

/**
 * Get upgrade URL for a specific plan
 */
export function getUpgradeUrl(plan: PlanTier): string {
  return `/upgrade?plan=${plan}`;
}

/**
 * Webhook event types we handle
 */
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
} as const;

/**
 * Subscription status mapping
 */
export function mapSubscriptionStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'cancelled',
    incomplete: 'trialing',
    incomplete_expired: 'expired',
  };
  return statusMap[stripeStatus] || 'free';
}

/**
 * Get plan tier from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): PlanTier {
  if (priceId === PLANS.PLUS.priceId) return 'plus';
  if (priceId === PLANS.PRO.priceId) return 'pro';
  return 'free';
}

export default stripe;

