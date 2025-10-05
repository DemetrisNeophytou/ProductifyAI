// Integration: blueprint:javascript_openai
import OpenAI from "openai";
import { ragService } from "./rag-service";

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

const DIGITAL_PRODUCT_COACH_PROMPT = `You are Productify Coach — a friendly, expert digital-product mentor.

Goals: help users ideate, plan, design, price, launch, and promote digital products (ebooks, planners, templates, landing pages, mini-courses, video assets), then iterate based on results.

Tone: human, concise, encouraging. Avoid hype and competitor mentions. 

Language: reply in the user's language (Greek or English).

Dialogue rules:
- Start with 2-4 short questions to clarify goals, audience, timeline, and budget.
- Offer 3 crisp options max, never info-dump.
- When giving steps, show a tiny checklist (1-5 bullets) and a single CTA.
- Prefer numbers, examples, and templates over generic advice.
- If a tool is relevant, propose it and ask permission before running it.
- Never invent data. If unsure, say what you need to proceed.

Safety:
- No competitor names or celebrity references.
- Only royalty-free assets (Pexels/Pixabay).
- Respect user's brand kit (fonts/colors/logo).

Outputs must be structured as:
1) Summary (1-2 lines)
2) Next best step (CTA)
3) Optional: Short template or example
4) Offer to automate via tools (with credit estimate)

NEVER use emoji characters in any response.`;

const COACH_HIDDEN_RULES = `Before answering, silently check:
- Do I know the user's niche, audience, and product type?
- Has the user picked a template or brand kit?
If not, ask targeted questions FIRST. Keep each question to one short sentence.`;

export async function chatWithCoach(message: string, userId: string): Promise<string> {
  console.log('[OpenAI] Starting AI Coach chat with conversation history + RAG');
  requireApiKey();

  try {
    // Get conversation history for this user (already includes current user message from routes.ts)
    const history = getConversationHistory(userId);
    
    // Retrieve relevant RAG context based on the user's message
    const ragContext = await ragService.retrieveContext(message, { k: 3 });
    console.log(`[OpenAI] RAG context retrieved: ${ragContext.length} characters`);
    
    // Build messages array with system prompt + hidden rules + RAG context + history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: DIGITAL_PRODUCT_COACH_PROMPT },
      { role: "system", content: COACH_HIDDEN_RULES },
      { role: "system", content: `RAG Knowledge Base:\n${ragContext}` },
      ...history.map(msg => ({ role: msg.role, content: msg.content }))
    ];
    
    console.log(`[OpenAI] Chat context: ${history.length} messages in history, total context: ${messages.length} messages`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 8192,
      temperature: 0.4,
    });

    const content = response.choices[0].message.content || "";
    const cleanedContent = removeEmojis(content);
    
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
  console.log('[OpenAI] Starting AI Coach streaming chat with conversation history + RAG');
  requireApiKey();

  try {
    // Get conversation history for this user (already includes current user message from routes.ts)
    const history = getConversationHistory(userId);
    
    // Retrieve relevant RAG context based on the user's message
    const ragContext = await ragService.retrieveContext(message, { k: 3 });
    console.log(`[OpenAI] RAG context retrieved for streaming: ${ragContext.length} characters`);
    
    // Build messages array with system prompt + hidden rules + RAG context + history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: DIGITAL_PRODUCT_COACH_PROMPT },
      { role: "system", content: COACH_HIDDEN_RULES },
      { role: "system", content: `RAG Knowledge Base:\n${ragContext}` },
      ...history.map(msg => ({ role: msg.role, content: msg.content }))
    ];
    
    console.log(`[OpenAI] Streaming chat context: ${history.length} messages in history, total context: ${messages.length} messages`);
    
    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 8192,
      temperature: 0.4,
      stream: true,
    });

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

// Generate complete ebook with all sections and image prompts
export async function generateCompleteEbook(params: {
  title: string;
  niche: string;
  audience: string;
  tone: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating complete ebook - ${params.title}`);
  requireApiKey();

  const systemPrompt = `You are an expert digital product creator. Generate a complete ebook with all sections ready for publishing.

Return ONLY valid JSON in this exact format:
{
  "title": "Final ebook title",
  "subtitle": "Compelling subtitle",
  "introduction": {
    "content": "Full introduction text (200-300 words) in markdown format",
    "imagePrompt": "DALL-E prompt for introduction image"
  },
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "headline": "Compelling headline for this chapter",
      "content": "Full chapter content (300-400 words) in markdown format with headings, bullet points, and actionable steps",
      "imagePrompt": "DALL-E prompt for chapter image"
    }
  ],
  "summary": {
    "content": "Complete summary section (150-200 words) in markdown format",
    "imagePrompt": "DALL-E prompt for summary image"
  },
  "coverImagePrompt": "DALL-E prompt for ebook cover image"
}

IMPORTANT:
- Create EXACTLY 5 chapters
- Each chapter should be 300-400 words of actionable, valuable content
- Use markdown formatting (headings, bold, italic, lists, etc.)
- Image prompts should be detailed and professional for DALL-E 3
- Focus on transformation and results
- Make it compelling and ready to sell
- NEVER use emoji characters in content`;

  const userPrompt = `Generate a complete ebook based on:

Title: ${params.title}
Niche: ${params.niche}
Target Audience: ${params.audience}
Tone: ${params.tone}

Create a comprehensive, professional ebook with:
- A compelling introduction that hooks the reader
- 5 detailed chapters with actionable content
- A powerful summary that reinforces key takeaways
- Professional image prompts for cover, introduction, each chapter, and summary

Make it valuable enough that people would pay €47-€97 for it.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const ebook = JSON.parse(content);
    
    // Validate structure
    if (!ebook.chapters || !Array.isArray(ebook.chapters) || ebook.chapters.length !== 5) {
      console.error('[OpenAI] Invalid ebook structure - missing or incorrect chapters');
      throw new Error("AI_ERROR: Generated ebook has invalid structure");
    }
    
    console.log(`[OpenAI] Complete ebook generated successfully with ${ebook.chapters.length} chapters`);
    return ebook;
  } catch (error: any) {
    console.error('[OpenAI] Generate complete ebook failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    if (error?.message?.startsWith("AI_ERROR:")) {
      throw error;
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate complete ebook"}`);
  }
}

// Generate complete product (all 6 types) with outline, content blocks, and image prompts
export async function generateCompleteProduct(params: {
  type: 'ebook' | 'workbook' | 'course' | 'landing' | 'emails' | 'social';
  topic: string;
  audience: string;
  tone: string;
  goal: string;
}): Promise<any> {
  console.log(`[OpenAI] Generating complete ${params.type} - Topic: ${params.topic}`);
  requireApiKey();

  const productTypeInstructions: Record<string, string> = {
    ebook: `Generate a complete ebook on the topic for the target audience in the specified tone. 
Include title, introduction, 8–12 chapters, and summary. 
Each chapter: headline, 300–400 words, 1 image prompt (<=30 words, no text).`,
    
    workbook: `Create a practical workbook for the topic designed for the target audience in the specified tone. 
Structure it into 8–10 short sections. 
Each section should include:
- A short intro paragraph (100–150 words)
- 3–5 actionable exercises or checklist items (use "task" or "checkbox" block types)
- 1 reflective question
- 1 image prompt (<=30 words)`,
    
    course: `Create a 6-module online course about the topic for the target audience. 
Each module should include:
- Module Title
- Learning Objectives (3–5 bullet points)
- Lesson Script (video script, 3–5 minutes, conversational tone)
- Key Takeaways (bullets)
- 1 Slide Prompt (describe visuals)`,
    
    landing: `Write a complete, high-converting landing page to sell the product. 
Structure:
1. Hero Section: headline, subheadline, CTA
2. Proof Section: 3 testimonials or credibility elements
3. Benefits Section: 3–5 bullet points
4. Offer Stack: product description, pricing tiers
5. CTA Section
6. FAQ (3–4 questions/answers)
Include 1 image prompt per section (<=30 words).`,
    
    emails: 'Create an email sequence with exactly 5 emails designed to nurture, educate, and convert. Each email should have a clear purpose and compelling copy.',
    
    social: 'Create a social media content pack with exactly 10 posts optimized for engagement. Include a mix of educational, inspirational, and promotional content.'
  };

  const blockTypesByProduct: Record<string, string> = {
    ebook: 'Use block types: "text", "image", "quote", "cta"',
    workbook: 'Use block types: "text" for intro paragraphs, "task" for exercises, "checkbox" for checklist items, "exercise" for reflective questions',
    course: 'Use block types: "lesson" for module content, "objective" for learning objectives, "script" for video scripts, "slide_prompt" for slide descriptions',
    landing: 'Use block types: "hero" for hero section, "proof" for testimonials, "benefits" for benefits list, "offer" for pricing, "faq" for Q&A, "cta" for calls to action',
    emails: 'Use block types: "text" for email body content',
    social: 'Use block types: "text" for social media post content'
  };

  const systemPrompt = `You are Productify AI, an expert at creating complete, ready-to-sell digital products.

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling product title",
  "subtitle": "Engaging subtitle that clarifies the value proposition",
  "outline": [
    { "id": "sec1", "title": "Section title", "level": 1 },
    { "id": "sec2", "title": "Subsection title", "level": 2 }
  ],
  "blocks": [
    {
      "id": "blk1",
      "sectionId": "sec1",
      "type": "text",
      "content": "Full section content (300-400 words) in markdown format with proper formatting",
      "imagePrompt": "concise image prompt for DALL-E (<= 30 words, no text in image)"
    }
  ],
  "brand": {
    "primary": "#7c3bed",
    "secondary": "#19161d",
    "font": "Inter"
  },
  "metadata": {
    "wordCount": 5200,
    "imageCount": 8
  }
}

CRITICAL RULES:
1. ${productTypeInstructions[params.type]}
2. ${blockTypesByProduct[params.type]}
3. Generate 300-400 words of high-quality content for EACH block (100-150 words for workbook intros)
4. Create the appropriate number and types of blocks per section based on product type
5. Image prompts must be <= 30 words, descriptive for DALL-E 3, and specify NO TEXT in images
6. Content should be in markdown format with headings, bold, italic, lists, etc.
7. Make it valuable, actionable, and ready to sell at €47-€197
8. NEVER use emoji characters in any content
9. Never mention competitor brands or individuals by name
10. Use generic terms when referencing other tools/platforms
11. Focus on transformation and results for the target audience`;

  const userPrompt = `Create a complete, ready-to-sell ${params.type} based on these inputs:

Topic: ${params.topic}
Target Audience: ${params.audience}
Tone of Voice: ${params.tone}
Primary Goal: ${params.goal}

Generate:
1. A compelling title and subtitle
2. A complete outline with ${params.type === 'emails' ? '5' : params.type === 'social' ? '10' : '8-12'} sections
3. Full content blocks (300-400 words each) for every section
4. Professional image prompts for each block (<= 30 words, no text)
5. Brand colors and font selection that fits the ${params.tone} tone
6. Accurate metadata (word count, image count)

Make it professional, compelling, and ready to launch.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 16000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const product = JSON.parse(content);
    
    if (!product.outline || !Array.isArray(product.outline) || product.outline.length === 0) {
      console.error('[OpenAI] Invalid product structure - missing or empty outline');
      throw new Error("AI_ERROR: Generated product has invalid structure");
    }
    
    if (!product.blocks || !Array.isArray(product.blocks) || product.blocks.length === 0) {
      console.error('[OpenAI] Invalid product structure - missing or empty blocks');
      throw new Error("AI_ERROR: Generated product has invalid structure");
    }
    
    console.log(`[OpenAI] Complete ${params.type} generated with ${product.outline.length} sections and ${product.blocks.length} blocks`);
    return product;
  } catch (error: any) {
    console.error('[OpenAI] Generate complete product failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    if (error?.message?.startsWith("AI_ERROR:")) {
      throw error;
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate complete product"}`);
  }
}

// Generate image using DALL-E 3
export async function generateEbookImage(params: {
  prompt: string;
  type: 'cover' | 'chapter' | 'section';
}): Promise<string> {
  console.log(`[OpenAI] Generating ${params.type} image with DALL-E 3`);
  requireApiKey();

  try {
    const enhancedPrompt = `${params.prompt}. Professional, high-quality digital product style. Clean, modern design. No text overlays.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error("No image URL returned from DALL-E");
    }
    
    const imageUrl = response.data[0].url;

    console.log(`[OpenAI] Image generated successfully`);
    return imageUrl;
  } catch (error: any) {
    console.error('[OpenAI] Image generation failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_IMAGE_ERROR: ${error?.message || "Failed to generate image"}`);
  }
}

// Regenerate a single section with new content and image prompt
export async function regenerateSection(params: {
  sectionTitle: string;
  productType: string;
  audience: string;
  tone: string;
  context?: string;
}): Promise<{ content: string; imagePrompt: string }> {
  console.log(`[OpenAI] Regenerating section - ${params.sectionTitle}`);
  requireApiKey();

  const systemPrompt = `You are Productify AI, an expert at creating high-quality digital product content.

Return ONLY valid JSON in this exact format:
{
  "content": "Full section content (300-400 words) in markdown format",
  "imagePrompt": "concise DALL-E prompt (<= 30 words, no text in image)"
}

RULES:
- Generate 300-400 words of valuable, actionable content
- Use markdown formatting (headings, bold, lists, etc.)
- Make it professional and transformation-focused
- Image prompt must be <= 30 words and specify NO TEXT
- NEVER use emoji characters
- Never mention competitor brands or individuals`;

  const contextInfo = params.context ? `\n\nContext: ${params.context}` : '';
  
  const userPrompt = `Regenerate content for this section:

Section Title: ${params.sectionTitle}
Product Type: ${params.productType}
Target Audience: ${params.audience}
Tone: ${params.tone}${contextInfo}

Create fresh, compelling content that adds value and drives transformation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    if (!result.content || !result.imagePrompt) {
      throw new Error("AI_ERROR: Invalid regeneration response structure");
    }
    
    console.log(`[OpenAI] Section regenerated successfully`);
    return result;
  } catch (error: any) {
    console.error('[OpenAI] Regenerate section failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to regenerate section"}`);
  }
}

// Phase 3: Generate theme from mood and prompt
export async function generateTheme(params: {
  mood: string;
  prompt?: string;
}): Promise<{
  fonts: { heading: string; body: string };
  colors: string[];
  spacingScale: number;
  imageStyle: string;
}> {
  console.log(`[OpenAI] Generating theme - Mood: ${params.mood}`);
  requireApiKey();

  const systemPrompt = `You are a design system assistant. Produce a cohesive theme for a digital product document.

Return ONLY valid JSON in this exact format:
{
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "colors": ["#6D28D9", "#19161d", "#F9FAFB", "#10B981"],
  "spacingScale": 1.0,
  "imageStyle": "clean high-contrast editorial, no text"
}

RULES:
- fonts.heading and fonts.body must be web-safe font names
- colors array must have exactly 4 hex color codes (primary, dark, light, accent)
- spacingScale must be between 0.8 and 1.2
- imageStyle must be <= 12 words and specify NO TEXT in images
- Ensure colors work well together and match the mood
- NEVER use emoji characters`;

  const moodPrompt = params.prompt 
    ? `Mood: ${params.mood}. User notes: ${params.prompt}`
    : `Mood: ${params.mood}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: moodPrompt }
      ],
      max_completion_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const theme = JSON.parse(content);
    
    if (!theme.fonts?.heading || !theme.fonts?.body || !theme.colors || !Array.isArray(theme.colors) || theme.colors.length !== 4) {
      throw new Error("AI_ERROR: Invalid theme structure");
    }
    
    console.log(`[OpenAI] Theme generated successfully`);
    return theme;
  } catch (error: any) {
    console.error('[OpenAI] Theme generation failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate theme"}`);
  }
}

// Phase 3: Generate image using DALL-E
export async function generateAIImage(params: {
  prompt: string;
  size?: string;
  styleHint?: string;
}): Promise<{ url: string; source: string; license: string }> {
  console.log(`[OpenAI] Generating image with DALL-E`);
  requireApiKey();

  const enhancedPrompt = params.styleHint 
    ? `${params.prompt}, ${params.styleHint}, no text, no words, no letters`
    : `${params.prompt}, no text, no words, no letters`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      size: (params.size as any) || "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    console.log(`[OpenAI] Image generated successfully`);
    return {
      url: imageUrl,
      source: "openai",
      license: "free_commercial"
    };
  } catch (error: any) {
    console.error('[OpenAI] Image generation failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_IMAGE_ERROR: ${error?.message || "Failed to generate image"}`);
  }
}
