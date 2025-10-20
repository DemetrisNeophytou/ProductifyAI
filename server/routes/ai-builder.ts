/**
 * AI Product Builder Routes
 * Handles AI-powered product generation with database persistence
 */

import { Router } from "express";
import { db } from "../db";
import { projects, projectBlocks } from "../schema";
import { eq } from "drizzle-orm";
import { validateAIProductRequest } from "../../shared/ai-video-dtos";

const router = Router();

// POST /api/ai/generate - Generate AI product
router.post("/generate", async (req, res) => {
  try {
    // Validate request
    const validation = validateAIProductRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`
      });
    }

    const { topic, type, audience, tone, goal } = validation.data!;

    // Generate AI product data (mock implementation)
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const aiProduct = await generateAIProduct({
      topic,
      type: type as 'ebook' | 'template' | 'course',
      audience,
      tone,
      goal
    });

    // Save to database
    const [savedProject] = await db.insert(projects).values({
      id: projectId,
      userId: null, // Will be set when auth is implemented
      type: type as 'ebook' | 'template' | 'course',
      title: aiProduct.title,
      status: 'draft',
      metadata: {
        niche: topic,
        goal,
        audience,
        tone,
        wordCount: aiProduct.layout.sections.reduce((total, section) => total + section.content.length, 0),
        imageCount: aiProduct.layout.sections.filter(s => s.type === 'image').length,
        version: 1,
        tags: [type, topic.toLowerCase().replace(/\s+/g, '-')]
      },
      brand: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        font: 'Inter'
      },
      outline: aiProduct.layout.sections.map((section, index) => ({
        id: section.id,
        title: section.title,
        level: section.type === 'heading' ? 1 : 2
      })),
      coverImageUrl: aiProduct.layout.cover.imageUrl,
      backgroundColor: aiProduct.layout.cover.backgroundColor
    }).returning();

    // Save project blocks
    const blocks = [
      // Cover section
      {
        projectId,
        type: 'heading',
        content: { text: aiProduct.title, level: 1 },
        order: 0,
        section: 'cover'
      },
      {
        projectId,
        type: 'paragraph',
        content: { text: aiProduct.layout.cover.subtitle || '' },
        order: 1,
        section: 'cover'
      },
      // Main sections
      ...aiProduct.layout.sections.map((section, index) => ({
        projectId,
        type: section.type,
        content: { text: section.content },
        order: index + 2,
        section: 'sections'
      }))
    ];

    await db.insert(projectBlocks).values(blocks);

    // Return response
    res.status(201).json({
      ok: true,
      data: {
        projectId,
        title: aiProduct.title,
        layout: aiProduct.layout,
        sell: aiProduct.sell,
        funnel: aiProduct.funnel
      }
    });

  } catch (error: any) {
    console.error('AI Product generation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate AI product'
    });
  }
});

// Mock AI product generation function
async function generateAIProduct(params: {
  topic: string;
  type: 'ebook' | 'template' | 'course';
  audience?: string;
  tone?: string;
  goal?: string;
}) {
  const { topic, type, audience = 'general audience', tone = 'professional', goal } = params;
  
  const title = `The Complete Guide to ${topic}`;
  const subtitle = `A comprehensive ${type} for ${audience}`;
  
  const sections = [
    {
      id: 'intro',
      title: 'Introduction',
      content: `Welcome to this comprehensive guide on ${topic}. This ${type} is designed specifically for ${audience} and will help you achieve your goals.`,
      order: 1,
      type: 'heading' as const
    },
    {
      id: 'overview',
      title: 'Overview',
      content: `In this ${type}, we'll cover the essential concepts and practical strategies you need to master ${topic}. Whether you're a beginner or looking to refine your skills, this guide has something for everyone.`,
      order: 2,
      type: 'paragraph' as const
    },
    {
      id: 'key-concepts',
      title: 'Key Concepts',
      content: `Let's dive into the core concepts that form the foundation of ${topic}. Understanding these principles will set you up for success.`,
      order: 3,
      type: 'heading' as const
    },
    {
      id: 'practical-tips',
      title: 'Practical Tips',
      content: `Here are some actionable tips you can implement immediately to improve your ${topic} skills. These strategies have been tested and proven effective.`,
      order: 4,
      type: 'paragraph' as const
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      content: `Congratulations! You now have a solid understanding of ${topic}. Remember, mastery comes with practice, so keep applying these concepts in your daily work.`,
      order: 5,
      type: 'paragraph' as const
    }
  ];

  const sell = {
    price: type === 'ebook' ? 29.99 : type === 'course' ? 99.99 : 49.99,
    currency: 'EUR' as const,
    cta: 'Get Instant Access',
    salesBlurb: `Transform your ${topic} skills with this comprehensive ${type}. Perfect for ${audience} who want to achieve ${goal || 'their goals'}.`
  };

  const funnel = {
    playbook: `A step-by-step playbook to master ${topic} in 30 days`,
    emails: [
      {
        subject: `Welcome to your ${topic} journey!`,
        content: `Thank you for purchasing our ${type} on ${topic}. Here's your first lesson...`,
        sendAfter: 0
      },
      {
        subject: `Day 3: Key insights about ${topic}`,
        content: `Now that you've had time to digest the basics, let's explore some advanced concepts...`,
        sendAfter: 3
      },
      {
        subject: `Week 1: Your progress with ${topic}`,
        content: `It's been a week since you started. Here's how you're doing and what's next...`,
        sendAfter: 7
      }
    ]
  };

  return {
    title,
    layout: {
      cover: {
        title,
        subtitle,
        imageUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center`,
        backgroundColor: '#3B82F6'
      },
      sections
    },
    sell,
    funnel
  };
}

export default router;