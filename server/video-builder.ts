import express, { Request, Response } from 'express';
import { storage } from './storage';
import { videoRenderQueue } from './video-render-queue';

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

const router = express.Router();

// Pexels API for video clips
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// Search for video clips from Pexels
router.get('/search-clips', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query, perPage = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!PEXELS_API_KEY) {
      return res.status(500).json({ error: 'Pexels API key not configured' });
    }

    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query as string)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch clips from Pexels');
    }

    const data = await response.json();

    // Transform Pexels response to our format
    const clips = data.videos?.map((video: any) => ({
      id: video.id,
      url: video.video_files?.[0]?.link || '',
      thumbnail: video.image,
      duration: video.duration || 5,
      width: video.width,
      height: video.height,
      source: 'pexels',
    })) || [];

    res.json({ clips });
  } catch (error: any) {
    console.error('[Video Builder] Search clips error:', error);
    res.status(500).json({ error: error.message || 'Failed to search clips' });
  }
});

// Create video project
router.post('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, prompt, clips, captions, musicUrl } = req.body;

    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt are required' });
    }

    // Check feature access
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const featureEnabled = await storage.isFeatureEnabled('FEATURE_VIDEO_BUILDER', user.subscriptionTier || 'trial');
    if (!featureEnabled) {
      return res.status(403).json({ error: 'Feature not available on your plan' });
    }

    // Create video project (draft is free, rendering costs credits)
    const project = await storage.createVideoProject({
      userId,
      title,
      prompt,
      clips: clips || [],
      captions: captions || [],
      music: musicUrl ? { url: musicUrl } : undefined,
      status: 'draft',
      duration: clips?.reduce((sum: number, clip: any) => sum + (clip.duration || 5), 0) || 0,
    });

    res.json(project);
  } catch (error: any) {
    console.error('[Video Builder] Create project error:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

// Get user's video projects
router.get('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projects = await storage.getUserVideoProjects(userId);
    res.json(projects);
  } catch (error: any) {
    console.error('[Video Builder] Get projects error:', error);
    res.status(500).json({ error: error.message || 'Failed to get projects' });
  }
});

// Get specific video project
router.get('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const project = await storage.getVideoProject(id);

    if (!project || project.userId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('[Video Builder] Get project error:', error);
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
});

// Update video project
router.patch('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const project = await storage.getVideoProject(id);

    if (!project || project.userId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates = req.body;
    const updatedProject = await storage.updateVideoProject(id, updates);

    res.json(updatedProject);
  } catch (error: any) {
    console.error('[Video Builder] Update project error:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

// Render video (deduct credits and mark as rendering)
router.post('/projects/:id/render', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const project = await storage.getVideoProject(id);

    if (!project || project.userId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check credits
    const currentCredits = await storage.getUserCredits(userId);
    const videoCost = 50;

    if (currentCredits < videoCost) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        creditsNeeded: videoCost,
        currentCredits 
      });
    }

    // Deduct credits
    await storage.deductCredits(userId, videoCost, 'video_render', `Video render: ${project.title}`);

    // Update project status to rendering
    const updatedProject = await storage.updateVideoProject(id, {
      status: 'rendering',
    });

    // Log usage
    await storage.logFeatureUsage({
      userId,
      featureName: 'video_builder_render',
      creditsCost: videoCost,
      metadata: { projectId: id, title: project.title }
    });

    // Add to rendering queue (async, non-blocking)
    videoRenderQueue.addJob(id, userId);

    res.json({ 
      ...updatedProject, 
      message: 'Video rendering started. This may take a few minutes.',
      queuePosition: videoRenderQueue.getQueueLength()
    });
  } catch (error: any) {
    console.error('[Video Builder] Render error:', error);
    res.status(500).json({ error: error.message || 'Failed to render video' });
  }
});

// Delete video project
router.delete('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const project = await storage.getVideoProject(id);

    if (!project || project.userId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await storage.deleteVideoProject(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Video Builder] Delete project error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

export function registerVideoBuilderRoutes(app: express.Application) {
  app.use('/api/video-builder', router);
}
