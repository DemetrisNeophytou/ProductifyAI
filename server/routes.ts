// Integration: blueprint:javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateProduct, chatWithCoach, chatWithCoachStream, generateIdeas, generateOutline, generateContent, generateOffer, generateFunnel, generateTheme, generateAIImage } from "./openai";
import aiGenerateRouter from "./ai-generate";
import nichesRouter from "./niches";
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
import { registerAiAgentRoutes } from "./ai-agents";
import { registerVideoBuilderRoutes } from "./video-builder";
import {
  insertBrandKitSchema,
  insertProjectSchema,
  insertSectionSchema,
  insertPageSchema,
  insertBlockSchema,
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

  // Simple health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

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

  // Phase 3: Smart Project Search
  app.get("/api/projects/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { q: query, type, tag, from, to, status, starred, limit, offset } = req.query;
      
      const results = await storage.searchProjects({
        userId,
        query: query as string | undefined,
        type: type && type !== 'all' ? type as string : undefined,
        tag: tag as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
        status: status && status !== 'all' ? status as string : undefined,
        starred: starred === 'true' ? true : starred === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(results);
    } catch (error) {
      console.error("Error searching projects:", error);
      res.status(500).json({ message: "Failed to search projects" });
    }
  });

  // Template routes
  app.get("/api/templates/user-data", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const [favorites, recentUsage] = await Promise.all([
        storage.getUserTemplateFavorites(userId),
        storage.getUserRecentTemplateUsage(userId, 10),
      ]);
      
      res.json({
        favorites,
        recentlyUsed: recentUsage.map(u => u.templateId),
      });
    } catch (error) {
      console.error("Error fetching template data:", error);
      res.status(500).json({ message: "Failed to fetch template data" });
    }
  });

  app.post("/api/templates/:templateId/favorite", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { templateId } = req.params;
      const result = await storage.toggleTemplateFavorite(userId, templateId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling template favorite:", error);
      res.status(500).json({ message: "Failed to toggle template favorite" });
    }
  });

  app.post("/api/templates/:templateId/use", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { templateId } = req.params;
      const { projectId } = req.body;
      
      await storage.createTemplateUsage({
        userId,
        templateId,
        projectId: projectId || null,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking template usage:", error);
      res.status(500).json({ message: "Failed to track template usage" });
    }
  });

  app.get("/api/templates/recommendations", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const [userProjects, recentUsage] = await Promise.all([
        storage.getUserProjects(userId),
        storage.getUserRecentTemplateUsage(userId, 20),
      ]);
      
      const projectTypes = new Set(userProjects.map(p => p.type));
      const usedTemplateIds = new Set(recentUsage.map(u => u.templateId));
      
      const curatedRecommendations = [
        "fitness-ebook",
        "mindfulness-course",
        "social-media-checklist",
        "productivity-guide",
        "remote-work-guide",
        "instagram-growth"
      ];
      
      const recommendations = curatedRecommendations.filter(
        id => !usedTemplateIds.has(id)
      ).slice(0, 6);
      
      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/templates/generate", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { templateId, title, type, category, description } = req.body;

      if (!templateId || !title || !type) {
        return res.status(400).json({ message: "Template ID, title, and type are required" });
      }

      const { TEMPLATE_CATALOG } = await import("../shared/template-catalog");
      const template = TEMPLATE_CATALOG.find(t => t.id === templateId);

      if (!template || !template.templateStructure) {
        return res.status(404).json({ message: "Template not found or has no structure" });
      }

      const project = await storage.createProject({
        userId,
        title,
        type,
        templateId,
        metadata: {
          niche: category || "general",
          goal: description || "",
          audience: "Target audience",
          tone: "professional",
        }
      });

      if (!project?.id) {
        throw new Error("Failed to create project");
      }

      const OpenAI = (await import("openai")).default;
      const apiKey = process.env.OPENAI_API_KEY || 'placeholder-key-not-configured';
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not configured - using placeholder content");
      }
      
      const openai = new OpenAI({ apiKey });
      const sections = [];

      for (const [index, section] of Array.from(template.templateStructure.sections.entries())) {
        const systemPrompt = `You are an expert digital product creator. Generate compelling, professional content for a ${type} about "${title}".
Category: ${category || 'general'}
Section: ${section.title}

Create engaging, actionable content that delivers real value. Be specific and practical. Use a professional but friendly tone.`;

        const userPrompt = `Write the content for the "${section.title}" section of this ${type}. Make it approximately 300-500 words. Focus on delivering value and actionable insights.`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          });

          const generatedContent = completion.choices[0]?.message?.content || "Content will be generated here.";

          const createdSection = await storage.createSection({
            projectId: project.id,
            title: section.title,
            content: generatedContent,
            order: index
          });

          sections.push(createdSection);
        } catch (error) {
          console.error(`Error generating section ${section.title}:`, error);
          const createdSection = await storage.createSection({
            projectId: project.id,
            title: section.title,
            content: `Write your ${section.title.toLowerCase()} content here...`,
            order: index
          });
          sections.push(createdSection);
        }
      }

      res.json({
        id: project.id,
        title: project.title,
        type: project.type,
        sectionsCount: sections.length
      });
    } catch (error) {
      console.error("Error generating from template:", error);
      res.status(500).json({ message: "Failed to generate product from template" });
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
          const { StreamingBrandGuard } = await import('./brand-guard');
          const streamResponse = await chatWithCoachStream(message, userId);

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          // Create buffered brand guard to detect split words across chunks
          const brandGuard = new StreamingBrandGuard();
          let fullResponse = '';
          
          try {
            for await (const chunk of streamResponse) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // Apply buffered brand-guard filtering (detects split words)
                const safeContent = await brandGuard.processChunk(content);
                if (safeContent) {
                  fullResponse += safeContent;
                  res.write(`data: ${JSON.stringify({ content: safeContent })}\n\n`);
                }
              }
            }
            
            // Flush remaining buffer at end of stream
            const finalContent = await brandGuard.flush();
            if (finalContent) {
              fullResponse += finalContent;
              res.write(`data: ${JSON.stringify({ content: finalContent })}\n\n`);
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
          const { filterChunk } = await import('./brand-guard');
          const response = await chatWithCoach(message, userId);
          
          // Apply brand-guard filtering
          const safeResponse = await filterChunk(response, false);
          
          // Store assistant response for fallback path
          addToConversationHistory(userId, 'assistant', safeResponse);
          
          res.json({ message: safeResponse });
        }
      } else {
        const { chatWithCoach } = await import('./openai');
        const { filterChunk } = await import('./brand-guard');
        const response = await chatWithCoach(message, userId);
        
        // Apply brand-guard filtering
        const safeResponse = await filterChunk(response, false);
        
        // Store assistant response for non-streaming path
        addToConversationHistory(userId, 'assistant', safeResponse);
        
        res.json({ message: safeResponse });
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
      const result = await generateOutline({
        productType: data.type,
        topic: data.title,
        targetAudience: data.audience || 'general audience',
        mainGoal: data.goal || 'provide value',
        experienceLevel: 'beginner',
      });

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

  // Phase 3: AI Re-Styling
  app.post("/api/ai/restyle", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const usageCount = await storage.getUserAiUsageToday(userId, 'ai_restyle');
      const tier = user.subscriptionTier || 'trial';
      
      if (tier === 'trial' || tier === 'plus') {
        const limit = 3;
        if (usageCount >= limit) {
          return res.status(429).json({ 
            message: `Daily AI Re-Style limit reached (${limit}/day). Upgrade to Pro for unlimited re-styles.`,
            limit,
            used: usageCount
          });
        }
      }

      const { projectId, mood, prompt } = req.body;
      if (!projectId || !mood) {
        return res.status(400).json({ message: "Project ID and mood are required" });
      }

      const theme = await generateTheme({ mood, prompt });
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.updateProject(projectId, {
        metadata: {
          ...project.metadata,
          theme,
        }
      });

      await storage.createProjectEvent({
        projectId,
        userId,
        type: 'ai_restyle',
        meta: { themeApplied: mood }
      });

      res.json(theme);
    } catch (error: any) {
      console.error("Error generating theme:", error);
      res.status(500).json({ message: error.message || "Failed to generate theme" });
    }
  });

  // Phase 3: AI Image Generation
  app.post("/api/ai/image", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const usageCount = await storage.getUserAiUsageToday(userId, 'ai_image');
      const tier = user.subscriptionTier || 'trial';
      
      let limit = 200;
      if (tier === 'trial' || tier === 'plus') {
        limit = 10;
      }
      
      if (usageCount >= limit) {
        return res.status(429).json({ 
          message: `Daily AI Image limit reached (${limit}/day). ${tier === 'plus' ? 'Upgrade to Pro for more images.' : 'Upgrade for more images.'}`,
          limit,
          used: usageCount
        });
      }

      const { prompt, size, styleHint, projectId, pageId, blockId } = req.body;
      if (!prompt || !projectId) {
        return res.status(400).json({ message: "Prompt and project ID are required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const result = await generateAIImage({ prompt, size, styleHint });
      
      const asset = await storage.createAsset({
        userId,
        projectId,
        type: 'image',
        url: result.url,
        filename: `ai-generated-${Date.now()}.png`,
        metadata: {
          source: 'openai',
          license: 'free_commercial',
          blockId,
          aiPrompt: prompt,
        }
      });

      await storage.createProjectEvent({
        projectId,
        userId,
        type: 'ai_image',
        meta: { imagePrompt: prompt }
      });

      res.json({ ...result, assetId: asset.id });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: error.message || "Failed to generate image" });
    }
  });

  // Phase 3: Analytics Event Tracking
  app.post("/api/analytics/event", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId, type, meta } = req.body;
      if (!projectId || !type) {
        return res.status(400).json({ message: "Project ID and event type are required" });
      }

      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const event = await storage.createProjectEvent({
        projectId,
        userId,
        type,
        meta: meta || {}
      });

      res.json(event);
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  // Phase 3: Analytics Summary
  app.get("/api/analytics/summary", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId } = req.query;

      if (projectId) {
        const project = await storage.getProject(projectId as string);
        if (!project || project.userId !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const summary = await storage.getProjectAnalyticsSummary(projectId as string);
        res.json(summary);
      } else {
        const events = await storage.getUserProjectEvents(userId, 1000);
        
        const summary = {
          totalEvents: events.length,
          views: events.filter(e => e.type === 'view').length,
          exports: events.filter(e => e.type.startsWith('export_')).length,
          aiUsage: events.filter(e => e.type.startsWith('ai_')).length,
        };
        
        res.json(summary);
      }
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
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

  // Niches endpoint with dedicated routes for niche generation
  app.use("/api/niches", isAuthenticated, aiGenerationLimiter, nichesRouter);

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

  // AI Autopilot: Auto-generate complete digital products (all 6 types)
  const generateProductSchema = z.object({
    type: z.enum(['ebook', 'workbook', 'course', 'landing', 'emails', 'social']),
    topic: z.string().min(1, "Topic is required"),
    audience: z.string().min(1, "Audience is required"),
    tone: z.string().min(1, "Tone is required"),
    goal: z.string().min(1, "Goal is required"),
  });

  app.post("/api/projects/auto-generate", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = generateProductSchema.parse(req.body);
      console.log(`[API] Starting auto-generation for ${data.type} - User: ${userId}`);

      const { generateCompleteProduct } = await import('./openai');
      
      console.log('[API] Generating complete product with AI...');
      const productData = await generateCompleteProduct({
        type: data.type,
        topic: data.topic,
        audience: data.audience,
        tone: data.tone,
        goal: data.goal,
      });

      console.log('[API] Creating project in database...');
      const project = await storage.createProject({
        userId,
        type: data.type,
        title: productData.title || data.topic,
        status: "draft",
        metadata: {
          audience: data.audience,
          tone: data.tone,
          goal: data.goal,
          wordCount: productData.metadata?.wordCount || 0,
          imageCount: productData.metadata?.imageCount || 0,
          version: 1,
        },
        brand: productData.brand || {
          primary: "#7c3bed",
          secondary: "#19161d",
          font: "Inter",
          logoUrl: null,
        },
        outline: productData.outline || [],
      });

      console.log('[API] Creating content blocks...');
      for (const block of productData.blocks || []) {
        await storage.createSection({
          projectId: project.id,
          sectionId: block.sectionId,
          type: block.type || 'text',
          title: block.sectionId ? productData.outline.find((s: any) => s.id === block.sectionId)?.title || 'Untitled' : 'Untitled',
          content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: block.content || '' }] }] },
          imagePrompt: block.imagePrompt,
          order: productData.blocks.indexOf(block),
        });
      }

      console.log(`[API] Auto-generation complete - Project ${project.id} created with ${productData.blocks?.length || 0} blocks`);
      res.json({
        success: true,
        project,
        message: `Your ${data.type} has been generated successfully!`,
      });
    } catch (error: any) {
      console.error("[API] Auto-generation failed:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please check your OpenAI account or contact support.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (error?.message?.startsWith("AI_ERROR")) {
        return res.status(500).json({ 
          message: error.message.replace("AI_ERROR: ", ""),
          code: "AI_ERROR"
        });
      }
      
      res.status(500).json({ message: "Failed to generate product. Please try again." });
    }
  });

  // AI-powered full ebook generation (legacy endpoint - kept for backwards compatibility)
  const generateFullEbookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    niche: z.string().min(1, "Niche is required"),
    audience: z.string().min(1, "Audience is required"),
    tone: z.string().min(1, "Tone is required"),
    type: z.string().default("ebook"),
  });

  app.post("/api/projects/generate-full", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = generateFullEbookSchema.parse(req.body);
      console.log('[API] Starting full ebook generation for user:', userId);

      // Import AI functions
      const { generateCompleteEbook, generateEbookImage } = await import('./openai');
      
      // Step 1: Generate complete ebook content
      console.log('[API] Generating ebook content...');
      const ebookData = await generateCompleteEbook({
        title: data.title,
        niche: data.niche,
        audience: data.audience,
        tone: data.tone,
      });

      // Step 2: Create project in database
      console.log('[API] Creating project in database...');
      const project = await storage.createProject({
        userId,
        type: data.type,
        title: ebookData.title || data.title,
        status: "draft",
        metadata: {
          niche: data.niche,
          audience: data.audience,
          tone: data.tone,
        },
      });

      // Helper function to convert markdown to TipTap JSON
      const markdownToTipTap = (markdown: string) => {
        const lines = markdown.split('\n');
        const content = lines.map(line => {
          if (line.trim() === '') {
            return { type: 'paragraph', content: [{ type: 'text', text: '' }] };
          }
          // Basic markdown conversion - headings
          if (line.startsWith('### ')) {
            return { 
              type: 'heading', 
              attrs: { level: 3 },
              content: [{ type: 'text', text: line.replace('### ', '') }] 
            };
          }
          if (line.startsWith('## ')) {
            return { 
              type: 'heading', 
              attrs: { level: 2 },
              content: [{ type: 'text', text: line.replace('## ', '') }] 
            };
          }
          if (line.startsWith('# ')) {
            return { 
              type: 'heading', 
              attrs: { level: 1 },
              content: [{ type: 'text', text: line.replace('# ', '') }] 
            };
          }
          // Bullet points
          if (line.trim().startsWith('- ')) {
            return {
              type: 'bulletList',
              content: [{
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: [{ type: 'text', text: line.trim().replace(/^- /, '') }]
                }]
              }]
            };
          }
          // Regular paragraph
          return { 
            type: 'paragraph', 
            content: [{ type: 'text', text: line }] 
          };
        });
        
        return { type: 'doc', content };
      };

      // Step 3: Generate cover image and save it as an asset
      console.log('[API] Generating cover image...');
      let coverImageUrl = '';
      try {
        coverImageUrl = await generateEbookImage({
          prompt: ebookData.coverImagePrompt,
          type: 'cover',
        });
        
        // Save cover image as asset
        if (coverImageUrl) {
          await storage.createAsset({
            userId,
            projectId: project.id,
            type: 'cover',
            url: coverImageUrl,
            filename: `${project.title}-cover.png`,
            metadata: { width: 1024, height: 1024, mimeType: 'image/png' },
          });
          
          // Update project with cover image
          await storage.updateProject(project.id, { coverImageUrl });
        }
      } catch (imgError) {
        console.error('[API] Cover image generation failed:', imgError);
        // Continue without cover image - non-blocking
      }

      // Step 4: Create introduction section
      console.log('[API] Creating introduction section...');
      let introImageUrl = '';
      try {
        introImageUrl = await generateEbookImage({
          prompt: ebookData.introduction.imagePrompt,
          type: 'section',
        });
      } catch (imgError) {
        console.error('[API] Introduction image generation failed:', imgError);
      }

      await storage.createSection({
        projectId: project.id,
        type: 'intro',
        title: 'Introduction',
        content: markdownToTipTap(ebookData.introduction.content + (introImageUrl ? `\n\n![Introduction](${introImageUrl})` : '')),
        order: 0,
      });

      // Step 5: Create chapter sections with images
      console.log('[API] Creating chapters...');
      for (let i = 0; i < ebookData.chapters.length; i++) {
        const chapter = ebookData.chapters[i];
        let chapterImageUrl = '';
        
        try {
          chapterImageUrl = await generateEbookImage({
            prompt: chapter.imagePrompt,
            type: 'chapter',
          });
        } catch (imgError) {
          console.error(`[API] Chapter ${i + 1} image generation failed:`, imgError);
        }

        await storage.createSection({
          projectId: project.id,
          type: 'chapter',
          title: chapter.title,
          content: markdownToTipTap(
            `## ${chapter.headline}\n\n${chapter.content}` + 
            (chapterImageUrl ? `\n\n![${chapter.title}](${chapterImageUrl})` : '')
          ),
          order: i + 1,
        });
      }

      // Step 6: Create summary section
      console.log('[API] Creating summary section...');
      let summaryImageUrl = '';
      try {
        summaryImageUrl = await generateEbookImage({
          prompt: ebookData.summary.imagePrompt,
          type: 'section',
        });
      } catch (imgError) {
        console.error('[API] Summary image generation failed:', imgError);
      }

      await storage.createSection({
        projectId: project.id,
        type: 'summary',
        title: 'Summary',
        content: markdownToTipTap(ebookData.summary.content + (summaryImageUrl ? `\n\n![Summary](${summaryImageUrl})` : '')),
        order: ebookData.chapters.length + 1,
      });

      console.log('[API] Full ebook generation completed successfully');
      
      // Return the complete project
      const sections = await storage.getProjectSections(project.id);
      res.json({ 
        ...project, 
        sections,
        generated: {
          subtitle: ebookData.subtitle,
          chaptersCount: ebookData.chapters.length,
        }
      });
    } catch (error: any) {
      console.error("Error generating full ebook:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded. Please add credits to your OpenAI account.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("INVALID_API_KEY") || error?.message?.startsWith("MISSING_API_KEY")) {
        return res.status(500).json({ 
          message: "AI service is temporarily unavailable. Please contact support.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      
      res.status(500).json({ message: "Failed to generate ebook. Please try again." });
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

  // Regenerate section with new AI content
  const regenerateSectionSchema = z.object({
    sectionId: z.string(),
  });

  app.post("/api/projects/:id/regenerate-section", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
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

      const { sectionId } = regenerateSectionSchema.parse(req.body);
      const section = await storage.getSection(sectionId);
      if (!section || section.projectId !== project.id) {
        return res.status(404).json({ message: "Section not found" });
      }

      console.log(`[API] Regenerating section ${sectionId} for project ${project.id}`);
      const { regenerateSection } = await import('./openai');
      
      const regenerated = await regenerateSection({
        sectionTitle: section.title,
        productType: project.type,
        audience: project.metadata?.audience || 'general audience',
        tone: project.metadata?.tone || 'professional',
        context: `This is part of a ${project.type} titled "${project.title}"`,
      });

      await storage.updateSection(sectionId, {
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: regenerated.content }] }] },
        imagePrompt: regenerated.imagePrompt,
      });

      const updated = await storage.getSection(sectionId);
      res.json({ success: true, section: updated });
    } catch (error: any) {
      console.error("[API] Section regeneration failed:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI quota exceeded.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("AI_ERROR")) {
        return res.status(500).json({ 
          message: error.message.replace("AI_ERROR: ", ""),
          code: "AI_ERROR"
        });
      }
      
      res.status(500).json({ message: "Failed to regenerate section" });
    }
  });

  // Generate image from prompt using DALL-E 3
  const generateImageSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    type: z.enum(['cover', 'section', 'chapter']).default('section'),
  });

  app.post("/api/images/generate", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { prompt, type } = generateImageSchema.parse(req.body);
      console.log(`[API] Generating ${type} image for user ${userId}`);

      const { generateEbookImage } = await import('./openai');
      const imageUrl = await generateEbookImage({ prompt, type });

      res.json({ success: true, imageUrl });
    } catch (error: any) {
      console.error("[API] Image generation failed:", error);
      
      if (error?.message?.startsWith("QUOTA_EXCEEDED")) {
        return res.status(429).json({ 
          message: "AI image quota exceeded.",
          code: "QUOTA_EXCEEDED"
        });
      }
      
      if (error?.message?.startsWith("AI_IMAGE_ERROR")) {
        return res.status(500).json({ 
          message: error.message.replace("AI_IMAGE_ERROR: ", ""),
          code: "AI_IMAGE_ERROR"
        });
      }
      
      res.status(500).json({ message: "Failed to generate image" });
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
        description: project.metadata?.niche || project.metadata?.goal || '',
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
        description: project.metadata?.niche || project.metadata?.goal || '',
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

  // Blocks-based export routes
  app.get("/api/projects/:id/export/blocks/pdf", isAuthenticated, async (req: AuthRequest, res) => {
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

      const pages = await storage.getProjectPages(project.id);
      const pagesWithBlocks = await Promise.all(
        pages.map(async (page) => {
          const blocks = await storage.getPageBlocks(page.id);
          return { ...page, blocks } as any;
        })
      );
      
      const brandKit = await storage.getBrandKit(userId);
      const { generateBlocksPDF } = await import('./blocks-pdf-export');
      
      const pdfBytes = await generateBlocksPDF({
        projectTitle: project.title,
        pages: pagesWithBlocks,
        brandKit: brandKit ? {
          primaryColor: brandKit.primaryColor || undefined,
          secondaryColor: brandKit.secondaryColor || undefined,
        } : undefined
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Error generating blocks PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/projects/:id/export/blocks/html", isAuthenticated, async (req: AuthRequest, res) => {
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

      const pages = await storage.getProjectPages(project.id);
      const pagesWithBlocks = await Promise.all(
        pages.map(async (page) => {
          const blocks = await storage.getPageBlocks(page.id);
          return { ...page, blocks } as any;
        })
      );
      
      const brandKit = await storage.getBrandKit(userId);
      const { generateBlocksHTML } = await import('./blocks-html-export');
      
      const html = generateBlocksHTML({
        projectTitle: project.title,
        pages: pagesWithBlocks,
        brandKit: brandKit ? {
          primaryColor: brandKit.primaryColor || undefined,
          secondaryColor: brandKit.secondaryColor || undefined,
          logo: brandKit.logoUrl || undefined,
          fonts: brandKit.fonts ? {
            heading: (brandKit.fonts as any).heading || undefined,
            body: (brandKit.fonts as any).body || undefined,
          } : undefined,
        } : undefined
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.html"`);
      res.send(html);
    } catch (error) {
      console.error("Error generating blocks HTML:", error);
      res.status(500).json({ message: "Failed to generate HTML" });
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

  // Page routes
  app.get("/api/projects/:projectId/pages", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const pages = await storage.getProjectPages(req.params.projectId);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.post("/api/projects/:projectId/pages", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const pageData = insertPageSchema.parse({ ...req.body, projectId: req.params.projectId });
      const page = await storage.createPage(pageData);
      res.json(page);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(500).json({ message: "Failed to create page" });
    }
  });

  app.patch("/api/pages/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updatePage(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.delete("/api/pages/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deletePage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  app.post("/api/pages/:id/duplicate", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const duplicated = await storage.duplicatePage(req.params.id);
      res.json(duplicated);
    } catch (error) {
      console.error("Error duplicating page:", error);
      res.status(500).json({ message: "Failed to duplicate page" });
    }
  });

  app.post("/api/pages/reorder", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId, pageIds } = req.body;
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.reorderPages(projectId, pageIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering pages:", error);
      res.status(500).json({ message: "Failed to reorder pages" });
    }
  });

  // Block routes
  app.get("/api/pages/:pageId/blocks", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const page = await storage.getPage(req.params.pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const blocks = await storage.getPageBlocks(req.params.pageId);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching blocks:", error);
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.post("/api/pages/:pageId/blocks", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const page = await storage.getPage(req.params.pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const blockData = insertBlockSchema.parse({ 
        ...req.body, 
        pageId: req.params.pageId, 
        projectId: page.projectId 
      });
      const block = await storage.createBlock(blockData);
      res.json(block);
    } catch (error) {
      console.error("Error creating block:", error);
      res.status(500).json({ message: "Failed to create block" });
    }
  });

  app.patch("/api/blocks/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const block = await storage.getBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ message: "Block not found" });
      }
      const project = await storage.getProject(block.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateBlock(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating block:", error);
      res.status(500).json({ message: "Failed to update block" });
    }
  });

  app.delete("/api/blocks/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const block = await storage.getBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ message: "Block not found" });
      }
      const project = await storage.getProject(block.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteBlock(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting block:", error);
      res.status(500).json({ message: "Failed to delete block" });
    }
  });

  app.post("/api/blocks/reorder", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { pageId, blockIds } = req.body;
      const page = await storage.getPage(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const project = await storage.getProject(page.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.reorderBlocks(pageId, blockIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering blocks:", error);
      res.status(500).json({ message: "Failed to reorder blocks" });
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

  app.post("/api/sections/:id/enhance/improve", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
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
      const currentContent = section.content;
      const currentText = (currentContent as any)?.text || JSON.stringify(currentContent);
      
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Section has no content to improve" });
      }

      const result = await askLLM({
        system: "You are an expert editor. Improve the writing quality, clarity, and impact of the content. Make it more engaging, persuasive, and professional. Return ONLY the improved content in TipTap JSON format.",
        user: `Section: ${section.title}\n\nCurrent content:\n${currentText}\n\nImprove this content to make it more compelling and effective.`,
        mode: 'quality',
        timeout: 30000
      });

      const improvedContent = (result as any).content;
      const updated = await storage.updateSection(req.params.id, { 
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: improvedContent }] }] }
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error improving section:", error);
      res.status(500).json({ message: error?.message || "Failed to improve section" });
    }
  });

  app.post("/api/sections/:id/enhance/shorten", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
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
      const currentContent = section.content;
      const currentText = (currentContent as any)?.text || JSON.stringify(currentContent);
      
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Section has no content to shorten" });
      }

      const result = await askLLM({
        system: "You are an expert editor. Make the content more concise while preserving key points and impact. Remove redundancy and keep only essential information. Return ONLY the shortened content.",
        user: `Section: ${section.title}\n\nCurrent content:\n${currentText}\n\nMake this content shorter and more concise.`,
        mode: 'quality',
        timeout: 30000
      });

      const shortenedContent = (result as any).content;
      const updated = await storage.updateSection(req.params.id, { 
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: shortenedContent }] }] }
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error shortening section:", error);
      res.status(500).json({ message: error?.message || "Failed to shorten section" });
    }
  });

  app.post("/api/sections/:id/enhance/expand", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
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
      const currentContent = section.content;
      const currentText = (currentContent as any)?.text || JSON.stringify(currentContent);
      
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Section has no content to expand" });
      }

      const result = await askLLM({
        system: "You are an expert editor. Expand the content with more details, examples, explanations, and depth while maintaining the original message. Add value and substance. Return ONLY the expanded content.",
        user: `Section: ${section.title}\n\nCurrent content:\n${currentText}\n\nExpand this content with more detail and examples.`,
        mode: 'quality',
        timeout: 30000
      });

      const expandedContent = (result as any).content;
      const updated = await storage.updateSection(req.params.id, { 
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: expandedContent }] }] }
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error expanding section:", error);
      res.status(500).json({ message: error?.message || "Failed to expand section" });
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
        "You suggest relevant stock photo search queries for content sections. Return a JSON array of 3-5 search queries that would find great images for the content.",
        `Section: ${section.title}\n\nContent: ${currentText}\n\nSuggest stock photo search queries for visuals that would enhance this section.`,
        {
          name: "image_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              queries: {
                type: "array",
                items: { type: "string" },
                description: "Array of stock photo search queries"
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

  // Consolidated AI Content Operations
  app.post("/api/ai/content", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId, blockId, op, tone, targetLang, context } = req.body;
      
      if (!projectId || !blockId || !op) {
        return res.status(400).json({ message: "Missing required fields: projectId, blockId, op" });
      }

      // Get the section/block
      const section = await storage.getSection(blockId);
      if (!section) {
        return res.status(404).json({ message: "Block not found" });
      }

      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const currentText = (section.content as any)?.text || "";
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Block has no content to process" });
      }

      const { askLLM } = await import('./llm-client');
      let systemPrompt = "";
      let userPrompt = "";

      switch (op) {
        case 'polish':
          systemPrompt = "You are an expert copywriter. Polish the content to improve clarity, flow, and professional tone while maintaining the original voice. Return ONLY the improved text.";
          userPrompt = `${context ? `Context: ${context}\n\n` : ""}Polish this content:\n${currentText}`;
          break;
        case 'shorten':
          systemPrompt = "You are an expert editor. Make the content more concise while preserving key points. Return ONLY the shortened text.";
          userPrompt = `${context ? `Context: ${context}\n\n` : ""}Shorten this content:\n${currentText}`;
          break;
        case 'expand':
          systemPrompt = "You are an expert writer. Expand the content with more detail, examples, and depth while maintaining coherence. Return ONLY the expanded text.";
          userPrompt = `${context ? `Context: ${context}\n\n` : ""}Expand this content:\n${currentText}`;
          break;
        case 'translate':
          if (!targetLang) {
            return res.status(400).json({ message: "targetLang is required for translation" });
          }
          systemPrompt = `You are an expert translator. Translate the content to ${targetLang} while preserving tone and meaning. Return ONLY the translated text.`;
          userPrompt = `Translate to ${targetLang}:\n${currentText}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid operation. Use: polish, shorten, expand, or translate" });
      }

      const result = await askLLM({
        system: systemPrompt,
        user: userPrompt,
        mode: 'quality',
        timeout: 30000
      });

      const newText = (result as any).content;
      const updated = await storage.updateSection(blockId, { 
        content: { text: newText } 
      });

      res.json({ blockId, newText });
    } catch (error: any) {
      console.error("Error processing AI content:", error);
      res.status(500).json({ message: error?.message || "Failed to process content" });
    }
  });

  // AI Re-Style
  app.post("/api/ai/restyle", isAuthenticated, aiGenerationLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId, blockId, tone } = req.body;
      
      if (!projectId || !blockId || !tone) {
        return res.status(400).json({ message: "Missing required fields: projectId, blockId, tone" });
      }

      if (!['professional', 'casual', 'inspirational', 'educational'].includes(tone)) {
        return res.status(400).json({ message: "Invalid tone. Use: professional, casual, inspirational, or educational" });
      }

      const section = await storage.getSection(blockId);
      if (!section) {
        return res.status(404).json({ message: "Block not found" });
      }

      const project = await storage.getProject(section.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const currentText = (section.content as any)?.text || "";
      if (!currentText.trim()) {
        return res.status(400).json({ message: "Block has no content to restyle" });
      }

      const { askLLM } = await import('./llm-client');
      const toneDescriptions: Record<string, string> = {
        professional: "formal, business-like, and authoritative",
        casual: "friendly, conversational, and approachable",
        inspirational: "motivating, uplifting, and encouraging",
        educational: "informative, clear, and instructive"
      };

      const result = await askLLM({
        system: `You are an expert copywriter. Rewrite the content in a ${toneDescriptions[tone]} tone. Maintain the core message but completely restyle the language and phrasing. Return ONLY the restyled text.`,
        user: `Rewrite this in a ${tone} tone:\n${currentText}`,
        mode: 'quality',
        timeout: 30000
      });

      const newText = (result as any).content;
      const updated = await storage.updateSection(blockId, { 
        content: { text: newText } 
      });

      res.json({ blockId, newText });
    } catch (error: any) {
      console.error("Error restyling content:", error);
      res.status(500).json({ message: error?.message || "Failed to restyle content" });
    }
  });

  // Unified Image Search
  app.get("/api/images/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { provider = 'pexels', q: query, page = '1', per_page = '12', orientation = '' } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      if (provider === 'pexels') {
        const apiKey = process.env.PEXELS_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ message: "Pexels API key not configured" });
        }

        const searchUrl = new URL("https://api.pexels.com/v1/search");
        searchUrl.searchParams.set("query", query);
        searchUrl.searchParams.set("page", page.toString());
        searchUrl.searchParams.set("per_page", per_page.toString());
        if (orientation && typeof orientation === 'string') {
          searchUrl.searchParams.set("orientation", orientation);
        }

        const response = await fetch(searchUrl.toString(), {
          headers: { Authorization: apiKey },
        });

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`);
        }

        const data = await response.json();
        const images = data.photos.map((photo: any) => ({
          url: photo.src.large,
          thumb: photo.src.medium,
          source: 'pexels',
          attribution: `Photo by ${photo.photographer}`,
          id: photo.id
        }));

        res.json({ images });
      } else if (provider === 'pixabay') {
        const apiKey = process.env.PIXABAY_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ message: "Pixabay API key not configured" });
        }

        const searchUrl = new URL("https://pixabay.com/api/");
        searchUrl.searchParams.set("key", apiKey);
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("page", page.toString());
        searchUrl.searchParams.set("per_page", per_page.toString());
        searchUrl.searchParams.set("image_type", "photo");
        if (orientation && typeof orientation === 'string') {
          searchUrl.searchParams.set("orientation", orientation);
        }

        const response = await fetch(searchUrl.toString());

        if (!response.ok) {
          throw new Error(`Pixabay API error: ${response.statusText}`);
        }

        const data = await response.json();
        const images = data.hits.map((hit: any) => ({
          url: hit.largeImageURL,
          thumb: hit.webformatURL,
          source: 'pixabay',
          attribution: `Image by ${hit.user}`,
          id: hit.id
        }));

        res.json({ images });
      } else {
        return res.status(400).json({ message: "Invalid provider. Use 'pexels' or 'pixabay'" });
      }
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({ message: "Failed to search images" });
    }
  });

  // Image Upload
  app.post("/api/images/upload", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // For now, return a placeholder since we don't have file upload configured
      // In production, this would handle multipart form data with multer or similar
      return res.status(501).json({ 
        message: "Image upload not yet implemented. Use stock image search instead." 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Brand Kit Apply
  app.post("/api/brand/apply", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId, colors, fonts, logoUrl } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Update project with brand kit
      const updated = await storage.updateProject(projectId, {
        brand: {
          ...project.brand,
          ...(colors && colors.length > 0 && { primary: colors[0], secondary: colors[1] || colors[0] }),
          ...(fonts && { font: fonts.heading || fonts.body }),
          ...(logoUrl && { logoUrl }),
        }
      });

      res.json({ applied: true, project: updated });
    } catch (error) {
      console.error("Error applying brand kit:", error);
      res.status(500).json({ message: "Failed to apply brand kit" });
    }
  });

  // Credits Estimate
  app.post("/api/credits/estimate", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { operation, params } = req.body;
      
      // Estimate credit costs based on operation type
      const creditCosts: Record<string, number> = {
        'ai_content_polish': 2,
        'ai_content_shorten': 2,
        'ai_content_expand': 3,
        'ai_content_translate': 3,
        'ai_restyle': 2,
        'ai_image_generate': 5,
        'export_pdf': 1,
        'export_png': 1,
        'export_html': 0,
      };

      const estimated = creditCosts[operation] || 1;
      res.json({ estimated, operation });
    } catch (error) {
      console.error("Error estimating credits:", error);
      res.status(500).json({ message: "Failed to estimate credits" });
    }
  });

  // Credits Deduct
  app.post("/api/credits/deduct", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount, operation } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid credit amount" });
      }

      // Get current user credit balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = user.credits || 0;
      if (currentBalance < amount) {
        return res.status(402).json({ 
          message: "Insufficient credits",
          balance: currentBalance,
          required: amount
        });
      }

      // Deduct credits
      await storage.updateUser(userId, { credits: currentBalance - amount });
      
      // Track event
      await storage.trackEvent({
        userId,
        eventType: 'credits_used',
        eventData: { operation, amount }
      });

      res.json({ balance: currentBalance - amount });
    } catch (error) {
      console.error("Error deducting credits:", error);
      res.status(500).json({ message: "Failed to deduct credits" });
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
      
      // Get current version count to determine version number
      const existingVersions = await storage.getProjectVersions(req.params.projectId);
      const versionNumber = existingVersions.length + 1;
      
      const version = await storage.createVersion({
        projectId: req.params.projectId,
        versionNumber,
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

  // Pexels integration routes (100% free for commercial use, no attribution required)
  app.get("/api/pexels/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { query, page = "1", per_page = "12", orientation = "" } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Pexels API key not configured" });
      }

      const searchUrl = new URL("https://api.pexels.com/v1/search");
      searchUrl.searchParams.set("query", query);
      searchUrl.searchParams.set("page", page.toString());
      searchUrl.searchParams.set("per_page", per_page.toString());
      if (orientation && typeof orientation === "string") {
        searchUrl.searchParams.set("orientation", orientation);
      }

      const response = await fetch(searchUrl.toString(), {
        headers: {
          Authorization: apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching Pexels:", error);
      res.status(500).json({ message: "Failed to search Pexels" });
    }
  });

  app.post("/api/pexels/import", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { z } = await import("zod");
      const pexelsImportSchema = z.object({
        pexelsId: z.number().positive().int(),
        url: z.string().url(),
        width: z.number().positive().int(),
        height: z.number().positive().int(),
        photographer: z.string(),
        photographerUrl: z.string().url(),
        alt: z.string().optional(),
      });

      const validation = pexelsImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      const { pexelsId, url, width, height, photographer, photographerUrl, alt } = validation.data;

      const isValidPexelsHostname = (hostname: string): boolean => {
        return hostname === 'pexels.com' || hostname.endsWith('.pexels.com') || 
               hostname === 'images.pexels.com';
      };
      
      const imageUrl = new URL(url);
      if (imageUrl.protocol !== 'https:' || !isValidPexelsHostname(imageUrl.hostname)) {
        return res.status(400).json({ message: "Invalid image URL - must be HTTPS from Pexels" });
      }

      const photographerUrlParsed = new URL(photographerUrl);
      if (photographerUrlParsed.protocol !== 'https:' || !isValidPexelsHostname(photographerUrlParsed.hostname)) {
        return res.status(400).json({ message: "Invalid photographer URL - must be HTTPS from Pexels" });
      }

      const asset = await storage.createAsset({
        userId,
        projectId: null,
        type: "image",
        url,
        filename: `pexels-${pexelsId}.jpg`,
        metadata: {
          size: 0,
          mimeType: "image/jpeg",
          width: Number(width),
          height: Number(height),
          source: "pexels",
          license: "free_commercial",
          pexels: {
            id: pexelsId,
            photographer,
            photographerUrl,
            alt: alt || "",
          },
        } as any,
      });

      res.json(asset);
    } catch (error) {
      console.error("Error importing Pexels image:", error);
      res.status(500).json({ message: "Failed to import image" });
    }
  });

  app.get("/api/pixabay/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { query, page = "1", per_page = "12", orientation = "" } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const apiKey = process.env.PIXABAY_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Pixabay API key not configured" });
      }

      const searchUrl = new URL("https://pixabay.com/api/");
      searchUrl.searchParams.set("key", apiKey);
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("page", page.toString());
      searchUrl.searchParams.set("per_page", per_page.toString());
      searchUrl.searchParams.set("image_type", "photo");
      if (orientation && typeof orientation === "string" && orientation !== "all") {
        searchUrl.searchParams.set("orientation", orientation);
      }

      const response = await fetch(searchUrl.toString());

      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching Pixabay:", error);
      res.status(500).json({ message: "Failed to search Pixabay" });
    }
  });

  app.post("/api/pixabay/import", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { z } = await import("zod");
      const pixabayImportSchema = z.object({
        pixabayId: z.number().positive().int(),
        url: z.string().url(),
        width: z.number().positive().int(),
        height: z.number().positive().int(),
        user: z.string(),
        userUrl: z.string().url(),
        tags: z.string().optional(),
      });

      const validation = pixabayImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      const { pixabayId, url, width, height, user, userUrl, tags } = validation.data;

      const isValidPixabayHostname = (hostname: string): boolean => {
        return hostname === 'pixabay.com' || hostname.endsWith('.pixabay.com');
      };
      
      const imageUrl = new URL(url);
      if (imageUrl.protocol !== 'https:' || !isValidPixabayHostname(imageUrl.hostname)) {
        return res.status(400).json({ message: "Invalid image URL - must be HTTPS from Pixabay" });
      }

      const userUrlParsed = new URL(userUrl);
      if (userUrlParsed.protocol !== 'https:' || !isValidPixabayHostname(userUrlParsed.hostname)) {
        return res.status(400).json({ message: "Invalid user URL - must be HTTPS from Pixabay" });
      }

      const asset = await storage.createAsset({
        userId,
        projectId: null,
        type: "image",
        url,
        filename: `pixabay-${pixabayId}.jpg`,
        metadata: {
          size: 0,
          mimeType: "image/jpeg",
          width: Number(width),
          height: Number(height),
          source: "pixabay",
          license: "free_commercial",
          pixabay: {
            id: pixabayId,
            user,
            userUrl,
            tags: tags || "",
          },
        } as any,
      });

      res.json(asset);
    } catch (error) {
      console.error("Error importing Pixabay image:", error);
      res.status(500).json({ message: "Failed to import image" });
    }
  });

  // Google Fonts API - fetch available fonts
  app.get("/api/fonts/google", async (_req, res) => {
    try {
      const apiKey = process.env.GOOGLE_FONTS_API_KEY;
      
      // Curated list of popular fonts (fallback if no API key)
      const fallbackFonts = [
        { family: "Inter", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
        { family: "Roboto", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Open Sans", category: "sans-serif", variants: ["regular", "600", "700"] },
        { family: "Lato", category: "sans-serif", variants: ["regular", "700"] },
        { family: "Montserrat", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
        { family: "Poppins", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
        { family: "Raleway", category: "sans-serif", variants: ["regular", "600", "700"] },
        { family: "Nunito", category: "sans-serif", variants: ["regular", "600", "700"] },
        { family: "Playfair Display", category: "serif", variants: ["regular", "700"] },
        { family: "Merriweather", category: "serif", variants: ["regular", "700"] },
        { family: "Source Sans Pro", category: "sans-serif", variants: ["regular", "600", "700"] },
        { family: "PT Sans", category: "sans-serif", variants: ["regular", "700"] },
        { family: "Oswald", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Noto Sans", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Ubuntu", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Quicksand", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Roboto Condensed", category: "sans-serif", variants: ["regular", "700"] },
        { family: "Mukta", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Rubik", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Work Sans", category: "sans-serif", variants: ["regular", "500", "600"] },
      ];

      if (!apiKey) {
        // Return fallback fonts if no API key
        return res.json({
          items: fallbackFonts,
          kind: "webfonts#webfontList",
          source: "fallback"
        });
      }

      // Fetch from Google Fonts API
      const apiUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error("Google Fonts API error:", response.statusText);
        // Fall back to curated list if API fails
        return res.json({
          items: fallbackFonts,
          kind: "webfonts#webfontList",
          source: "fallback"
        });
      }

      const data = await response.json();
      
      // Return the full list from the API, limited to first 100 most popular
      const limitedFonts = data.items.slice(0, 100);
      
      res.json({
        ...data,
        items: limitedFonts,
        source: "api"
      });
    } catch (error) {
      console.error("Error fetching Google Fonts:", error);
      
      // Fallback response on error
      const fallbackFonts = [
        { family: "Inter", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
        { family: "Roboto", category: "sans-serif", variants: ["regular", "500", "700"] },
        { family: "Open Sans", category: "sans-serif", variants: ["regular", "600", "700"] },
        { family: "Lato", category: "sans-serif", variants: ["regular", "700"] },
        { family: "Montserrat", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
        { family: "Poppins", category: "sans-serif", variants: ["regular", "500", "600", "700"] },
      ];
      
      res.json({
        items: fallbackFonts,
        kind: "webfonts#webfontList",
        source: "fallback"
      });
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

      const projects = await storage.getUserProjects(userId);

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
              subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
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

  // Photo search routes (Pexels + Pixabay fallback)
  app.get("/api/photos/search", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { q, orientation, color, page = "1" } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const perPage = 20;
      const pageNum = parseInt(page as string, 10);

      const searchPexels = async () => {
        const pexelsKey = process.env.PEXELS_API_KEY;
        if (!pexelsKey) return null;

        const params = new URLSearchParams({
          query: q as string,
          per_page: perPage.toString(),
          page: pageNum.toString(),
        });

        if (orientation && orientation !== 'all') {
          params.append('orientation', orientation as string);
        }
        if (color && color !== 'all') {
          params.append('color', color as string);
        }

        const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
          headers: { Authorization: pexelsKey },
        });

        if (!response.ok) return null;
        const data = await response.json();

        return data.photos?.map((photo: any) => ({
          id: `pexels-${photo.id}`,
          src: photo.src.medium,
          photographer: photo.photographer,
          url: photo.url,
          alt: photo.alt || q,
          source: 'pexels' as const,
        }));
      };

      const searchPixabay = async () => {
        const pixabayKey = process.env.PIXABAY_API_KEY;
        if (!pixabayKey) return null;

        const params = new URLSearchParams({
          key: pixabayKey,
          q: q as string,
          per_page: perPage.toString(),
          page: pageNum.toString(),
          image_type: 'photo',
        });

        if (orientation && orientation !== 'all') {
          params.append('orientation', orientation === 'landscape' ? 'horizontal' : orientation as string);
        }
        if (color && color !== 'all') {
          params.append('colors', color as string);
        }

        const response = await fetch(`https://pixabay.com/api/?${params}`);
        if (!response.ok) return null;
        const data = await response.json();

        return data.hits?.map((photo: any) => ({
          id: `pixabay-${photo.id}`,
          src: photo.webformatURL,
          photographer: photo.user,
          url: photo.pageURL,
          alt: photo.tags || q,
          source: 'pixabay' as const,
        }));
      };

      let photos = await searchPexels();
      if (!photos || photos.length === 0) {
        photos = await searchPixabay();
      }

      res.json(photos || []);
    } catch (error) {
      console.error("Error searching photos:", error);
      res.status(500).json({ message: "Failed to search photos" });
    }
  });

  app.post("/api/photos/insert", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId, src, source } = req.body;
      if (!projectId || !src || !source) {
        return res.status(400).json({ message: "Project ID, source URL, and source required" });
      }

      const validation = insertAssetSchema.safeParse({
        userId,
        projectId,
        type: 'image',
        url: src,
        metadata: {
          source,
          license: 'free_commercial',
        },
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid asset data", errors: validation.error });
      }

      const asset = await storage.createAsset(validation.data);
      res.json(asset);
    } catch (error) {
      console.error("Error inserting photo:", error);
      res.status(500).json({ message: "Failed to insert photo" });
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
      if (!brandKit) {
        const defaultBrandKit = {
          userId,
          colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
          fonts: { heading: "Inter", body: "Open Sans" },
        };
        const created = await storage.upsertBrandKit(defaultBrandKit);
        return res.json(created);
      }

      res.json(brandKit);
    } catch (error) {
      console.error("Error fetching brand kit:", error);
      res.status(500).json({ message: "Failed to fetch brand kit" });
    }
  });

  app.put("/api/brand-kit", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { fonts, colors, logoUrl } = req.body;
      if (!fonts || !colors) {
        return res.status(400).json({ message: "Fonts and colors required" });
      }

      const validation = insertBrandKitSchema.safeParse({
        userId,
        fonts,
        colors,
        logoUrl,
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid brand kit data", errors: validation.error });
      }

      const brandKit = await storage.upsertBrandKit(validation.data);
      res.json(brandKit);
    } catch (error) {
      console.error("Error updating brand kit:", error);
      res.status(500).json({ message: "Failed to update brand kit" });
    }
  });

  // Templates endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const { TEMPLATE_CATALOG, searchTemplates } = await import("@shared/template-catalog");
      
      const q = req.query.q as string;
      const type = req.query.type as string;
      const tag = req.query.tag as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      
      let templates = TEMPLATE_CATALOG;
      
      // Search filter
      if (q && q.trim()) {
        templates = searchTemplates(q.trim());
      }
      
      // Type filter
      if (type && type !== 'all') {
        templates = templates.filter(t => t.type === type);
      }
      
      // Tag filter
      if (tag) {
        templates = templates.filter(t => t.tags.includes(tag));
      }
      
      // Pagination
      const total = templates.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedTemplates = templates.slice(start, end);
      
      // Add slug if missing
      const templatesWithSlug = paginatedTemplates.map(t => ({
        ...t,
        slug: t.slug || t.id,
        thumbnailUrl: t.thumbnailUrl || t.previewImage || `/api/placeholder/template/${t.id}`,
      }));
      
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        templates: templatesWithSlug,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const { TEMPLATE_CATALOG } = await import("@shared/template-catalog");
      const { id } = req.params;
      
      const template = TEMPLATE_CATALOG.find(t => t.id === id || t.slug === id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Add slug and thumbnailUrl if missing
      const templateWithExtras = {
        ...template,
        slug: template.slug || template.id,
        thumbnailUrl: template.thumbnailUrl || template.previewImage || `/api/placeholder/template/${template.id}`,
      };
      
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(templateWithExtras);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Register Stripe payment and subscription routes
  registerStripeRoutes(app);
  
  // Register growth tools routes (testimonials, referrals, analytics)
  registerGrowthRoutes(app);

  // Phase 5: AI Agents
  registerAiAgentRoutes(app);

  // Phase 5: Video Builder
  registerVideoBuilderRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}


