/**
 * AI Mock Service
 * Simulates AI-powered features for the canvas editor
 */

import type { Layer } from '@/types/editor';

/**
 * Generate a unique layer ID
 */
function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate AI delay for realistic feel
 */
async function simulateAIDelay(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate layers from text prompt
 */
export async function generateLayoutFromPrompt(prompt: string): Promise<Layer[]> {
  await simulateAIDelay();

  const lowerPrompt = prompt.toLowerCase();
  
  // Pricing section
  if (lowerPrompt.includes('pricing')) {
    return generatePricingSection();
  }
  
  // Hero section
  if (lowerPrompt.includes('hero')) {
    return generateHeroSection();
  }
  
  // Testimonial section
  if (lowerPrompt.includes('testimonial')) {
    return generateTestimonialSection();
  }
  
  // Feature cards
  if (lowerPrompt.includes('feature')) {
    return generateFeatureCards();
  }
  
  // CTA section
  if (lowerPrompt.includes('cta') || lowerPrompt.includes('call to action')) {
    return generateCTASection();
  }
  
  // Default: Simple card layout
  return generateDefaultLayout();
}

/**
 * Generate pricing section with 3 cards
 */
function generatePricingSection(): Layer[] {
  const layers: Layer[] = [];
  const startX = 100;
  const startY = 100;
  const cardWidth = 250;
  const cardHeight = 400;
  const gap = 30;

  // Section title
  layers.push({
    id: generateLayerId(),
    type: 'text',
    name: 'Pricing Title',
    x: startX + (cardWidth * 3 + gap * 2) / 2 - 150,
    y: startY - 60,
    width: 300,
    height: 50,
    zIndex: 0,
    opacity: 1,
    visible: true,
    content: 'Choose Your Plan',
    style: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#1a1a1a',
      textAlign: 'center',
    },
  });

  // Three pricing cards
  const plans = [
    { name: 'Starter', price: '$19', features: 'Basic features' },
    { name: 'Pro', price: '$49', features: 'Advanced features' },
    { name: 'Enterprise', price: '$99', features: 'All features' },
  ];

  plans.forEach((plan, index) => {
    const x = startX + index * (cardWidth + gap);
    
    // Card background
    layers.push({
      id: generateLayerId(),
      type: 'shape',
      name: `Pricing Card - ${plan.name}`,
      x,
      y: startY,
      width: cardWidth,
      height: cardHeight,
      zIndex: index,
      opacity: 1,
      visible: true,
      style: {
        background: index === 1 ? '#A855F7' : '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    });

    // Plan name
    layers.push({
      id: generateLayerId(),
      type: 'text',
      name: `Plan Name - ${plan.name}`,
      x: x + 20,
      y: startY + 30,
      width: cardWidth - 40,
      height: 40,
      zIndex: index + 10,
      opacity: 1,
      visible: true,
      content: plan.name,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: index === 1 ? '#FFFFFF' : '#1a1a1a',
        textAlign: 'center',
      },
    });

    // Price
    layers.push({
      id: generateLayerId(),
      type: 'text',
      name: `Price - ${plan.name}`,
      x: x + 20,
      y: startY + 100,
      width: cardWidth - 40,
      height: 60,
      zIndex: index + 10,
      opacity: 1,
      visible: true,
      content: plan.price,
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: index === 1 ? '#FFFFFF' : '#A855F7',
        textAlign: 'center',
      },
    });

    // CTA Button
    layers.push({
      id: generateLayerId(),
      type: 'shape',
      name: `CTA Button - ${plan.name}`,
      x: x + 40,
      y: startY + cardHeight - 80,
      width: cardWidth - 80,
      height: 50,
      zIndex: index + 10,
      opacity: 1,
      visible: true,
      style: {
        background: index === 1 ? '#FFFFFF' : '#A855F7',
        borderRadius: 8,
      },
    });
  });

  return layers;
}

/**
 * Generate hero section
 */
function generateHeroSection(): Layer[] {
  return [
    {
      id: generateLayerId(),
      type: 'text',
      name: 'Hero Headline',
      x: 200,
      y: 150,
      width: 600,
      height: 80,
      zIndex: 0,
      opacity: 1,
      visible: true,
      content: 'Build Amazing Products with AI',
      style: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
      },
    },
    {
      id: generateLayerId(),
      type: 'text',
      name: 'Hero Subheadline',
      x: 250,
      y: 250,
      width: 500,
      height: 60,
      zIndex: 1,
      opacity: 1,
      visible: true,
      content: 'Transform your ideas into reality with our AI-powered platform',
      style: {
        fontSize: 20,
        fontWeight: 'normal',
        color: '#6B7280',
        textAlign: 'center',
      },
    },
    {
      id: generateLayerId(),
      type: 'shape',
      name: 'CTA Button',
      x: 400,
      y: 350,
      width: 200,
      height: 60,
      zIndex: 2,
      opacity: 1,
      visible: true,
      style: {
        background: '#A855F7',
        borderRadius: 10,
      },
    },
  ];
}

/**
 * Generate testimonial section
 */
function generateTestimonialSection(): Layer[] {
  const layers: Layer[] = [];
  const testimonials = 3;
  const cardWidth = 300;
  const cardHeight = 200;
  const gap = 30;
  const startX = 100;
  const startY = 150;

  for (let i = 0; i < testimonials; i++) {
    const x = startX + i * (cardWidth + gap);
    
    // Card
    layers.push({
      id: generateLayerId(),
      type: 'shape',
      name: `Testimonial Card ${i + 1}`,
      x,
      y: startY,
      width: cardWidth,
      height: cardHeight,
      zIndex: i,
      opacity: 1,
      visible: true,
      style: {
        background: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    });

    // Quote text
    layers.push({
      id: generateLayerId(),
      type: 'text',
      name: `Quote ${i + 1}`,
      x: x + 20,
      y: startY + 20,
      width: cardWidth - 40,
      height: 100,
      zIndex: i + 10,
      opacity: 1,
      visible: true,
      content: '"This product changed my workflow completely!"',
      style: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#1a1a1a',
      },
    });

    // Author
    layers.push({
      id: generateLayerId(),
      type: 'text',
      name: `Author ${i + 1}`,
      x: x + 20,
      y: startY + 150,
      width: cardWidth - 40,
      height: 30,
      zIndex: i + 10,
      opacity: 1,
      visible: true,
      content: '— Customer Name',
      style: {
        fontSize: 12,
        fontWeight: 'medium',
        color: '#6B7280',
      },
    });
  }

  return layers;
}

/**
 * Generate feature cards
 */
function generateFeatureCards(): Layer[] {
  const features = ['Fast', 'Secure', 'Scalable'];
  const layers: Layer[] = [];
  const cardSize = 200;
  const gap = 40;
  const startX = 150;
  const startY = 200;

  features.forEach((feature, i) => {
    const x = startX + i * (cardSize + gap);

    layers.push({
      id: generateLayerId(),
      type: 'shape',
      name: `Feature Card - ${feature}`,
      x,
      y: startY,
      width: cardSize,
      height: cardSize,
      zIndex: i,
      opacity: 1,
      visible: true,
      style: {
        background: '#F3F4F6',
        borderRadius: 16,
      },
    });

    layers.push({
      id: generateLayerId(),
      type: 'text',
      name: `Feature Title - ${feature}`,
      x: x + 20,
      y: startY + 80,
      width: cardSize - 40,
      height: 40,
      zIndex: i + 10,
      opacity: 1,
      visible: true,
      content: feature,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
      },
    });
  });

  return layers;
}

/**
 * Generate CTA section
 */
function generateCTASection(): Layer[] {
  return [
    {
      id: generateLayerId(),
      type: 'shape',
      name: 'CTA Background',
      x: 150,
      y: 200,
      width: 700,
      height: 300,
      zIndex: 0,
      opacity: 1,
      visible: true,
      style: {
        background: '#A855F7',
        borderRadius: 20,
      },
    },
    {
      id: generateLayerId(),
      type: 'text',
      name: 'CTA Headline',
      x: 200,
      y: 250,
      width: 600,
      height: 60,
      zIndex: 1,
      opacity: 1,
      visible: true,
      content: 'Ready to Get Started?',
      style: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
      },
    },
    {
      id: generateLayerId(),
      type: 'shape',
      name: 'CTA Button',
      x: 400,
      y: 380,
      width: 200,
      height: 60,
      zIndex: 2,
      opacity: 1,
      visible: true,
      style: {
        background: '#FFFFFF',
        borderRadius: 10,
      },
    },
  ];
}

/**
 * Generate default layout
 */
function generateDefaultLayout(): Layer[] {
  return [
    {
      id: generateLayerId(),
      type: 'text',
      name: 'Title',
      x: 200,
      y: 150,
      width: 600,
      height: 60,
      zIndex: 0,
      opacity: 1,
      visible: true,
      content: 'Your Content Here',
      style: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
      },
    },
    {
      id: generateLayerId(),
      type: 'shape',
      name: 'Content Box',
      x: 200,
      y: 250,
      width: 600,
      height: 300,
      zIndex: 1,
      opacity: 1,
      visible: true,
      style: {
        background: '#F3F4F6',
        borderRadius: 12,
      },
    },
  ];
}

/**
 * Auto-name layers based on content and type
 */
export async function autoNameLayers(layers: Layer[]): Promise<Array<{ id: string; name: string; description?: string }>> {
  await simulateAIDelay(500);

  return layers.map(layer => {
    let name = '';
    let description = '';

    switch (layer.type) {
      case 'text':
        if (layer.content) {
          const content = layer.content.toLowerCase();
          if (content.includes('headline') || content.includes('title') || (layer.style?.fontSize || 0) > 30) {
            name = 'Headline';
            description = 'Main title text';
          } else if (content.includes('button') || content.includes('cta')) {
            name = 'Button Label';
            description = 'Call-to-action text';
          } else if ((layer.style?.fontSize || 0) > 20) {
            name = 'Subheading';
            description = 'Section subtitle';
          } else {
            name = 'Body Text';
            description = 'Content paragraph';
          }
        } else {
          name = 'Text Layer';
          description = 'Empty text element';
        }
        break;
      
      case 'shape':
        if (layer.width < 150 && layer.height < 80) {
          name = 'Button';
          description = 'Interactive button element';
        } else if (layer.width > 500) {
          name = 'Section Background';
          description = 'Full-width section container';
        } else {
          name = 'Card';
          description = 'Content card container';
        }
        break;
      
      case 'image':
        name = 'Image';
        description = 'Visual asset';
        break;
      
      case 'video':
        name = 'Video Player';
        description = 'Video content';
        break;
      
      default:
        name = 'Layer';
        description = 'Canvas element';
    }

    return {
      id: layer.id,
      name,
      description,
    };
  });
}

/**
 * Auto-align layers to grid
 */
export async function autoAlignLayers(layers: Layer[], gridSize: number = 20): Promise<Array<{ id: string; updates: Partial<Layer> }>> {
  await simulateAIDelay(300);

  return layers.map(layer => ({
    id: layer.id,
    updates: {
      x: Math.round(layer.x / gridSize) * gridSize,
      y: Math.round(layer.y / gridSize) * gridSize,
      width: Math.round(layer.width / gridSize) * gridSize,
      height: Math.round(layer.height / gridSize) * gridSize,
    },
  }));
}

/**
 * Distribute layers evenly
 */
export async function distributeLayersEvenly(
  layers: Layer[], 
  direction: 'horizontal' | 'vertical'
): Promise<Array<{ id: string; updates: Partial<Layer> }>> {
  await simulateAIDelay(300);

  if (layers.length < 2) return [];

  const sorted = [...layers].sort((a, b) => 
    direction === 'horizontal' ? a.x - b.x : a.y - b.y
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const totalSpace = direction === 'horizontal'
    ? (last.x + last.width) - first.x
    : (last.y + last.height) - first.y;
  
  const totalSize = sorted.reduce((sum, layer) => 
    sum + (direction === 'horizontal' ? layer.width : layer.height), 0
  );
  
  const gap = (totalSpace - totalSize) / (sorted.length - 1);
  
  let position = direction === 'horizontal' ? first.x : first.y;
  
  return sorted.map(layer => {
    const updates = direction === 'horizontal'
      ? { x: position }
      : { y: position };
    
    position += (direction === 'horizontal' ? layer.width : layer.height) + gap;
    
    return { id: layer.id, updates };
  });
}

/**
 * Analyze design and suggest improvements
 */
export async function analyzeDesign(layers: Layer[]): Promise<{
  score: number;
  issues: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  suggestions: string[];
}> {
  await simulateAIDelay(600);

  const issues: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
  const suggestions: string[] = [];

  // Check for overlapping layers
  const overlapping = layers.filter((layer1, i) => 
    layers.some((layer2, j) => {
      if (i === j) return false;
      return !(
        layer1.x + layer1.width < layer2.x ||
        layer2.x + layer2.width < layer1.x ||
        layer1.y + layer1.height < layer2.y ||
        layer2.y + layer2.height < layer1.y
      );
    })
  );

  if (overlapping.length > 0) {
    issues.push({
      type: 'overlap',
      message: `${overlapping.length} layers are overlapping`,
      severity: 'medium',
    });
    suggestions.push('Use auto-align to fix spacing');
  }

  // Check for small text
  const smallText = layers.filter(l => 
    l.type === 'text' && (l.style?.fontSize || 16) < 12
  );

  if (smallText.length > 0) {
    issues.push({
      type: 'accessibility',
      message: `${smallText.length} text layers may be too small`,
      severity: 'high',
    });
    suggestions.push('Increase font size for better readability');
  }

  // Check for low contrast (simplified)
  const lightBackgrounds = layers.filter(l => 
    l.style?.background && ['#FFFFFF', '#FFF', '#F'].some(c => 
      l.style?.background?.toUpperCase().includes(c)
    )
  );

  if (lightBackgrounds.length > layers.length * 0.7) {
    suggestions.push('Consider adding more color variety');
  }

  // Calculate score
  const score = Math.max(0, 100 - (issues.length * 15));

  return { score, issues, suggestions };
}

/**
 * Suggest color palette
 */
export async function suggestColorPalette(): Promise<{
  name: string;
  colors: { name: string; value: string; usage: string }[];
}> {
  await simulateAIDelay(400);

  const palettes = [
    {
      name: 'Professional Purple',
      colors: [
        { name: 'Primary', value: '#A855F7', usage: 'Buttons, CTAs' },
        { name: 'Secondary', value: '#EC4899', usage: 'Accents' },
        { name: 'Background', value: '#FFFFFF', usage: 'Cards, sections' },
        { name: 'Text', value: '#1F2937', usage: 'Headlines, body' },
        { name: 'Muted', value: '#6B7280', usage: 'Subtitles' },
      ],
    },
    {
      name: 'Ocean Blue',
      colors: [
        { name: 'Primary', value: '#3B82F6', usage: 'Buttons, CTAs' },
        { name: 'Secondary', value: '#06B6D4', usage: 'Accents' },
        { name: 'Background', value: '#F9FAFB', usage: 'Cards, sections' },
        { name: 'Text', value: '#111827', usage: 'Headlines, body' },
        { name: 'Muted', value: '#6B7280', usage: 'Subtitles' },
      ],
    },
  ];

  return palettes[Math.floor(Math.random() * palettes.length)];
}

/**
 * Describe layout in natural language
 */
export async function describeLayout(layers: Layer[]): Promise<string> {
  await simulateAIDelay(500);

  const textLayers = layers.filter(l => l.type === 'text').length;
  const shapeLayers = layers.filter(l => l.type === 'shape').length;
  const imageLayers = layers.filter(l => l.type === 'image').length;

  let description = `This layout contains ${layers.length} layers: `;
  
  const parts: string[] = [];
  if (textLayers > 0) parts.push(`${textLayers} text element${textLayers > 1 ? 's' : ''}`);
  if (shapeLayers > 0) parts.push(`${shapeLayers} shape${shapeLayers > 1 ? 's' : ''}`);
  if (imageLayers > 0) parts.push(`${imageLayers} image${imageLayers > 1 ? 's' : ''}`);

  description += parts.join(', ') + '. ';

  // Analyze layout structure
  const hasTitle = layers.some(l => 
    l.type === 'text' && (l.style?.fontSize || 0) > 30
  );

  if (hasTitle) {
    description += 'It features a prominent headline. ';
  }

  const hasButtons = layers.some(l => 
    l.type === 'shape' && l.width < 250 && l.height < 80
  );

  if (hasButtons) {
    description += 'Interactive buttons are included. ';
  }

  description += 'The design appears to be for a modern web interface.';

  return description;
}

