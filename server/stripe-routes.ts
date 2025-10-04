import type { Express, Request, Response } from "express";
import { stripe } from "./stripe-config";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { checkoutLimiter } from "./rate-limiter";
import Stripe from 'stripe';

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

// Stripe Price IDs - Update these with your actual Stripe price IDs
const PRICE_IDS = {
  plus_monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_plus_monthly',
  pro_quarterly: process.env.STRIPE_PRO_QUARTERLY_PRICE_ID || 'price_pro_quarterly',
};

export function registerStripeRoutes(app: Express) {
  // Create checkout session
  app.post("/api/stripe/create-checkout-session", isAuthenticated, checkoutLimiter, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { plan, billingPeriod } = req.body;

      if (!plan || !billingPeriod) {
        return res.status(400).json({ message: "Plan and billing period are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Determine price ID
      let priceId = '';
      if (plan === 'plus' && billingPeriod === 'monthly') {
        priceId = PRICE_IDS.plus_monthly;
      } else if (plan === 'pro' && billingPeriod === 'quarterly') {
        priceId = PRICE_IDS.pro_quarterly;
      } else {
        return res.status(400).json({ message: "Invalid plan or billing period" });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Track checkout started event
      await storage.trackEvent({
        userId,
        eventType: 'checkout_started',
        eventData: {
          plan,
          billingPeriod,
        },
      });

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
        success_url: `${req.headers.origin}/billing?success=true`,
        cancel_url: `${req.headers.origin}/pricing?canceled=true`,
        metadata: {
          userId,
          plan,
          billingPeriod,
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ 
        message: "Failed to create checkout session",
        error: error.message 
      });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/create-portal-session", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/billing`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe portal error:", error);
      res.status(500).json({ 
        message: "Failed to create portal session",
        error: error.message 
      });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('No signature');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          
          if (userId && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            await storage.updateUser(userId, {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              subscriptionTier: session.metadata?.plan as any,
              subscriptionStatus: 'active',
              subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
              projectsLimit: session.metadata?.plan === 'pro' ? -1 : 10,
              aiTokensLimit: session.metadata?.plan === 'pro' ? -1 : 20000,
            });

            // Create payment history record
            if (session.amount_total) {
              await storage.createPaymentHistory({
                userId,
                stripeInvoiceId: session.invoice as string || null,
                stripePaymentIntentId: session.payment_intent as string || null,
                amount: session.amount_total,
                currency: session.currency || 'eur',
                status: 'succeeded',
                plan: session.metadata?.plan || 'plus',
                billingPeriod: session.metadata?.billingPeriod || 'monthly',
                metadata: {
                  description: `Subscription - ${session.metadata?.plan}`,
                },
              });
            }

            // Track subscription completed event
            await storage.trackEvent({
              userId,
              eventType: 'subscription_completed',
              eventData: {
                plan: session.metadata?.plan,
                revenue: session.amount_total || 0,
              },
            });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscription = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription as string) : null;
          
          if (subscription && subscription.metadata?.userId) {
            const userId = subscription.metadata.userId;
            
            await storage.createPaymentHistory({
              userId,
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId: invoice.payment_intent as string || null,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              plan: subscription.metadata?.plan || 'plus',
              billingPeriod: subscription.metadata?.billingPeriod || 'monthly',
              metadata: {
                description: `Payment for subscription`,
                receiptUrl: invoice.hosted_invoice_url || undefined,
              },
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status as any,
              subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionStatus: 'cancelled',
              subscriptionTier: 'trial',
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user billing info
  app.get("/api/billing/info", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Always fetch payment history regardless of subscription status
      const paymentHistory = await storage.getUserPaymentHistory(userId, 10);

      // Return billing info without calling Stripe if user has no subscription
      res.json({
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPeriodEnd: user.subscriptionPeriodEnd,
        projectsLimit: user.projectsLimit,
        aiTokensLimit: user.aiTokensLimit,
        aiTokensUsed: user.aiTokensUsed,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        paymentHistory,
      });
    } catch (error) {
      console.error("Error fetching billing info:", error);
      res.status(500).json({ message: "Failed to fetch billing info" });
    }
  });
}
