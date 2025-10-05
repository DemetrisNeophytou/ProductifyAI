import {
  users,
  products_old,
  brandKits,
  projects,
  sections,
  pages,
  blocks,
  assets,
  projectVersions,
  communityPosts,
  communityComments,
  communityPostLikes,
  templateFavorites,
  templateUsage,
  aiSessions,
  aiMessages,
  paymentHistory,
  testimonials,
  referralCodes,
  referralConversions,
  analyticsEvents,
  projectEvents,
  featureFlags,
  creditHistory,
  featureUsageLog,
  aiAgentSessions,
  videoProjects,
  type User,
  type UpsertUser,
  type BrandKit,
  type InsertBrandKit,
  type Project,
  type InsertProject,
  type Section,
  type InsertSection,
  type Page,
  type InsertPage,
  type Block,
  type InsertBlock,
  type Asset,
  type InsertAsset,
  type ProjectVersion,
  type InsertProjectVersion,
  type CommunityPost,
  type InsertCommunityPost,
  type CommunityComment,
  type InsertCommunityComment,
  type TemplateFavorite,
  type InsertTemplateFavorite,
  type TemplateUsage,
  type InsertTemplateUsage,
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
  type ProjectEvent,
  type InsertProjectEvent,
  type FeatureFlag,
  type InsertFeatureFlag,
  type CreditHistory,
  type InsertCreditHistory,
  type FeatureUsageLog,
  type InsertFeatureUsageLog,
  type AiAgentSession,
  type InsertAiAgentSession,
  type VideoProject,
  type InsertVideoProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, like, gte, lte, ilike } from "drizzle-orm";

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
  
  // Section operations (DEPRECATED - use pages/blocks instead)
  createSection(section: InsertSection): Promise<Section>;
  getSection(id: string): Promise<Section | undefined>;
  getProjectSections(projectId: string): Promise<Section[]>;
  updateSection(id: string, data: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  reorderSections(projectId: string, sectionIds: string[]): Promise<void>;
  
  // Page operations (NEW)
  createPage(page: InsertPage): Promise<Page>;
  getPage(id: string): Promise<Page | undefined>;
  getProjectPages(projectId: string): Promise<Page[]>;
  updatePage(id: string, data: Partial<InsertPage>): Promise<Page>;
  deletePage(id: string): Promise<void>;
  reorderPages(projectId: string, pageIds: string[]): Promise<void>;
  duplicatePage(id: string): Promise<Page>;
  
  // Block operations (NEW)
  createBlock(block: InsertBlock): Promise<Block>;
  getBlock(id: string): Promise<Block | undefined>;
  getPageBlocks(pageId: string): Promise<Block[]>;
  updateBlock(id: string, data: Partial<InsertBlock>): Promise<Block>;
  deleteBlock(id: string): Promise<void>;
  reorderBlocks(pageId: string, blockIds: string[]): Promise<void>;
  
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
  
  // Template operations
  toggleTemplateFavorite(userId: string, templateId: string): Promise<{ favorited: boolean }>;
  getUserTemplateFavorites(userId: string): Promise<string[]>;
  createTemplateUsage(usage: InsertTemplateUsage): Promise<TemplateUsage>;
  getUserRecentTemplateUsage(userId: string, limit?: number): Promise<TemplateUsage[]>;
  
  // Phase 3: Project Events & Analytics operations
  createProjectEvent(event: InsertProjectEvent): Promise<ProjectEvent>;
  getProjectEvents(projectId: string, limit?: number): Promise<ProjectEvent[]>;
  getUserProjectEvents(userId: string, limit?: number): Promise<ProjectEvent[]>;
  getProjectAnalyticsSummary(projectId: string): Promise<{
    views: number;
    exports: Record<string, number>;
    aiUsage: Record<string, number>;
  }>;
  getUserAiUsageToday(userId: string, eventType: string): Promise<number>;
  
  // Phase 3: Smart Search operations
  searchProjects(params: {
    userId: string;
    query?: string;
    type?: string;
    tag?: string;
    from?: string;
    to?: string;
    status?: string;
    starred?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Project[]>;
  
  // Phase 5: Feature Flag operations
  getFeatureFlag(name: string): Promise<FeatureFlag | undefined>;
  getAllFeatureFlags(): Promise<FeatureFlag[]>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(name: string, enabled: boolean): Promise<void>;
  isFeatureEnabled(name: string, userTier?: string): Promise<boolean>;
  
  // Phase 5: Credit operations
  getUserCredits(userId: string): Promise<number>;
  deductCredits(userId: string, amount: number, type: string, description?: string): Promise<number>;
  refillCredits(userId: string, amount: number, description?: string): Promise<number>;
  getUserCreditHistory(userId: string, limit?: number): Promise<CreditHistory[]>;
  
  // Phase 5: Feature Usage Log operations
  logFeatureUsage(log: InsertFeatureUsageLog): Promise<FeatureUsageLog>;
  getUserFeatureUsage(userId: string, featureName?: string, limit?: number): Promise<FeatureUsageLog[]>;
  getWeeklyUsageSummary(userId: string): Promise<{
    totalTokens: number;
    totalCredits: number;
    byFeature: Record<string, { tokens: number; credits: number }>;
  }>;
  
  // Phase 5: AI Agent Session operations
  createAiAgentSession(session: InsertAiAgentSession): Promise<AiAgentSession>;
  getAiAgentSession(id: string): Promise<AiAgentSession | undefined>;
  getUserAiAgentSessions(userId: string, agentType?: string): Promise<AiAgentSession[]>;
  updateAiAgentSession(id: string, data: Partial<InsertAiAgentSession>): Promise<AiAgentSession>;
  deleteAiAgentSession(id: string): Promise<void>;
  
  // Phase 5: Video Project operations
  createVideoProject(project: InsertVideoProject): Promise<VideoProject>;
  getVideoProject(id: string): Promise<VideoProject | undefined>;
  getUserVideoProjects(userId: string): Promise<VideoProject[]>;
  updateVideoProject(id: string, data: Partial<InsertVideoProject>): Promise<VideoProject>;
  deleteVideoProject(id: string): Promise<void>;
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
          colors: brandKitData.colors,
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

  // Page operations
  async createPage(page: InsertPage): Promise<Page> {
    const [newPage] = await db.insert(pages).values(page).returning();
    return newPage;
  }

  async getPage(id: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }

  async getProjectPages(projectId: string): Promise<Page[]> {
    return await db
      .select()
      .from(pages)
      .where(eq(pages.projectId, projectId))
      .orderBy(pages.order);
  }

  async updatePage(id: string, data: Partial<InsertPage>): Promise<Page> {
    const [updated] = await db
      .update(pages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updated;
  }

  async deletePage(id: string): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }

  async reorderPages(projectId: string, pageIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < pageIds.length; i++) {
        await tx
          .update(pages)
          .set({ order: i })
          .where(eq(pages.id, pageIds[i]));
      }
    });
  }

  async duplicatePage(id: string): Promise<Page> {
    const original = await this.getPage(id);
    if (!original) throw new Error("Page not found");

    const pageBlocks = await this.getPageBlocks(id);

    return await db.transaction(async (tx) => {
      const [newPage] = await tx
        .insert(pages)
        .values({
          projectId: original.projectId,
          title: `${original.title} (Copy)`,
          order: original.order + 1,
          settings: original.settings,
        })
        .returning();

      for (const block of pageBlocks) {
        await tx.insert(blocks).values({
          pageId: newPage.id,
          projectId: original.projectId,
          type: block.type,
          content: block.content,
          order: block.order,
          settings: block.settings,
        });
      }

      return newPage;
    });
  }

  // Block operations
  async createBlock(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db.insert(blocks).values(block).returning();
    return newBlock;
  }

  async getBlock(id: string): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.id, id));
    return block;
  }

  async getPageBlocks(pageId: string): Promise<Block[]> {
    return await db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(blocks.order);
  }

  async updateBlock(id: string, data: Partial<InsertBlock>): Promise<Block> {
    const [updated] = await db
      .update(blocks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blocks.id, id))
      .returning();
    return updated;
  }

  async deleteBlock(id: string): Promise<void> {
    await db.delete(blocks).where(eq(blocks.id, id));
  }

  async reorderBlocks(pageId: string, blockIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < blockIds.length; i++) {
        await tx
          .update(blocks)
          .set({ order: i })
          .where(eq(blocks.id, blockIds[i]));
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
  
  // Template operations
  async toggleTemplateFavorite(userId: string, templateId: string): Promise<{ favorited: boolean }> {
    const existing = await db
      .select()
      .from(templateFavorites)
      .where(and(
        eq(templateFavorites.userId, userId),
        eq(templateFavorites.templateId, templateId)
      ));
    
    if (existing.length > 0) {
      await db
        .delete(templateFavorites)
        .where(eq(templateFavorites.id, existing[0].id));
      return { favorited: false };
    } else {
      await db.insert(templateFavorites).values({ userId, templateId });
      return { favorited: true };
    }
  }
  
  async getUserTemplateFavorites(userId: string): Promise<string[]> {
    const favorites = await db
      .select()
      .from(templateFavorites)
      .where(eq(templateFavorites.userId, userId));
    return favorites.map(f => f.templateId);
  }
  
  async createTemplateUsage(usageData: InsertTemplateUsage): Promise<TemplateUsage> {
    const [usage] = await db.insert(templateUsage).values(usageData).returning();
    return usage;
  }
  
  async getUserRecentTemplateUsage(userId: string, limit: number = 10): Promise<TemplateUsage[]> {
    return await db
      .select()
      .from(templateUsage)
      .where(eq(templateUsage.userId, userId))
      .orderBy(desc(templateUsage.createdAt))
      .limit(limit);
  }
  
  // Phase 3: Project Events & Analytics operations
  async createProjectEvent(eventData: InsertProjectEvent): Promise<ProjectEvent> {
    const [event] = await db.insert(projectEvents).values(eventData).returning();
    return event;
  }
  
  async getProjectEvents(projectId: string, limit: number = 100): Promise<ProjectEvent[]> {
    return await db
      .select()
      .from(projectEvents)
      .where(eq(projectEvents.projectId, projectId))
      .orderBy(desc(projectEvents.createdAt))
      .limit(limit);
  }
  
  async getUserProjectEvents(userId: string, limit: number = 100): Promise<ProjectEvent[]> {
    return await db
      .select()
      .from(projectEvents)
      .where(eq(projectEvents.userId, userId))
      .orderBy(desc(projectEvents.createdAt))
      .limit(limit);
  }
  
  async getProjectAnalyticsSummary(projectId: string): Promise<{
    views: number;
    exports: Record<string, number>;
    aiUsage: Record<string, number>;
  }> {
    const events = await db
      .select()
      .from(projectEvents)
      .where(eq(projectEvents.projectId, projectId));
    
    const views = events.filter(e => e.type === 'view').length;
    
    const exports: Record<string, number> = {};
    events.filter(e => e.type.startsWith('export_')).forEach(e => {
      const format = e.type.replace('export_', '');
      exports[format] = (exports[format] || 0) + 1;
    });
    
    const aiUsage: Record<string, number> = {};
    events.filter(e => e.type.startsWith('ai_')).forEach(e => {
      aiUsage[e.type] = (aiUsage[e.type] || 0) + 1;
    });
    
    return { views, exports, aiUsage };
  }
  
  async getUserAiUsageToday(userId: string, eventType: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await db
      .select()
      .from(projectEvents)
      .where(
        and(
          eq(projectEvents.userId, userId),
          eq(projectEvents.type, eventType),
          gte(projectEvents.createdAt, today)
        )
      );
    
    return events.length;
  }
  
  // Phase 3: Smart Search operations
  async searchProjects(params: {
    userId: string;
    query?: string;
    type?: string;
    tag?: string;
    from?: string;
    to?: string;
    status?: string;
    starred?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    const conditions = [eq(projects.userId, params.userId)];
    
    if (params.type) {
      conditions.push(eq(projects.type, params.type));
    }
    
    if (params.status) {
      conditions.push(eq(projects.status, params.status));
    }
    
    if (params.starred !== undefined) {
      conditions.push(
        sql`${projects.metadata}->>'starred' = ${params.starred.toString()}`
      );
    }
    
    if (params.from) {
      conditions.push(gte(projects.createdAt, new Date(params.from)));
    }
    
    if (params.to) {
      conditions.push(lte(projects.createdAt, new Date(params.to)));
    }
    
    if (params.tag) {
      conditions.push(
        sql`${projects.metadata}->'tags' ? ${params.tag}`
      );
    }
    
    if (params.query) {
      conditions.push(
        or(
          ilike(projects.title, `%${params.query}%`),
          sql`${projects.metadata}->>'niche' ILIKE ${`%${params.query}%`}`
        )
      );
    }
    
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    
    const results = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.updatedAt))
      .limit(limit)
      .offset(offset);
    
    return results;
  }
  
  // Phase 5: Feature Flag operations
  async getFeatureFlag(name: string): Promise<FeatureFlag | undefined> {
    const result = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, name))
      .limit(1);
    return result[0];
  }
  
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags);
  }
  
  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const result = await db.insert(featureFlags).values(flag).returning();
    return result[0]!;
  }
  
  async updateFeatureFlag(name: string, enabled: boolean): Promise<void> {
    await db
      .update(featureFlags)
      .set({ enabled: enabled ? 1 : 0, updatedAt: new Date() })
      .where(eq(featureFlags.name, name));
  }
  
  async isFeatureEnabled(name: string, userTier?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(name);
    if (!flag || flag.enabled === 0) return false;
    
    if (flag.metadata?.allowedTiers && userTier) {
      return flag.metadata.allowedTiers.includes(userTier);
    }
    
    return true;
  }
  
  // Phase 5: Credit operations
  async getUserCredits(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.credits || 0;
  }
  
  async deductCredits(userId: string, amount: number, type: string, description?: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const currentCredits = user.credits || 0;
    const newBalance = Math.max(0, currentCredits - amount);
    
    await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
    
    await db.insert(creditHistory).values({
      userId,
      amount: -amount,
      type,
      description: description || `Used ${amount} credits for ${type}`,
      balanceAfter: newBalance,
    });
    
    return newBalance;
  }
  
  async refillCredits(userId: string, amount: number, description?: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + amount;
    
    await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
    
    await db.insert(creditHistory).values({
      userId,
      amount,
      type: 'refill',
      description: description || `Refilled ${amount} credits`,
      balanceAfter: newBalance,
    });
    
    return newBalance;
  }
  
  async getUserCreditHistory(userId: string, limit: number = 50): Promise<CreditHistory[]> {
    return await db
      .select()
      .from(creditHistory)
      .where(eq(creditHistory.userId, userId))
      .orderBy(desc(creditHistory.createdAt))
      .limit(limit);
  }
  
  // Phase 5: Feature Usage Log operations
  async logFeatureUsage(log: InsertFeatureUsageLog): Promise<FeatureUsageLog> {
    const result = await db.insert(featureUsageLog).values(log).returning();
    return result[0]!;
  }
  
  async getUserFeatureUsage(userId: string, featureName?: string, limit: number = 100): Promise<FeatureUsageLog[]> {
    const conditions = [eq(featureUsageLog.userId, userId)];
    if (featureName) {
      conditions.push(eq(featureUsageLog.featureName, featureName));
    }
    
    return await db
      .select()
      .from(featureUsageLog)
      .where(and(...conditions))
      .orderBy(desc(featureUsageLog.createdAt))
      .limit(limit);
  }
  
  async getWeeklyUsageSummary(userId: string): Promise<{
    totalTokens: number;
    totalCredits: number;
    byFeature: Record<string, { tokens: number; credits: number }>;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const logs = await db
      .select()
      .from(featureUsageLog)
      .where(
        and(
          eq(featureUsageLog.userId, userId),
          gte(featureUsageLog.createdAt, weekAgo)
        )
      );
    
    const summary = {
      totalTokens: 0,
      totalCredits: 0,
      byFeature: {} as Record<string, { tokens: number; credits: number }>,
    };
    
    for (const log of logs) {
      summary.totalTokens += log.tokenCount || 0;
      summary.totalCredits += log.creditsCost || 0;
      
      if (!summary.byFeature[log.featureName]) {
        summary.byFeature[log.featureName] = { tokens: 0, credits: 0 };
      }
      summary.byFeature[log.featureName].tokens += log.tokenCount || 0;
      summary.byFeature[log.featureName].credits += log.creditsCost || 0;
    }
    
    return summary;
  }
  
  // Phase 5: AI Agent Session operations
  async createAiAgentSession(session: InsertAiAgentSession): Promise<AiAgentSession> {
    const result = await db.insert(aiAgentSessions).values(session).returning();
    return result[0]!;
  }
  
  async getAiAgentSession(id: string): Promise<AiAgentSession | undefined> {
    const result = await db
      .select()
      .from(aiAgentSessions)
      .where(eq(aiAgentSessions.id, id))
      .limit(1);
    return result[0];
  }
  
  async getUserAiAgentSessions(userId: string, agentType?: string): Promise<AiAgentSession[]> {
    const conditions = [eq(aiAgentSessions.userId, userId)];
    if (agentType) {
      conditions.push(eq(aiAgentSessions.agentType, agentType));
    }
    
    return await db
      .select()
      .from(aiAgentSessions)
      .where(and(...conditions))
      .orderBy(desc(aiAgentSessions.updatedAt));
  }
  
  async updateAiAgentSession(id: string, data: Partial<InsertAiAgentSession>): Promise<AiAgentSession> {
    const result = await db
      .update(aiAgentSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiAgentSessions.id, id))
      .returning();
    return result[0]!;
  }
  
  async deleteAiAgentSession(id: string): Promise<void> {
    await db.delete(aiAgentSessions).where(eq(aiAgentSessions.id, id));
  }
  
  // Phase 5: Video Project operations
  async createVideoProject(project: InsertVideoProject): Promise<VideoProject> {
    const result = await db.insert(videoProjects).values(project).returning();
    return result[0]!;
  }
  
  async getVideoProject(id: string): Promise<VideoProject | undefined> {
    const result = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, id))
      .limit(1);
    return result[0];
  }
  
  async getUserVideoProjects(userId: string): Promise<VideoProject[]> {
    return await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.userId, userId))
      .orderBy(desc(videoProjects.updatedAt));
  }
  
  async updateVideoProject(id: string, data: Partial<InsertVideoProject>): Promise<VideoProject> {
    const result = await db
      .update(videoProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videoProjects.id, id))
      .returning();
    return result[0]!;
  }
  
  async deleteVideoProject(id: string): Promise<void> {
    await db.delete(videoProjects).where(eq(videoProjects.id, id));
  }
}

export const storage = new DatabaseStorage();
