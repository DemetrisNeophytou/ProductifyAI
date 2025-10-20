/**
 * Stripe Subscription Routes
 * Handle checkout sessions, webhooks, and subscription management
 */

import { Router } from 'express';
import Stripe from 'stripe';
import { stripe, PLANS, getPlanFromPriceId, mapSubscriptionStatus, WEBHOOK_EVENTS } from '../config/stripe';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';

const router = Router();

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/checkout
 */
router.post('/checkout', async (req, res) => {
  try {
    const { plan, userId } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({
        ok: false,
        error: 'Plan and userId are required',
      });
    }

    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    // Get price ID for plan
    const priceId = plan === 'plus' ? PLANS.PLUS.priceId : PLANS.PRO.priceId;

    if (!priceId) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid plan or price ID not configured',
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        userId: user.id,
        plan,
      },
      subscription_data: {
        trial_period_days: plan === 'plus' ? 3 : undefined, // 3-day trial for Plus
        metadata: {
          userId: user.id,
          plan,
        },
      },
    });

    Logger.info(`Checkout session created for user ${userId}, plan ${plan}`);

    res.json({
      ok: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error: any) {
    Logger.error('Checkout session error', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to create checkout session',
    });
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    Logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    Logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  Logger.info(`Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_COMPLETED: {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAID: {
        const invoice = event.data.object as Stripe.Invoice;
        Logger.info(`Invoice paid: ${invoice.id}`);
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED: {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        Logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    Logger.error(`Webhook processing error: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get subscription status
 * GET /api/subscription/status
 */
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId as string))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    // Check if subscription is still valid
    let isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

    // Check trial expiry
    if (user.subscriptionStatus === 'trialing' && user.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      
      if (now > trialEnd) {
        // Trial expired, downgrade to free
        await db
          .update(users)
          .set({
            plan: 'free',
            subscriptionTier: 'free',
            subscriptionStatus: 'expired',
            commissionRate: 7,
            aiTokensLimit: 0,
            credits: 0,
            projectsLimit: 3,
          })
          .where(eq(users.id, user.id));

        isActive = false;
      }
    }

    res.json({
      ok: true,
      data: {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionTier: user.subscriptionTier,
        trialEndDate: user.trialEndDate,
        subscriptionPeriodEnd: user.subscriptionPeriodEnd,
        isActive,
        commissionRate: user.commissionRate,
        limits: {
          projects: user.projectsLimit,
          aiTokens: user.aiTokensLimit,
          credits: user.credits,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Subscription status error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Cancel subscription
 * POST /api/subscription/cancel
 */
router.post('/cancel', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({
        ok: false,
        error: 'No active subscription found',
      });
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    Logger.info(`Subscription cancelled for user ${userId}`);

    res.json({
      ok: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    });
  } catch (error: any) {
    Logger.error('Subscription cancellation error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as 'plus' | 'pro';

  if (!userId || !plan) {
    Logger.error('Missing metadata in checkout session');
    return;
  }

  Logger.info(`Checkout completed for user ${userId}, plan ${plan}`);

  // Subscription will be handled by subscription.created event
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      Logger.error(`No user found for subscription ${subscription.id}`);
      return;
    }
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);
  const status = mapSubscriptionStatus(subscription.status);

  // Determine limits based on plan
  const limits = plan === 'plus'
    ? { projects: 10, aiTokens: 20000, credits: 500, commission: 4 }
    : plan === 'pro'
    ? { projects: -1, aiTokens: -1, credits: 2000, commission: 1 }
    : { projects: 3, aiTokens: 0, credits: 0, commission: 7 };

  // Update user in database
  await db
    .update(users)
    .set({
      plan,
      subscriptionTier: plan,
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
      projectsLimit: limits.projects,
      aiTokensLimit: limits.aiTokens,
      credits: limits.credits,
      commissionRate: limits.commission,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId));

  Logger.info(`Updated user subscription: ${userId || customerId} -> ${plan} (${status})`);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Downgrade to free plan
  await db
    .update(users)
    .set({
      plan: 'free',
      subscriptionTier: 'free',
      subscriptionStatus: 'cancelled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      trialEndDate: null,
      subscriptionPeriodEnd: null,
      projectsLimit: 3,
      aiTokensLimit: 0,
      credits: 0,
      commissionRate: 7,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId));

  Logger.info(`Subscription cancelled, downgraded to free: ${customerId}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Mark subscription as past_due
  await db
    .update(users)
    .set({
      subscriptionStatus: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId));

  Logger.warn(`Payment failed for customer: ${customerId}`);
}

export default router;

