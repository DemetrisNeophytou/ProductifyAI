/**
 * Input Validation Middleware (Zod)
 * 
 * Validates request body, query params, and URL params using Zod schemas
 * Prevents invalid data from reaching route handlers
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { Logger } from '../utils/logger';

/**
 * Validation source types
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * 
 * @param schema - Zod schema to validate against
 * @param source - Where to get the data from (body, query, params)
 * @returns Express middleware
 * 
 * @example
 * router.post('/users', validate(createUserSchema, 'body'), createUser);
 */
export const validate = (schema: AnyZodObject, source: ValidationSource = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from specified source
      const dataToValidate = req[source];
      
      // Validate data against schema
      const validated = await schema.parseAsync(dataToValidate);
      
      // Replace request data with validated (and sanitized) data
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for client response
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        Logger.warn(`Validation error on ${req.method} ${req.path}:`, formattedErrors);
        
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: formattedErrors,
        });
      }
      
      // Handle unexpected errors
      Logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };
};

/**
 * Common Zod Schemas
 * 
 * Reusable validation schemas for common data types
 */

export const commonSchemas = {
  /**
   * UUID validation
   */
  uuid: z.string().uuid({ message: 'Invalid UUID format' }),
  
  /**
   * Email validation
   */
  email: z.string().email({ message: 'Invalid email address' }),
  
  /**
   * URL validation
   */
  url: z.string().url({ message: 'Invalid URL format' }),
  
  /**
   * Pagination params
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  /**
   * Date range validation
   */
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine(
    data => new Date(data.startDate) <= new Date(data.endDate),
    { message: 'Start date must be before or equal to end date' }
  ),
  
  /**
   * ID param validation
   */
  idParam: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
};

/**
 * Example schemas for common routes
 * These can be imported and used in route files
 */

/**
 * User registration schema
 */
export const registerUserSchema = z.object({
  email: commonSchemas.email,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: commonSchemas.email.optional(),
  bio: z.string().max(500).optional(),
  avatar: commonSchemas.url.optional(),
});

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['ebook', 'landing_page', 'social_post', 'email', 'video']),
  settings: z.record(z.unknown()).optional(),
});

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.any().optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * AI generation schema
 */
export const aiGenerationSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must be less than 2000 characters'),
  type: z.enum(['text', 'image', 'video']),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4000).optional(),
});

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
});

/**
 * Search query schema
 */
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  category: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Batch operation schema
 */
export const batchOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required').max(100, 'Maximum 100 IDs per batch'),
  action: z.enum(['delete', 'archive', 'publish', 'duplicate']),
});

/**
 * Webhook payload schema
 */
export const webhookSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  signature: z.string().optional(),
});

/**
 * Payment intent schema
 */
export const createPaymentSchema = z.object({
  amount: z.number().int().positive().max(999999999), // Max $9,999,999.99
  currency: z.string().length(3).toUpperCase(),
  productId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * Validation helper for arrays
 */
export const validateArray = <T extends z.ZodTypeAny>(itemSchema: T, options?: {
  minItems?: number;
  maxItems?: number;
}) => {
  let schema = z.array(itemSchema);
  
  if (options?.minItems !== undefined) {
    schema = schema.min(options.minItems, `At least ${options.minItems} items required`);
  }
  
  if (options?.maxItems !== undefined) {
    schema = schema.max(options.maxItems, `Maximum ${options.maxItems} items allowed`);
  }
  
  return schema;
};

/**
 * Sanitize and validate file upload
 */
export const validateFileUpload = (file: any) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
  ];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  const schema = z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.enum(allowedMimeTypes as [string, ...string[]]),
    size: z.number().int().positive().max(maxSize),
  });
  
  return schema.parse(file);
};

/**
 * Custom error formatter
 */
export const formatValidationError = (error: ZodError) => {
  const formatted = error.errors.reduce((acc, err) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    error: 'Validation Error',
    fields: formatted,
  };
};

