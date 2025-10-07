import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { insertTestimonialSchema, insertReferralCodeSchema, insertAnalyticsEventSchema } from "@shared/schema";

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

export function registerGrowthRoutes(app: Express) {
  // ===== TESTIMONIALS =====
  
  // Get featured testimonials (public)
  app.get("/api/testimonials/featured", async (_req: Request, res: Response) => {
    try {
      const testimonials = await storage.getFeaturedTestimonials(6);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching featured testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Get all approved testimonials (public)
  app.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const testimonials = await storage.getApprovedTestimonials(limit);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Submit a testimonial
  app.post("/api/testimonials", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = insertTestimonialSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid testimonial data",
          errors: validation.error.errors 
        });
      }

      const testimonial = await storage.createTestimonial(validation.data);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  // ===== REFERRALS =====
  
  // Get or create user's referral code
  app.get("/api/referrals/my-code", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let referralCode = await storage.getUserReferralCode(userId);
      
      if (!referralCode) {
        const user = await storage.getUser(userId);
        const code = `${user?.firstName?.toUpperCase().substring(0, 4) || 'USER'}${Date.now().toString().substring(-4)}`;
        
        referralCode = await storage.createReferralCode({
          userId,
          code,
        });
      }

      res.json(referralCode);
    } catch (error) {
      console.error("Error fetching referral code:", error);
      res.status(500).json({ message: "Failed to fetch referral code" });
    }
  });

  // Get user's referral conversions
  app.get("/api/referrals/conversions", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversions = await storage.getUserReferralConversions(userId);
      res.json(conversions);
    } catch (error) {
      console.error("Error fetching conversions:", error);
      res.status(500).json({ message: "Failed to fetch conversions" });
    }
  });

  // Validate referral code (public - for signup)
  app.get("/api/referrals/validate/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const referralCode = await storage.getReferralCodeByCode(code);
      
      if (!referralCode || referralCode.active !== 1) {
        return res.status(404).json({ valid: false, message: "Invalid referral code" });
      }

      res.json({ valid: true, code: referralCode.code });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate code" });
    }
  });

  // ===== ANALYTICS =====
  
  // Track an event
  app.post("/api/analytics/track", async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.claims?.sub || null;

      const validation = insertAnalyticsEventSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid event data",
          errors: validation.error.errors 
        });
      }

      const event = await storage.trackEvent(validation.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  // Get user analytics summary
  app.get("/api/analytics/summary", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const summary = await storage.getAnalyticsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get user events
  app.get("/api/analytics/events", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const events = await storage.getUserAnalytics(userId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching analytics events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
}
