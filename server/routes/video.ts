import { Router } from "express";
import { db } from "../db";

const router = Router();

// Video Generation Endpoint
router.post("/generate", async (req, res) => {
  try {
    const { script, productId, template, settings } = req.body;
    
    if (!script) {
      return res.status(400).json({
        success: false,
        error: "Script is required",
      });
    }

    // Generate video scenes from script
    const videoStructure = generateVideoFromScript(script, template || "modern");
    
    // Create video job record
    const videoJob = {
      id: `video_${Date.now()}`,
      productId: productId || null,
      script: script.substring(0, 100) + "...", // Store truncated script
      template: template || "modern",
      status: "generated",
      progress: 100,
      scenes: videoStructure.scenes,
      totalDuration: videoStructure.totalDuration,
      settings: settings || {},
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: "Video structure generated successfully",
      data: {
        videoJob,
        scenes: videoStructure.scenes,
        summary: {
          totalScenes: videoStructure.scenes.length,
          estimatedDuration: videoStructure.totalDuration,
          template: template || "modern",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate video",
    });
  }
});

// Helper function to generate video scenes from script
function generateVideoFromScript(script: string, template: string): any {
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const scenes = [];
  
  // Generate scenes based on script analysis
  sentences.forEach((sentence, index) => {
    const scene = {
      id: index + 1,
      type: determineSceneType(sentence, index),
      text: sentence.trim(),
      duration: calculateSceneDuration(sentence),
      visual: generateVisualPrompt(sentence, template),
      transition: index < sentences.length - 1 ? "fade" : "fadeOut",
    };
    scenes.push(scene);
  });

  // Add intro and outro scenes
  const introScene = {
    id: 0,
    type: "intro",
    text: "Welcome!",
    duration: 3,
    visual: "Title card with background",
    transition: "fade",
  };

  const outroScene = {
    id: scenes.length + 1,
    type: "outro",
    text: "Thank you for watching!",
    duration: 3,
    visual: "Call-to-action with logo",
    transition: "fadeOut",
  };

  scenes.unshift(introScene);
  scenes.push(outroScene);

  const totalDuration = scenes.reduce((total, scene) => total + scene.duration, 0);

  return {
    scenes,
    totalDuration: `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`,
    template,
  };
}

function determineSceneType(sentence: string, index: number): string {
  const lowerSentence = sentence.toLowerCase();
  
  if (lowerSentence.includes('introduction') || lowerSentence.includes('welcome')) return "intro";
  if (lowerSentence.includes('conclusion') || lowerSentence.includes('thank')) return "outro";
  if (lowerSentence.includes('step') || lowerSentence.includes('first') || lowerSentence.includes('next')) return "instruction";
  if (lowerSentence.includes('example') || lowerSentence.includes('for instance')) return "example";
  if (lowerSentence.includes('important') || lowerSentence.includes('note')) return "highlight";
  
  return "content";
}

function calculateSceneDuration(sentence: string): number {
  const wordCount = sentence.split(' ').length;
  // Average reading speed: 150 words per minute
  const baseDuration = Math.max(3, Math.ceil((wordCount / 150) * 60));
  return Math.min(baseDuration, 8); // Cap at 8 seconds per scene
}

function generateVisualPrompt(sentence: string, template: string): string {
  const keywords = sentence.split(' ').filter(word => word.length > 4).slice(0, 3);
  
  const templateStyles = {
    modern: "Clean, minimalist design with smooth animations",
    energetic: "Dynamic, fast-paced visuals with bold colors",
    professional: "Corporate style with subtle animations and charts",
    creative: "Artistic visuals with creative transitions",
  };

  return `${templateStyles[template as keyof typeof templateStyles]} featuring ${keywords.join(', ')}`;
}

// Video Status Endpoint
router.get("/:videoId/status", async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // TODO: Query video generation status from queue/database
    
    res.json({
      success: true,
      data: {
        id: videoId,
        status: "processing", // queued | processing | completed | failed
        progress: 45,
        estimatedTime: "2 minutes",
        videoUrl: null,
        thumbnailUrl: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get video status",
    });
  }
});

// Video Download Endpoint
router.get("/:videoId/download", async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // TODO: Serve completed video file
    
    res.json({
      success: true,
      data: {
        id: videoId,
        downloadUrl: `https://storage.example.com/videos/${videoId}.mp4`,
        format: "mp4",
        size: "15.2 MB",
        duration: "45 seconds",
        status: "pending_implementation",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to download video",
    });
  }
});

// Video Templates List
router.get("/templates", async (req, res) => {
  try {
    const templates = [
      {
        id: "modern",
        name: "Modern Product Showcase",
        description: "Clean, minimal design with smooth transitions",
        duration: "30-60s",
        thumbnail: "/templates/modern.jpg",
      },
      {
        id: "energetic",
        name: "Energetic Sales Video",
        description: "Fast-paced with dynamic animations",
        duration: "15-30s",
        thumbnail: "/templates/energetic.jpg",
      },
      {
        id: "professional",
        name: "Professional Presentation",
        description: "Corporate style with data visualization",
        duration: "60-90s",
        thumbnail: "/templates/professional.jpg",
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch templates",
    });
  }
});

export default router;



