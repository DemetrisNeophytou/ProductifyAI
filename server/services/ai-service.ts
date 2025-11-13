// ProductifyAI AI Service
import { Logger } from '../utils/logger';

export interface ProductContent {
  title: string;
  outline: Array<{ id: string; title: string; level: number }>;
  cover: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    blocks: Array<{
      type: string;
      content: any;
      order: number;
    }>;
  }>;
  price: number;
  cta: string;
  salesBlurb: string;
  brand: {
    primary: string;
    secondary: string;
    font: string;
  };
  wordCount: number;
}

export interface FunnelContent {
  playbook: string;
  emails: string[];
}

export class AIService {
  private static instance: AIService;
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateProductContent(
    topic: string, 
    type: string, 
    audience: string = 'general audience',
    tone: string = 'professional',
    goal: string = 'educate and inform'
  ): Promise<ProductContent> {
    Logger.info(`Generating ${type} content for topic: ${topic}`);

    // TODO: Integrate with OpenAI API for real AI generation
    // For now, return structured mock data
    const title = this.generateTitle(topic, type);
    const outline = this.generateOutline(topic, type);
    const cover = this.generateCoverDescription(topic, type);
    const sections = this.generateSections(topic, type, outline);
    const price = this.calculatePrice(type, sections.length);
    const cta = this.generateCTA(type);
    const salesBlurb = this.generateSalesBlurb(topic, type);
    const brand = this.generateBrand(topic, type);
    const wordCount = this.calculateWordCount(sections);

    return {
      title,
      outline,
      cover,
      sections,
      price,
      cta,
      salesBlurb,
      brand,
      wordCount
    };
  }

  async generateFunnelContent(topic: string, type: string, title: string): Promise<FunnelContent> {
    Logger.info(`Generating funnel content for ${type}: ${title}`);

    const playbook = this.generatePlaybook(topic, type);
    const emails = this.generateEmailSequence(topic, type, title);

    return {
      playbook,
      emails
    };
  }

  private generateTitle(topic: string, type: string): string {
    const baseTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
    const typePrefixes = {
      ebook: 'The Complete Guide to',
      course: 'Master',
      template: 'Ultimate'
    };
    return `${typePrefixes[type as keyof typeof typePrefixes] || 'The Complete Guide to'} ${baseTitle}`;
  }

  private generateOutline(topic: string, type: string): Array<{ id: string; title: string; level: number }> {
    const baseOutline = [
      { id: 'intro', title: `Introduction to ${topic}`, level: 1 },
      { id: 'fundamentals', title: 'Key Concepts and Fundamentals', level: 1 },
      { id: 'implementation', title: 'Step-by-Step Implementation', level: 1 },
      { id: 'advanced', title: 'Advanced Techniques', level: 1 },
      { id: 'solutions', title: 'Common Pitfalls and Solutions', level: 1 },
      { id: 'conclusion', title: 'Conclusion and Next Steps', level: 1 }
    ];

    if (type === 'course') {
      baseOutline.splice(2, 0, { id: 'modules', title: 'Course Modules', level: 1 });
    }

    return baseOutline;
  }

  private generateCoverDescription(topic: string, type: string): string {
    return `Professional ${type} cover featuring ${topic} with modern design, clean typography, and engaging visuals`;
  }

  private generateSections(topic: string, type: string, outline: Array<{ id: string; title: string; level: number }>): Array<{
    id: string;
    title: string;
    content: string;
    blocks: Array<{ type: string; content: any; order: number }>;
  }> {
    return outline.map((item, index) => ({
      id: item.id,
      title: item.title,
      content: this.generateSectionContent(item.title, topic, type),
      blocks: this.generateSectionBlocks(item.title, topic, type, index)
    }));
  }

  private generateSectionContent(title: string, topic: string, type: string): string {
    return `This section covers ${title.toLowerCase()} in the context of ${topic}. You'll learn practical strategies and actionable insights that you can implement immediately.`;
  }

  private generateSectionBlocks(title: string, topic: string, type: string, index: number): Array<{ type: string; content: any; order: number }> {
    const blocks = [
      {
        type: 'heading',
        content: { text: title, level: 1 },
        order: 0
      },
      {
        type: 'paragraph',
        content: { text: `This section covers ${title.toLowerCase()} in the context of ${topic}.` },
        order: 1
      }
    ];

    if (index === 0) {
      blocks.push({
        type: 'image',
        content: { url: '', alt: `Cover image for ${topic}` },
        order: 2
      });
    }

    if (type === 'course' && index > 1) {
      blocks.push({
        type: 'cta',
        content: { text: 'Start Learning Now', action: 'enroll' },
        order: 3
      });
    }

    return blocks;
  }

  private calculatePrice(type: string, sectionCount: number): number {
    const basePrices = { ebook: 19.99, course: 49.99, template: 29.99 };
    const basePrice = basePrices[type as keyof typeof basePrices] || 19.99;
    return Math.round(basePrice + (sectionCount * 2.5) * 100) / 100;
  }

  private generateCTA(type: string): string {
    const ctas = {
      ebook: 'Get Instant Access',
      course: 'Start Learning Today',
      template: 'Download Now'
    };
    return ctas[type as keyof typeof ctas] || 'Get Instant Access';
  }

  private generateSalesBlurb(topic: string, type: string): string {
    return `Discover how to master ${topic} with this comprehensive ${type}. Get instant access to proven strategies and actionable insights.`;
  }

  private generateBrand(topic: string, type: string): {
    primary: string;
    secondary: string;
    font: string;
  } {
    const brandColors = {
      ebook: { primary: '#2563eb', secondary: '#1e40af', font: 'Inter' },
      course: { primary: '#dc2626', secondary: '#b91c1c', font: 'Poppins' },
      template: { primary: '#059669', secondary: '#047857', font: 'Roboto' }
    };
    return brandColors[type as keyof typeof brandColors] || brandColors.ebook;
  }

  private calculateWordCount(sections: Array<{ content: string }>): number {
    return sections.reduce((total, section) => {
      return total + section.content.split(' ').length;
    }, 0);
  }

  private generatePlaybook(topic: string, type: string): string {
    return `lead-magnet-mini-course-offer`;
  }

  private generateEmailSequence(topic: string, type: string, title: string): string[] {
    return [
      `Welcome to ${title}! Here's what you'll learn...`,
      `Day 2: The first key insight about ${topic}`,
      `Day 3: Common mistakes to avoid with ${topic}`,
      `Day 4: Advanced strategies for ${topic}`,
      `Day 5: Your next steps to master ${topic}`
    ];
  }

  async generateVideoScenes(script: string, template: string): Promise<{
    scenes: Array<{
      id: number;
      type: string;
      text: string;
      duration: number;
      visual: string;
      transition: string;
    }>;
    totalDuration: string;
  }> {
    Logger.info(`Generating video scenes for script with template: ${template}`);

    // TODO: Integrate with AI for better scene generation
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const scenes = [];

    sentences.forEach((sentence, index) => {
      const scene = {
        id: index + 1,
        type: this.determineSceneType(sentence, index),
        text: sentence.trim(),
        duration: this.calculateSceneDuration(sentence),
        visual: this.generateVisualPrompt(sentence, template),
        transition: index < sentences.length - 1 ? 'fade' : 'fadeOut'
      };
      scenes.push(scene);
    });

    // Add intro and outro
    scenes.unshift({
      id: 0,
      type: 'intro',
      text: 'Welcome!',
      duration: 3,
      visual: 'Title card with background',
      transition: 'fade'
    });

    scenes.push({
      id: scenes.length,
      type: 'outro',
      text: 'Thank you for watching!',
      duration: 3,
      visual: 'Call-to-action with logo',
      transition: 'fadeOut'
    });

    const totalDuration = scenes.reduce((total, scene) => total + scene.duration, 0);
    const durationString = `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`;

    return {
      scenes,
      totalDuration: durationString
    };
  }

  private determineSceneType(sentence: string, index: number): string {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('introduction') || lowerSentence.includes('welcome')) return 'intro';
    if (lowerSentence.includes('conclusion') || lowerSentence.includes('thank')) return 'outro';
    if (lowerSentence.includes('step') || lowerSentence.includes('first') || lowerSentence.includes('next')) return 'instruction';
    if (lowerSentence.includes('example') || lowerSentence.includes('for instance')) return 'example';
    if (lowerSentence.includes('important') || lowerSentence.includes('note')) return 'highlight';
    
    return 'content';
  }

  private calculateSceneDuration(sentence: string): number {
    const wordCount = sentence.split(' ').length;
    const baseDuration = Math.max(3, Math.ceil((wordCount / 150) * 60));
    return Math.min(baseDuration, 8);
  }

  private generateVisualPrompt(sentence: string, template: string): string {
    const keywords = sentence.split(' ').filter(word => word.length > 4).slice(0, 3);
    
    const templateStyles = {
      modern: 'Clean, minimalist design with smooth animations',
      energetic: 'Dynamic, fast-paced visuals with bold colors',
      professional: 'Corporate style with subtle animations and charts',
      creative: 'Artistic visuals with creative transitions'
    };

    return `${templateStyles[template as keyof typeof templateStyles]} featuring ${keywords.join(', ')}`;
  }
}


