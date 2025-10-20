/**
 * AI Product Builder Contracts
 * Type definitions and interfaces for AI-powered product generation
 */

export interface AIProductRequest {
  idea: string;
  userId: string;
  productType: 'eBook' | 'course' | 'template' | 'video-pack';
  niche?: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative';
  length?: 'short' | 'medium' | 'long';
  includeImages?: boolean;
  includeExercises?: boolean;
  includeTemplates?: boolean;
}

export interface AIProductResponse {
  ok: boolean;
  data?: {
    productId: string;
    title: string;
    description: string;
    outline: Chapter[];
    content: ContentBlock[];
    metadata: ProductMetadata;
    estimatedTime: number;
    wordCount: number;
  };
  error?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedReadTime: number;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'exercise' | 'template' | 'image' | 'quote';
  metadata?: {
    imagePrompt?: string;
    exerciseType?: string;
    templateData?: any;
  };
}

export interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'exercise' | 'template' | 'image';
  content: string;
  order: number;
  chapterId: string;
  metadata?: {
    level?: number;
    style?: string;
    imagePrompt?: string;
    exerciseData?: any;
    templateData?: any;
  };
}

export interface ProductMetadata {
  niche: string;
  targetAudience: string;
  tone: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  estimatedReadTime: number;
  wordCount: number;
  imageCount: number;
  exerciseCount: number;
  templateCount: number;
}

export interface AIGenerationOptions {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
  temperature: number;
  maxTokens: number;
  includeImages: boolean;
  includeExercises: boolean;
  includeTemplates: boolean;
  customPrompts?: {
    title?: string;
    outline?: string;
    content?: string;
  };
}

export interface AIBuilderConfig {
  openaiApiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  contentLimits: {
    maxChapters: number;
    maxSectionsPerChapter: number;
    maxWordsPerSection: number;
  };
}

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  type: 'eBook' | 'course' | 'template' | 'video-pack';
  structure: Chapter[];
  prompts: {
    title: string;
    outline: string;
    content: string;
  };
  metadata: {
    difficulty: string;
    category: string;
    tags: string[];
    estimatedTime: number;
  };
}

export interface AIBuilderService {
  generateProduct(request: AIProductRequest): Promise<AIProductResponse>;
  generateOutline(idea: string, productType: string): Promise<Chapter[]>;
  generateContent(chapter: Chapter, options: AIGenerationOptions): Promise<ContentBlock[]>;
  generateTitle(idea: string, productType: string): Promise<string>;
  generateDescription(outline: Chapter[]): Promise<string>;
  validateRequest(request: AIProductRequest): { valid: boolean; errors: string[] };
  getTemplates(productType: string): Promise<ProductTemplate[]>;
  getBuilderConfig(): Promise<AIBuilderConfig>;
}
