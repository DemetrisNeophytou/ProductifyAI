import express, { Request } from 'express';
import OpenAI from 'openai';
import { db } from './db';
import { userNiches } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRAND_SAFE_HEADER = `
BRAND SAFETY RULES (NEVER BREAK):
- Do NOT mention or reference any competitor brand or individual by name.
- Speak generically (e.g., "a competing platform", "another creator") when comparisons are necessary.
- No quotes, paraphrases, or summaries that could identify competitors.
- If asked to name competitors, politely refuse and offer generic guidance.
- NEVER use emoji characters in any response.
`;

const NICHE_FINDER_PROMPT = `You are the Niche Finder AI for Productify AI - a platform helping users create €100k+ digital product businesses.

${BRAND_SAFE_HEADER}

Your job: Generate 5-7 profitable digital product niches based on user inputs.

SCORING SYSTEM (1-10 for each):
- **Pain**: How urgent/painful is the problem? (10 = desperate, bleeding neck, will pay anything)
- **Money**: Does the audience have disposable income? (10 = proven buyers, high LTV)
- **Speed**: How fast can we deliver results? (10 = quick wins, instant gratification)

COMPETITION LEVELS:
- **low**: Few competitors, underserved market
- **medium**: Moderate competition, differentiation possible
- **high**: Saturated market, requires unique positioning

For each niche, provide:
1. **Title**: Clear, specific niche name (e.g., "Time Management for Remote Workers")
2. **Description**: 1-2 sentence overview of the niche and who it serves
3. **Pain Score** (1-10) with brief justification
4. **Money Score** (1-10) with brief justification
5. **Speed Score** (1-10) with brief justification
6. **Competition Level** (low/medium/high)
7. **Suggested Offer**: One-line product idea (e.g., "Launch a €297 Notion Productivity System in 30 days")

After listing all niches, add an "AI Insights" section with 2-3 improvement suggestions:
Example: "You might get better results if you focus on online coaching instead of physical events" or "Your niche could perform better if you target casual players instead of pros."

Return ONLY valid JSON in this exact format:
{
  "niches": [
    {
      "title": "...",
      "description": "...",
      "painScore": 8,
      "moneyScore": 9,
      "speedScore": 7,
      "competitionLevel": "medium",
      "suggestedOffer": "..."
    }
  ],
  "aiInsights": "Your improvement suggestions here as a single string..."
}`;

// Generate niches with streaming
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { interests, timeAvailable, audienceType, experienceLevel } = req.body;
    
    if (!interests || !timeAvailable || !audienceType || !experienceLevel) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const userMessage = `
USER PROFILE:
- Interests/Skills: ${interests}
- Time Available: ${timeAvailable}
- Target Audience: ${audienceType}
- Experience Level: ${experienceLevel}

Generate 5-7 profitable niche ideas that match this profile. Return JSON only.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: NICHE_FINDER_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Parse and save niches to database
    try {
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.niches && Array.isArray(parsed.niches)) {
          const inputs = { interests, timeAvailable, audienceType, experienceLevel };
          
          // Save each niche to database
          for (const niche of parsed.niches) {
            await db.insert(userNiches).values({
              userId,
              title: niche.title,
              description: niche.description,
              painScore: niche.painScore,
              moneyScore: niche.moneyScore,
              speedScore: niche.speedScore,
              competitionLevel: niche.competitionLevel,
              suggestedOffer: niche.suggestedOffer,
              aiInsights: parsed.aiInsights || null,
              inputs,
            });
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse or save niches:', parseError);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Niche generation error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Get user's saved niches
router.get('/saved', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const niches = await db
      .select()
      .from(userNiches)
      .where(eq(userNiches.userId, userId))
      .orderBy(desc(userNiches.createdAt));

    res.json({ ok: true, niches });
  } catch (error: any) {
    console.error('Get niches error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Toggle save/unsave niche
router.patch('/:id/toggle-save', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const niche = await db
      .select()
      .from(userNiches)
      .where(eq(userNiches.id, id))
      .limit(1);

    if (!niche[0] || niche[0].userId !== userId) {
      return res.status(404).json({ ok: false, error: 'Niche not found' });
    }

    const newSavedValue = niche[0].saved === 1 ? 0 : 1;
    
    await db
      .update(userNiches)
      .set({ saved: newSavedValue })
      .where(eq(userNiches.id, id));

    res.json({ ok: true, saved: newSavedValue === 1 });
  } catch (error: any) {
    console.error('Toggle save error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Analyze a user-provided niche
router.post('/analyze', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { nicheIdea } = req.body;
    
    if (!nicheIdea) {
      return res.status(400).json({ ok: false, error: 'Missing niche idea' });
    }

    const analyzePrompt = `${BRAND_SAFE_HEADER}

You are analyzing a user's digital product niche idea.

Rate it across these dimensions (1-10 scale):
- **Pain**: How urgent/painful is the problem?
- **Money**: Does the audience have disposable income?
- **Speed**: How fast can results be delivered?
- **Competition Level**: low/medium/high

Also provide:
- **Strengths**: What's good about this niche (2-3 points)
- **Weaknesses**: What could be improved (2-3 points)
- **Suggestions**: Specific recommendations to improve the niche
- **Overall Score**: Sum of Pain + Money + Speed (max 30)

Return JSON only:
{
  "title": "Cleaned up niche name",
  "painScore": 8,
  "moneyScore": 7,
  "speedScore": 9,
  "competitionLevel": "medium",
  "totalScore": 24,
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1", "point 2"],
  "suggestions": "Detailed suggestions here...",
  "verdict": "One sentence overall verdict"
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: analyzePrompt },
        { role: 'user', content: `Analyze this niche idea: ${nicheIdea}` }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      res.json({ ok: true, analysis });
    } else {
      res.json({ ok: false, error: 'Failed to analyze niche' });
    }
  } catch (error: any) {
    console.error('Niche analysis error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
