/**
 * AI Product Builder & Video Builder DTOs
 * Shared type definitions and Zod validation schemas
 */

import { z } from 'zod';

// =============================================================================
// AI PRODUCT BUILDER DTOs
// =============================================================================

export const AIProductRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
  type: z.enum(['ebook', 'template', 'course']).default('ebook'),
  audience: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative']).optional(),
  goal: z.string().optional(),
});

export type AIProductRequest = z.infer<typeof AIProductRequestSchema>;

export const AIProductResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    projectId: z.string(),
    title: z.string(),
    layout: z.object({
      cover: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        imageUrl: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
      sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        order: z.number(),
        type: z.enum(['heading', 'paragraph', 'image', 'list', 'quote']),
      })),
    }),
    sell: z.object({
      price: z.number(),
      currency: z.literal('EUR'),
      cta: z.string(),
      salesBlurb: z.string(),
    }),
    funnel: z.object({
      playbook: z.string(),
      emails: z.array(z.object({
        subject: z.string(),
        content: z.string(),
        sendAfter: z.number(), // days
      })),
    }),
  }).optional(),
  error: z.string().optional(),
});

export type AIProductResponse = z.infer<typeof AIProductResponseSchema>;

// =============================================================================
// VIDEO BUILDER DTOs
// =============================================================================

export const VideoGenerationRequestSchema = z.object({
  script: z.string().min(1, 'Script is required').max(10000, 'Script too long'),
});

export type VideoGenerationRequest = z.infer<typeof VideoGenerationRequestSchema>;

export const VideoGenerationResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    videoId: z.string(),
    scenes: z.array(z.object({
      id: z.string(),
      caption: z.string(),
      duration: z.number(),
      order: z.number(),
    })),
    totalDuration: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export type VideoGenerationResponse = z.infer<typeof VideoGenerationResponseSchema>;

// =============================================================================
// PROJECTS DTOs
// =============================================================================

export const ProjectUpdateRequestSchema = z.object({
  title: z.string().optional(),
  layout: z.record(z.any()).optional(), // Canvas JSON
  status: z.enum(['draft', 'final']).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ProjectUpdateRequest = z.infer<typeof ProjectUpdateRequestSchema>;

export const ProjectResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    id: z.string(),
    userId: z.string().nullable(),
    type: z.string(),
    title: z.string(),
    status: z.string(),
    layout: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateAIProductRequest(data: unknown): { valid: boolean; data?: AIProductRequest; errors?: string[] } {
  try {
    const validated = AIProductRequestSchema.parse(data);
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

export function validateVideoRequest(data: unknown): { valid: boolean; data?: VideoGenerationRequest; errors?: string[] } {
  try {
    const validated = VideoGenerationRequestSchema.parse(data);
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

export function validateProjectUpdate(data: unknown): { valid: boolean; data?: ProjectUpdateRequest; errors?: string[] } {
  try {
    const validated = ProjectUpdateRequestSchema.parse(data);
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
