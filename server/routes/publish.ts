/**
 * Publish Routes
 * Handles project publishing and cloning functionality
 */

import { Router } from "express";
import { db } from "../db";
import { projects, listings, entitlements, users } from "../schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schemas
const publishProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  category: z.enum(["ebook", "course", "template", "video"]),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().url().optional(),
  previewImages: z.array(z.string().url()).default([]),
  features: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
});

const cloneProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

// POST /api/projects/:id/publish - Publish project to marketplace
router.post("/:id/publish", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = 1; // TODO: Get from auth when implemented

    // Validate input
    const validatedData = publishProjectSchema.parse(req.body);

    // Check if project exists and user owns it
    const project = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId.toString())
      ))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found or access denied"
      });
    }

    // Check if already published
    const existingListing = await db
      .select()
      .from(listings)
      .where(and(
        eq(listings.projectId, projectId),
        eq(listings.ownerId, userId)
      ))
      .limit(1);

    if (existingListing.length) {
      return res.status(400).json({
        ok: false,
        error: "Project already published"
      });
    }

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existingSlug = await db
        .select()
        .from(listings)
        .where(eq(listings.slug, finalSlug))
        .limit(1);
      
      if (!existingSlug.length) break;
      
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create listing
    const [listing] = await db.insert(listings).values({
      projectId,
      ownerId: userId,
      slug: finalSlug,
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price.toString(),
      currency: validatedData.currency,
      category: validatedData.category,
      tags: validatedData.tags,
      coverImage: validatedData.coverImage,
      previewImages: validatedData.previewImages,
      features: validatedData.features,
      requirements: validatedData.requirements,
      status: "published",
      publishedAt: new Date(),
    }).returning();

    // Update project status
    await db
      .update(projects)
      .set({
        status: "published",
        metadata: {
          ...project[0].metadata,
          listingId: listing.id,
          publishedAt: new Date().toISOString()
        }
      })
      .where(eq(projects.id, projectId));

    res.json({
      ok: true,
      data: {
        listing,
        url: `/listings/${listing.slug}`
      }
    });

  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        error: "Validation error",
        details: error.errors
      });
    }

    console.error('Publish project error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to publish project"
    });
  }
});

// POST /api/projects/:id/clone - Clone a project
router.post("/:id/clone", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = 1; // TODO: Get from auth when implemented

    // Validate input
    const validatedData = cloneProjectSchema.parse(req.body);

    // Check if user has clone permission
    const entitlement = await db
      .select()
      .from(entitlements)
      .where(and(
        eq(entitlements.userId, userId),
        eq(entitlements.projectId, projectId),
        eq(entitlements.status, "active")
      ))
      .limit(1);

    if (!entitlement.length) {
      return res.status(403).json({
        ok: false,
        error: "No clone permission for this project"
      });
    }

    const permissions = entitlement[0].permissions as any;
    if (!permissions?.can_clone) {
      return res.status(403).json({
        ok: false,
        error: "Clone not permitted for this project"
      });
    }

    // Get original project
    const originalProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!originalProject.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    const original = originalProject[0];

    // Create cloned project
    const [clonedProject] = await db.insert(projects).values({
      userId: userId.toString(),
      type: original.type,
      title: validatedData.title || `${original.title} (Copy)`,
      description: validatedData.description || original.description,
      status: "draft",
      templateId: original.id, // Reference to original
      metadata: {
        ...original.metadata,
        clonedFrom: original.id,
        clonedAt: new Date().toISOString(),
        version: 1
      }
    }).returning();

    // Create entitlement for the cloned project
    await db.insert(entitlements).values({
      userId,
      projectId: clonedProject.id,
      type: "clone",
      status: "active",
      permissions: {
        can_download: true,
        can_clone: true,
        can_share: false,
        can_modify: true
      }
    });

    // TODO: Clone project blocks/content
    // This would involve copying all the project_blocks for the original project

    res.json({
      ok: true,
      data: {
        project: clonedProject,
        originalProjectId: original.id
      }
    });

  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        error: "Validation error",
        details: error.errors
      });
    }

    console.error('Clone project error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to clone project"
    });
  }
});

// GET /api/projects/:id/status - Get project publication status
router.get("/:id/status", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = 1; // TODO: Get from auth when implemented

    // Get project
    const project = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId.toString())
      ))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Get listing if published
    const listing = await db
      .select()
      .from(listings)
      .where(and(
        eq(listings.projectId, projectId),
        eq(listings.ownerId, userId)
      ))
      .limit(1);

    res.json({
      ok: true,
      data: {
        project: project[0],
        listing: listing[0] || null,
        isPublished: listing.length > 0,
        canPublish: project[0].status !== "published"
      }
    });

  } catch (error: any) {
    console.error('Project status error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to get project status"
    });
  }
});

export default router;
