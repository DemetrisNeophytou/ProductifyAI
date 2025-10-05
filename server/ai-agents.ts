import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { storage } from './storage';

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Feature flag check
async function checkFeatureAccess(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user) return false;
  
  const featureEnabled = await storage.isFeatureEnabled('FEATURE_AGENTS', user.subscriptionTier || 'trial');
  return featureEnabled;
}

// Credit cost per agent type
const AGENT_COSTS = {
  builder: 5,   // Builder agent costs 5 credits per interaction
  design: 3,    // Design agent costs 3 credits per interaction
  content: 4,   // Content agent costs 4 credits per interaction
};

// Agent system prompts
const AGENT_PROMPTS = {
  builder: `You are the Builder Agent - an expert at helping users create digital products.
Your role:
- Help users structure their ebooks, courses, templates, and workbooks
- Generate outlines, chapter structures, and learning objectives
- Suggest profitable content ideas and product frameworks
- Guide users through the creation process step-by-step

Rules:
- Never mention competitor brands or names
- Focus on actionable, specific guidance
- Ask clarifying questions to understand user needs
- Provide structured, implementable solutions
- Keep responses under 500 words unless detailed structure is requested`,

  design: `You are the Design Agent - an expert at visual design and branding for digital products.
Your role:
- Help users choose colors, fonts, and visual themes
- Suggest layout improvements and design best practices
- Recommend image styles and visual elements
- Guide branding consistency across products

Rules:
- Never mention competitor brands or tools
- Focus on accessible, modern design principles
- Provide specific color codes (hex) and font suggestions
- Consider readability and user experience
- Keep responses focused and actionable`,

  content: `You are the Content Agent - an expert at writing compelling content for digital products.
Your role:
- Write chapters, sections, and lessons for ebooks and courses
- Create engaging headlines, introductions, and CTAs
- Improve existing content (polish, expand, shorten)
- Ensure content matches user's tone and audience

Rules:
- Never mention competitor brands or names
- Write in the user's specified tone (professional, casual, friendly, etc.)
- Focus on clear, valuable content
- Provide examples when helpful
- Keep responses actionable and ready to use`
};

// Create AI Agent Session
router.post('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentType, title } = req.body;

    if (!['builder', 'design', 'content'].includes(agentType)) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Check feature access
    const hasAccess = await checkFeatureAccess(userId);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Feature not available', 
        message: 'AI Agents are not available on your current plan' 
      });
    }

    // Create session
    const session = await storage.createAiAgentSession({
      userId,
      agentType,
      title: title || `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent Session`,
      messages: [],
      status: 'active',
      creditsUsed: 0,
    });

    res.json(session);
  } catch (error: any) {
    console.error('[AI Agent] Create session error:', error);
    res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

// Get user's agent sessions
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentType } = req.query;
    const sessions = await storage.getUserAiAgentSessions(
      userId,
      agentType as string | undefined
    );

    res.json(sessions);
  } catch (error: any) {
    console.error('[AI Agent] Get sessions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get sessions' });
  }
});

// Chat with AI Agent (streaming)
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId, message, agentType } = req.body;

    if (!sessionId || !message || !agentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check feature access
    const hasAccess = await checkFeatureAccess(userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Feature not available' });
    }

    // Check credits
    const currentCredits = await storage.getUserCredits(userId);
    const cost = AGENT_COSTS[agentType as keyof typeof AGENT_COSTS] || 5;

    if (currentCredits < cost) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        creditsNeeded: cost,
        currentCredits 
      });
    }

    // Get session
    const session = await storage.getAiAgentSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build conversation history
    const messages = session.messages || [];
    const conversationHistory: any[] = [
      { role: 'system', content: AGENT_PROMPTS[agentType as keyof typeof AGENT_PROMPTS] }
    ];

    // Add last 10 messages for context
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
      conversationHistory.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add new user message
    conversationHistory.push({ role: 'user', content: message });

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save messages to session
    const updatedMessages = [
      ...messages,
      { role: 'user' as const, content: message, timestamp: Date.now() },
      { role: 'assistant' as const, content: fullResponse, timestamp: Date.now() }
    ];

    await storage.updateAiAgentSession(sessionId, {
      messages: updatedMessages,
      creditsUsed: (session.creditsUsed || 0) + cost
    });

    // Deduct credits
    await storage.deductCredits(userId, cost, `ai_agent_${agentType}`, `${agentType} agent interaction`);

    // Log usage
    await storage.logFeatureUsage({
      userId,
      featureName: `ai_agent_${agentType}`,
      tokenCount: Math.floor(fullResponse.length / 4), // Approximate token count
      creditsCost: cost,
      metadata: { agentType, sessionId }
    });

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('[AI Agent] Chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

// Delete agent session
router.delete('/sessions/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    const session = await storage.getAiAgentSession(sessionId);

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await storage.deleteAiAgentSession(sessionId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[AI Agent] Delete session error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete session' });
  }
});

// Get credit balance
router.get('/credits', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const credits = await storage.getUserCredits(userId);
    const history = await storage.getUserCreditHistory(userId, 10);

    res.json({ credits, history });
  } catch (error: any) {
    console.error('[AI Agent] Get credits error:', error);
    res.status(500).json({ error: error.message || 'Failed to get credits' });
  }
});

export function registerAiAgentRoutes(app: express.Application) {
  app.use('/api/ai-agents', router);
}
