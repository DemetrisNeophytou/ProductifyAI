/**
 * Video Builder Routes
 * Handles AI-powered video generation with scene breakdown
 */

import { Router } from "express";
import { validateVideoRequest } from "../../shared/ai-video-dtos";

const router = Router();

// POST /api/video/generate - Generate video scenes from script
router.post("/generate", async (req, res) => {
  try {
    // Validate request
    const validation = validateVideoRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`
      });
    }

    const { script } = validation.data!;

    // Generate video scenes (mock implementation)
    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scenes = await generateVideoScenes(script);
    const totalDuration = scenes.reduce((total, scene) => total + scene.duration, 0);

    res.status(201).json({
      ok: true,
      data: {
        videoId,
        scenes,
        totalDuration
      }
    });

  } catch (error: any) {
    console.error('Video generation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate video scenes'
    });
  }
});

// Mock video scene generation function
async function generateVideoScenes(script: string): Promise<Array<{
  id: string;
  caption: string;
  duration: number;
  order: number;
}>> {
  // Split script into sentences for scene generation
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const scenes = sentences.map((sentence, index) => {
    const trimmedSentence = sentence.trim();
    const duration = Math.max(3, Math.min(8, trimmedSentence.length / 10)); // 3-8 seconds based on length
    
    return {
      id: `scene_${index + 1}`,
      caption: trimmedSentence,
      duration: Math.round(duration),
      order: index + 1
    };
  });

  // Add intro and outro scenes if not present
  if (scenes.length === 0) {
    return [
      {
        id: 'scene_intro',
        caption: 'Welcome to our video',
        duration: 3,
        order: 1
      },
      {
        id: 'scene_content',
        caption: script.substring(0, 100) + '...',
        duration: 10,
        order: 2
      },
      {
        id: 'scene_outro',
        caption: 'Thank you for watching',
        duration: 3,
        order: 3
      }
    ];
  }

  // Add intro scene
  scenes.unshift({
    id: 'scene_intro',
    caption: 'Welcome to our presentation',
    duration: 3,
    order: 0
  });

  // Add outro scene
  scenes.push({
    id: 'scene_outro',
    caption: 'Thank you for watching!',
    duration: 3,
    order: scenes.length
  });

  // Update order numbers
  return scenes.map((scene, index) => ({
    ...scene,
    order: index + 1
  }));
}

export default router;
