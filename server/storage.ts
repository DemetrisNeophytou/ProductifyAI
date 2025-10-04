import {
  users,
  products_old,
  brandKits,
  projects,
  sections,
  assets,
  projectVersions,
  communityPosts,
  communityComments,
  communityPostLikes,
  aiSessions,
  aiMessages,
  paymentHistory,
  testimonials,
  referralCodes,
  referralConversions,
  analyticsEvents,
  type User,
  type UpsertUser,
  type BrandKit,
  type InsertBrandKit,
  type Project,
  type InsertProject,
  type Section,
  type InsertSection,
  type Asset,
  type InsertAsset,
  type ProjectVersion,
  type InsertProjectVersion,
  type CommunityPost,
  type InsertCommunityPost,
  type CommunityComment,
  type InsertCommunityComment,
  type AiSession,
  type InsertAiSession,
  type AiMessage,
  type InsertAiMessage,
  type PaymentHistory,
  type InsertPaymentHistory,
  type Testimonial,
  type InsertTestimonial,
  type ReferralCode,
  type InsertReferralCode,
  type ReferralConversion,
  type InsertReferralConversion,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  updateUserByStripeSubscription(stripeSubscriptionId: string, data: Partial<UpsertUser>): Promise<void>;
  
  // Brand Kit operations
  getBrandKit(userId: string): Promise<BrandKit | undefined>;
  upsertBrandKit(brandKit: InsertBrandKit): Promise<BrandKit>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string, userId: string): Promise<Project>;
  
  // Section operations
  createSection(section: InsertSection): Promise<Section>;
  getSection(id: string): Promise<Section | undefined>;
  getProjectSections(projectId: string): Promise<Section[]>;
  updateSection(id: string, data: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  reorderSections(projectId: string, sectionIds: string[]): Promise<void>;
  
  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAsset(id: string): Promise<Asset | undefined>;
  getUserAssets(userId: string): Promise<Asset[]>;
  getProjectAssets(projectId: string): Promise<Asset[]>;
  deleteAsset(id: string): Promise<void>;
  
  // Version operations
  createVersion(version: InsertProjectVersion): Promise<ProjectVersion>;
  getProjectVersions(projectId: string, limit?: number): Promise<ProjectVersion[]>;
  restoreVersion(versionId: string): Promise<Project>;
  
  // Community operations
  getCommunityPosts(limit?: number, offset?: number): Promise<(CommunityPost & { user: User })[]>;
  getCommunityPost(id: string): Promise<(CommunityPost & { user: User }) | undefined>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  deleteCommunityPost(id: string): Promise<void>;
  getPostComments(postId: string): Promise<(CommunityComment & { user: User })[]>;
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;
  incrementCommentCount(postId: string): Promise<void>;
  togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  
  // AI Session operations
  createAiSession(session: InsertAiSession): Promise<AiSession>;
  getAiSession(id: string): Promise<AiSession | undefined>;
  getUserAiSessions(userId: string, builderType?: string): Promise<AiSession[]>;
  updateAiSession(id: string, data: Partial<InsertAiSession>): Promise<AiSession>;
  deleteAiSession(id: string): Promise<void>;
  
  // AI Message operations
  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;
  getSessionMessages(sessionId: string): Promise<AiMessage[]>;
  
  // Payment History operations
  createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory>;
  getUserPaymentHistory(userId: string, limit?: number): Promise<PaymentHistory[]>;
  
  // Testimonial operations
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getApprovedTestimonials(limit?: number): Promise<Testimonial[]>;
  getFeaturedTestimonials(limit?: number): Promise<Testimonial[]>;
  approveTestimonial(id: string): Promise<void>;
  featureTestimonial(id: string, featured: boolean): Promise<void>;
  
  // Referral Code operations
  createReferralCode(code: InsertReferralCode): Promise<ReferralCode>;
  getUserReferralCode(userId: string): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  updateReferralCodeStats(codeId: string, referredCount: number, rewardEarned: number): Promise<void>;
  
  // Referral Conversion operations
  createReferralConversion(conversion: InsertReferralConversion): Promise<ReferralConversion>;
  getUserReferralConversions(referrerId: string): Promise<ReferralConversion[]>;
  updateReferralConversionStatus(id: string, status: string, rewardAmount?: number): Promise<void>;
  
  // Analytics Event operations
  trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getUserAnalytics(userId: string, limit?: number): Promise<AnalyticsEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<AnalyticsEvent[]>;
  getAnalyticsSummary(userId?: string): Promise<{
    totalProjects: number;
    totalAiUsage: number;
    totalRevenue: number;
    conversionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserByStripeSubscription(stripeSubscriptionId: string, data: Partial<UpsertUser>): Promise<void> {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
  }

  // Brand Kit operations
  async getBrandKit(userId: string): Promise<BrandKit | undefined> {
    const [brandKit] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.userId, userId));
    return brandKit;
  }

  async upsertBrandKit(brandKitData: InsertBrandKit): Promise<BrandKit> {
    const [brandKit] = await db
      .insert(brandKits)
      .values(brandKitData)
      .onConflictDoUpdate({
        target: brandKits.userId,
        set: {
          logoUrl: brandKitData.logoUrl,
          primaryColor: brandKitData.primaryColor,
          secondaryColor: brandKitData.secondaryColor,
          fonts: brandKitData.fonts,
          toneOfVoice: brandKitData.toneOfVoice,
          updatedAt: new Date(),
        },
      })
      .returning();
    return brandKit;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async duplicateProject(id: string, userId: string): Promise<Project> {
    const original = await this.getProject(id);
    if (!original) throw new Error("Project not found");

    const projectSections = await this.getProjectSections(id);

    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          userId,
          type: original.type,
          title: `${original.title} (Copy)`,
          status: "draft",
          metadata: original.metadata,
          coverImageUrl: original.coverImageUrl,
          backgroundColor: original.backgroundColor,
        })
        .returning();

      for (const section of projectSections) {
        await tx.insert(sections).values({
          projectId: newProject.id,
          type: section.type,
          title: section.title,
          content: section.content,
          order: section.order,
        });
      }

      return newProject;
    });
  }

  // Section operations
  async createSection(section: InsertSection): Promise<Section> {
    const [newSection] = await db.insert(sections).values(section).returning();
    return newSection;
  }

  async getSection(id: string): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }

  async getProjectSections(projectId: string): Promise<Section[]> {
    return await db
      .select()
      .from(sections)
      .where(eq(sections.projectId, projectId))
      .orderBy(sections.order);
  }

  async updateSection(id: string, data: Partial<InsertSection>): Promise<Section> {
    const [updated] = await db
      .update(sections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sections.id, id))
      .returning();
    return updated;
  }

  async deleteSection(id: string): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }

  async reorderSections(projectId: string, sectionIds: string[]): Promise<void> {
    // Use transaction to ensure all updates succeed or fail together
    await db.transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await tx
          .update(sections)
          .set({ order: i })
          .where(eq(sections.id, sectionIds[i]));
      }
    });
  }

  // Asset operations
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getUserAssets(userId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId))
      .orderBy(desc(assets.createdAt));
  }

  async getProjectAssets(projectId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.projectId, projectId!))
      .orderBy(desc(assets.createdAt));
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Version operations
  async createVersion(version: InsertProjectVersion): Promise<ProjectVersion> {
    // Get the next version number for this project
    const versions = await this.getProjectVersions(version.projectId, 1);
    const versionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;
    
    const [newVersion] = await db
      .insert(projectVersions)
      .values({ ...version, versionNumber })
      .returning();
    return newVersion;
  }

  async getProjectVersions(projectId: string, limit = 10): Promise<ProjectVersion[]> {
    return await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.createdAt))
      .limit(limit);
  }

  async restoreVersion(versionId: string): Promise<Project> {
    const [version] = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.id, versionId));
    
    if (!version) throw new Error("Version not found");
    
    const snapshot = version.snapshot as any;
    
    // Use transaction to ensure atomicity when restoring project and sections
    return await db.transaction(async (tx) => {
      const [restored] = await tx
        .update(projects)
        .set({
          ...snapshot.project,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, version.projectId))
        .returning();

      // If snapshot contains sections, restore them as well
      if (snapshot.sections && Array.isArray(snapshot.sections)) {
        // Delete existing sections
        await tx.delete(sections).where(eq(sections.projectId, version.projectId));
        
        // Restore sections from snapshot
        for (const section of snapshot.sections) {
          await tx.insert(sections).values({
            projectId: version.projectId,
            type: section.type,
            title: section.title,
            content: section.content,
            order: section.order,
          });
        }
      }

      return restored;
    });
  }

  // Community operations
  async getCommunityPosts(limit: number = 50, offset: number = 0): Promise<(CommunityPost & { user: User })[]> {
    return await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCommunityPost(id: string): Promise<(CommunityPost & { user: User }) | undefined> {
    const [post] = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, id));
    return post;
  }

  async createCommunityPost(postData: InsertCommunityPost): Promise<CommunityPost> {
    const [post] = await db
      .insert(communityPosts)
      .values(postData)
      .returning();
    return post;
  }

  async deleteCommunityPost(id: string): Promise<void> {
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  }

  async getPostComments(postId: string): Promise<(CommunityComment & { user: User })[]> {
    return await db
      .select({
        id: communityComments.id,
        postId: communityComments.postId,
        userId: communityComments.userId,
        content: communityComments.content,
        createdAt: communityComments.createdAt,
        updatedAt: communityComments.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(communityComments)
      .leftJoin(users, eq(communityComments.userId, users.id))
      .where(eq(communityComments.postId, postId))
      .orderBy(communityComments.createdAt);
  }

  async createCommunityComment(commentData: InsertCommunityComment): Promise<CommunityComment> {
    const [comment] = await db
      .insert(communityComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async incrementCommentCount(postId: string): Promise<void> {
    await db
      .update(communityPosts)
      .set({
        commentsCount: sql`${communityPosts.commentsCount} + 1`,
      })
      .where(eq(communityPosts.id, postId));
  }

  async togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const [existingLike] = await db
      .select()
      .from(communityPostLikes)
      .where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, userId)));

    if (existingLike) {
      await db.delete(communityPostLikes).where(eq(communityPostLikes.id, existingLike.id));
      await db
        .update(communityPosts)
        .set({
          likesCount: sql`${communityPosts.likesCount} - 1`,
        })
        .where(eq(communityPosts.id, postId));

      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      return { liked: false, likesCount: post?.likesCount || 0 };
    } else {
      await db.insert(communityPostLikes).values({ postId, userId });
      await db
        .update(communityPosts)
        .set({
          likesCount: sql`${communityPosts.likesCount} + 1`,
        })
        .where(eq(communityPosts.id, postId));

      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      return { liked: true, likesCount: post?.likesCount || 0 };
    }
  }
  
  // AI Session operations
  async createAiSession(sessionData: InsertAiSession): Promise<AiSession> {
    const [session] = await db.insert(aiSessions).values(sessionData).returning();
    return session;
  }
  
  async getAiSession(id: string): Promise<AiSession | undefined> {
    const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, id));
    return session;
  }
  
  async getUserAiSessions(userId: string, builderType?: string): Promise<AiSession[]> {
    if (builderType) {
      return await db
        .select()
        .from(aiSessions)
        .where(and(eq(aiSessions.userId, userId), eq(aiSessions.builderType, builderType)))
        .orderBy(desc(aiSessions.updatedAt));
    }
    return await db
      .select()
      .from(aiSessions)
      .where(eq(aiSessions.userId, userId))
      .orderBy(desc(aiSessions.updatedAt));
  }
  
  async updateAiSession(id: string, data: Partial<InsertAiSession>): Promise<AiSession> {
    const [session] = await db
      .update(aiSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiSessions.id, id))
      .returning();
    return session;
  }
  
  async deleteAiSession(id: string): Promise<void> {
    await db.delete(aiSessions).where(eq(aiSessions.id, id));
  }
  
  // AI Message operations
  async createAiMessage(messageData: InsertAiMessage): Promise<AiMessage> {
    const [message] = await db.insert(aiMessages).values(messageData).returning();
    return message;
  }
  
  async getSessionMessages(sessionId: string): Promise<AiMessage[]> {
    return await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, sessionId))
      .orderBy(aiMessages.createdAt);
  }
  
  // Payment History operations
  async createPaymentHistory(paymentData: InsertPaymentHistory): Promise<PaymentHistory> {
    const [payment] = await db.insert(paymentHistory).values(paymentData).returning();
    return payment;
  }
  
  async getUserPaymentHistory(userId: string, limit: number = 50): Promise<PaymentHistory[]> {
    return await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(limit);
  }
  
  // Testimonial operations
  async createTestimonial(testimonialData: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(testimonialData).returning();
    return testimonial;
  }
  
  async getApprovedTestimonials(limit: number = 20): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.approved, 1))
      .orderBy(desc(testimonials.createdAt))
      .limit(limit);
  }
  
  async getFeaturedTestimonials(limit: number = 6): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.approved, 1), eq(testimonials.featured, 1)))
      .orderBy(desc(testimonials.rating), desc(testimonials.revenueGenerated))
      .limit(limit);
  }
  
  async approveTestimonial(id: string): Promise<void> {
    await db
      .update(testimonials)
      .set({ approved: 1 })
      .where(eq(testimonials.id, id));
  }
  
  async featureTestimonial(id: string, featured: boolean): Promise<void> {
    await db
      .update(testimonials)
      .set({ featured: featured ? 1 : 0 })
      .where(eq(testimonials.id, id));
  }
  
  // Referral Code operations
  async createReferralCode(codeData: InsertReferralCode): Promise<ReferralCode> {
    const [code] = await db.insert(referralCodes).values(codeData).returning();
    return code;
  }
  
  async getUserReferralCode(userId: string): Promise<ReferralCode | undefined> {
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId));
    return code;
  }
  
  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code));
    return referralCode;
  }
  
  async updateReferralCodeStats(codeId: string, referredCount: number, rewardEarned: number): Promise<void> {
    await db
      .update(referralCodes)
      .set({
        referredCount,
        rewardEarned,
      })
      .where(eq(referralCodes.id, codeId));
  }
  
  // Referral Conversion operations
  async createReferralConversion(conversionData: InsertReferralConversion): Promise<ReferralConversion> {
    const [conversion] = await db.insert(referralConversions).values(conversionData).returning();
    return conversion;
  }
  
  async getUserReferralConversions(referrerId: string): Promise<ReferralConversion[]> {
    return await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referrerId, referrerId))
      .orderBy(desc(referralConversions.createdAt));
  }
  
  async updateReferralConversionStatus(id: string, status: string, rewardAmount?: number): Promise<void> {
    const updateData: any = { status };
    if (status === 'converted') {
      updateData.convertedAt = new Date();
    }
    if (rewardAmount !== undefined) {
      updateData.rewardAmount = rewardAmount;
    }
    await db
      .update(referralConversions)
      .set(updateData)
      .where(eq(referralConversions.id, id));
  }
  
  // Analytics Event operations
  async trackEvent(eventData: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db.insert(analyticsEvents).values(eventData).returning();
    return event;
  }
  
  async getUserAnalytics(userId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    return await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit);
  }
  
  async getEventsByType(eventType: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    return await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, eventType))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit);
  }
  
  async getAnalyticsSummary(userId?: string): Promise<{
    totalProjects: number;
    totalAiUsage: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    let projectQuery = db.select().from(projects);
    let aiQuery = db.select().from(analyticsEvents).where(eq(analyticsEvents.eventType, 'ai_used'));
    let revenueQuery = db.select().from(analyticsEvents).where(eq(analyticsEvents.eventType, 'subscription_completed'));
    
    if (userId) {
      projectQuery = projectQuery.where(eq(projects.userId, userId)) as any;
      aiQuery = aiQuery.where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.eventType, 'ai_used'))) as any;
      revenueQuery = revenueQuery.where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.eventType, 'subscription_completed'))) as any;
    }
    
    const projectsData = await projectQuery;
    const aiEvents = await aiQuery;
    const revenueEvents = await revenueQuery;
    
    const totalRevenue = revenueEvents.reduce((sum, event) => {
      return sum + ((event.eventData as any)?.revenue || 0);
    }, 0);
    
    const checkoutStarted = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'checkout_started'));
    
    const conversionRate = checkoutStarted.length > 0 
      ? (revenueEvents.length / checkoutStarted.length) * 100 
      : 0;
    
    return {
      totalProjects: projectsData.length,
      totalAiUsage: aiEvents.length,
      totalRevenue,
      conversionRate,
    };
  }
}

export const storage = new DatabaseStorage();
