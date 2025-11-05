/**
 * Marketplace Routes
 * Handles product listings, browsing, and marketplace functionality
 */

import { Router } from "express";
import { db } from "../db";
import { listings, projects, users, reviews, entitlements } from "../schema";
import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";

const router = Router();

// GET /listings - Browse all published listings
router.get("/", async (req, res) => {
  try {
    const { 
      category, 
      search, 
      sort = "newest", 
      minPrice, 
      maxPrice, 
      rating,
      page = 1,
      limit = 20 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build where conditions
    let whereConditions = eq(listings.status, "published");
    
    if (category) {
      whereConditions = and(whereConditions, eq(listings.category, category as string));
    }
    
    if (search) {
      whereConditions = and(
        whereConditions,
        or(
          like(listings.title, `%${search}%`),
          like(listings.description, `%${search}%`)
        )
      );
    }
    
    if (minPrice) {
      whereConditions = and(whereConditions, sql`${listings.price} >= ${minPrice}`);
    }
    
    if (maxPrice) {
      whereConditions = and(whereConditions, sql`${listings.price} <= ${maxPrice}`);
    }
    
    if (rating) {
      whereConditions = and(whereConditions, sql`${listings.rating} >= ${rating}`);
    }

    // Build sort order
    let orderBy;
    switch (sort) {
      case "newest":
        orderBy = desc(listings.publishedAt);
        break;
      case "oldest":
        orderBy = asc(listings.publishedAt);
        break;
      case "price_low":
        orderBy = asc(listings.price);
        break;
      case "price_high":
        orderBy = desc(listings.price);
        break;
      case "rating":
        orderBy = desc(listings.rating);
        break;
      case "popular":
        orderBy = desc(listings.downloadCount);
        break;
      default:
        orderBy = desc(listings.publishedAt);
    }

    // Get listings with owner info
    const listingsData = await db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        currency: listings.currency,
        category: listings.category,
        tags: listings.tags,
        coverImage: listings.coverImage,
        rating: listings.rating,
        reviewCount: listings.reviewCount,
        downloadCount: listings.downloadCount,
        publishedAt: listings.publishedAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(listings)
      .leftJoin(users, eq(listings.ownerId, users.id))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(whereConditions);

    const total = totalResult[0]?.count || 0;

    res.json({
      ok: true,
      data: {
        listings: listingsData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error: any) {
    console.error('Marketplace listings error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch listings"
    });
  }
});

// GET /listings/:slug - Get specific listing details
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const listing = await db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        currency: listings.currency,
        category: listings.category,
        tags: listings.tags,
        coverImage: listings.coverImage,
        previewImages: listings.previewImages,
        features: listings.features,
        requirements: listings.requirements,
        fileSize: listings.fileSize,
        rating: listings.rating,
        reviewCount: listings.reviewCount,
        downloadCount: listings.downloadCount,
        publishedAt: listings.publishedAt,
        createdAt: listings.createdAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        project: {
          id: projects.id,
          type: projects.type,
          metadata: projects.metadata,
        }
      })
      .from(listings)
      .leftJoin(users, eq(listings.ownerId, users.id))
      .leftJoin(projects, eq(listings.projectId, projects.id))
      .where(and(
        eq(listings.slug, slug),
        eq(listings.status, "published")
      ))
      .limit(1);

    if (!listing.length) {
      return res.status(404).json({
        ok: false,
        error: "Listing not found"
      });
    }

    // Get reviews for this listing
    const listingReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        isVerified: reviews.isVerified,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        user: {
          name: users.name,
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.listingId, listing[0].id))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    res.json({
      ok: true,
      data: {
        ...listing[0],
        reviews: listingReviews
      }
    });

  } catch (error: any) {
    console.error('Listing details error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch listing details"
    });
  }
});

// GET /listings/categories - Get available categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db
      .select({
        category: listings.category,
        count: sql<number>`count(*)`
      })
      .from(listings)
      .where(eq(listings.status, "published"))
      .groupBy(listings.category)
      .orderBy(asc(listings.category));

    res.json({
      ok: true,
      data: categories
    });

  } catch (error: any) {
    console.error('Categories error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch categories"
    });
  }
});

export default router;
