import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

export const SUBSCRIPTION_PLANS = {
  plus: {
    name: 'Productify AI Plus',
    features: [
      'AI-powered outlines',
      'Chapter writing',
      'PDF/DOCX export',
      'Brand Kit integration',
      '10 projects',
      '20,000 AI tokens/month',
    ],
    projectsLimit: 10,
    aiTokensLimit: 20000,
  },
  pro: {
    name: 'Productify AI Pro',
    features: [
      'Everything in Plus',
      'Pricing strategies',
      'Funnel templates',
      'Launch plans',
      'Premium templates',
      'Priority support',
      'Unlimited projects',
      'Unlimited AI tokens',
    ],
    projectsLimit: -1, // unlimited
    aiTokensLimit: -1, // unlimited
  },
} as const;

export type SubscriptionTier = 'trial' | 'plus' | 'pro';
export type SubscriptionStatus = 'trialing' | 'active' | 'cancelled' | 'past_due' | 'expired';

export const TRIAL_DAYS = 3;

export const CREDIT_PACKAGES = {
  starter: {
    name: '100 Credits',
    credits: 100,
    price: 9.99,
    priceId: process.env.STRIPE_CREDITS_100_PRICE_ID || 'price_credits_100',
  },
  pro: {
    name: '500 Credits',
    credits: 500,
    price: 39.99,
    priceId: process.env.STRIPE_CREDITS_500_PRICE_ID || 'price_credits_500',
    popular: true,
  },
  business: {
    name: '1000 Credits',
    credits: 1000,
    price: 69.99,
    priceId: process.env.STRIPE_CREDITS_1000_PRICE_ID || 'price_credits_1000',
  },
} as const;

export type CreditPackage = keyof typeof CREDIT_PACKAGES;
