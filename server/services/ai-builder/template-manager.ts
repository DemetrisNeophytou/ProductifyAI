/**
 * Template Manager
 * Handles product templates for AI generation
 */

import { ProductTemplate } from '../../../shared/ai-builder-contracts';

export class TemplateManager {
  async getTemplate(productType: string, niche?: string): Promise<ProductTemplate | null> {
    // Mock implementation - would load from database in production
    const templates = this.getMockTemplates();
    return templates.find(t => t.type === productType && (!niche || t.metadata.category === niche)) || null;
  }

  async getTemplates(productType: string): Promise<ProductTemplate[]> {
    // Mock implementation - would load from database in production
    const templates = this.getMockTemplates();
    return templates.filter(t => t.type === productType);
  }

  private getMockTemplates(): ProductTemplate[] {
    return [
      {
        id: 'ebook_productivity',
        name: 'Productivity eBook Template',
        description: 'A comprehensive template for productivity-focused eBooks',
        type: 'eBook',
        structure: [
          {
            id: 'intro',
            title: 'Introduction',
            description: 'Welcome and overview',
            order: 1,
            estimatedReadTime: 5,
            sections: []
          },
          {
            id: 'core',
            title: 'Core Strategies',
            description: 'Main productivity strategies',
            order: 2,
            estimatedReadTime: 20,
            sections: []
          }
        ],
        prompts: {
          title: 'Create an engaging title for a productivity eBook about {topic}',
          outline: 'Generate a detailed outline for a productivity eBook covering {topic}',
          content: 'Write comprehensive content for a productivity eBook chapter about {chapter}'
        },
        metadata: {
          difficulty: 'intermediate',
          category: 'productivity',
          tags: ['productivity', 'time-management', 'efficiency'],
          estimatedTime: 120
        }
      },
      {
        id: 'course_business',
        name: 'Business Course Template',
        description: 'A structured template for business courses',
        type: 'course',
        structure: [
          {
            id: 'intro',
            title: 'Course Introduction',
            description: 'Welcome and course overview',
            order: 1,
            estimatedReadTime: 10,
            sections: []
          },
          {
            id: 'modules',
            title: 'Course Modules',
            description: 'Main course content',
            order: 2,
            estimatedReadTime: 60,
            sections: []
          }
        ],
        prompts: {
          title: 'Create a compelling title for a business course about {topic}',
          outline: 'Generate a structured outline for a business course covering {topic}',
          content: 'Write educational content for a business course module about {module}'
        },
        metadata: {
          difficulty: 'advanced',
          category: 'business',
          tags: ['business', 'entrepreneurship', 'strategy'],
          estimatedTime: 180
        }
      }
    ];
  }
}


