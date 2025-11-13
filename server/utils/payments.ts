/**
 * Payment Utilities
 * Commission calculation and Stripe Connect helpers
 */

import { stripe, calculateCommission as calcCommission, PlanTier } from '../config/stripe';
import { Logger } from './logger';

/**
 * Calculate platform commission based on user's plan
 */
export function calculateCommission(amount: number, userPlan: PlanTier): number {
  return calcCommission(amount, userPlan);
}

/**
 * Create Stripe Connect transfer with commission
 */
export async function createConnectTransfer(params: {
  amount: number; // Total amount in cents
  currency: string;
  sellerConnectAccountId: string;
  buyerPlan: PlanTier;
  orderId: string;
  description: string;
}) {
  try {
    const { amount, currency, sellerConnectAccountId, buyerPlan, orderId, description } = params;

    // Calculate platform commission
    const platformFee = calculateCommission(amount, buyerPlan);
    const sellerAmount = amount - platformFee;

    Logger.info(`Processing payment: Total ${amount}, Commission ${platformFee}, Seller gets ${sellerAmount}`);

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerConnectAccountId,
      },
      metadata: {
        orderId,
        buyerPlan,
        platformFee: platformFee.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      description,
    });

    return {
      ok: true,
      paymentIntent,
      platformFee,
      sellerAmount,
    };
  } catch (error: any) {
    Logger.error('Connect transfer error', error);
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Create Stripe Connect account for seller
 */
export async function createConnectAccount(params: {
  email: string;
  country?: string;
  userId: string;
}) {
  try {
    const { email, country = 'US', userId } = params;

    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId,
      },
    });

    Logger.info(`Stripe Connect account created: ${account.id} for user ${userId}`);

    return {
      ok: true,
      accountId: account.id,
    };
  } catch (error: any) {
    Logger.error('Connect account creation error', error);
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Create Connect account onboarding link
 */
export async function createConnectOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return {
      ok: true,
      url: accountLink.url,
    };
  } catch (error: any) {
    Logger.error('Connect onboarding link error', error);
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Get commission rate display string
 */
export function getCommissionRateDisplay(plan: PlanTier): string {
  const rates = {
    free: '7%',
    plus: '4%',
    pro: '1%',
  };
  return rates[plan] || '7%';
}

/**
 * Calculate earnings after commission
 */
export function calculateSellerEarnings(saleAmount: number, buyerPlan: PlanTier): {
  grossAmount: number;
  platformFee: number;
  sellerEarnings: number;
  commissionRate: number;
} {
  const platformFee = calculateCommission(saleAmount, buyerPlan);
  const sellerEarnings = saleAmount - platformFee;
  
  const commissionRates = { free: 7, plus: 4, pro: 1 };
  const commissionRate = commissionRates[buyerPlan];

  return {
    grossAmount: saleAmount,
    platformFee,
    sellerEarnings,
    commissionRate,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents
}

export default {
  calculateCommission,
  createConnectTransfer,
  createConnectAccount,
  createConnectOnboardingLink,
  getCommissionRateDisplay,
  calculateSellerEarnings,
  formatCurrency,
};



