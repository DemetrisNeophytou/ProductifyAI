/**
 * Marketplace Listings Routes
 * Allow Free users to list pre-made products for sale (upload + metadata)
 * No editor/canvas required - just file upload
 */

import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { validateOwnership } from '../middleware/freePlanGuard';

const router = Router();

// Listings table will be added to schema
// For now, use products table with a flag

/**
 * Create marketplace listing (Free users allowed)
 * POST /api/marketplace/listings
 */
router.post('/listings', async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      price, // in cents
      category,
      tags,
      fileUrl, // Pre-uploaded file URL
      thumbnailUrl,
      license,
    } = req.body;

    if (!userId || !title || !price || !fileUrl) {
      return res.status(400).json({
        ok: false,
        error: 'userId, title, price, and fileUrl are required',
      });
    }

    // Get user to verify account exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    // Create listing (simplified product entry)
    // TODO: When products table supports listings, use proper table
    // For now, this is a placeholder showing the structure

    const listing = {
      id: `listing-${Date.now()}`,
      userId,
      title,
      description,
      price,
      category: category || 'digital-product',
      tags: tags || [],
      fileUrl,
      thumbnailUrl: thumbnailUrl || null,
      license: license || 'standard',
      type: 'marketplace-listing', // Distinguish from created products
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    Logger.info(`Marketplace listing created: ${listing.id} by user ${userId} (plan: ${user.plan})`);

    res.json({
      ok: true,
      data: { listing },
      message: 'Listing created successfully',
    });
  } catch (error: any) {
    Logger.error('Create listing error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Update own listing
 * PUT /api/marketplace/listings/:id
 */
router.put('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, description, price, tags } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
    }

    // TODO: Validate ownership - user can only update their own listings
    // await validateOwnership(req, res, () => {}, 'listing');

    // TODO: Update in database when listings table exists

    Logger.info(`Listing updated: ${id} by user ${userId}`);

    res.json({
      ok: true,
      message: 'Listing updated successfully',
    });
  } catch (error: any) {
    Logger.error('Update listing error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Delete own listing
 * DELETE /api/marketplace/listings/:id
 */
router.delete('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
    }

    // TODO: Validate ownership and delete

    Logger.info(`Listing deleted: ${id} by user ${userId}`);

    res.json({
      ok: true,
      message: 'Listing deleted successfully',
    });
  } catch (error: any) {
    Logger.error('Delete listing error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Get user's own listings
 * GET /api/marketplace/listings/my
 */
router.get('/listings/my', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
    }

    // TODO: Query user's listings from database

    const listings: any[] = []; // Placeholder

    res.json({
      ok: true,
      data: { listings },
    });
  } catch (error: any) {
    Logger.error('Get my listings error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Browse all marketplace listings (public)
 * GET /api/marketplace/listings
 */
router.get('/listings', async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;

    // TODO: Query all published listings
    // Filter by category, search, pagination

    const listings: any[] = []; // Placeholder

    res.json({
      ok: true,
      data: {
        listings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Browse listings error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;

