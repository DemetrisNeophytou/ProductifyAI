/**
 * AI Digital Products Expert
 * RAG-powered chat assistant with plan-based access and usage limits
 */

import { Router } from 'express';
import { db } from '../db';
import { users, aiExpertSessions, aiUsageLogs } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { PlanTier } from '../config/stripe';

const router = Router();

// Lazy load OpenAI
let openai: any = null;
async function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    const { OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Usage limits by plan
const USAGE_LIMITS = {
  free: 0,
  plus: 50, // 50 queries per month
  pro: -1, // unlimited
};

/**
 * Query AI Expert with RAG context
 * POST /api/ai/expert
 */
router.post('/expert', async (req, res) => {
  try {
    const { userId, query, context } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        ok: false,
        error: 'userId and query are required',
      });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    const userPlan = (user.plan || 'free') as PlanTier;

    // Check plan access
    if (userPlan === 'free') {
      return res.status(403).json({
        ok: false,
        error: 'AI Expert requires Plus or Pro plan',
        requiredPlan: 'plus',
        upgradeUrl: '/upgrade?plan=plus',
      });
    }

    // Check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [usageLog] = await db
      .select()
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.userId, userId),
          eq(aiUsageLogs.month, currentMonth)
        )
      )
      .limit(1);

    const currentUsage = usageLog?.queryCount || 0;
    const limit = USAGE_LIMITS[userPlan];

    if (limit !== -1 && currentUsage >= limit) {
      return res.status(429).json({
        ok: false,
        error: `You've reached your monthly limit of ${limit} queries`,
        userPlan,
        currentUsage,
        limit,
        upgradeUrl: '/upgrade?plan=pro',
      });
    }

    // Step 1: Get relevant context from knowledge base via RAG
    let ragContext = '';
    let sources: { title: string; source: string; score: number }[] = [];

    try {
      const ragResponse = await fetch(`${process.env.API_URL || 'http://localhost:5050'}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 3 }),
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData.ok && ragData.data.results) {
          ragContext = ragData.data.results
            .map((r: any) => `[KB: ${r.source}]\n${r.content}`)
            .join('\n\n---\n\n');

          sources = ragData.data.results.map((r: any) => ({
            title: r.title,
            source: r.source,
            score: r.score,
          }));
        }
      }
    } catch (error) {
      Logger.warn('RAG query failed, continuing without context', error);
    }

    // Step 2: Build system prompt with RAG context
    const systemPrompt = `You are the ProductifyAI Digital Products Expert — an AI assistant specialized in helping creators build, launch, and sell digital products.

Your expertise covers:
- Digital product strategy and ideation
- Pricing and monetization models
- Marketing and launch strategies
- SEO and content marketing
- Sales funnels and conversion optimization
- Branding and positioning
- Community building
- Analytics and growth

IMPORTANT INSTRUCTIONS:
1. Always cite your sources using [KB: filename.md] format when referencing knowledge base content
2. Provide actionable, specific advice tailored to digital products
3. Keep responses concise but comprehensive (aim for 200-400 words)
4. Use bullet points and structure for clarity
5. Be encouraging and supportive — you're helping creators succeed

${ragContext ? `\n=== KNOWLEDGE BASE CONTEXT ===\n${ragContext}\n===========================\n` : ''}

${context ? `\n=== ADDITIONAL CONTEXT ===\n${context}\n==========================\n` : ''}

Answer the user's question using the knowledge base context when relevant, and cite your sources.`;

    // Step 3: Get OpenAI client and generate AI response
    const client = await getOpenAI();
    if (!client) {
      return res.json({
        ok: true,
        data: {
          response: 'AI Expert is currently unavailable. Please configure OPENAI_API_KEY to enable this feature.',
          sources: [],
          usage: {
            queriesUsed: 0,
            queriesRemaining: limit === -1 ? 'unlimited' : limit,
            tokensUsed: 0,
          },
        },
        mock: true,
      });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4o' for better quality
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Step 4: Store session
    await db.insert(aiExpertSessions).values({
      userId,
      query,
      response,
      sources: sources.length > 0 ? sources : null,
      tokensUsed,
    });

    // Step 5: Update usage log
    if (usageLog) {
      await db
        .update(aiUsageLogs)
        .set({
          queryCount: usageLog.queryCount + 1,
          tokensUsed: usageLog.tokensUsed + tokensUsed,
          updatedAt: new Date(),
        })
        .where(eq(aiUsageLogs.id, usageLog.id));
    } else {
      await db.insert(aiUsageLogs).values({
        userId,
        month: currentMonth,
        queryCount: 1,
        tokensUsed,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // First day of next month
      });
    }

    Logger.info(`AI Expert query: user ${userId}, tokens ${tokensUsed}, sources ${sources.length}`);

    res.json({
      ok: true,
      data: {
        response,
        sources,
        usage: {
          queriesUsed: currentUsage + 1,
          queriesRemaining: limit === -1 ? 'unlimited' : limit - (currentUsage + 1),
          tokensUsed,
        },
      },
    });
  } catch (error: any) {
    Logger.error('AI Expert error', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to generate response',
    });
  }
});

/**
 * Get AI usage statistics
 * GET /api/ai/expert/usage
 */
router.get('/expert/usage', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId as string)).limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    const userPlan = (user.plan || 'free') as PlanTier;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [usageLog] = await db
      .select()
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.userId, userId as string),
          eq(aiUsageLogs.month, currentMonth)
        )
      )
      .limit(1);

    const limit = USAGE_LIMITS[userPlan];
    const used = usageLog?.queryCount || 0;

    res.json({
      ok: true,
      data: {
        plan: userPlan,
        queriesUsed: used,
        queriesLimit: limit,
        queriesRemaining: limit === -1 ? 'unlimited' : limit - used,
        tokensUsed: usageLog?.tokensUsed || 0,
        resetDate: usageLog?.resetDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });
  } catch (error: any) {
    Logger.error('Get AI usage error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Get AI session history
 * GET /api/ai/expert/history
 */
router.get('/expert/history', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required',
      });
    }

    const sessions = await db
      .select()
      .from(aiExpertSessions)
      .where(eq(aiExpertSessions.userId, userId as string))
      .orderBy(aiExpertSessions.createdAt)
      .limit(Number(limit));

    res.json({
      ok: true,
      data: {
        sessions: sessions.reverse(), // Most recent first
      },
    });
  } catch (error: any) {
    Logger.error('Get AI history error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;

