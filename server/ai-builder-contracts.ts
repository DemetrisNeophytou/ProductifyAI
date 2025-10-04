// Unified API Contracts for AI Builders
// Prevents "Method is not a valid HTTP token" errors and React rendering issues

import { 
  generateIdeas, 
  generateOffer, 
  generateFunnel, 
  generateContent,
  generateOutline 
} from './openai';

export interface BuilderInput {
  module: 'idea' | 'offer' | 'funnel' | 'content' | 'outline' | 'assets' | 'launch' | 'emails' | 'reddit' | 'quora' | 'hooks';
  inputs: Record<string, any>;
  format?: 'markdown' | 'json' | 'html';
  tier?: 'free' | 'plus' | 'pro';
}

export interface Deliverable {
  type: 'markdown' | 'json' | 'html';
  filename: string;
  content: string | Record<string, any>;
}

export interface BuilderResponse {
  ok: boolean;
  module: string;
  deliverables: Deliverable[];
  kpis: string[];
  nextActions: string[];
}

// Standardized response builder
export function buildSuccessResponse(
  module: string,
  deliverables: Deliverable[],
  kpis: string[],
  nextActions: string[]
): BuilderResponse {
  return {
    ok: true,
    module,
    deliverables,
    kpis,
    nextActions
  };
}

export function buildErrorResponse(module: string, error: string): BuilderResponse {
  return {
    ok: false,
    module,
    deliverables: [],
    kpis: [],
    nextActions: [`Error: ${error}`]
  };
}

// Main router - handles all AI Builder requests
export async function handleBuilderRequest(input: BuilderInput): Promise<BuilderResponse> {
  try {
    const tier = input.tier || 'free';
    
    switch (input.module) {
      case 'idea':
        return await handleIdeaFinder(input.inputs, tier);
      case 'offer':
        return await handleOfferBuilder(input.inputs, tier);
      case 'funnel':
        return await handleFunnelBuilder(input.inputs, tier);
      case 'content':
        return await handleContentBuilder(input.inputs, tier);
      case 'outline':
        return await handleOutlineBuilder(input.inputs, tier);
      default:
        return buildErrorResponse(input.module, `Module '${input.module}' not implemented yet`);
    }
  } catch (error: any) {
    console.error(`[AI Builder] Error in ${input.module}:`, error);
    return buildErrorResponse(input.module, error.message || 'Unknown error');
  }
}

// Module-specific handlers
export async function handleIdeaFinder(inputs: Record<string, any>, tier: string): Promise<BuilderResponse> {
  const { interests, timeAvailable, audienceType, experienceLevel } = inputs;
  
  const ideas = await generateIdeas({
    interests: interests || 'general',
    timeAvailable: timeAvailable || '10 hours/week',
    audienceType: audienceType || 'B2C',
    experienceLevel: experienceLevel || 'beginner'
  });

  const parsedIdeas = JSON.parse(ideas);

  return buildSuccessResponse(
    'idea',
    [
      {
        type: 'json',
        filename: 'niche-ideas.json',
        content: parsedIdeas
      },
      {
        type: 'markdown',
        filename: 'niche-ideas.md',
        content: `# Niche Ideas\n\n${parsedIdeas.ideas.map((idea: any, i: number) => 
          `## ${i + 1}. ${idea.title}\n\n${idea.why}\n\n**ICP:** ${idea.icp}\n\n**Revenue Potential:** ${idea.revenuePotential}\n`
        ).join('\n')}`
      }
    ],
    [
      'Target 3-5 niche validation conversations',
      'Research 10+ competitors in each niche',
      'Validate keywords with 1000+ monthly searches'
    ],
    parsedIdeas.nextSteps || ['Validate top idea with 10 Reddit/Quora searches', 'Interview 3 potential customers', 'Create basic landing page']
  );
}

export async function handleOfferBuilder(inputs: Record<string, any>, tier: string): Promise<BuilderResponse> {
  const { productName, productDescription, targetRevenue, targetAudience } = inputs;
  
  const offer = await generateOffer({
    productName: productName || 'Digital Product',
    productDescription: productDescription || 'A valuable digital product',
    targetRevenue: targetRevenue || '€10,000',
    targetAudience: targetAudience || 'beginners',
    tier
  });

  const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer;

  return buildSuccessResponse(
    'offer',
    [
      {
        type: 'json',
        filename: 'offer-strategy.json',
        content: parsedOffer
      },
      {
        type: 'markdown',
        filename: 'offer-strategy.md',
        content: `# Offer Strategy\n\n## Pricing Tiers\n\n**Recommended:** ${parsedOffer.priceAnchoring?.recommended || 'Mid-ticket €97'}\n\n## Revenue Projections\n\n- Month 1: ${parsedOffer.revenueProjections?.month1 || '€2,000'}\n- Month 3: ${parsedOffer.revenueProjections?.month3 || '€5,000'}\n- Year 1: ${parsedOffer.revenueProjections?.yearOne || '€50,000'}\n`
      }
    ],
    [
      'Opt-in rate target: 35-45%',
      'Tripwire CVR target: 3-5%',
      'Core product CVR: 2-4%'
    ],
    parsedOffer.nextSteps || ['Set up Gumroad/Stripe product', 'Create sales page', 'Test pricing with beta group']
  );
}

export async function handleFunnelBuilder(inputs: Record<string, any>, tier: string): Promise<BuilderResponse> {
  const { productName, productPrice, hasAudience, launchGoal } = inputs;
  
  const funnel = await generateFunnel({
    productName: productName || 'Digital Product',
    productPrice: productPrice || '€97',
    hasAudience: hasAudience || 'false',
    launchGoal: launchGoal || '€5,000 in 30 days',
    tier
  });

  const parsedFunnel = typeof funnel === 'string' ? JSON.parse(funnel) : funnel;

  const deliverables: Deliverable[] = [
    {
      type: 'json',
      filename: 'funnel-plan.json',
      content: parsedFunnel
    },
    {
      type: 'markdown',
      filename: 'funnel-copy.md',
      content: `# Funnel Copy\n\n## Lead Magnet\n\n${parsedFunnel.funnel?.leadMagnet?.title || 'Lead Magnet'}\n\n${parsedFunnel.funnel?.leadMagnet?.description || ''}\n`
    }
  ];

  if (inputs.format === 'html') {
    deliverables.push({
      type: 'html',
      filename: 'landing-page.html',
      content: generateLandingPageHTML(parsedFunnel)
    });
  }

  return buildSuccessResponse(
    'funnel',
    deliverables,
    [
      'Landing page conversion: 35-50%',
      'Email open rate: 40-60%',
      'Sales conversion: 2-5%'
    ],
    parsedFunnel.nextSteps || ['Build landing page', 'Set up email automation', 'Launch in 5-7 days']
  );
}

export async function handleContentBuilder(inputs: Record<string, any>, tier: string): Promise<BuilderResponse> {
  const { chapterTitle, mainPoints, targetLength, tone, format } = inputs;
  
  const content = await generateContent({
    chapterTitle: chapterTitle || 'Introduction',
    mainPoints: mainPoints || 'Key concepts and fundamentals',
    targetLength: targetLength || '1000 words',
    tone: tone || 'professional',
    format: format || 'article',
    tier
  });

  const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

  return buildSuccessResponse(
    'content',
    [
      {
        type: 'json',
        filename: 'content-pack.json',
        content: parsedContent
      },
      {
        type: 'markdown',
        filename: 'main-content.md',
        content: parsedContent.content?.markdown || parsedContent.mainContent?.markdown || ''
      }
    ],
    [
      'Content engagement rate: 60%+',
      'Social shares target: 50+ per piece',
      'Email CTR: 5-10%'
    ],
    parsedContent.nextSteps || ['Publish content', 'Share on 3 platforms', 'Track engagement metrics']
  );
}

export async function handleOutlineBuilder(inputs: Record<string, any>, tier: string): Promise<BuilderResponse> {
  const { productType, topic, audienceLevel } = inputs;
  
  const outline = await generateOutline({
    productType: productType || 'course',
    topic: topic || 'Getting Started',
    audienceLevel: audienceLevel || 'beginner',
    tier
  });

  const parsedOutline = typeof outline === 'string' ? JSON.parse(outline) : outline;

  return buildSuccessResponse(
    'outline',
    [
      {
        type: 'json',
        filename: 'product-outline.json',
        content: parsedOutline
      },
      {
        type: 'markdown',
        filename: 'product-outline.md',
        content: `# ${parsedOutline.outline?.topic || 'Product Outline'}\n\n## Modules\n\n${parsedOutline.outline?.modules?.map((mod: any) => 
          `### ${mod.title}\n\n${mod.chapters?.map((ch: any) => `- ${ch.title}`).join('\n')}`
        ).join('\n\n') || 'No modules found'}`
      }
    ],
    [
      'Complete product outline in 3-7 days',
      'Target 5-10 modules for comprehensive coverage',
      'Include downloadable assets'
    ],
    parsedOutline.nextSteps || ['Review outline', 'Start creating content', 'Build MVP first']
  );
}

// Helper: Generate basic HTML landing page
function generateLandingPageHTML(funnelData: any): string {
  const headline = funnelData.funnel?.optInCopy?.headline || 'Get Your Free Guide';
  const subheadline = funnelData.funnel?.optInCopy?.subheadline || 'Transform your results in 30 days';
  const bullets = funnelData.funnel?.optInCopy?.bullets || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">${headline}</h1>
    <p class="text-xl text-gray-600 mb-8">${subheadline}</p>
    <ul class="space-y-3 mb-8">
      ${bullets.map((bullet: string) => `<li class="flex items-start">
        <svg class="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="text-gray-700">${bullet}</span>
      </li>`).join('\n')}
    </ul>
    <form class="space-y-4">
      <input type="email" placeholder="Your email address" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
      <button type="submit" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700">
        ${funnelData.funnel?.optInCopy?.cta || 'Get Instant Access'}
      </button>
    </form>
  </div>
</body>
</html>`;
}
