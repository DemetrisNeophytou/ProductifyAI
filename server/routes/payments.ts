import { Router } from "express";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

const router = Router();

// Stripe configuration (test mode)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_demo";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_demo";

// Create Stripe checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, priceId } = req.body;
    
    if (!userId || !priceId) {
      return res.status(400).json({
        success: false,
        error: "User ID and price ID are required",
      });
    }

    // TODO: Integrate with actual Stripe API
    // For demo purposes, return mock session data
    
    const checkoutSession = {
      id: `cs_demo_${Date.now()}`,
      url: "https://checkout.stripe.com/demo",
      priceId,
      userId,
      status: "open",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };

    res.json({
      success: true,
      message: "Checkout session created",
      data: {
        session: checkoutSession,
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        note: "Connect to actual Stripe API for production payments",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
});

// Handle successful payment
router.post("/success", async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Session ID and user ID are required",
      });
    }

    // TODO: Verify payment with Stripe API
    // For demo purposes, upgrade user to Pro
    
    const updatedUser = await db.update(users)
      .set({ isPro: true })
      .where(eq(users.id, parseInt(userId)))
      .returning();
    
    if (updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Payment successful! Welcome to Pro!",
      data: {
        user: {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
          name: updatedUser[0].name,
          isPro: updatedUser[0].isPro,
        },
        payment: {
          sessionId,
          amount: 29.99,
          currency: "usd",
          status: "completed",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process payment",
    });
  }
});

// Get pricing plans
router.get("/plans", async (req, res) => {
  try {
    const plans = [
      {
        id: "basic",
        name: "Basic",
        price: 0,
        currency: "usd",
        interval: "month",
        features: [
          "Create up to 3 products",
          "Basic AI generation",
          "Standard templates",
          "Email support",
        ],
        limits: {
          products: 3,
          aiGenerations: 10,
          storage: "100MB",
        },
      },
      {
        id: "pro",
        name: "Pro",
        price: 29.99,
        currency: "usd",
        interval: "month",
        features: [
          "Unlimited products",
          "Advanced AI generation",
          "Premium templates",
          "Video generation",
          "Priority support",
          "Analytics dashboard",
        ],
        limits: {
          products: -1, // unlimited
          aiGenerations: -1,
          storage: "10GB",
        },
        stripePriceId: "price_demo_pro",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 99.99,
        currency: "usd",
        interval: "month",
        features: [
          "Everything in Pro",
          "Custom branding",
          "API access",
          "White-label solution",
          "Dedicated support",
          "Custom integrations",
        ],
        limits: {
          products: -1,
          aiGenerations: -1,
          storage: "100GB",
        },
        stripePriceId: "price_demo_enterprise",
      },
    ];

    res.json({
      success: true,
      data: {
        plans,
        currency: "usd",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get pricing plans",
    });
  }
});

// Get user subscription status
router.get("/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // TODO: Fetch actual subscription from Stripe
    const subscription = {
      userId: parseInt(userId),
      status: user[0].isPro ? "active" : "inactive",
      plan: user[0].isPro ? "pro" : "basic",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      cancelAtPeriodEnd: false,
    };

    res.json({
      success: true,
      data: {
        subscription,
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          isPro: user[0].isPro,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get subscription",
    });
  }
});

// Cancel subscription
router.post("/cancel/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // TODO: Cancel subscription in Stripe
    // For demo purposes, keep user as Pro but mark for cancellation
    
    res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current period",
      data: {
        userId: parseInt(userId),
        cancelAtPeriodEnd: true,
        note: "Connect to Stripe API for actual cancellation",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to cancel subscription",
    });
  }
});

// Webhook handler for Stripe events
router.post("/webhook", async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const payload = req.body;
    
    // TODO: Verify webhook signature with Stripe
    // For demo purposes, log the event
    
    console.log("Stripe webhook received:", {
      type: payload.type,
      id: payload.id,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Webhook received",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process webhook",
    });
  }
});

export default router;
