import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { ProjectService } from "../services/project-service";
import { MediaService } from "../services/media-service";
import { Logger } from "../utils/logger";

const router = Router();

// Media generation schema
const generateMediaSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(['image', 'video']).default('image'),
  style: z.string().optional(),
  quality: z.enum(['standard', 'hd']).optional().default('standard'),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
  projectId: z.string().optional()
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload image for project
router.post("/upload/:projectId", upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    // For now, we'll return a mock URL since we don't have Supabase Storage configured
    // In production, you would upload to Supabase Storage here
    const mockUrl = `https://example.com/uploads/${Date.now()}-${file.originalname}`;
    
    const projectService = ProjectService.getInstance();
    const asset = await projectService.saveAsset(
      req.body.userId || 'demo-user', // TODO: Get from auth
      projectId,
      {
        type: 'image',
        url: mockUrl,
        filename: file.originalname,
        metadata: {
          size: file.size,
          mimeType: file.mimetype,
          width: null, // Would be extracted from image in production
          height: null,
          source: 'upload'
        }
      }
    );

    res.json({
      success: true,
      data: {
        id: asset.id,
        url: mockUrl,
        filename: file.originalname,
        metadata: asset.metadata
      }
    });

  } catch (error: any) {
    Logger.error("Failed to upload image", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload image"
    });
  }
});

// Get project assets
router.get("/assets/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const projectService = ProjectService.getInstance();
    const assets = await projectService.getProjectAssets(projectId);
    
    res.json({
      success: true,
      data: assets
    });

  } catch (error: any) {
    Logger.error("Failed to get project assets", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get project assets"
    });
  }
});

// Generate AI Media
router.post("/generate", async (req, res) => {
  try {
    const { prompt, type, style, quality, size, projectId } = generateMediaSchema.parse(req.body);
    const userId = req.body.userId || 'demo-user'; // TODO: Get from auth
    
    Logger.info(`Generating ${type} for prompt: ${prompt}`);

    const mediaService = MediaService.getInstance();
    let asset;

    if (type === 'image') {
      asset = await mediaService.generateImage({
        prompt,
        type: 'image',
        style,
        quality,
        size,
        projectId
      }, userId);
    } else {
      asset = await mediaService.generateVideo({
        prompt,
        type: 'video',
        style,
        quality,
        size,
        projectId
      }, userId);
    }

    // Save the asset
    const savedAsset = await mediaService.saveAsset(asset);

    res.json({
      success: true,
      data: savedAsset
    });

  } catch (error: any) {
    Logger.error("Failed to generate media", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate media"
    });
  }
});

// Get Media Gallery
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const projectId = req.query.projectId as string;
    const assetId = req.query.assetId as string;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    const mediaService = MediaService.getInstance();
    let media = await mediaService.getUserMedia(userId, projectId);
    
    // Filter by specific asset ID if provided
    if (assetId) {
      media = media.filter(asset => asset.id === assetId);
    }
    
    res.json({
      success: true,
      data: media
    });

  } catch (error: any) {
    Logger.error("Failed to get media gallery", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get media gallery"
    });
  }
});

// Delete Media Asset
router.delete("/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const userId = req.body.userId || 'demo-user'; // TODO: Get from auth
    
    const mediaService = MediaService.getInstance();
    const success = await mediaService.deleteAsset(assetId, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Asset not found"
      });
    }

    res.json({
      success: true,
      message: "Asset deleted successfully"
    });

  } catch (error: any) {
    Logger.error("Failed to delete asset", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete asset"
    });
  }
});

export default router;


