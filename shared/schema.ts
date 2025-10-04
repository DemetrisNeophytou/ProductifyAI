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
  type: varchar("type", { length: 50 }).notNull(), // ebook, course, checklist, template, leadmagnet, workbook
  title: text("title").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, final
  templateId: varchar("template_id"), // ID of template used to create this project
  metadata: jsonb("metadata").$type<{
    niche?: string;
    goal?: string;
    audience?: string;
    tone?: string;
  }>(),
  coverImageUrl: text("cover_image_url"),
  backgroundColor: text("background_color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sections - Content blocks within a project
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }), // framework type: intro, problem, solution, offer, etc
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // TipTap JSON content
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Types
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityPostLike = typeof communityPostLikes.$inferSelect;
