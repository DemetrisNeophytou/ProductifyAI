/**
 * Social Pack Routes
 * Handles social media content generation for projects
 */

import { Router } from "express";
import { db } from "../db";
import { projects, socialPacks, projectBlocks } from "../schema";
import { eq, and } from "drizzle-orm";
import { validateSocialPackRequest } from "../../shared/multilingual-dtos";

const router = Router();

// POST /api/social/pack - Generate social media content pack
router.post("/pack", async (req, res) => {
  try {
    // Validate request
    const validation = validateSocialPackRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`
      });
    }

    const { projectId, platforms, tone = 'professional', length = 'short', locale = 'en' } = validation.data!;

    // Check if project exists
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Get project content for the specified locale
    const projectBlocks = await db.select()
      .from(projectBlocks)
      .where(and(
        eq(projectBlocks.projectId, projectId),
        eq(projectBlocks.locale, locale)
      ))
      .orderBy(projectBlocks.order);

    if (projectBlocks.length === 0) {
      return res.status(404).json({
        ok: false,
        error: `No content found for locale: ${locale}`
      });
    }

    // Generate social pack content
    const socialContent = await generateSocialPack(project[0], projectBlocks, platforms, tone, length);

    // Save to database
    const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [savedPack] = await db.insert(socialPacks).values({
      id: packId,
      projectId,
      locale,
      platforms,
      payload: socialContent
    }).returning();

    res.status(201).json({
      ok: true,
      data: {
        packId,
        projectId,
        platforms,
        payload: socialContent
      }
    });

  } catch (error: any) {
    console.error('Social pack generation error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to generate social pack"
    });
  }
});

// GET /api/social/pack/:projectId - Get social packs for a project
router.get("/pack/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { locale } = req.query;

    let query = eq(socialPacks.projectId, projectId);
    if (locale) {
      query = and(query, eq(socialPacks.locale, locale as string));
    }

    const packs = await db.select().from(socialPacks).where(query);

    res.json({
      ok: true,
      data: packs
    });

  } catch (error: any) {
    console.error('Get social packs error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch social packs"
    });
  }
});

// Mock social pack generation function
async function generateSocialPack(
  project: any, 
  blocks: any[], 
  platforms: string[], 
  tone: string, 
  length: string
): Promise<Record<string, any>> {
  const content = blocks.map(block => block.content?.text || '').join(' ');
  const title = project.title;
  
  const socialContent: Record<string, any> = {};

  platforms.forEach(platform => {
    switch (platform) {
      case 'reels':
        socialContent.reels = generateReelsContent(title, content, tone, length);
        break;
      case 'tiktok':
        socialContent.tiktok = generateTikTokContent(title, content, tone, length);
        break;
      case 'shorts':
        socialContent.shorts = generateShortsContent(title, content, tone, length);
        break;
    }
  });

  return socialContent;
}

function generateReelsContent(title: string, content: string, tone: string, length: string): any {
  const hooks = [
    "Want to master this skill?",
    "This changed everything for me",
    "The secret nobody talks about",
    "Why this matters more than you think"
  ];

  const ctas = [
    "Swipe up for the full guide!",
    "Link in bio for more",
    "Save this for later!",
    "Follow for more tips"
  ];

  const hashtags = [
    "#productivity",
    "#tips",
    "#guide",
    "#learn",
    "#success",
    "#motivation"
  ];

  return {
    caption: `🎯 ${title}\n\n${hooks[Math.floor(Math.random() * hooks.length)]}\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`,
    hashtags: hashtags.slice(0, 5),
    shortScript: generateShortScript(content, 30), // 30 seconds max
    hooks: hooks.slice(0, 3),
    cta: ctas[Math.floor(Math.random() * ctas.length)]
  };
}

function generateTikTokContent(title: string, content: string, tone: string, length: string): any {
  const hooks = [
    "POV: You're about to learn something amazing",
    "This is why everyone's talking about it",
    "The hack that changed my life",
    "You won't believe this works"
  ];

  const ctas = [
    "Follow for more!",
    "Comment your thoughts!",
    "Share if this helped!",
    "Double tap if you agree!"
  ];

  const hashtags = [
    "#fyp",
    "#viral",
    "#learn",
    "#tips",
    "#hack",
    "#lifehack"
  ];

  return {
    caption: `🔥 ${title}\n\n${hooks[Math.floor(Math.random() * hooks.length)]}\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`,
    hashtags: hashtags.slice(0, 6),
    shortScript: generateShortScript(content, 60), // 60 seconds max
    hooks: hooks.slice(0, 4),
    cta: ctas[Math.floor(Math.random() * ctas.length)]
  };
}

function generateShortsContent(title: string, content: string, tone: string, length: string): any {
  const hooks = [
    "The truth about...",
    "What they don't tell you",
    "This is how you actually...",
    "The real secret is..."
  ];

  const ctas = [
    "Subscribe for more!",
    "Like if this helped!",
    "Comment below!",
    "Share with friends!"
  ];

  const hashtags = [
    "#shorts",
    "#youtube",
    "#learn",
    "#education",
    "#tips",
    "#howto"
  ];

  return {
    caption: `📚 ${title}\n\n${hooks[Math.floor(Math.random() * hooks.length)]}\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`,
    hashtags: hashtags.slice(0, 5),
    shortScript: generateShortScript(content, 60), // 60 seconds max
    hooks: hooks.slice(0, 3),
    cta: ctas[Math.floor(Math.random() * ctas.length)]
  };
}

function generateShortScript(content: string, maxSeconds: number): string {
  // Extract key sentences and create a short script
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const maxWords = maxSeconds * 2; // Assume 2 words per second
  
  let script = "";
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).length;
    if (wordCount + words <= maxWords) {
      script += sentence.trim() + ". ";
      wordCount += words;
    } else {
      break;
    }
  }
  
  return script.trim() || "Welcome to our guide. Let's get started with the basics.";
}

export default router;
