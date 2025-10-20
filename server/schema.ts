import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  numeric,
  text,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  isPro: boolean("is_pro").default(false).notNull(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 💎 PRODUCTS TABLE
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(), // Foreign key -> users.id
  title: varchar("title", { length: 200 }).notNull(),
  kind: varchar("kind", { length: 50 }).notNull(), // eBook | course | template | video-pack
  price: numeric("price", { precision: 10, scale: 2 }).default("0").notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 💰 PURCHASES TABLE
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 🚀 PROJECTS TABLE - AI Product Builder
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // ebook, course, template
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
}, (table) => [
  index("idx_projects_user").on(table.userId),
  index("idx_projects_type").on(table.type),
  index("idx_projects_status").on(table.status),
]);

// 📄 PAGES TABLE - Multi-page structure for projects
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

// 🧱 BLOCKS TABLE - Content blocks within pages
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // heading, paragraph, image, cta, list, quote, table
  content: jsonb("content").notNull(),
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

// 🧱 PROJECT_BLOCKS TABLE - Content blocks for AI-generated projects
export const projectBlocks = pgTable("project_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // heading, paragraph, image, cta, list, quote, table
  content: jsonb("content").notNull(),
  order: integer("order").notNull().default(0),
  section: varchar("section", { length: 50 }), // cover, sections, sell, funnel
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
  index("idx_project_blocks_project").on(table.projectId),
  index("idx_project_blocks_section").on(table.section),
  index("idx_project_blocks_order").on(table.projectId, table.order),
]);

// 🌍 SOCIAL_PACKS TABLE - Social media content generation
export const socialPacks = pgTable("social_packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull().default("en"),
  platforms: jsonb("platforms").$type<string[]>().notNull(),
  payload: jsonb("payload").$type<{
    reels?: {
      caption: string;
      hashtags: string[];
      shortScript: string;
      hooks: string[];
      cta: string;
    };
    tiktok?: {
      caption: string;
      hashtags: string[];
      shortScript: string;
      hooks: string[];
      cta: string;
    };
    shorts?: {
      caption: string;
      hashtags: string[];
      shortScript: string;
      hooks: string[];
      cta: string;
    };
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_packs_project").on(table.projectId),
  index("idx_social_packs_locale").on(table.locale),
]);

// 🖼️ MEDIA TABLE - Generated media assets
export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // image, video, audio
  prompt: text("prompt").notNull(),
  license: varchar("license", { length: 40 }).default("generated").notNull(),
  attribution: text("attribution"),
  metadata: jsonb("metadata").$type<{
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    size?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_media_project").on(table.projectId),
  index("idx_media_user").on(table.userId),
  index("idx_media_type").on(table.type),
]);

// 📊 ANALYTICS TABLE - Product metrics and events
export const metricsEvents = pgTable("metrics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 40 }).notNull(),
  value: numeric("value"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_metrics_events_user").on(table.userId),
  index("idx_metrics_events_project").on(table.projectId),
  index("idx_metrics_events_kind").on(table.kind),
  index("idx_metrics_events_created_at").on(table.createdAt),
]);

// 🛒 COMMERCE TABLES - Marketplace & Monetization

// Listings table - Published products in marketplace
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, published, archived
  category: varchar("category", { length: 50 }).notNull(), // ebook, course, template, video
  tags: jsonb("tags").$type<string[]>().default([]),
  coverImage: text("cover_image"),
  previewImages: jsonb("preview_images").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  fileSize: integer("file_size"), // in bytes
  downloadCount: integer("download_count").default(0).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_listings_owner").on(table.ownerId),
  index("idx_listings_status").on(table.status),
  index("idx_listings_category").on(table.category),
  index("idx_listings_slug").on(table.slug),
  index("idx_listings_published_at").on(table.publishedAt),
]);

// Orders table - Purchase records
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: integer("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  stripeSessionId: varchar("stripe_session_id").unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, completed, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }),
  buyerEmail: varchar("buyer_email", { length: 255 }).notNull(),
  buyerName: varchar("buyer_name", { length: 120 }),
  metadata: jsonb("metadata").$type<{
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    discount_code?: string;
    tax_amount?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_orders_buyer").on(table.buyerId),
  index("idx_orders_listing").on(table.listingId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_stripe_session").on(table.stripeSessionId),
  index("idx_orders_created_at").on(table.createdAt),
]);

// Entitlements table - What users own
export const entitlements = pgTable("entitlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // purchase, clone, free
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, expired, revoked
  permissions: jsonb("permissions").$type<{
    can_download: boolean;
    can_clone: boolean;
    can_share: boolean;
    can_modify: boolean;
    expires_at?: string;
  }>().default({
    can_download: true,
    can_clone: false,
    can_share: false,
    can_modify: false
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_entitlements_user").on(table.userId),
  index("idx_entitlements_project").on(table.projectId),
  index("idx_entitlements_listing").on(table.listingId),
  index("idx_entitlements_type").on(table.type),
  index("idx_entitlements_status").on(table.status),
]);

// Reviews table - User reviews for listings
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 200 }),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_listing").on(table.listingId),
  index("idx_reviews_user").on(table.userId),
  index("idx_reviews_rating").on(table.rating),
  index("idx_reviews_created_at").on(table.createdAt),
  // Ensure one review per user per listing
  index("idx_reviews_user_listing").on(table.userId, table.listingId),
]);