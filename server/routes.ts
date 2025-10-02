// Integration: blueprint:javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateProduct } from "./openai";
import { insertProductSchema } from "@shared/schema";

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

  // Product routes
  app.get("/api/products", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userProducts = await storage.getUserProducts(userId);
      res.json(userProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products/generate", isAuthenticated, async (req: AuthRequest, res) => {
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
      const content = await generateProduct({
        prompt,
        type,
        creativity: parseFloat(creativity) || 0.7,
        length: parseInt(length) || 500,
        style: style || "professional",
      });

      // Save product to database
      const productData = insertProductSchema.parse({
        userId,
        title: prompt.substring(0, 100),
        type,
        content,
        prompt,
        creativity,
        length,
        style,
      });

      const product = await storage.createProduct(productData);
      res.json(product);
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

  app.delete("/api/products/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
