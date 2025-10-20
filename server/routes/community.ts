/**
 * Community Routes
 * Tiered community channels with plan-based access control
 */

import { Router } from 'express';
import { db } from '../db';
import { channels, messages, users } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { hasFeatureAccess, PlanTier } from '../config/stripe';

const router = Router();

// Channel access mapping
const CHANNEL_ACCESS: Record<string, string> = {
  marketplace_public: 'public',
  creators_hub: 'plus',
  pro_founders_lounge: 'pro',
};

/**
 * Get available channels for user based on plan
 * GET /api/community/channels
 */
router.get('/channels', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    // Get user to check plan
    const [user] = await db.select().from(users).where(eq(users.id, userId as string)).limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    const userPlan = (user.plan || 'free') as PlanTier;

    // Get all channels
    const allChannels = await db
      .select()
      .from(channels)
      .where(eq(channels.isActive, 1))
      .orderBy(channels.createdAt);

    // Filter channels based on plan
    const accessibleChannels = allChannels.filter((channel) => {
      const accessLevel = channel.accessLevel;

      if (accessLevel === 'public') return true;
      if (accessLevel === 'plus') return userPlan === 'plus' || userPlan === 'pro';
      if (accessLevel === 'pro') return userPlan === 'pro';

      return false;
    });

    res.json({
      ok: true,
      data: {
        channels: accessibleChannels,
        userPlan,
      },
    });
  } catch (error: any) {
    Logger.error('Get channels error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Get messages for a channel
 * GET /api/community/:channelId/messages
 */
router.get('/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId, limit = 100, before } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    // Verify user has access to channel
    const [user] = await db.select().from(users).where(eq(users.id, userId as string)).limit(1);
    const [channel] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);

    if (!user || !channel) {
      return res.status(404).json({
        ok: false,
        error: 'User or channel not found',
      });
    }

    // Check access level
    const userPlan = (user.plan || 'free') as PlanTier;
    const canAccess =
      channel.accessLevel === 'public' ||
      (channel.accessLevel === 'plus' && (userPlan === 'plus' || userPlan === 'pro')) ||
      (channel.accessLevel === 'pro' && userPlan === 'pro');

    if (!canAccess) {
      return res.status(403).json({
        ok: false,
        error: `This channel requires ${channel.accessLevel} plan`,
        upgradeUrl: `/upgrade?plan=${channel.accessLevel}`,
      });
    }

    // Get messages
    const channelMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        isBot: messages.isBot,
        createdAt: messages.createdAt,
        userId: messages.userId,
        userName: users.firstName,
        userEmail: users.email,
        userImage: users.profileImageUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(
        before
          ? and(
              eq(messages.channelId, channelId),
              // @ts-ignore - Drizzle type issue with timestamp comparison
              desc(messages.createdAt)
            )
          : eq(messages.channelId, channelId)
      )
      .orderBy(desc(messages.createdAt))
      .limit(Number(limit));

    res.json({
      ok: true,
      data: {
        messages: channelMessages.reverse(), // Reverse to show oldest first
        channel: {
          id: channel.id,
          name: channel.name,
          displayName: channel.displayName,
          description: channel.description,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Get messages error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Post a message to a channel
 * POST /api/community/:channelId/message
 */
router.post('/:channelId/message', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        ok: false,
        error: 'userId and content are required',
      });
    }

    // Verify user has access to channel
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [channel] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);

    if (!user || !channel) {
      return res.status(404).json({
        ok: false,
        error: 'User or channel not found',
      });
    }

    // Check access level
    const userPlan = (user.plan || 'free') as PlanTier;
    const canAccess =
      channel.accessLevel === 'public' ||
      (channel.accessLevel === 'plus' && (userPlan === 'plus' || userPlan === 'pro')) ||
      (channel.accessLevel === 'pro' && userPlan === 'pro');

    if (!canAccess) {
      return res.status(403).json({
        ok: false,
        error: `This channel requires ${channel.accessLevel} plan`,
        upgradeUrl: `/upgrade?plan=${channel.accessLevel}`,
      });
    }

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        userId,
        channelId,
        content,
        isBot: 0,
      })
      .returning();

    Logger.info(`Message posted: user ${userId} in channel ${channelId}`);

    res.json({
      ok: true,
      data: {
        message: {
          ...newMessage,
          userName: user.firstName,
          userEmail: user.email,
          userImage: user.profileImageUrl,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Post message error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Initialize default channels (run once during setup)
 * POST /api/community/init
 */
router.post('/init', async (req, res) => {
  try {
    const defaultChannels = [
      {
        name: 'marketplace_public',
        displayName: 'Marketplace Public',
        description: 'General discussions about marketplace products',
        accessLevel: 'public',
      },
      {
        name: 'creators_hub',
        displayName: 'Creators Hub',
        description: 'For Plus and Pro creators building digital products',
        accessLevel: 'plus',
      },
      {
        name: 'pro_founders_lounge',
        displayName: 'Pro Founders Lounge',
        description: 'Exclusive space for Pro members',
        accessLevel: 'pro',
      },
    ];

    for (const channel of defaultChannels) {
      // Check if channel already exists
      const [existing] = await db
        .select()
        .from(channels)
        .where(eq(channels.name, channel.name))
        .limit(1);

      if (!existing) {
        await db.insert(channels).values(channel);
        Logger.info(`Channel created: ${channel.name}`);
      }
    }

    res.json({
      ok: true,
      message: 'Channels initialized',
    });
  } catch (error: any) {
    Logger.error('Initialize channels error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;

