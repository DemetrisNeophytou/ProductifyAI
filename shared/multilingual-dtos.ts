/**
 * Multilingual & Social Export DTOs
 * Type definitions and Zod validation schemas for translation and social features
 */

import { z } from 'zod';

// =============================================================================
// TRANSLATION DTOs
// =============================================================================

export const TranslationRequestSchema = z.object({
  to: z.string().length(2, 'Language code must be 2 characters').regex(/^[a-z]{2}$/, 'Invalid language code'),
  force: z.boolean().optional().default(false),
});

export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

export const TranslationResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    projectId: z.string(),
    from: z.string(),
    to: z.string(),
    blocks: z.array(z.object({
      id: z.string(),
      content: z.record(z.any()),
      locale: z.string(),
      originalId: z.string(),
    })),
  }).optional(),
  error: z.string().optional(),
});

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;

// =============================================================================
// SOCIAL PACK DTOs
// =============================================================================

export const SocialPackRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  platforms: z.array(z.enum(['reels', 'tiktok', 'shorts'])).min(1, 'At least one platform required'),
  tone: z.enum(['professional', 'casual', 'energetic', 'friendly']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional().default('short'),
  locale: z.string().length(2).optional().default('en'),
});

export type SocialPackRequest = z.infer<typeof SocialPackRequestSchema>;

export const SocialPackResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    packId: z.string(),
    projectId: z.string(),
    platforms: z.array(z.string()),
    payload: z.record(z.object({
      caption: z.string(),
      hashtags: z.array(z.string()),
      shortScript: z.string(),
      hooks: z.array(z.string()),
      cta: z.string(),
    })),
  }).optional(),
  error: z.string().optional(),
});

export type SocialPackResponse = z.infer<typeof SocialPackResponseSchema>;

// =============================================================================
// MEDIA GENERATION DTOs
// =============================================================================

export const MediaGenerationRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  projectId: z.string().optional(),
  type: z.enum(['image', 'video', 'audio']).default('image'),
  style: z.enum(['realistic', 'illustration', 'abstract', 'minimal']).optional(),
  size: z.enum(['square', 'landscape', 'portrait']).optional(),
});

export type MediaGenerationRequest = z.infer<typeof MediaGenerationRequestSchema>;

export const MediaResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    id: z.string(),
    url: z.string(),
    type: z.string(),
    prompt: z.string(),
    metadata: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      format: z.string().optional(),
      size: z.number().optional(),
    }).optional(),
  }).optional(),
  error: z.string().optional(),
});

export type MediaResponse = z.infer<typeof MediaResponseSchema>;

// =============================================================================
// SUPPORTED LOCALES
// =============================================================================

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]['code'];

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateTranslationRequest(data: unknown): { valid: boolean; data?: TranslationRequest; errors?: string[] } {
  try {
    const validated = TranslationRequestSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    return { valid: false, errors: ['Invalid request format'] };
  }
}

export function validateSocialPackRequest(data: unknown): { valid: boolean; data?: SocialPackRequest; errors?: string[] } {
  try {
    const validated = SocialPackRequestSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    return { valid: false, errors: ['Invalid request format'] };
  }
}

export function validateMediaRequest(data: unknown): { valid: boolean; data?: MediaGenerationRequest; errors?: string[] } {
  try {
    const validated = MediaGenerationRequestSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    return { valid: false, errors: ['Invalid request format'] };
  }
}
