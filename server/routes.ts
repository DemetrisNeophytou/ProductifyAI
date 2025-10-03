// Integration: blueprint:javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateProduct } from "./openai";
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

  const httpServer = createServer(app);
  return httpServer;
}
