// ProductifyAI Validation Utilities
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const productTypeSchema = z.enum(['eBook', 'course', 'template', 'video-pack']);

// Product validation schema
export const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  kind: productTypeSchema,
  price: z.number().min(0, 'Price must be positive'),
  published: z.boolean().optional().default(false),
  ownerId: z.number().int().positive('Invalid owner ID')
});

// User validation schema
export const userSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(120, 'Name too long'),
  isPro: z.boolean().optional().default(false)
});

// Video generation schema
export const videoGenerationSchema = z.object({
  script: z.string().min(1, 'Script is required'),
  template: z.string().optional().default('modern'),
  productId: z.number().int().positive().optional()
});

// AI generation schema
export const aiGenerationSchema = z.object({
  idea: z.string().min(1, 'Idea is required'),
  productType: productTypeSchema,
  userId: z.number().int().positive('Invalid user ID')
});
