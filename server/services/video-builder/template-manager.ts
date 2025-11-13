/**
 * Template Manager
 * Handles video templates for different types and styles
 */

import { VideoTemplate } from '../../../shared/video-builder-contracts';

export class TemplateManager {
  async getTemplates(type: string): Promise<VideoTemplate[]> {
    // Mock implementation - would load from database in production
    const templates = this.getMockTemplates();
    return templates.filter(t => t.type === type);
  }

  private getMockTemplates(): VideoTemplate[] {
    return [
      {
        id: 'promo_modern',
        name: 'Modern Promo Template',
        description: 'A sleek, modern template for promotional videos',
        type: 'promo',
        style: 'modern',
        aspectRatio: '16:9',
        duration: 60,
        structure: {
          intro: {
            id: 'intro',
            type: 'intro',
            duration: 5,
            layout: {
              background: 'Gradient background',
              elements: [],
              transitions: []
            },
            audio: {
              voiceOver: true,
              backgroundMusic: true,
              soundEffects: ['intro_swoosh']
            },
            prompts: {
              visual: 'Modern, clean intro with company logo',
              audio: 'Upbeat, professional voice over',
              text: 'Welcome to our product'
            }
          },
          content: [
            {
              id: 'content_1',
              type: 'content',
              duration: 45,
              layout: {
                background: 'Product showcase background',
                elements: [],
                transitions: []
              },
              audio: {
                voiceOver: true,
                backgroundMusic: true,
                soundEffects: []
              },
              prompts: {
                visual: 'Product features with smooth animations',
                audio: 'Clear, engaging narration',
                text: 'Key product benefits'
              }
            }
          ],
          outro: {
            id: 'outro',
            type: 'outro',
            duration: 10,
            layout: {
              background: 'Call-to-action background',
              elements: [],
              transitions: []
            },
            audio: {
              voiceOver: true,
              backgroundMusic: true,
              soundEffects: ['outro_chime']
            },
            prompts: {
              visual: 'Call-to-action with contact information',
              audio: 'Compelling call-to-action',
              text: 'Get started today'
            }
          }
        },
        branding: {
          colors: ['#3B82F6', '#1E40AF', '#FFFFFF'],
          fonts: ['Inter', 'Roboto'],
          logo: 'https://example.com/logo.png',
          style: 'modern'
        },
        metadata: {
          category: 'promotional',
          tags: ['promo', 'modern', 'business'],
          difficulty: 'beginner',
          estimatedTime: 30
        }
      },
      {
        id: 'tutorial_professional',
        name: 'Professional Tutorial Template',
        description: 'A structured template for educational tutorial videos',
        type: 'tutorial',
        style: 'professional',
        aspectRatio: '16:9',
        duration: 300,
        structure: {
          intro: {
            id: 'intro',
            type: 'intro',
            duration: 10,
            layout: {
              background: 'Professional studio background',
              elements: [],
              transitions: []
            },
            audio: {
              voiceOver: true,
              backgroundMusic: false,
              soundEffects: []
            },
            prompts: {
              visual: 'Professional instructor introduction',
              audio: 'Clear, educational tone',
              text: 'Welcome to this tutorial'
            }
          },
          content: [
            {
              id: 'content_1',
              type: 'content',
              duration: 240,
              layout: {
                background: 'Screen recording or demonstration',
                elements: [],
                transitions: []
              },
              audio: {
                voiceOver: true,
                backgroundMusic: false,
                soundEffects: []
              },
              prompts: {
                visual: 'Step-by-step demonstration',
                audio: 'Detailed, educational narration',
                text: 'Step 1: Getting started'
              }
            }
          ],
          outro: {
            id: 'outro',
            type: 'outro',
            duration: 20,
            layout: {
              background: 'Summary and next steps',
              elements: [],
              transitions: []
            },
            audio: {
              voiceOver: true,
              backgroundMusic: false,
              soundEffects: []
            },
            prompts: {
              visual: 'Summary of key points',
              audio: 'Recap and next steps',
              text: 'Thank you for watching'
            }
          }
        },
        branding: {
          colors: ['#1F2937', '#6B7280', '#FFFFFF'],
          fonts: ['Inter', 'Source Sans Pro'],
          logo: 'https://example.com/logo.png',
          style: 'professional'
        },
        metadata: {
          category: 'educational',
          tags: ['tutorial', 'educational', 'professional'],
          difficulty: 'intermediate',
          estimatedTime: 120
        }
      }
    ];
  }
}


