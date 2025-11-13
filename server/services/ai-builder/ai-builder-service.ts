/**
 * AI Product Builder Service
 * Main service for AI-powered product generation
 */

import { 
  AIProductRequest, 
  AIProductResponse, 
  AIBuilderService as IAIBuilderService,
  AIGenerationOptions,
  ProductTemplate,
  AIBuilderConfig
} from '../../../shared/ai-builder-contracts';
import { ContentGenerator } from './content-generator';
import { TemplateManager } from './template-manager';
import { ValidationService } from './validation-service';

export class AIBuilderService implements IAIBuilderService {
  private contentGenerator: ContentGenerator;
  private templateManager: TemplateManager;
  private validationService: ValidationService;

  constructor() {
    this.contentGenerator = new ContentGenerator();
    this.templateManager = new TemplateManager();
    this.validationService = new ValidationService();
  }

  async generateProduct(request: AIProductRequest): Promise<AIProductResponse> {
    try {
      // Validate request
      const validation = this.validationService.validateRequest(request);
      if (!validation.valid) {
        return {
          ok: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Get appropriate template
      const template = await this.templateManager.getTemplate(request.productType, request.niche);
      
      // Generate product outline
      const outline = await this.generateOutline(request.idea, request.productType);
      
      // Generate content for each chapter
      const contentBlocks = await this.generateContentBlocks(outline, request);
      
      // Generate metadata
      const metadata = await this.generateMetadata(request, outline, contentBlocks);
      
      // Create product response
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        ok: true,
        data: {
          productId,
          title: await this.generateTitle(request.idea, request.productType),
          description: await this.generateDescription(outline),
          outline,
          content: contentBlocks,
          metadata,
          estimatedTime: metadata.estimatedReadTime,
          wordCount: metadata.wordCount
        }
      };
    } catch (error: any) {
      return {
        ok: false,
        error: `Failed to generate product: ${error.message}`
      };
    }
  }

  async generateOutline(idea: string, productType: string): Promise<any[]> {
    return await this.contentGenerator.generateOutline(idea, productType);
  }

  async generateContent(chapter: any, options: AIGenerationOptions): Promise<any[]> {
    return await this.contentGenerator.generateContent(chapter, options);
  }

  async generateTitle(idea: string, productType: string): Promise<string> {
    return await this.contentGenerator.generateTitle(idea, productType);
  }

  async generateDescription(outline: any[]): Promise<string> {
    return await this.contentGenerator.generateDescription(outline);
  }

  validateRequest(request: AIProductRequest): { valid: boolean; errors: string[] } {
    return this.validationService.validateRequest(request);
  }

  async getTemplates(productType: string): Promise<ProductTemplate[]> {
    return await this.templateManager.getTemplates(productType);
  }

  async getBuilderConfig(): Promise<AIBuilderConfig> {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.AI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      contentLimits: {
        maxChapters: 20,
        maxSectionsPerChapter: 10,
        maxWordsPerSection: 2000
      }
    };
  }

  private async generateContentBlocks(outline: any[], request: AIProductRequest): Promise<any[]> {
    const contentBlocks: any[] = [];
    
    for (const chapter of outline) {
      const options: AIGenerationOptions = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        includeImages: request.includeImages || false,
        includeExercises: request.includeExercises || false,
        includeTemplates: request.includeTemplates || false
      };
      
      const chapterContent = await this.generateContent(chapter, options);
      contentBlocks.push(...chapterContent);
    }
    
    return contentBlocks;
  }

  private async generateMetadata(request: AIProductRequest, outline: any[], contentBlocks: any[]): Promise<any> {
    const wordCount = contentBlocks.reduce((total, block) => {
      return total + (block.content?.length || 0);
    }, 0);

    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      niche: request.niche || 'general',
      targetAudience: request.targetAudience || 'general audience',
      tone: request.tone || 'professional',
      difficulty: 'intermediate',
      category: request.productType,
      tags: this.generateTags(request.idea, request.niche),
      estimatedReadTime,
      wordCount,
      imageCount: contentBlocks.filter(block => block.type === 'image').length,
      exerciseCount: contentBlocks.filter(block => block.type === 'exercise').length,
      templateCount: contentBlocks.filter(block => block.type === 'template').length
    };
  }

  private generateTags(idea: string, niche?: string): string[] {
    const tags = [niche || 'general', 'ai-generated', 'digital-product'];
    
    // Add more specific tags based on idea content
    const ideaLower = idea.toLowerCase();
    if (ideaLower.includes('productivity')) tags.push('productivity', 'time-management');
    if (ideaLower.includes('business')) tags.push('business', 'entrepreneurship');
    if (ideaLower.includes('health')) tags.push('health', 'wellness');
    if (ideaLower.includes('education')) tags.push('education', 'learning');
    
    return [...new Set(tags)]; // Remove duplicates
  }
}


