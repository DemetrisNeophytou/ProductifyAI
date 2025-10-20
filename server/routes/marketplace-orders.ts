/**
 * Marketplace Orders with Commission Logic
 * Handle product purchases with plan-based commission rates
 */

import { Router } from 'express';
import { db } from '../db';
import { orders, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { calculateCommission, createConnectTransfer, PlanTier } from '../utils/payments';

const router = Router();

/**
 * Create marketplace order
 * POST /api/marketplace/orders
 */
router.post('/orders', async (req, res) => {
  try {
    const { buyerId, sellerId, productId, productTitle, amount } = req.body;

    if (!buyerId || !sellerId || !amount) {
      return res.status(400).json({
        ok: false,
        error: 'buyerId, sellerId, and amount are required',
      });
    }

    // Get buyer to determine commission rate
    const [buyer] = await db.select().from(users).where(eq(users.id, buyerId)).limit(1);

    if (!buyer) {
      return res.status(404).json({
        ok: false,
        error: 'Buyer not found',
      });
    }

    const buyerPlan = (buyer.plan || 'free') as PlanTier;

    // Calculate commission
    const commission = calculateCommission(amount, buyerPlan);
    const sellerPayout = amount - commission;
    const commissionRate = buyer.commissionRate || 7;

    // Create order record
    const [order] = await db
      .insert(orders)
      .values({
        buyerId,
        sellerId,
        productId: productId || null,
        productTitle: productTitle || 'Digital Product',
        amount,
        subtotal: amount,
        commission,
        commissionRate,
        sellerPayout,
        buyerPlan,
        status: 'pending',
      })
      .returning();

    Logger.info(`Order created: ${order.id}, commission ${commission} (${commissionRate}%)`);

    res.json({
      ok: true,
      data: {
        order,
        breakdown: {
          total: amount,
          commission,
          commissionRate: `${commissionRate}%`,
          sellerReceives: sellerPayout,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Create order error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Process payment with Stripe Connect
 * POST /api/marketplace/orders/:orderId/pay
 */
router.post('/orders/:orderId/pay', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethodId } = req.body;

    // Get order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found',
      });
    }

    // Get seller for Connect account
    const [seller] = await db.select().from(users).where(eq(users.id, order.sellerId)).limit(1);

    if (!seller || !seller.stripeConnectAccountId) {
      return res.status(400).json({
        ok: false,
        error: 'Seller Stripe Connect account not set up',
      });
    }

    // Create payment with Connect transfer
    const transferResult = await createConnectTransfer({
      amount: order.amount,
      currency: 'eur',
      sellerConnectAccountId: seller.stripeConnectAccountId,
      buyerPlan: order.buyerPlan as PlanTier,
      orderId: order.id,
      description: `Purchase: ${order.productTitle}`,
    });

    if (!transferResult.ok) {
      return res.status(500).json({
        ok: false,
        error: 'Payment processing failed',
      });
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'completed',
        stripePaymentIntentId: transferResult.paymentIntent?.id,
        completedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    Logger.info(`Order ${orderId} completed, payment ${transferResult.paymentIntent?.id}`);

    res.json({
      ok: true,
      data: {
        orderId: order.id,
        paymentIntentId: transferResult.paymentIntent?.id,
        status: 'completed',
      },
    });
  } catch (error: any) {
    Logger.error('Process payment error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Get order details
 * GET /api/marketplace/orders/:orderId
 */
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found',
      });
    }

    res.json({
      ok: true,
      data: order,
    });
  } catch (error: any) {
    Logger.error('Get order error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Get user's orders
 * GET /api/marketplace/orders?userId=&type=buyer|seller
 */
router.get('/orders', async (req, res) => {
  try {
    const { userId, type = 'buyer', limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(type === 'seller' ? eq(orders.sellerId, userId as string) : eq(orders.buyerId, userId as string))
      .orderBy(orders.createdAt)
      .limit(Number(limit));

    // Calculate totals
    const totalAmount = userOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalCommission = userOrders.reduce((sum, order) => sum + order.commission, 0);
    const totalPayout = userOrders.reduce((sum, order) => sum + order.sellerPayout, 0);

    res.json({
      ok: true,
      data: {
        orders: userOrders.reverse(), // Most recent first
        summary: {
          count: userOrders.length,
          totalAmount,
          totalCommission,
          totalPayout: type === 'seller' ? totalPayout : undefined,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Get orders error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;

