/**
 * Checkout Routes
 * Handles Stripe checkout sessions and payment processing
 */

import { Router } from "express";
import { db } from "../db";
import { listings, orders, entitlements, projects, users } from "../schema";
import { eq, and, sql } from "drizzle-orm";
const router = Router();

// Initialize Stripe (only if key is provided)
let stripe: any = null;

// Lazy load Stripe only when needed
const getStripe = async () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import("stripe")).default;
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-09-30.clover",
      });
    } catch (error) {
      console.log("Stripe not configured - commerce features disabled");
    }
  }
  return stripe;
};

// POST /checkout/session - Create Stripe checkout session
router.post("/session", async (req, res) => {
  try {
    const { listingId, successUrl, cancelUrl } = req.body;

    if (!listingId) {
      return res.status(400).json({
        ok: false,
        error: "listingId is required"
      });
    }

    // Get listing details
    const listing = await db
      .select()
      .from(listings)
      .where(and(
        eq(listings.id, listingId),
        eq(listings.status, "published")
      ))
      .limit(1);

    if (!listing.length) {
      return res.status(404).json({
        ok: false,
        error: "Listing not found or not published"
      });
    }

    const listingData = listing[0];

    const stripeInstance = await getStripe();
    if (!stripeInstance) {
      return res.status(500).json({
        ok: false,
        error: "Stripe not configured"
      });
    }

    // Create Stripe checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: listingData.currency.toLowerCase(),
            product_data: {
              name: listingData.title,
              description: listingData.description,
              images: listingData.coverImage ? [listingData.coverImage] : [],
            },
            unit_amount: Math.round(parseFloat(listingData.price) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        listingId: listingData.id,
        projectId: listingData.projectId,
        ownerId: listingData.ownerId.toString(),
      },
      // For now, we'll handle user info in webhook
      customer_email: req.body.email || undefined,
    });

    // Create pending order record
    const [order] = await db.insert(orders).values({
      listingId: listingData.id,
      buyerId: 1, // TODO: Get from auth when implemented
      stripeSessionId: session.id,
      amount: listingData.price,
      currency: listingData.currency,
      status: "pending",
      buyerEmail: req.body.email || "test@example.com",
      buyerName: req.body.name || "Test User",
      metadata: {
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
        referrer: req.get("Referer"),
      }
    }).returning();

    res.json({
      ok: true,
      data: {
        sessionId: session.id,
        url: session.url,
        orderId: order.id
      }
    });

  } catch (error: any) {
    console.error('Checkout session error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to create checkout session"
    });
  }
});

// POST /webhooks/stripe - Handle Stripe webhooks
router.post("/webhooks/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripeInstance = await getStripe();
  if (!stripeInstance || !endpointSecret) {
    console.error("Stripe not configured");
    return res.status(500).json({ error: "Stripe not configured" });
  }

  let event: any;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// Handle successful checkout
async function handleCheckoutCompleted(session: any) {
  try {
    const { listingId, projectId, ownerId } = session.metadata || {};
    
    if (!listingId || !projectId) {
      console.error("Missing metadata in checkout session");
      return;
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: "completed",
        stripePaymentIntentId: session.payment_intent as string,
        completedAt: new Date(),
      })
      .where(eq(orders.stripeSessionId, session.id));

    // Get order details
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id))
      .limit(1);

    if (!orderResult.length) {
      console.error("Order not found for session:", session.id);
      return;
    }

    const order = orderResult[0];

    // Create entitlement for buyer
    await db.insert(entitlements).values({
      userId: order.buyerId,
      projectId: projectId,
      listingId: listingId,
      orderId: order.id,
      type: "purchase",
      status: "active",
      permissions: {
        can_download: true,
        can_clone: false,
        can_share: false,
        can_modify: false
      }
    });

    // Update listing download count
    await db
      .update(listings)
      .set({
        downloadCount: sql`${listings.downloadCount} + 1`
      })
      .where(eq(listings.id, listingId));

    console.log(`✅ Order completed: ${order.id} for listing: ${listingId}`);

  } catch (error: any) {
    console.error("Error handling checkout completed:", error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: any) {
  console.log("Payment succeeded:", paymentIntent.id);
  // Additional payment success logic can be added here
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: any) {
  try {
    // Update order status to failed
    await db
      .update(orders)
      .set({
        status: "failed"
      })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    console.log("Payment failed:", paymentIntent.id);
  } catch (error: any) {
    console.error("Error handling payment failed:", error);
  }
}

export default router;


