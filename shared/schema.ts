import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("trial"), // trial, plus, pro
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("trialing"), // trialing, active, cancelled, past_due, expired
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"), // Specific price ID (monthly/quarterly)
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  projectsLimit: integer("projects_limit").default(3), // Trial: 3, Plus: 10, Pro: unlimited (-1)
  aiTokensUsed: integer("ai_tokens_used").default(0),
  aiTokensLimit: integer("ai_tokens_limit").default(5000), // Trial: 5000, Plus: 20000, Pro: unlimited (-1)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Old products table (kept for backwards compatibility)
export const products_old = pgTable("products_old", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt").notNull(),
  creativity: text("creativity"),
  length: integer("length"),
  style: text("style"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Brand Kit - User's branding settings
export const brandKits = pgTable("brand_kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#8B5CF6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#EC4899"),
  colors: jsonb("colors").$type<string[]>().default(sql`'["#8B5CF6", "#EC4899", "#F59E0B"]'::jsonb`),
  fonts: jsonb("fonts").$type<{
    heading?: string;
    body?: string;
    accent?: string;
  }>().default(sql`'{"heading": "Inter", "body": "Georgia", "accent": "Courier New"}'::jsonb`),
  toneOfVoice: varchar("tone_of_voice", { length: 50 }).default("professional"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects - Main product/project container
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // ebook, workbook, course, landing, emails, social
  title: text("title").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, final
  templateId: varchar("template_id"), // ID of template used to create this project
  metadata: jsonb("metadata").$type<{
    niche?: string;
    goal?: string;
    audience?: string;
    tone?: string;
    wordCount?: number;
    imageCount?: number;
    version?: number;
    theme?: {
      fonts?: { heading: string; body: string };
      colors?: string[];
      spacingScale?: number;
      imageStyle?: string;
    };
    starred?: boolean;
    tags?: string[];
  }>(),
  brand: jsonb("brand").$type<{
    primary?: string;
    secondary?: string;
    font?: string;
    logoUrl?: string | null;
  }>(),
  outline: jsonb("outline").$type<Array<{
    id: string;
    title: string;
    level: number;
  }>>(),
  coverImageUrl: text("cover_image_url"),
  backgroundColor: text("background_color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sections - Content blocks within a project (DEPRECATED - use pages/blocks instead)
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }), // text, image, list, quote, cta, task, checkbox, exercise, lesson, objective, script, slide_prompt, hero, proof, benefits, offer, faq
  sectionId: varchar("section_id"), // Reference to outline section
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // TipTap JSON content or markdown
  imagePrompt: text("image_prompt"), // AI prompt for image generation (<= 30 words)
  imageUrl: text("image_url"), // Generated image URL
  imageMetadata: jsonb("image_metadata").$type<{
    width?: number;
    height?: number;
    mimeType?: string;
  }>(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pages - Multi-page structure for projects (NEW)
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  settings: jsonb("settings").$type<{
    backgroundColor?: string;
    layout?: string;
    padding?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pages_project").on(table.projectId),
  index("idx_pages_project_order").on(table.projectId, table.order),
]);

// Block content type definitions
export type HeadingContent = {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
};

export type ParagraphContent = {
  text: string;
  html?: string;
};

export type ImageContent = {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type CTAContent = {
  heading?: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
  buttonStyle?: string;
};

export type ListContent = {
  items: Array<{ text: string; checked?: boolean }>;
  style: 'bullet' | 'numbered' | 'checklist';
};

export type QuoteContent = {
  text: string;
  author?: string;
  source?: string;
};

export type TableContent = {
  rows: Array<Array<string>>;
  headers?: string[];
  caption?: string;
};

export type BlockContent = 
  | HeadingContent 
  | ParagraphContent 
  | ImageContent 
  | CTAContent 
  | ListContent 
  | QuoteContent 
  | TableContent;

// Block type validation
export const blockTypes = ['heading', 'paragraph', 'image', 'cta', 'list', 'quote', 'table'] as const;
export type BlockType = typeof blockTypes[number];

// Blocks - Content blocks within pages (NEW - replaces sections)
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // heading, paragraph, image, cta, list, quote, table
  content: jsonb("content").$type<BlockContent>().notNull(),
  order: integer("order").notNull().default(0),
  settings: jsonb("settings").$type<{
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_blocks_page").on(table.pageId),
  index("idx_blocks_project").on(table.projectId),
  index("idx_blocks_page_order").on(table.pageId, table.order),
]);

// Assets - Images, files, and other media
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }).notNull(), // image, logo, cover, file
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  metadata: jsonb("metadata").$type<{
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
    source?: 'upload' | 'pexels' | 'pixabay' | 'openai' | 'replicate';
    license?: string;
    blockId?: string;
    aiPrompt?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Versions - Autosave snapshots
export const projectVersions = pgTable("project_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshot: jsonb("snapshot").notNull(), // Full project + sections state
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertBrandKitSchema = createInsertSchema(brandKits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(blockTypes),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({
  id: true,
  createdAt: true,
});

// Community Posts - User-generated community content
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community Comments - Comments on posts
export const communityComments = pgTable("community_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community Post Likes - Track who liked what
export const communityPostLikes = pgTable("community_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Template Favorites - Track user's starred templates
export const templateFavorites = pgTable("template_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull(), // Reference to template in shared/templates.ts
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_template_favorites_user").on(table.userId),
]);

// Template Usage - Track when users use templates
export const templateUsage = pgTable("template_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull(), // Reference to template in shared/templates.ts
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }), // Project created from template
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_template_usage_user").on(table.userId),
  index("idx_template_usage_created_at").on(table.createdAt),
]);

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateFavoriteSchema = createInsertSchema(templateFavorites).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateUsageSchema = createInsertSchema(templateUsage).omit({
  id: true,
  createdAt: true,
});

// Types
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityPostLike = typeof communityPostLikes.$inferSelect;

export type TemplateFavorite = typeof templateFavorites.$inferSelect;
export type InsertTemplateFavorite = z.infer<typeof insertTemplateFavoriteSchema>;

export type TemplateUsage = typeof templateUsage.$inferSelect;
export type InsertTemplateUsage = z.infer<typeof insertTemplateUsageSchema>;

// Artifacts - AI Builder outputs (outlines, content, funnels, etc.)
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // idea, outline, content, offer, funnel, launch_plan
  title: text("title").notNull(),
  contentMarkdown: text("content_md"),
  contentJson: jsonb("content_json"),
  metadata: jsonb("metadata").$type<{
    builderType?: string;
    productType?: string;
    niche?: string;
    audienceLevel?: string;
    plan?: string; // plus or pro - which plan generated this
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage Logs - Track AI token usage per user per tool
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tool: varchar("tool", { length: 100 }).notNull(), // idea_finder, outline_builder, content_writer, etc.
  tokensUsed: integer("tokens_used").notNull(),
  model: varchar("model", { length: 50 }), // gpt-4o, gpt-4o-mini, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_usage_logs_user").on(table.userId),
  index("idx_usage_logs_created_at").on(table.createdAt),
]);

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  createdAt: true,
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;

// AI Sessions - Interactive chat sessions with AI builders
export const aiSessions = pgTable("ai_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  builderType: varchar("builder_type", { length: 50 }).notNull(), // product_idea, market_research, content_plan, launch_strategy, scale_blueprint
  title: text("title").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, archived
  metadata: jsonb("metadata").$type<{
    niche?: string;
    productType?: string;
    currentStep?: number;
    totalSteps?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_sessions_user").on(table.userId),
  index("idx_ai_sessions_builder").on(table.builderType),
]);

// AI Messages - Conversation messages within sessions
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => aiSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    tokensUsed?: number;
    model?: string;
    artifactId?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_messages_session").on(table.sessionId),
]);

export const insertAiSessionSchema = createInsertSchema(aiSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

export type AiSession = typeof aiSessions.$inferSelect;
export type InsertAiSession = z.infer<typeof insertAiSessionSchema>;

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;

// Payment History - Track all subscription transactions
export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("eur"),
  status: varchar("status", { length: 20 }).notNull(), // succeeded, failed, pending, refunded
  plan: varchar("plan", { length: 20 }).notNull(), // plus, pro
  billingPeriod: varchar("billing_period", { length: 20 }), // monthly, quarterly
  metadata: jsonb("metadata").$type<{
    description?: string;
    receiptUrl?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payment_history_user").on(table.userId),
]);

// Testimonials - User success stories and reviews
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // nullable for anonymized testimonials
  name: text("name").notNull(),
  role: text("role"), // e.g., "Digital Product Creator", "Course Builder"
  avatarUrl: text("avatar_url"),
  rating: integer("rating").notNull().default(5), // 1-5 stars
  content: text("content").notNull(),
  revenueGenerated: integer("revenue_generated"), // in cents, optional
  productType: varchar("product_type", { length: 50 }), // ebook, course, etc.
  featured: integer("featured").default(0), // 0 or 1, for homepage display
  approved: integer("approved").default(0), // 0 or 1, moderation flag
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_testimonials_featured").on(table.featured),
  index("idx_testimonials_approved").on(table.approved),
]);

// Referral Codes - Track referral program
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull().unique(), // e.g., "JOHN2024" 
  referredCount: integer("referred_count").default(0), // how many people used this code
  rewardEarned: integer("reward_earned").default(0), // in cents, total commission earned
  active: integer("active").default(1), // 0 or 1
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referral_codes_user").on(table.userId),
  index("idx_referral_codes_code").on(table.code),
]);

// Referral Conversions - Track successful referrals
export const referralConversions = pgTable("referral_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }), // user who owns the code
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // new user who signed up
  status: varchar("status", { length: 20 }).default("pending"), // pending, converted, paid
  rewardAmount: integer("reward_amount").default(0), // commission in cents
  createdAt: timestamp("created_at").defaultNow(),
  convertedAt: timestamp("converted_at"), // when they subscribed
}, (table) => [
  index("idx_referral_conversions_referrer").on(table.referrerId),
  index("idx_referral_conversions_referred").on(table.referredUserId),
]);

// Analytics Events - Track user behavior and conversions
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // nullable for anonymous events
  sessionId: varchar("session_id"), // browser session tracking
  eventType: varchar("event_type", { length: 50 }).notNull(), // page_view, project_created, ai_used, checkout_started, subscription_completed
  eventData: jsonb("event_data").$type<{
    page?: string;
    projectType?: string;
    builderType?: string;
    plan?: string;
    billingPeriod?: string;
    revenue?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_events_user").on(table.userId),
  index("idx_analytics_events_type").on(table.eventType),
  index("idx_analytics_events_created").on(table.createdAt),
]);

// Project Events - Track project-specific analytics (Phase 3)
export const projectEvents = pgTable("project_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // view, export_pdf, export_png, export_html, ai_text, ai_image, ai_restyle
  meta: jsonb("meta").$type<{
    exportFormat?: string;
    aiAction?: string;
    imagePrompt?: string;
    themeApplied?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_project_events_project").on(table.projectId),
  index("idx_project_events_user").on(table.userId),
  index("idx_project_events_type").on(table.type),
  index("idx_project_events_created").on(table.createdAt),
]);

// Zod schemas
export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
});

export const insertReferralConversionSchema = createInsertSchema(referralConversions).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertProjectEventSchema = createInsertSchema(projectEvents).omit({
  id: true,
  createdAt: true,
});

// Types
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

export type ReferralConversion = typeof referralConversions.$inferSelect;
export type InsertReferralConversion = z.infer<typeof insertReferralConversionSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type ProjectEvent = typeof projectEvents.$inferSelect;
export type InsertProjectEvent = z.infer<typeof insertProjectEventSchema>;

// User Niches - Store AI-generated niche ideas with scores
export const userNiches = pgTable("user_niches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  painScore: integer("pain_score").notNull(), // 1-10
  moneyScore: integer("money_score").notNull(), // 1-10
  speedScore: integer("speed_score").notNull(), // 1-10
  competitionLevel: varchar("competition_level", { length: 20 }).notNull(), // low, medium, high
  suggestedOffer: text("suggested_offer"),
  aiInsights: text("ai_insights"), // Extra AI suggestions for improvement
  inputs: jsonb("inputs").$type<{
    interests?: string;
    timeAvailable?: string;
    audienceType?: string;
    experienceLevel?: string;
  }>(), // Store the original inputs used to generate this niche
  saved: integer("saved").default(0), // 0 or 1, whether user saved this niche
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_niches_user").on(table.userId),
  index("idx_user_niches_saved").on(table.saved),
]);

export const insertUserNicheSchema = createInsertSchema(userNiches).omit({
  id: true,
  createdAt: true,
});

export type UserNiche = typeof userNiches.$inferSelect;
export type InsertUserNiche = z.infer<typeof insertUserNicheSchema>;
