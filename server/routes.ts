// Integration: blueprint:javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateProduct, chatWithCoach, chatWithCoachStream, generateIdeas, generateOutline, generateContent, generateOffer, generateFunnel } from "./openai";
import aiGenerateRouter from "./ai-generate";
import { z } from "zod";
import { stripe } from "./stripe-config";
import { 
  initializeTrial, 
  hasActiveAccess, 
  checkSubscriptionLimits,
  updateSubscriptionFromStripe,
  cancelSubscriptionAccess,
} from "./subscription-helpers";
import type { SubscriptionTier, SubscriptionStatus } from "./stripe-config";
import { registerStripeRoutes } from "./stripe-routes";
import { registerGrowthRoutes } from "./growth-routes";
import {
  insertBrandKitSchema,
  insertProjectSchema,
  insertSectionSchema,
  insertAssetSchema,
  insertCommunityPostSchema,
  insertCommunityCommentSchema,
} from "@shared/schema";
import {
  communityPostLimiter,
  communityCommentLimiter,
  communityLikeLimiter,
  aiChatLimiter,
  aiGenerationLimiter,
  aiBuilderChatLimiter,
  checkoutLimiter,
  generalApiLimiter,
} from "./rate-limiter";

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // General rate limiting for all API routes
  app.use('/api', generalApiLimiter);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Health Check
  app.get("/api/v2/ai/health", async (_req, res) => {
    try {
      const { healthCheck } = await import('./llm-client');
      const status = await healthCheck();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ 
        ok: false, 
        model: process.env.OPENAI_MODEL || 'gpt-5',
        error: error?.message || 'Health check failed' 
      });
    }
  });

  // Projects routes (new structure)
  app.get("/api/projects", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userProjects = await storage.getUserProjects(userId);
      res.json(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Temporary: Keep old /api/products for backwards compatibility
  app.get("/api/products", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // TODO: Migrate old products or return empty array
      res.json([]);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products/generate", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { prompt, type, creativity, length, style } = req.body;

      if (!prompt || !type) {
        return res.status(400).json({ message: "Prompt and type are required" });
      }

      // Generate content using OpenAI
      const parsedCreativity = parseFloat(creativity) || 0.7;
      const parsedLength = parseInt(length) || 500;
      const parsedStyle = style || "professional";

      const content = await generateProduct({
        prompt,
        type,
        creativity: parsedCreativity,
        length: parsedLength,
        style: parsedStyle,
      });

      // TODO: Save to new projects/sections structure (Phase 2)
      // For now, return the generated content
      res.json({
        id: `temp-${Date.now()}`,
        userId,
        title: prompt.substring(0, 100),
        type,
        content,
        prompt,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error generating product:", error);
      
      // Handle specific AI generation errors
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please add credits to your OpenAI account or contact support.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service is temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (error?.message?.startsWith("AI_GENERATION_ERROR")) {
        return res.status(500).json({ 
          message: error.message.replace("AI_GENERATION_ERROR: ", ""),
          code: "AI_ERROR"
        });
      }
      
      res.status(500).json({ message: "Failed to generate product. Please try again." });
    }
  });

  app.post("/api/chat", isAuthenticated, aiChatLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { message, stream } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Import conversation history helpers
      const { addToConversationHistory } = await import('./openai');
      
      // Store user message ONCE before any AI call
      addToConversationHistory(userId, 'user', message);

      if (stream) {
        try {
          const { chatWithCoachStream } = await import('./openai');
          const streamResponse = await chatWithCoachStream(message, userId);

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          let fullResponse = '';
          try {
            for await (const chunk of streamResponse) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
            
            // Store the complete assistant response in conversation history
            if (fullResponse) {
              addToConversationHistory(userId, 'assistant', fullResponse);
            }
            
            res.write('data: [DONE]\n\n');
            res.end();
          } catch (streamError: any) {
            console.error("Error during streaming:", streamError);
            res.write(`data: ${JSON.stringify({ error: "Stream interrupted. Please try again." })}\n\n`);
            res.end();
          }
        } catch (streamInitError: any) {
          // If streaming fails (e.g., organization not verified), fall back to non-streaming
          console.log('[Chat] Streaming failed, falling back to non-streaming mode:', streamInitError.message);
          const { chatWithCoach } = await import('./openai');
          const response = await chatWithCoach(message, userId);
          
          // Store assistant response for fallback path
          addToConversationHistory(userId, 'assistant', response);
          
          res.json({ message: response });
        }
      } else {
        const { chatWithCoach } = await import('./openai');
        const response = await chatWithCoach(message, userId);
        
        // Store assistant response for non-streaming path
        addToConversationHistory(userId, 'assistant', response);
        
        res.json({ message: response });
      }
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please add credits to your OpenAI account or contact support.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service is temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (error?.message?.startsWith("AI_CHAT_ERROR")) {
        return res.status(500).json({ 
          message: error.message.replace("AI_CHAT_ERROR: ", ""),
          code: "AI_ERROR"
        });
      }
      
      res.status(500).json({ message: "Failed to get AI response. Please try again." });
    }
  });

  // Clear conversation history endpoint
  app.post("/api/chat/clear", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { clearConversationHistory } = await import('./openai');
      clearConversationHistory(userId);
      
      res.json({ success: true, message: "Conversation history cleared" });
    } catch (error: any) {
      console.error("Error clearing conversation:", error);
      res.status(500).json({ message: "Failed to clear conversation history" });
    }
  });

  // AI Content Generation Routes
  const generateOutlineSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.string().min(1, "Type is required"),
    description: z.string().optional(),
    audience: z.string().optional(),
    goal: z.string().optional(),
  });

  app.post("/api/generate-outline", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = generateOutlineSchema.parse(req.body);
      const { generateOutline } = await import('./openai');
      const result = await generateOutline(data);

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating outline:", error);
      res.status(500).json({ message: "Failed to generate outline" });
    }
  });

  const writeChapterSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.string().min(1, "Type is required"),
    context: z.string().optional(),
    audience: z.string().optional(),
    tone: z.string().optional(),
  });

  app.post("/api/write-chapter", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = writeChapterSchema.parse(req.body);
      const { writeChapter } = await import('./openai');
      const content = await writeChapter(data);

      res.json({ content });
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error writing chapter:", error);
      res.status(500).json({ message: "Failed to generate chapter content" });
    }
  });

  // AI Builders - Idea Finder
  const ideaFinderSchema = z.object({
    interests: z.string().min(1, "Interests are required"),
    timeAvailable: z.string().min(1, "Time availability is required"),
    audienceType: z.string().min(1, "Audience type is required"),
    experienceLevel: z.string().min(1, "Experience level is required"),
  });

  app.post("/api/builders/idea-finder", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = ideaFinderSchema.parse(req.body);
      const result = await generateIdeas(data);

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating ideas:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please add credits to your OpenAI account.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service is temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (error?.message?.startsWith("MISSING_API_KEY")) {
        return res.status(503).json({ 
          message: "OpenAI API key not configured. Please add your API key to the OPENAI_API_KEY secret in Replit Settings → Secrets.",
          code: "MISSING_API_KEY"
        });
      }
      
      res.status(500).json({ message: "Failed to generate ideas. Please try again." });
    }
  });

  // AI Builders - Outline Builder
  const outlineBuilderSchema = z.object({
    productType: z.string().min(1, "Product type is required"),
    topic: z.string().min(1, "Topic is required"),
    targetAudience: z.string().min(1, "Target audience is required"),
    mainGoal: z.string().min(1, "Main goal is required"),
    experienceLevel: z.string().min(1, "Experience level is required"),
  });

  app.post("/api/builders/outline", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = outlineBuilderSchema.parse(req.body);
      
      // Get subscription tier for Pro features
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || 'free';
      
      const result = await generateOutline({
        ...data,
        tier: tier === 'trial' ? 'plus' : tier,
      });

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating outline:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please add credits to your OpenAI account.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service is temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      res.status(500).json({ message: "Failed to generate outline. Please try again." });
    }
  });

  // AI Builders - Content Writer
  const contentWriterSchema = z.object({
    chapterTitle: z.string().min(1, "Chapter title is required"),
    mainPoints: z.string().min(1, "Main points are required"),
    targetLength: z.string().min(1, "Target length is required"),
    tone: z.string().min(1, "Tone is required"),
    format: z.string().min(1, "Format is required"),
  });

  app.post("/api/builders/content", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = contentWriterSchema.parse(req.body);
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || 'free';
      
      const result = await generateContent({
        ...data,
        tier: tier === 'trial' ? 'plus' : tier,
      });

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content. Please try again." });
    }
  });

  // AI Builders - Offer Builder
  const offerBuilderSchema = z.object({
    productName: z.string().min(1, "Product name is required"),
    productDescription: z.string().min(1, "Product description is required"),
    targetRevenue: z.string().min(1, "Target revenue is required"),
    targetAudience: z.string().min(1, "Target audience is required"),
  });

  app.post("/api/builders/offer", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = offerBuilderSchema.parse(req.body);
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || 'free';
      
      const result = await generateOffer({
        ...data,
        tier: tier === 'trial' ? 'plus' : tier,
      });

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating offer:", error);
      res.status(500).json({ message: "Failed to generate offer. Please try again." });
    }
  });

  // AI Builders - Funnel Planner
  const funnelPlannerSchema = z.object({
    productName: z.string().min(1, "Product name is required"),
    productPrice: z.string().min(1, "Product price is required"),
    hasAudience: z.string().min(1, "Audience status is required"),
    launchGoal: z.string().min(1, "Launch goal is required"),
  });

  app.post("/api/builders/funnel", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = funnelPlannerSchema.parse(req.body);
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || 'free';
      
      const result = await generateFunnel({
        ...data,
        tier: tier === 'trial' ? 'plus' : tier,
      });

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating funnel:", error);
      res.status(500).json({ message: "Failed to generate funnel. Please try again." });
    }
  });

  // Helper function to get builder-specific system prompts
  function getBuilderSystemPrompt(builderType: string): string {
    const prompts: Record<string, string> = {
      product_idea: `You are the Product Idea Builder, a GPT-5 powered AI that helps entrepreneurs validate €100k+ digital product ideas using Iman Gadzhi's frameworks.

Your role:
- Apply the 7-filter validation: Pain • Money • Access • Speed • Expertise • Passion • Scalability
- Suggest profitable niches in eBooks, courses, templates, memberships
- Validate market demand and competition
- Calculate realistic revenue projections
- Guide users through idea refinement

Be direct, data-driven, and focused on €100k+ revenue potential.`,

      market_research: `You are the Market Research Builder, a GPT-5 powered AI that conducts deep market analysis for digital products.

Your role:
- Analyze target audience demographics and psychographics
- Identify pain points and buying triggers
- Research competitor positioning and pricing
- Validate market size and growth potential
- Create customer avatars and journey maps
- Provide actionable insights for positioning

Be thorough, analytical, and focused on actionable intelligence.`,

      content_plan: `You are the Content Plan Builder, a GPT-5 powered AI that creates comprehensive content strategies for digital products.

Your role:
- Design product structure (chapters, modules, lessons)
- Create content outlines with learning objectives
- Plan content delivery and pacing
- Suggest multimedia elements and interactivity
- Optimize for completion and results
- Apply proven educational frameworks

Be structured, pedagogical, and focused on student success.`,

      launch_strategy: `You are the Launch Strategy Builder, a GPT-5 powered AI that designs €100k+ product launches.

Your role:
- Create pre-launch, launch, and post-launch timelines
- Design email sequences and automation
- Plan social media campaigns and content
- Build urgency with limited offers and bonuses
- Optimize pricing and payment plans
- Calculate launch metrics and goals

Be strategic, persuasive, and focused on conversion.`,

      scale_blueprint: `You are the Scale Blueprint Builder, a GPT-5 powered AI that creates growth systems for digital products.

Your role:
- Design automated sales funnels
- Create upsell and cross-sell strategies
- Build affiliate and partnership programs
- Implement retention and community systems
- Plan paid advertising and organic growth
- Develop systems for sustainable scaling

Be systematic, growth-focused, and results-oriented.`
    };

    return prompts[builderType] || prompts.product_idea;
  }

  // AI Sessions - Interactive conversational AI builders
  // GET /api/ai/sessions - Get all sessions for user
  app.get("/api/ai/sessions", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const builderType = req.query.builderType as string | undefined;
      const sessions = await storage.getUserAiSessions(userId, builderType);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching AI sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // POST /api/ai/sessions - Create new AI session
  const createSessionSchema = z.object({
    builderType: z.enum(["product_idea", "market_research", "content_plan", "launch_strategy", "scale_blueprint"]),
    title: z.string().min(1, "Title is required"),
    metadata: z.object({
      niche: z.string().optional(),
      productType: z.string().optional(),
      currentStep: z.number().optional(),
      totalSteps: z.number().optional(),
    }).optional(),
  });

  app.post("/api/ai/sessions", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = createSessionSchema.parse(req.body);
      const session = await storage.createAiSession({
        userId,
        ...data,
      });

      res.json(session);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error creating AI session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // GET /api/ai/sessions/:id - Get session with messages
  app.get("/api/ai/sessions/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessionId = req.params.id;
      const session = await storage.getAiSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await storage.getSessionMessages(sessionId);
      res.json({ ...session, messages });
    } catch (error: any) {
      console.error("Error fetching AI session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // POST /api/ai/sessions/:id/messages - Send message with streaming
  app.post("/api/ai/sessions/:id/messages", isAuthenticated, aiBuilderChatLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessionId = req.params.id;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      const session = await storage.getAiSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Save user message
      await storage.createAiMessage({
        sessionId,
        role: "user",
        content,
      });

      // Get conversation history
      const messages = await storage.getSessionMessages(sessionId);
      
      // Build conversation context string
      const conversationContext = messages
        .slice(-10) // Last 10 messages for context
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      // Set up streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const { askLLM } = await import('./llm-client');
      
      // Get builder-specific system prompt
      const systemPrompt = getBuilderSystemPrompt(session.builderType);
      
      let fullResponse = '';
      
      // Call askLLM with streaming enabled
      const stream = await askLLM({
        system: systemPrompt,
        user: `${conversationContext ? 'Previous conversation:\n' + conversationContext + '\n\nCurrent message:\n' : ''}${content}`,
        stream: true,
        mode: 'quality',
        maxTokens: 2000,
      }) as AsyncIterable<any>;

      // Process the stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
        }
      }

      // Save assistant message
      await storage.createAiMessage({
        sessionId,
        role: "assistant",
        content: fullResponse,
      });

      // Update session timestamp
      await storage.updateAiSession(sessionId, {});

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Error processing AI message:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  });

  // DELETE /api/ai/sessions/:id - Delete session
  app.delete("/api/ai/sessions/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessionId = req.params.id;
      const session = await storage.getAiSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteAiSession(sessionId);
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting AI session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  const expandContentSchema = z.object({
    originalContent: z.string().min(1, "Original content is required"),
    expandBy: z.string().min(1, "Expansion instructions are required"),
  });

  app.post("/api/expand", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = expandContentSchema.parse(req.body);
      const { expandContent } = await import('./openai');
      const expandedContent = await expandContent(data);

      res.json({ content: expandedContent });
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error expanding content:", error);
      res.status(500).json({ message: "Failed to expand content" });
    }
  });

  const suggestSchema = z.object({
    sectionTitle: z.string().min(1, "Section title is required"),
    currentContent: z.string().default(""),
    productType: z.string().min(1, "Product type is required"),
  });

  app.post("/api/suggest", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = suggestSchema.parse(req.body);
      const { suggestImprovements } = await import('./openai');
      const suggestions = await suggestImprovements(data);

      res.json({ suggestions });
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Error generating suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Unified AI Builder API Contract
  // Standardized endpoint for all builder modules
  app.post("/api/builders/unified", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { module, inputs, format, tier } = req.body;
      
      if (!module || !inputs) {
        return res.status(400).json({ message: "module and inputs are required" });
      }

      // Get user's subscription tier
      const user = await storage.getUser(userId);
      const userTier = tier || user?.subscriptionTier || 'free';
      
      const { handleBuilderRequest } = await import('./ai-builder-contracts');
      const response = await handleBuilderRequest({
        module,
        inputs,
        format: format || 'json',
        tier: userTier === 'trial' ? 'plus' : userTier
      });

      // Always return 200 with standardized response
      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error in unified builder:", error);
      
      // Still return 200 with error structure
      return res.status(200).json({
        ok: false,
        module: req.body.module || 'unknown',
        deliverables: [],
        kpis: [],
        nextActions: [`Error: ${error?.message || 'Unknown error occurred'}`]
      });
    }
  });

  // New simplified AI Generate endpoint
  app.use("/api/ai", isAuthenticated, aiGenerationLimiter, aiGenerateRouter);

  app.delete("/api/products/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projectId = req.params.id;
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteProject(projectId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Brand Kit routes
  app.get("/api/brand-kit", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const brandKit = await storage.getBrandKit(userId);
      res.json(brandKit);
    } catch (error) {
      console.error("Error fetching brand kit:", error);
      res.status(500).json({ message: "Failed to fetch brand kit" });
    }
  });

  app.post("/api/brand-kit", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const brandKitData = insertBrandKitSchema.parse({ ...req.body, userId });
      const brandKit = await storage.upsertBrandKit(brandKitData);
      res.json(brandKit);
    } catch (error) {
      console.error("Error saving brand kit:", error);
      res.status(500).json({ message: "Failed to save brand kit" });
    }
  });

  // Project CRUD routes
  app.post("/api/projects", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      
      // If a template is selected, create sections from template
      if (req.body.templateId) {
        const { PRODUCT_TEMPLATES } = await import('@shared/templates');
        const template = PRODUCT_TEMPLATES.find(t => t.id === req.body.templateId);
        if (template) {
          for (const section of template.sections) {
            await storage.createSection({
              projectId: project.id,
              type: section.type,
              title: section.title,
              content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
              order: section.order,
            });
          }
        }
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      // Hydrate with sections
      const sections = await storage.getProjectSections(project.id);
      res.json({ ...project, sections });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.post("/api/projects/:id/duplicate", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const duplicated = await storage.duplicateProject(req.params.id, userId);
      res.json(duplicated);
    } catch (error) {
      console.error("Error duplicating project:", error);
      res.status(500).json({ message: "Failed to duplicate project" });
    }
  });

  // Export routes
  app.get("/api/projects/:id/export/pdf", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const sections = await storage.getProjectSections(project.id);
      const brandKit = await storage.getBrandKit(userId);
      const { generatePDF } = await import('./pdf-export');
      const { convertTipTapToPlainText } = await import('./content-converter');
      
      const pdfBytes = await generatePDF({
        title: project.title,
        type: project.type,
        description: project.description,
        sections: sections.map(s => ({
          title: s.title,
          content: convertTipTapToPlainText(s.content),
          order: s.order
        })),
        brandKit: brandKit ? {
          primaryColor: brandKit.primaryColor || undefined,
          secondaryColor: brandKit.secondaryColor || undefined,
          fonts: brandKit.fonts as any
        } : undefined
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/projects/:id/export/docx", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const sections = await storage.getProjectSections(project.id);
      const { generateDOCX } = await import('./docx-export');
      const { convertTipTapToPlainText } = await import('./content-converter');
      
      const docxBuffer = await generateDOCX({
        title: project.title,
        type: project.type,
        description: project.description,
        sections: sections.map(s => ({
          title: s.title,
          content: convertTipTapToPlainText(s.content),
          order: s.order
        }))
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.docx"`);
      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({ message: "Failed to generate DOCX" });
    }
  });

  // Section routes
  app.get("/api/projects/:projectId/sections", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const sections = await storage.getProjectSections(req.params.projectId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  app.post("/api/projects/:projectId/sections", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const sectionData = insertSectionSchema.parse({ ...req.body, projectId: req.params.projectId });
      const section = await storage.createSection(sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  app.patch("/api/sections/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateSection(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  app.delete("/api/sections/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteSection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  app.post("/api/sections/reorder", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId, sectionIds } = req.body;
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.reorderSections(projectId, sectionIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering sections:", error);
      res.status(500).json({ message: "Failed to reorder sections" });
    }
  });

  // AI Enhancement routes
  app.post("/api/sections/:id/enhance/polish", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { askLLM } = await import('./llm-client');
      const currentText = (section.content as any)?.text || "";
      
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Section has no content to polish" });
      }

      const result = await askLLM({
        system: "You are an expert copywriter specializing in digital products. Polish the user's content to improve clarity, flow, and professional tone while maintaining their voice. Return ONLY the improved text, no explanations.",
        user: `Section: ${section.title}\n\nCurrent content:\n${currentText}\n\nPolish this content to be more clear, professional, and engaging.`,
        mode: 'quality',
        timeout: 30000
      });

      const polishedText = (result as any).content;
      const updated = await storage.updateSection(req.params.id, { 
        content: { text: polishedText } 
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error polishing section:", error);
      res.status(500).json({ message: error?.message || "Failed to polish section" });
    }
  });

  app.post("/api/sections/:id/enhance/images", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { askLLMJSON } = await import('./llm-client');
      const currentText = (section.content as any)?.text || "";
      
      const result = await askLLMJSON<{ queries: string[] }>(
        "You suggest relevant Unsplash search queries for content sections. Return a JSON array of 3-5 search queries that would find great images for the content.",
        `Section: ${section.title}\n\nContent: ${currentText}\n\nSuggest Unsplash search queries for visuals that would enhance this section.`,
        {
          name: "image_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              queries: {
                type: "array",
                items: { type: "string" },
                description: "Array of Unsplash search queries"
              }
            },
            required: ["queries"],
            additionalProperties: false
          }
        },
        'quality'
      );

      res.json({ suggestions: result.queries || [] });
    } catch (error: any) {
      console.error("Error suggesting images:", error);
      res.status(500).json({ message: error?.message || "Failed to suggest images" });
    }
  });

  app.post("/api/sections/:id/enhance/seo", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { askLLMJSON } = await import('./llm-client');
      const currentText = (section.content as any)?.text || "";
      
      const result = await askLLMJSON<{
        keywords: string[];
        metaDescription: string;
        titleSuggestion: string;
      }>(
        "You are an SEO expert. Analyze content and suggest SEO improvements including keywords, meta descriptions, and title optimizations.",
        `Section: ${section.title}\n\nContent: ${currentText}\n\nProvide SEO recommendations.`,
        {
          name: "seo_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Recommended keywords"
              },
              metaDescription: {
                type: "string",
                description: "Optimized meta description"
              },
              titleSuggestion: {
                type: "string",
                description: "Optimized title"
              }
            },
            required: ["keywords", "metaDescription", "titleSuggestion"],
            additionalProperties: false
          }
        },
        'quality'
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error generating SEO recommendations:", error);
      res.status(500).json({ message: error?.message || "Failed to generate SEO recommendations" });
    }
  });

  app.post("/api/sections/:id/enhance/upsells", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { askLLMJSON } = await import('./llm-client');
      const currentText = (section.content as any)?.text || "";
      
      const result = await askLLMJSON<{
        ideas: Array<{
          title: string;
          description: string;
          type: 'upsell' | 'cross-sell' | 'bundle';
        }>;
      }>(
        "You are a digital product strategist. Suggest complementary products, upsells, and cross-sells based on the content.",
        `Project: ${project.title}\nSection: ${section.title}\n\nContent: ${currentText}\n\nSuggest 3-5 upsell/cross-sell ideas.`,
        {
          name: "upsell_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ideas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    type: { type: "string", enum: ["upsell", "cross-sell", "bundle"] }
                  },
                  required: ["title", "description", "type"],
                  additionalProperties: false
                }
              }
            },
            required: ["ideas"],
            additionalProperties: false
          }
        },
        'quality'
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error generating upsell ideas:", error);
      res.status(500).json({ message: error?.message || "Failed to generate upsell ideas" });
    }
  });

  // Asset routes
  app.get("/api/assets", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assets = await storage.getUserAssets(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get("/api/projects/:projectId/assets", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const assets = await storage.getProjectAssets(req.params.projectId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching project assets:", error);
      res.status(500).json({ message: "Failed to fetch project assets" });
    }
  });

  app.post("/api/assets", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assetData = insertAssetSchema.parse({ ...req.body, userId });
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.delete("/api/assets/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      if (asset.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteAsset(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Version routes
  app.get("/api/projects/:projectId/versions", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const versions = await storage.getProjectVersions(req.params.projectId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.post("/api/projects/:projectId/versions", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create snapshot of current project state
      const sections = await storage.getProjectSections(req.params.projectId);
      const snapshot = { project, sections };
      
      const version = await storage.createVersion({
        projectId: req.params.projectId,
        snapshot,
      });
      res.json(version);
    } catch (error) {
      console.error("Error creating version:", error);
      res.status(500).json({ message: "Failed to create version" });
    }
  });

  app.post("/api/versions/:versionId/restore", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const restored = await storage.restoreVersion(req.params.versionId);
      if (restored.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(restored);
    } catch (error) {
      console.error("Error restoring version:", error);
      res.status(500).json({ message: "Failed to restore version" });
    }
  });

  // Unsplash integration routes
  app.get("/api/unsplash/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { query, page = "1", per_page = "12" } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return res.status(500).json({ message: "Unsplash API key not configured" });
      }

      const searchUrl = new URL("https://api.unsplash.com/search/photos");
      searchUrl.searchParams.set("query", query);
      searchUrl.searchParams.set("page", page.toString());
      searchUrl.searchParams.set("per_page", per_page.toString());

      const response = await fetch(searchUrl.toString(), {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching Unsplash:", error);
      res.status(500).json({ message: "Failed to search Unsplash" });
    }
  });

  app.post("/api/unsplash/import", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate request body
      const { z } = await import("zod");
      const unsplashImportSchema = z.object({
        unsplashId: z.string().min(1),
        url: z.string().url(),
        width: z.number().positive().int().or(z.string().transform((v) => {
          const num = Number(v);
          if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
            throw new Error('Width must be a positive integer');
          }
          return num;
        })),
        height: z.number().positive().int().or(z.string().transform((v) => {
          const num = Number(v);
          if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
            throw new Error('Height must be a positive integer');
          }
          return num;
        })),
        photographer: z.string(),
        photographerUrl: z.string().url(),
        download_location: z.string().url().optional(),
      });

      const validation = unsplashImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      const { unsplashId, url, width, height, photographer, photographerUrl, download_location } = validation.data;

      // Strict URL validation helper (prevent SSRF)
      const isValidUnsplashHostname = (hostname: string): boolean => {
        return hostname === 'unsplash.com' || hostname.endsWith('.unsplash.com');
      };
      
      // Validate image URL
      const imageUrl = new URL(url);
      if (imageUrl.protocol !== 'https:' || !isValidUnsplashHostname(imageUrl.hostname)) {
        return res.status(400).json({ message: "Invalid image URL - must be HTTPS from Unsplash" });
      }

      // Validate photographer URL (prevent SSRF via metadata)
      const photographerUrlParsed = new URL(photographerUrl);
      if (photographerUrlParsed.protocol !== 'https:' || !isValidUnsplashHostname(photographerUrlParsed.hostname)) {
        return res.status(400).json({ message: "Invalid photographer URL - must be HTTPS from Unsplash" });
      }

      // Trigger download endpoint (required by Unsplash API guidelines)
      // Only if download_location is provided and is from Unsplash API domain
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (accessKey && download_location) {
        try {
          const downloadUrl = new URL(download_location);
          // Strict validation: must be HTTPS from Unsplash domain (exact or subdomain)
          if (downloadUrl.protocol !== 'https:' || !isValidUnsplashHostname(downloadUrl.hostname)) {
            console.warn("Invalid download_location - must be HTTPS from Unsplash API, skipping trigger");
          } else {
            const downloadResponse = await fetch(download_location, {
              headers: {
                Authorization: `Client-ID ${accessKey}`,
              },
            });
            if (!downloadResponse.ok) {
              console.error("Failed to trigger Unsplash download:", downloadResponse.statusText);
              // Log but don't fail the import - Unsplash download trigger is best-effort
            }
          }
        } catch (err) {
          console.error("Failed to trigger Unsplash download:", err);
          // Log but don't fail the import
        }
      }

      // Create asset record
      const asset = await storage.createAsset({
        userId,
        projectId: null,
        type: "image",
        url,
        filename: `unsplash-${unsplashId}.jpg`,
        metadata: {
          size: 0,
          mimeType: "image/jpeg",
          width: Number(width),
          height: Number(height),
          unsplash: {
            id: unsplashId,
            photographer,
            photographerUrl,
          },
        } as any,
      });

      res.json(asset);
    } catch (error) {
      console.error("Error importing Unsplash image:", error);
      res.status(500).json({ message: "Failed to import image" });
    }
  });

  // Stripe subscription routes
  app.get("/api/subscription/status", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const limits = await checkSubscriptionLimits(userId);
      res.json(limits);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });

  app.get("/api/usage", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { projects } = await storage.getUserProjects(userId);

      res.json({
        aiTokensUsed: user.aiTokensUsed || 0,
        aiTokensLimit: user.aiTokensLimit || 5000,
        projectsUsed: projects.length,
        projectsLimit: user.projectsLimit || 3,
        tier: user.subscriptionTier || 'trial',
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage data" });
    }
  });

  app.post("/api/subscription/create-checkout", isAuthenticated, checkoutLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { priceId, tier } = req.body;
      
      if (!priceId || !tier) {
        return res.status(400).json({ message: "Price ID and tier are required" });
      }

      if (tier !== 'plus' && tier !== 'pro') {
        return res.status(400).json({ message: "Invalid tier. Must be 'plus' or 'pro'" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;
        
        await storage.updateUser(userId, {
          stripeCustomerId: customerId,
        });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';

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
        success_url: `${baseUrl}/projects?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          userId: userId,
          tier: tier,
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/subscription/portal", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription" });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/projects`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: error.message || "Failed to create portal session" });
    }
  });

  // Stripe webhook handler (raw body required)
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier as SubscriptionTier;

          if (userId && tier && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            await storage.updateUser(userId, {
              stripeSubscriptionId: subscription.id,
              subscriptionTier: tier,
              subscriptionStatus: 'active' as SubscriptionStatus,
              stripePriceId: subscription.items.data[0].price.id,
              subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          
          const status = subscription.status as SubscriptionStatus;
          const periodEnd = new Date(subscription.current_period_end * 1000);
          
          await storage.updateUserByStripeSubscription(subscription.id, {
            subscriptionStatus: status,
            subscriptionPeriodEnd: periodEnd,
            stripePriceId: subscription.items.data[0].price.id,
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          
          await storage.updateUserByStripeSubscription(subscription.id, {
            subscriptionStatus: 'cancelled' as SubscriptionStatus,
          });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          
          if (invoice.subscription) {
            await storage.updateUserByStripeSubscription(invoice.subscription, {
              subscriptionStatus: 'past_due' as SubscriptionStatus,
            });
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // Community routes
  app.get("/api/community/posts", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const posts = await storage.getCommunityPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/community/posts", isAuthenticated, communityPostLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validation = insertCommunityPostSchema.safeParse({ ...req.body, userId });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid post data", errors: validation.error });
      }

      const post = await storage.createCommunityPost(validation.data);
      res.json(post);
    } catch (error) {
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/community/posts/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const post = await storage.getCommunityPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const comments = await storage.getPostComments(req.params.id);
      res.json({ ...post, comments });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/community/posts/:id/comments", isAuthenticated, communityCommentLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validation = insertCommunityCommentSchema.safeParse({ 
        ...req.body, 
        userId,
        postId: req.params.id 
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: validation.error });
      }

      const comment = await storage.createCommunityComment(validation.data);
      await storage.incrementCommentCount(req.params.id);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post("/api/community/posts/:id/like", isAuthenticated, communityLikeLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await storage.togglePostLike(req.params.id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.delete("/api/community/posts/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const post = await storage.getCommunityPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      await storage.deleteCommunityPost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Register Stripe payment and subscription routes
  registerStripeRoutes(app);
  
  // Register growth tools routes (testimonials, referrals, analytics)
  registerGrowthRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
