// Integration: blueprint:javascript_openai
import OpenAI from "openai";

// Using GPT-5 - the latest OpenAI model for ultra-fast, specialized coaching
// Initialize with conditional API key to prevent crashes when key is missing
const apiKey = process.env.OPENAI_API_KEY || 'placeholder-key-not-configured';
const openai = new OpenAI({ apiKey });

// Conversation history storage (in-memory)
// Stores last 15 messages per user for dynamic, context-aware conversations
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const conversationStore = new Map<string, ConversationMessage[]>();
const MAX_HISTORY_LENGTH = 15;

// Helper function to check if API key is configured
function isApiKeyConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'placeholder-key-not-configured';
}

// Helper function to throw consistent error when API key is missing
function requireApiKey(): void {
  if (!isApiKeyConfigured()) {
    throw new Error('MISSING_API_KEY: OpenAI API key is not configured. Please add your API key to OPENAI_API_KEY secret in Replit.');
  }
}

function removeEmojis(text: string): string {
  // Remove common emoji ranges - uses simple character filtering
  return text.split('').filter(char => {
    const code = char.codePointAt(0) || 0;
    // Filter out common emoji ranges
    return !(
      (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
      (code >= 0x1F300 && code <= 0x1F5FF) || // Misc Symbols and Pictographs
      (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map
      (code >= 0x2600 && code <= 0x26FF) ||   // Misc symbols
      (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
      (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols and Pictographs
      (code >= 0x1FA70 && code <= 0x1FAFF)    // Symbols and Pictographs Extended-A
    );
  }).join('');
}

interface GenerateProductParams {
  prompt: string;
  type: string;
  creativity: number;
  length: number;
  style: string;
}

// Helper functions for conversation history management
export function getConversationHistory(userId: string): ConversationMessage[] {
  return conversationStore.get(userId) || [];
}

export function addToConversationHistory(userId: string, role: 'user' | 'assistant', content: string): void {
  const history = getConversationHistory(userId);
  
  history.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  // Keep only last 15 messages
  if (history.length > MAX_HISTORY_LENGTH) {
    history.splice(0, history.length - MAX_HISTORY_LENGTH);
  }
  
  conversationStore.set(userId, history);
}

export function clearConversationHistory(userId: string): void {
  conversationStore.delete(userId);
}

const DIGITAL_PRODUCT_COACH_PROMPT = `You are Productify Coach, an advanced AI powered by GPT-5. You help entrepreneurs build, launch, and scale digital products that generate €100k+ revenue.

WHO YOU ARE:
You're a seasoned digital product expert with deep knowledge of successful launches, monetization strategies, and proven frameworks. But you're NOT a template-dispensing robot. You THINK, ADAPT, and provide personalized advice based on each entrepreneur's unique situation.

YOUR KNOWLEDGE BASE:
- Iman Gadzhi's digital product frameworks & monetization strategies
- Proven pricing psychology (€27 tripwire → €97 core → €497 premium tiers)
- High-converting funnel architectures (VSL → Checkout → Upsell → Community)
- Launch strategies that work WITHOUT an existing audience
- SEO keyword research & organic traffic generation
- Email sequences that convert cold traffic to buyers
- Community-building tactics for long-term revenue
- Complete product creation workflows (idea → outline → content → launch)

HOW YOU COACH (Critical - Read Carefully):

1. THINK BEFORE YOU ANSWER:
   - Analyze the entrepreneur's specific situation, experience level, and goals
   - Consider what they've shared in previous messages (you have conversation memory)
   - Identify gaps in their plan or thinking
   - Think about what will actually move them forward TODAY

2. ASK CLARIFYING QUESTIONS:
   - If you need more context, ask 2-3 specific questions
   - Don't make assumptions about their audience, budget, or skills
   - Example: "Before I suggest a pricing strategy, tell me - do you have any existing audience (email list, social following)? And what's your revenue goal for month 1?"

3. MIX FRAMEWORKS WITH PERSONALIZED ADVICE:
   - Start with proven frameworks (The €100k Product Stack, 5-Email Launch Sequence)
   - Then ADAPT them to the person's situation
   - Example: "The standard launch is 7 days, but since you mentioned having zero audience, I'd recommend a 30-day Reddit + SEO strategy instead. Here's why..."

4. PROVIDE READY-TO-USE ASSETS (When Appropriate):
   - Sales page templates with customized headlines for their niche
   - Email sequences adapted to their product type
   - Revenue calculators: "50 sales × €97 = €4,850"
   - Launch timelines tailored to their time availability
   - Pricing tiers that match their market positioning

5. BE CONVERSATIONAL & ADAPTIVE:
   - Remember what they told you in previous messages
   - Reference their earlier questions: "You mentioned wanting to launch in 30 days..."
   - Adjust your tone based on their experience level (beginner vs advanced)
   - Celebrate progress: "Great progress on your outline! Now let's tackle pricing..."

6. FOCUS ON EXECUTION:
   - Every response should end with 1-3 specific next actions
   - Make actions small and achievable (today/this week)
   - Build momentum: "Your Next Step: Spend 30 minutes writing your sales page headline using this formula..."

COMMUNICATION STYLE:
- Conversational but professional (like a trusted business partner)
- Short sentences. Clear reasoning. No corporate jargon.
- Show revenue math when discussing pricing: "20 sales × €97 = €1,940"
- Use frameworks when helpful, but always explain WHY they apply
- NEVER use emoji characters
- Ask questions when you need clarity
- Adapt based on conversation context

CRITICAL RULES:
1. You have SHORT-TERM MEMORY - reference previous messages in the conversation
2. Don't just dump templates - THINK about what this specific person needs
3. Ask questions if you're unclear about their situation
4. Mix proven strategies with personalized adaptations
5. Focus on what will generate revenue FASTEST for their specific situation
6. Keep responses actionable and momentum-building

EXAMPLE DYNAMIC RESPONSE:
User: "I want to create a course about productivity for remote workers."

You (BAD - Template Response):
"Here's the €100k Product Stack:
- €27 lead magnet
- €97 core course
- €297 advanced course
[Full generic template dump]"

You (GOOD - Dynamic Response):
"Productivity for remote workers is a solid niche with proven buyers. Before I help you structure this, I need to understand your positioning:

1. Are you targeting remote workers in specific industries (tech, marketing, etc.) or all remote workers?
2. What unique angle do you bring - are you a remote worker yourself, a manager, a productivity coach?
3. Do you have any existing audience (email list, LinkedIn following)?

Once I know this, I can help you choose between a quick-launch €47 mini-course (4-week timeline) vs a comprehensive €197 flagship course (8-week timeline). The pricing and positioning will be very different based on your answers.

In the meantime, here's your immediate next step: Write down 10 specific pain points remote workers face that you can solve. This will shape your entire product positioning."

See the difference? You're THINKING, ASKING, and ADAPTING - not just dumping templates.`;

export async function chatWithCoach(message: string, userId: string): Promise<string> {
  console.log('[OpenAI] Starting AI Coach chat with conversation history');
  requireApiKey();

  try {
    // Get conversation history for this user (already includes current user message from routes.ts)
    const history = getConversationHistory(userId);
    
    // Build messages array with system prompt + history ONLY
    // The user message is already in history, so don't add it again
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: DIGITAL_PRODUCT_COACH_PROMPT },
      ...history.map(msg => ({ role: msg.role, content: msg.content }))
    ];
    
    console.log(`[OpenAI] Chat context: ${history.length} messages in history, total context: ${messages.length} messages`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 8192,  // Increased for comprehensive coaching responses with templates
    });

    const content = response.choices[0].message.content || "";
    const cleanedContent = removeEmojis(content);
    
    // Note: Conversation history is managed by the routes layer, not here
    // This keeps the function pure and avoids duplicate storage
    
    console.log(`[OpenAI] Chat completed - Response length: ${cleanedContent.length} characters, finish_reason: ${response.choices[0].finish_reason}`);
    return cleanedContent;
  } catch (error: any) {
    console.error('[OpenAI] Chat failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded. Please check your API plan and billing details.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_CHAT_ERROR: ${error?.message || "Failed to get response from AI coach"}`);
  }
}

export async function chatWithCoachStream(message: string, userId: string) {
  console.log('[OpenAI] Starting AI Coach streaming chat with conversation history');
  requireApiKey();

  try {
    // Get conversation history for this user (already includes current user message from routes.ts)
    const history = getConversationHistory(userId);
    
    // Build messages array with system prompt + history ONLY
    // The user message is already in history, so don't add it again
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: DIGITAL_PRODUCT_COACH_PROMPT },
      ...history.map(msg => ({ role: msg.role, content: msg.content }))
    ];
    
    console.log(`[OpenAI] Streaming chat context: ${history.length} messages in history, total context: ${messages.length} messages`);
    
    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 8192,  // Increased for comprehensive coaching responses with templates
      stream: true,
    });

    // Note: Conversation history is managed by the routes layer, not here
    // This keeps the function pure and avoids duplicate storage

    return stream;
  } catch (error: any) {
    console.error('[OpenAI] Streaming chat failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded. Please check your API plan and billing details.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_CHAT_ERROR: ${error?.message || "Failed to get response from AI coach"}`);
  }
}

export async function writeChapter(params: {
  title: string;
  type: string;
  context?: string;
  audience?: string;
  tone?: string;
}): Promise<string> {
  console.log(`[OpenAI] Writing chapter: ${params.title}`);
  requireApiKey();

  const systemPrompt = `You are a €100k+ Monetization Coach writing content that transforms beginners into successful creators.

Your task: Write a chapter/lesson that is ACTIONABLE and REVENUE-FOCUSED.

Requirements:
- Write 500-1500 words with clear step-by-step instructions
- Include specific revenue examples ("Price at €97, sell 20 copies = €1,940")
- Provide ready-to-use templates and frameworks
- Make it confidence-building ("You can do this, even as a beginner")
- Focus on FAST implementation (what to do TODAY)
- End with a "Next Action Step" for immediate progress
- NEVER use emoji characters

Remember: Readers want to make money, not just learn theory. Give them the exact steps to get results.`;

  const userPrompt = `Write a complete chapter titled "${params.title}" for a ${params.type}.

${params.context ? `Context: ${params.context}` : ''}
${params.audience ? `Target audience: ${params.audience}` : ''}
${params.tone ? `Tone: ${params.tone}` : ''}

Make it comprehensive, valuable, and actionable.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content || "";
    return removeEmojis(content);
  } catch (error: any) {
    console.error('[OpenAI] Write chapter failed:', error);
    throw new Error(`AI_GENERATION_ERROR: ${error?.message || "Failed to generate chapter"}`);
  }
}

export async function expandContent(params: {
  originalContent: string;
  expandBy: string;
}): Promise<string> {
  console.log('[OpenAI] Expanding content');
  requireApiKey();

  const systemPrompt = `You are a Digital Product Strategist expert at enhancing content value.

Your task: Expand and improve existing content strategically.

Requirements:
- Preserve the original meaning and structure
- Add strategic insights, examples, or implementation details
- Enhance commercial value and customer transformation
- Maintain professional tone
- NEVER use emoji characters

Return only the enhanced, expanded content.`;

  const userPrompt = `Expand this content: "${params.originalContent}"

Expansion request: ${params.expandBy}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content || "";
    return removeEmojis(content);
  } catch (error: any) {
    console.error('[OpenAI] Expand content failed:', error);
    throw new Error(`AI_EXPANSION_ERROR: ${error?.message || "Failed to expand content"}`);
  }
}

export async function suggestImprovements(params: {
  sectionTitle: string;
  currentContent: string;
  productType: string;
}): Promise<string[]> {
  console.log('[OpenAI] Generating suggestions');
  requireApiKey();

  const systemPrompt = `You are a Digital Product Strategist providing strategic content improvements.

Your task: Provide 2-3 actionable suggestions to enhance content value.

Requirements:
- Each suggestion should be specific and commercially focused
- Prioritize customer transformation and engagement
- Keep suggestions brief (1-2 sentences each)
- Focus on strategic impact
- NEVER use emoji characters

Return suggestions as a numbered list.`;

  const userPrompt = `Product type: ${params.productType}
Section: "${params.sectionTitle}"
Current content length: ${params.currentContent.length} characters

Provide 2-3 suggestions to improve this section.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 500,
    });

    const content = removeEmojis(response.choices[0].message.content || "");
    const suggestions = content
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);

    return suggestions.slice(0, 3);
  } catch (error: any) {
    console.error('[OpenAI] Suggestions failed:', error);
    throw new Error(`AI_SUGGESTION_ERROR: ${error?.message || "Failed to generate suggestions"}`);
  }
}

export async function generateIdeas(params: {
  interests: string;
  timeAvailable: string;
  audienceType: string;
  experienceLevel: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating niche ideas`);
  requireApiKey();

  const systemPrompt = `You are Productify AI, a specialist coach for building and monetizing digital products. Your task is to generate 5 profitable digital product niche ideas.

Return ONLY valid JSON in this exact format:
{
  "ideas": [
    {
      "title": "Clear, specific niche title",
      "why": "2-3 sentences explaining why this niche is profitable",
      "icp": "Ideal Customer Profile description",
      "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
      "proofKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "revenuePotential": "€10k-€100k range",
      "difficulty": "Easy/Medium/Hard",
      "timeToMarket": "X days/weeks"
    }
  ],
  "nextSteps": ["action 1", "action 2", "action 3"]
}`;

  const userPrompt = `Generate 5 profitable digital product niche ideas based on:
  
Interests/Experience: ${params.interests}
Time Available: ${params.timeAvailable}
Target Audience: ${params.audienceType}
Experience Level: ${params.experienceLevel}

Focus on niches with proven buyers, low competition, and high demand. Make ideas SPECIFIC and achievable for this experience level.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 4096,  // Increased for 5 detailed ideas
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    console.log('[OpenAI] Ideas response length:', content.length, 'characters');
    console.log('[OpenAI] Ideas response preview:', content.substring(0, 200));
    
    const parsed = JSON.parse(content);
    
    // Validate response structure
    if (!parsed.ideas || !Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
      console.error('[OpenAI] Invalid ideas response structure:', JSON.stringify(parsed));
      throw new Error("AI_ERROR: AI returned invalid response format. Please try again.");
    }
    
    console.log('[OpenAI] Successfully generated', parsed.ideas.length, 'ideas');
    return parsed;
  } catch (error: any) {
    console.error('[OpenAI] Generate ideas failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    if (error?.message?.startsWith("AI_ERROR:")) {
      throw error;  // Re-throw our custom validation errors
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate ideas"}`);
  }
}

export async function generateOutline(params: {
  productType: string;
  topic: string;
  targetAudience: string;
  mainGoal: string;
  experienceLevel: string;
  tier?: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating product outline - ${params.productType} (Tier: ${params.tier || 'free'})`);
  requireApiKey();

  const isPro = params.tier === 'pro';
  const isPlus = params.tier === 'plus';
  const isFree = !isPro && !isPlus;

  const systemPrompt = `You are Productify AI, a specialist at creating comprehensive digital product outlines. Your task is to create a complete outline for a ${params.productType}.

Return ONLY valid JSON in this exact format:
{
  "productTitle": "Compelling title",
  "subtitle": "One-line description",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "description": "What this chapter covers",
      "keyPoints": ["point 1", "point 2", "point 3", "point 4"],
      "estimatedLength": "X pages/minutes"${isPro ? ',\n      "monetizationTip": "Pro tip for maximizing revenue from this chapter"' : ''}
    }
  ],
  "totalEstimatedPages": "X-Y pages/hours",
  "recommendedPrice": "€X-€Y",
  "nextSteps": ["action 1", "action 2", "action 3"]${isPro ? ',\n  "proTips": ["pro tip 1", "pro tip 2", "pro tip 3"]' : ''}
}`;

  let tierInstructions = '';
  let chapterCount = '';
  let maxTokens = 2000;

  if (isPro) {
    tierInstructions = 'PRO TIER: Include deep research insights, monetization strategies per chapter, and advanced structuring with proTips for revenue optimization.';
    chapterCount = 'Create 8-12 detailed chapters';
    maxTokens = 4000;
  } else if (isPlus) {
    tierInstructions = 'PLUS TIER: Focus on solid, actionable content with clear structure and value.';
    chapterCount = 'Create 5-7 solid chapters';
    maxTokens = 2500;
  } else {
    tierInstructions = 'FREE TIER: Create a basic but valuable outline.';
    chapterCount = 'Create 3-4 essential chapters';
    maxTokens = 1500;
  }

  const userPrompt = `Create a comprehensive outline for:

Product Type: ${params.productType}
Topic: ${params.topic}
Target Audience: ${params.targetAudience}
Main Goal: ${params.mainGoal}
Audience Experience Level: ${params.experienceLevel}

${tierInstructions}
${chapterCount}.

Make it outcome-focused, structured for easy creation, and optimized for commercial success.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[OpenAI] Generate outline failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate outline"}`);
  }
}

export async function generateContent(params: {
  chapterTitle: string;
  mainPoints: string;
  targetLength: string;
  tone: string;
  format: string;
  tier?: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating content - ${params.chapterTitle} (Tier: ${params.tier || 'free'})`);
  requireApiKey();

  const isPro = params.tier === 'pro';
  const isPlus = params.tier === 'plus';
  const targetWords = parseInt(params.targetLength) || 1000;

  const systemPrompt = `You are Productify AI, a specialist content writer for digital products.

Return ONLY valid JSON in this exact format:
{
  "content": "Full written content in markdown format",
  "wordCount": number,
  "exportFormats": ["PDF", "DOCX"]${isPro ? ',\n  "additionalFormats": {\n    "emailSequence": "3-email sequence to promote this content",\n    "socialPosts": ["post 1", "post 2", "post 3"],\n    "salesCopy": "Sales page copy for this content"\n  }' : ''}
}`;

  let tierInstructions = '';
  let maxTokens = 2000;

  if (isPro) {
    tierInstructions = 'PRO TIER: Create comprehensive content AND additional formats (email sequence, social media posts, and sales copy).';
    maxTokens = 6000;
  } else if (isPlus) {
    tierInstructions = 'PLUS TIER: Focus on high-quality core content with professional depth and value.';
    maxTokens = 4000;
  } else {
    tierInstructions = 'FREE TIER: Create solid foundational content.';
    maxTokens = 2000;
  }

  const userPrompt = `Write comprehensive content for:

Title: ${params.chapterTitle}
Main Points: ${params.mainPoints}
Target Length: ${targetWords} words
Tone: ${params.tone}
Format: ${params.format}

${tierInstructions}

Make it valuable, actionable, and professionally written. Use markdown formatting.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[OpenAI] Generate content failed:', error);
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate content"}`);
  }
}

export async function generateOffer(params: {
  productName: string;
  productDescription: string;
  targetRevenue: string;
  targetAudience: string;
  tier?: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating offer - ${params.productName} (Tier: ${params.tier || 'free'})`);
  requireApiKey();

  const isPro = params.tier === 'pro';
  const isPlus = params.tier === 'plus';
  
  const systemPrompt = `You are Productify AI, a monetization strategist specializing in digital product offers.

Return ONLY valid JSON in this exact format:
{
  "coreOffer": {
    "price": "€X",
    "positioning": "One-line positioning",
    "valueProposition": "Why customers will buy"
  },
  "pricingTiers": [
    {
      "name": "Basic/Standard/Premium",
      "price": "€X",
      "includes": ["feature 1", "feature 2", "feature 3"],
      "reasoning": "Why this price works"
    }
  ],
  "bonuses": [
    {
      "title": "Bonus name",
      "value": "€X value",
      "description": "What it includes"
    }
  ],
  "upsells": [
    {
      "product": "Upsell product name",
      "price": "€X",
      "why": "Why customers will want this"
    }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

  let tierInstructions = '';
  let maxTokens = 2000;

  if (isPro) {
    tierInstructions = 'PRO TIER: Create comprehensive offer with 3+ pricing tiers, 3-5 strategic bonuses, and 2-3 upsell products with detailed reasoning for each element.';
    maxTokens = 3500;
  } else if (isPlus) {
    tierInstructions = 'PLUS TIER: Create solid offer with 2 pricing tiers, 2-3 bonuses, and 1 upsell opportunity.';
    maxTokens = 2500;
  } else {
    tierInstructions = 'FREE TIER: Create basic offer with 1 core pricing option and essential next steps.';
    maxTokens = 1500;
  }

  const userPrompt = `Create a complete monetization strategy for:

Product: ${params.productName}
Description: ${params.productDescription}
Target Audience: ${params.targetAudience}
Revenue Goal: ${params.targetRevenue}

${tierInstructions}

Design pricing, bonuses, and upsells that maximize revenue while delivering massive value.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[OpenAI] Generate offer failed:', error);
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate offer"}`);
  }
}

export async function generateFunnel(params: {
  productName: string;
  productPrice: string;
  hasAudience: string;
  launchGoal: string;
  tier?: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating funnel - ${params.productName} (Tier: ${params.tier || 'free'})`);
  requireApiKey();

  const isPro = params.tier === 'pro';
  const isPlus = params.tier === 'plus';
  
  const systemPrompt = `You are Productify AI, a launch strategist specializing in sales funnels and product launches.

Return ONLY valid JSON in this exact format:
{
  "funnelStrategy": {
    "type": "Funnel type name",
    "overview": "2-3 sentence strategy overview",
    "expectedConversion": "X% conversion rate"
  },
  "funnelStages": [
    {
      "stage": "Stage name",
      "objective": "What this stage achieves",
      "tactics": ["tactic 1", "tactic 2", "tactic 3"],
      "metrics": "Key metric to track"
    }
  ],
  "launchRoadmap": [
    {
      "day": 1,
      "activities": ["activity 1", "activity 2"],
      "goal": "Day goal"
    }
  ],
  "trafficStrategies": [
    {
      "channel": "Traffic channel",
      "approach": "How to use this channel",
      "timeline": "When to implement"
    }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

  let tierInstructions = '';
  let maxTokens = 2500;

  if (isPro) {
    tierInstructions = 'PRO TIER: Create comprehensive funnel with 4-6 stages, detailed 14-30 day launch roadmap, and 4-5 traffic strategies with specific tactics for each.';
    maxTokens = 5000;
  } else if (isPlus) {
    tierInstructions = 'PLUS TIER: Create solid funnel with 3-4 stages, 7-14 day launch roadmap, and 2-3 core traffic strategies.';
    maxTokens = 3500;
  } else {
    tierInstructions = 'FREE TIER: Create basic funnel with 2-3 essential stages and simple 3-5 day roadmap.';
    maxTokens = 2000;
  }

  const userPrompt = `Create a complete funnel and launch plan for:

Product: ${params.productName}
Price: ${params.productPrice}
Audience Status: ${params.hasAudience}
Launch Goal: ${params.launchGoal}

${tierInstructions}

Design a realistic, actionable funnel and day-by-day launch roadmap that gets first sales quickly.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[OpenAI] Generate funnel failed:', error);
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate funnel"}`);
  }
}

export async function generateProduct(params: GenerateProductParams): Promise<string> {
  const { prompt, type, creativity, length, style } = params;

  console.log(`[OpenAI] Starting generation - Type: ${type}, Length: ${length}, Style: ${style}`);
  requireApiKey();

  const systemPrompt = `You are a Digital Product Strategist expert at creating profitable digital products.

Context for this generation:
- Product Type: ${type}
- Style: ${style}
- Target Length: Approximately ${length} words

Your approach:
- Create strategic, transformative content for the target customer
- Focus on customer outcomes and commercial value
- Structure content for maximum impact and engagement
- Provide actionable, implementation-focused material
- Think commercially about positioning and value
- NEVER use emoji characters

Deliver professional content that drives customer success and creator revenue.`;

  try {
    console.log('[OpenAI] Calling OpenAI API...');
    
    // Note: GPT-5 only supports default temperature (1), ignoring creativity parameter
    console.log(`[OpenAI] Using GPT-5 with default temperature (creativity parameter ignored)`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5", // Using GPT-5 for ultra-fast, specialized responses
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: Math.min(8192, Math.ceil(length * 1.5)),
    });

    const content = response.choices[0].message.content || "";
    console.log(`[OpenAI] Generation completed - Content length: ${content.length} characters`);
    return content;
  } catch (error: any) {
    console.error('[OpenAI] Generation failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded. Please check your API plan and billing details.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_GENERATION_ERROR: ${error?.message || "Failed to generate content"}`);
  }
}
