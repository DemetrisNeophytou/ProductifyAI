/**
 * Admin API Routes
 * Comprehensive admin endpoints for users, revenue, usage, and community insights
 */

import { Router } from 'express';
import { db } from '../db';
import { users, subscriptions, orders, aiUsage, aiFeedback, messages, channels, adminLogs } from '@shared/schema';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { stripe } from '../config/stripe';

const router = Router();

// Helper to mask email
function maskEmail(email: string): string {
  if (!email) return 'unknown';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

// Helper to get date range
function getDateRange(range: string): Date {
  const now = new Date();
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get all users (paginated)
 * GET /api/admin/users?page=1&limit=50&plan=all&search=
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, plan = 'all', search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    let whereClause = sql`1=1`;
    if (plan !== 'all') {
      whereClause = sql`${whereClause} AND ${users.plan} = ${plan}`;
    }
    if (search) {
      whereClause = sql`${whereClause} AND (${users.email} ILIKE ${'%' + search + '%'} OR ${users.firstName} ILIKE ${'%' + search + '%'})`;
    }

    // Fetch users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        plan: users.plan,
        subscriptionStatus: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        commissionRate: users.commissionRate,
        createdAt: users.createdAt,
        aiTokensUsed: users.aiTokensUsed,
        credits: users.credits,
      })
      .from(users)
      .limit(Number(limit))
      .offset(offset);

    // Mask emails in list view
    const maskedUsers = allUsers.map((u) => ({
      ...u,
      emailMasked: maskEmail(u.email || ''),
      email: undefined, // Remove full email from list
    }));

    // Count total
    const [{ count }] = await db.select({ count: sql`count(*)::int` }).from(users);

    Logger.info(`Admin fetched ${allUsers.length} users (page ${page})`);

    res.json({
      ok: true,
      data: {
        users: maskedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Get users error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get single user details (full access)
 * GET /api/admin/users/:id
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // Get subscription details
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    // Get last 30 days usage
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usageRecords = await db
      .select()
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, id), gte(aiUsage.createdAt, thirtyDaysAgo)))
      .orderBy(desc(aiUsage.createdAt))
      .limit(100);

    // Get recent community messages
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, id))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    // Get orders as buyer and seller
    const buyerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, id))
      .limit(10);

    const sellerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, id))
      .limit(10);

    Logger.info(`Admin viewed user details: ${id}`);

    res.json({
      ok: true,
      data: {
        user,
        subscription,
        usage: {
          last30Days: usageRecords,
          totalTokens: usageRecords.reduce((sum, u) => sum + (u.tokensIn || 0) + (u.tokensOut || 0), 0),
          totalRequests: usageRecords.length,
        },
        community: {
          recentMessages,
          messageCount: recentMessages.length,
        },
        orders: {
          asBuyer: buyerOrders,
          asSeller: sellerOrders,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Get user details error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Update user plan (manual override for testing)
 * PATCH /api/admin/users/:id/plan
 */
router.patch('/users/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['free', 'plus', 'pro'].includes(plan)) {
      return res.status(400).json({ ok: false, error: 'Invalid plan' });
    }

    // Update plan and commission rate
    const commissionRates = { free: 7, plus: 4, pro: 1 };
    const limits = {
      free: { projects: 3, tokens: 0, credits: 0 },
      plus: { projects: 10, tokens: 20000, credits: 500 },
      pro: { projects: -1, tokens: -1, credits: 2000 },
    };

    await db
      .update(users)
      .set({
        plan,
        commissionRate: commissionRates[plan as keyof typeof commissionRates],
        projectsLimit: limits[plan as keyof typeof limits].projects,
        aiTokensLimit: limits[plan as keyof typeof limits].tokens,
        credits: limits[plan as keyof typeof limits].credits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    Logger.info(`Admin updated user ${id} plan to ${plan}`);

    // Log audit
    const adminId = (req as any).user?.id || 'system';
    await db.insert(adminLogs).values({
      adminUserId: adminId,
      action: 'plan_changed',
      entityType: 'user',
      entityId: id,
      details: { oldPlan: 'unknown', newPlan: plan },
    });

    res.json({ ok: true, message: 'Plan updated successfully' });
  } catch (error: any) {
    Logger.error('Update user plan error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Promote user to admin
 * PATCH /api/admin/users/:id/role
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role' });
    }

    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));

    Logger.info(`Admin updated user ${id} role to ${role}`);

    res.json({ ok: true, message: 'Role updated successfully' });
  } catch (error: any) {
    Logger.error('Update user role error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get Stripe revenue summary (cached 60s)
 * GET /api/admin/revenue/stripe-summary?range=30d
 */
let stripeCache: any = null;
let stripeCacheTime = 0;

router.get('/revenue/stripe-summary', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const now = Date.now();

    // Check cache (60s)
    if (stripeCache && now - stripeCacheTime < 60000) {
      return res.json({ ok: true, data: stripeCache, cached: true });
    }

    // Fetch from Stripe (if configured)
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return res.json({
        ok: true,
        data: {
          mrr: 0,
          arr: 0,
          activeSubscriptions: 0,
          canceledSubscriptions: 0,
          planSplits: { plus: 0, pro: 0 },
          revenueSeriesLast12Weeks: [],
        },
        mock: true,
      });
    }

    try {
      // Get active subscriptions
      const subs = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      });

      // Calculate MRR
      let mrr = 0;
      const planSplits = { plus: 0, pro: 0 };

      subs.data.forEach((sub) => {
        const amount = sub.items.data[0]?.price?.unit_amount || 0;
        mrr += amount;

        const priceId = sub.items.data[0]?.price?.id;
        if (priceId === process.env.STRIPE_PRICE_ID_PLUS) planSplits.plus++;
        if (priceId === process.env.STRIPE_PRICE_ID_PRO) planSplits.pro++;
      });

      mrr = mrr / 100; // Convert to euros

      const summary = {
        mrr,
        arr: mrr * 12,
        activeSubscriptions: subs.data.length,
        canceledSubscriptions: 0, // TODO: Query canceled count
        planSplits,
        revenueSeriesLast12Weeks: [], // TODO: Query invoices
      };

      // Cache result
      stripeCache = summary;
      stripeCacheTime = now;

      res.json({ ok: true, data: summary });
    } catch (stripeError: any) {
      Logger.error('Stripe API error', stripeError);
      
      // Return mock data if Stripe fails
      res.json({
        ok: true,
        data: {
          mrr: 4752,
          arr: 57024,
          activeSubscriptions: 268,
          canceledSubscriptions: 12,
          planSplits: { plus: 198, pro: 70 },
          revenueSeriesLast12Weeks: [],
        },
        mock: true,
      });
    }
  } catch (error: any) {
    Logger.error('Get Stripe summary error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get marketplace commission analytics
 * GET /api/admin/revenue/commissions?range=30d
 */
router.get('/revenue/commissions', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const startDate = getDateRange(range as string);

    // Aggregate orders
    const allOrders = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, startDate))
      .orderBy(desc(orders.createdAt));

    const totalGMV = allOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalCommission = allOrders.reduce((sum, o) => sum + o.commission, 0);
    const totalPayout = allOrders.reduce((sum, o) => sum + o.sellerPayout, 0);

    // Top sellers
    const sellerMap = new Map<string, { sellerId: string; revenue: number; count: number }>();
    allOrders.forEach((order) => {
      const existing = sellerMap.get(order.sellerId) || {
        sellerId: order.sellerId,
        revenue: 0,
        count: 0,
      };
      existing.revenue += order.sellerPayout;
      existing.count++;
      sellerMap.set(order.sellerId, existing);
    });

    const topSellers = Array.from(sellerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      ok: true,
      data: {
        totalGMV,
        totalCommission,
        totalPayout,
        orderCount: allOrders.length,
        avgCommissionRate: allOrders.length > 0 ? totalCommission / totalGMV * 100 : 0,
        topSellers,
        dailySeries: [], // TODO: Group by day
      },
      range,
    });
  } catch (error: any) {
    Logger.error('Get commissions error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get AI usage aggregates
 * GET /api/admin/usage/aggregate?range=30d
 */
router.get('/usage/aggregate', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const startDate = getDateRange(range as string);

    const usageRecords = await db
      .select()
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, startDate));

    const totalTokensIn = usageRecords.reduce((sum, u) => sum + (u.tokensIn || 0), 0);
    const totalTokensOut = usageRecords.reduce((sum, u) => sum + (u.tokensOut || 0), 0);
    const totalTokens = totalTokensIn + totalTokensOut;
    const avgLatency = usageRecords.length > 0
      ? usageRecords.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / usageRecords.length
      : 0;

    // Group by feature
    const byFeature: Record<string, { count: number; tokens: number }> = {};
    usageRecords.forEach((u) => {
      const feature = u.feature || 'unknown';
      if (!byFeature[feature]) {
        byFeature[feature] = { count: 0, tokens: 0 };
      }
      byFeature[feature].count++;
      byFeature[feature].tokens += (u.tokensIn || 0) + (u.tokensOut || 0);
    });

    // Top users by token usage
    const userTokens = new Map<string, number>();
    usageRecords.forEach((u) => {
      const current = userTokens.get(u.userId) || 0;
      userTokens.set(u.userId, current + (u.tokensIn || 0) + (u.tokensOut || 0));
    });

    const topUsers = Array.from(userTokens.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, tokens]) => ({ userId, tokens }));

    res.json({
      ok: true,
      data: {
        totalRequests: usageRecords.length,
        totalTokens,
        totalTokensIn,
        totalTokensOut,
        avgLatency: Math.round(avgLatency),
        byFeature,
        topUsers,
      },
      range,
    });
  } catch (error: any) {
    Logger.error('Get usage aggregate error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get AI usage for specific user
 * GET /api/admin/usage/by-user/:userId?range=30d
 */
router.get('/usage/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { range = '30d' } = req.query;
    const startDate = getDateRange(range as string);

    const userUsage = await db
      .select()
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, startDate)))
      .orderBy(desc(aiUsage.createdAt));

    const totalTokens = userUsage.reduce(
      (sum, u) => sum + (u.tokensIn || 0) + (u.tokensOut || 0),
      0
    );

    res.json({
      ok: true,
      data: {
        usage: userUsage,
        totalRequests: userUsage.length,
        totalTokens,
      },
      range,
    });
  } catch (error: any) {
    Logger.error('Get user usage error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get community insights
 * GET /api/admin/community/insights?range=30d
 */
router.get('/community/insights', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const startDate = getDateRange(range as string);

    const allMessages = await db
      .select()
      .from(messages)
      .where(gte(messages.createdAt, startDate));

    // Group by channel
    const byChannel: Record<string, number> = {};
    allMessages.forEach((m) => {
      const channelId = m.channelId;
      byChannel[channelId] = (byChannel[channelId] || 0) + 1;
    });

    // Top contributors
    const contributorMap = new Map<string, number>();
    allMessages.forEach((m) => {
      const count = contributorMap.get(m.userId) || 0;
      contributorMap.set(m.userId, count + 1);
    });

    const topContributors = Array.from(contributorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, messageCount: count }));

    res.json({
      ok: true,
      data: {
        totalMessages: allMessages.length,
        byChannel,
        topContributors,
        botMessages: allMessages.filter((m) => m.isBot === 1).length,
      },
      range,
    });
  } catch (error: any) {
    Logger.error('Get community insights error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get AI quality metrics
 * GET /api/admin/ai/quality?range=30d
 */
router.get('/ai/quality', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const startDate = getDateRange(range as string);

    const feedbackRecords = await db
      .select()
      .from(aiFeedback)
      .where(gte(aiFeedback.createdAt, startDate));

    const avgRating =
      feedbackRecords.length > 0
        ? feedbackRecords.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackRecords.length
        : 0;

    const helpfulCount = feedbackRecords.filter((f) => f.helpful === 1).length;
    const helpfulRate = feedbackRecords.length > 0 ? (helpfulCount / feedbackRecords.length) * 100 : 0;

    const hallucinationCount = feedbackRecords.filter((f) => f.hallucinationFlag === 1).length;
    const hallucinationRate =
      feedbackRecords.length > 0 ? (hallucinationCount / feedbackRecords.length) * 100 : 0;

    const avgCitations =
      feedbackRecords.length > 0
        ? feedbackRecords.reduce((sum, f) => sum + (f.citationCount || 0), 0) / feedbackRecords.length
        : 0;

    res.json({
      ok: true,
      data: {
        totalFeedback: feedbackRecords.length,
        avgRating: parseFloat(avgRating.toFixed(2)),
        helpfulRate: parseFloat(helpfulRate.toFixed(2)),
        hallucinationRate: parseFloat(hallucinationRate.toFixed(2)),
        avgCitations: parseFloat(avgCitations.toFixed(2)),
      },
      range,
    });
  } catch (error: any) {
    Logger.error('Get AI quality error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Submit AI feedback
 * POST /api/admin/ai/feedback
 */
router.post('/ai/feedback', async (req, res) => {
  try {
    const { userId, sessionId, messageId, rating, helpful, notes, citationCount, hallucinationFlag } = req.body;

    await db.insert(aiFeedback).values({
      userId,
      sessionId: sessionId || null,
      messageId: messageId || null,
      rating: rating || null,
      helpful: helpful ? 1 : 0,
      notes: notes || null,
      citationCount: citationCount || 0,
      hallucinationFlag: hallucinationFlag ? 1 : 0,
    });

    Logger.info(`AI feedback submitted: session ${sessionId}, rating ${rating}`);

    res.json({ ok: true, message: 'Feedback submitted successfully' });
  } catch (error: any) {
    Logger.error('Submit AI feedback error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get system stats (existing endpoint - enhanced)
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // Count users by plan
    const allUsers = await db.select().from(users);
    const usersByPlan = {
      free: allUsers.filter((u) => u.plan === 'free').length,
      plus: allUsers.filter((u) => u.plan === 'plus').length,
      pro: allUsers.filter((u) => u.plan === 'pro').length,
    };

    // Count active subscriptions
    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    // Recent AI usage
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsage = await db
      .select()
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, twentyFourHoursAgo));

    // Recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, twentyFourHoursAgo));

    const stats = {
      uptime: process.uptime ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` : '0h 0m',
      totalUsers: allUsers.length,
      usersByPlan,
      totalProjects: 0, // TODO: Count from projects table
      totalKBDocs: 0, // TODO: Count from kb_documents
      aiRequestsToday: recentUsage.length,
      avgLatency: recentUsage.length > 0
        ? Math.round(recentUsage.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / recentUsage.length)
        : 0,
      errorRate: 0.02, // TODO: Calculate from error logs
      systemHealth: 'healthy',
      activeSubscriptions: activeSubs.length,
      ordersLast24h: recentOrders.length,
    };

    res.json({ ok: true, data: stats });
  } catch (error: any) {
    Logger.error('Failed to fetch admin stats', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get audit logs
 * GET /api/admin/logs/audit?limit=100
 */
router.get('/logs/audit', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(Number(limit));

    res.json({ ok: true, data: { logs } });
  } catch (error: any) {
    Logger.error('Get audit logs error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
