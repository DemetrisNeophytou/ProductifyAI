// Integration: blueprint:javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateProduct, chatWithCoach } from "./openai";
import {
  insertBrandKitSchema,
  insertProjectSchema,
  insertSectionSchema,
  insertAssetSchema,
} from "@shared/schema";

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

  app.post("/api/chat", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await chatWithCoach(message);

      res.json({
        message: response,
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
