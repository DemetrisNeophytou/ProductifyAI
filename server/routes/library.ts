/**
 * Library Routes
 * Handles user's purchased/owned content (My Library)
 */

import { Router } from "express";
import { db } from "../db";
import { entitlements, projects, listings, users } from "../schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// GET /me/library - Get user's library (entitlements)
router.get("/", async (req, res) => {
  try {
    const userId = 1; // TODO: Get from auth when implemented

    const libraryItems = await db
      .select({
        id: entitlements.id,
        type: entitlements.type,
        status: entitlements.status,
        permissions: entitlements.permissions,
        createdAt: entitlements.createdAt,
        expiresAt: entitlements.expiresAt,
        project: {
          id: projects.id,
          title: projects.title,
          type: projects.type,
          metadata: projects.metadata,
          createdAt: projects.createdAt,
        },
        listing: {
          id: listings.id,
          title: listings.title,
          description: listings.description,
          coverImage: listings.coverImage,
          category: listings.category,
          price: listings.price,
          currency: listings.currency,
          rating: listings.rating,
          reviewCount: listings.reviewCount,
        }
      })
      .from(entitlements)
      .leftJoin(projects, eq(entitlements.projectId, projects.id))
      .leftJoin(listings, eq(entitlements.listingId, listings.id))
      .where(and(
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active")
      ))
      .orderBy(desc(entitlements.createdAt));

    // Group by type for better organization
    const organizedLibrary = {
      purchases: libraryItems.filter(item => item.type === "purchase"),
      clones: libraryItems.filter(item => item.type === "clone"),
      free: libraryItems.filter(item => item.type === "free"),
    };

    res.json({
      ok: true,
      data: {
        items: libraryItems,
        organized: organizedLibrary,
        total: libraryItems.length
      }
    });

  } catch (error: any) {
    console.error('Library fetch error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch library"
    });
  }
});

// GET /me/library/:projectId - Get specific project from library
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = 1; // TODO: Get from auth when implemented

    const libraryItem = await db
      .select({
        id: entitlements.id,
        type: entitlements.type,
        status: entitlements.status,
        permissions: entitlements.permissions,
        createdAt: entitlements.createdAt,
        expiresAt: entitlements.expiresAt,
        project: {
          id: projects.id,
          title: projects.title,
          type: projects.type,
          metadata: projects.metadata,
          createdAt: projects.createdAt,
        },
        listing: {
          id: listings.id,
          title: listings.title,
          description: listings.description,
          coverImage: listings.coverImage,
          category: listings.category,
          price: listings.price,
          currency: listings.currency,
          rating: listings.rating,
          reviewCount: listings.reviewCount,
        }
      })
      .from(entitlements)
      .leftJoin(projects, eq(entitlements.projectId, projects.id))
      .leftJoin(listings, eq(entitlements.listingId, listings.id))
      .where(and(
        eq(entitlements.userId, userId),
        eq(entitlements.projectId, projectId),
        eq(entitlements.status, "active")
      ))
      .limit(1);

    if (!libraryItem.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found in library"
      });
    }

    res.json({
      ok: true,
      data: libraryItem[0]
    });

  } catch (error: any) {
    console.error('Library item fetch error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch library item"
    });
  }
});

// POST /me/library/:projectId/download - Download project (if entitled)
router.post("/:projectId/download", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = 1; // TODO: Get from auth when implemented

    // Check if user has download permission
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
        error: "No download permission for this project"
      });
    }

    const permissions = entitlement[0].permissions as any;
    if (!permissions?.can_download) {
      return res.status(403).json({
        ok: false,
        error: "Download not permitted for this project"
      });
    }

    // Get project details
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // TODO: Generate download URL or return project data
    // For now, return project metadata
    res.json({
      ok: true,
      data: {
        project: project[0],
        downloadUrl: `/api/projects/${projectId}/download`, // Placeholder
        expiresAt: entitlement[0].expiresAt
      }
    });

  } catch (error: any) {
    console.error('Download error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to process download"
    });
  }
});

export default router;
