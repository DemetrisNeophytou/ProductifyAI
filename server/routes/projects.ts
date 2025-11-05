/**
 * Projects Routes
 * Handles CRUD operations for AI-generated projects
 */

import { Router } from "express";
import { db } from "../db";
import { projects, projectBlocks } from "../schema";
import { eq } from "drizzle-orm";
import { validateProjectUpdate } from "../../shared/ai-video-dtos";

const router = Router();

// GET /api/projects/:id - Get project by ID
router.get("/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    
    if (project.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Get project blocks
    const blocks = await db.select().from(projectBlocks)
      .where(eq(projectBlocks.projectId, projectId))
      .orderBy(projectBlocks.order);

    // Reconstruct layout from blocks
    const layout = reconstructLayout(blocks);

    res.json({
      ok: true,
      data: {
        ...project[0],
        layout
      }
    });

  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch project"
    });
  }
});

// PUT /api/projects/:id - Update project
router.put("/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Validate request
    const validation = validateProjectUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`
      });
    }

    const { title, layout, status, metadata } = validation.data!;

    // Check if project exists
    const existingProject = await db.select().from(projects).where(eq(projects.id, projectId));
    if (existingProject.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Update project
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title) updateData.title = title;
    if (status) updateData.status = status;
    if (metadata) updateData.metadata = metadata;

    const [updatedProject] = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    // Update layout if provided
    if (layout) {
      // Delete existing blocks
      await db.delete(projectBlocks).where(eq(projectBlocks.projectId, projectId));
      
      // Insert new blocks from layout
      const blocks = layoutToBlocks(projectId, layout);
      if (blocks.length > 0) {
        await db.insert(projectBlocks).values(blocks);
      }
    }

    // Get updated project with blocks
    const blocks = await db.select().from(projectBlocks)
      .where(eq(projectBlocks.projectId, projectId))
      .orderBy(projectBlocks.order);

    const reconstructedLayout = reconstructLayout(blocks);

    res.json({
      ok: true,
      data: {
        ...updatedProject,
        layout: reconstructedLayout
      }
    });

  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to update project"
    });
  }
});

// Helper function to reconstruct layout from blocks
function reconstructLayout(blocks: any[]) {
  const coverBlocks = blocks.filter(block => block.section === 'cover');
  const sectionBlocks = blocks.filter(block => block.section === 'sections');
  
  const cover = {
    title: coverBlocks.find(b => b.type === 'heading')?.content?.text || '',
    subtitle: coverBlocks.find(b => b.type === 'paragraph')?.content?.text || '',
    imageUrl: null,
    backgroundColor: '#3B82F6'
  };

  const sections = sectionBlocks.map(block => ({
    id: block.id,
    title: block.content?.text || '',
    content: block.content?.text || '',
    order: block.order,
    type: block.type
  }));

  return {
    cover,
    sections
  };
}

// Helper function to convert layout to blocks
function layoutToBlocks(projectId: string, layout: any) {
  const blocks = [];

  // Cover blocks
  if (layout.cover) {
    if (layout.cover.title) {
      blocks.push({
        projectId,
        type: 'heading',
        content: { text: layout.cover.title, level: 1 },
        order: 0,
        section: 'cover'
      });
    }
    if (layout.cover.subtitle) {
      blocks.push({
        projectId,
        type: 'paragraph',
        content: { text: layout.cover.subtitle },
        order: 1,
        section: 'cover'
      });
    }
  }

  // Section blocks
  if (layout.sections) {
    layout.sections.forEach((section: any, index: number) => {
      blocks.push({
        projectId,
        type: section.type || 'paragraph',
        content: { text: section.content || section.title },
        order: index + 2,
        section: 'sections'
      });
    });
  }

  return blocks;
}

export default router;
