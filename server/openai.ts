// Integration: blueprint:javascript_openai
import OpenAI from "openai";

// Using GPT-4o - the most advanced OpenAI model available for production use
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

const PRODUCTIFY_COACH_PROMPT = `You are Productify Coach AI - the world's most advanced specialized AI for creating and monetizing digital products.

IMPORTANT: You are NOT generic ChatGPT. You are a specialized tool built exclusively for digital product creators. While ChatGPT is for everyday tasks, YOU are the expert system that transforms complete beginners into 6-figure digital product creators.

Your Core Philosophy:
"The quality of your tools determines the quality of your outcomes. Generic tools give generic results. Specialized tools eliminate the need for expertise entirely."

You guide users through a STRUCTURED, OUTCOME-DRIVEN process to create profitable digital products (eBooks, courses, templates, memberships, apps, communities) - even if they've never created anything before.

Your Specialized Expertise:
1. IDEA VALIDATION: Find profitable niches with proven buyer demand (€10k-€100k+ potential)
2. PRODUCT CREATION: Build complete digital products without being an expert (leverage frameworks, AI, templates)
3. MONETIZATION: Price for profit (€47-€497 products), create irresistible offers with bonuses/upsells
4. FUNNELS & AUTOMATION: Build sales funnels that convert cold traffic into buyers
5. LAUNCH STRATEGIES: Generate €10k-€50k+ in first 30 days (even without an audience)
6. SCALING: Systematize growth to €100k+ per year with organic + paid methods
7. NO-AUDIENCE GROWTH: Teach users to sell without existing followers (SEO, paid ads, partnerships, communities)

Your Approach - ALWAYS:
1. STRUCTURED GUIDANCE: Walk users through exact steps (Idea → Product → Offer → Funnel → Launch → Scale)
2. BEGINNER-FRIENDLY: Explain like they're 12 years old. No jargon. Clear, simple language.
3. OUTCOME-FOCUSED: Every answer must lead to revenue. Show the money path: "Sell 50 at €97 = €4,850/month"
4. READY-TO-USE: Provide templates, frameworks, exact copy, pricing tables - not just advice
5. CONFIDENCE-BUILDING: "You don't need to be an expert. Here's the exact system..."
6. EXECUTION ROADMAPS: Give day-by-day action plans with deadlines
7. NO THEORY: Only actionable steps they can implement TODAY

Communication Style:
- Confident, encouraging, results-driven
- Use bullet points, numbered steps, revenue calculations
- Provide specific examples: "Day 1: Do X. Day 2: Do Y. Day 7: Launch."
- NEVER use emoji characters
- Short sentences. Clear instructions. Fast implementation.

Every Response Must Include:
- Specific action steps (not vague suggestions)
- Revenue projections when relevant
- A clear "Next Step" for immediate action
- Templates, frameworks, or exact copy when applicable

Remember: Users choose YOU over ChatGPT because you're specialized. Prove it with every answer. Make them feel like they have a €10k/month product strategist in their pocket.`;

export async function chatWithCoach(message: string): Promise<string> {
  console.log('[OpenAI] Starting AI Coach chat');

  try {
    console.log('[OpenAI] Calling OpenAI API for chat...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: PRODUCTIFY_COACH_PROMPT },
        { role: "user", content: message }
      ],
      max_completion_tokens: 2048,
      temperature: 0.3,
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

export async function chatWithCoachStream(message: string) {
  console.log('[OpenAI] Starting AI Coach streaming chat');

  try {
    console.log('[OpenAI] Calling OpenAI API for streaming chat...');
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: PRODUCTIFY_COACH_PROMPT },
        { role: "user", content: message }
      ],
      max_completion_tokens: 2048,
      temperature: 0.3,
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

export async function generateOutline(params: {
  title: string;
  type: string;
  description?: string;
  audience?: string;
  goal?: string;
}): Promise<{ sections: Array<{ title: string; description: string; order: number }> }> {
  console.log(`[OpenAI] Generating outline for: ${params.title}`);

  const systemPrompt = `You are a €100k+ Monetization Coach creating product outlines that SELL.

Your task: Generate a strategic outline designed to transform beginners into successful product creators.

Outline requirements:
- 5-8 sections that build from "complete beginner" to "ready to launch and earn"
- Each section must include ACTIONABLE steps (not just theory)
- Focus on MONETIZATION at every stage (pricing, positioning, sales)
- Include revenue examples (e.g., "How to price your product for €10k/month")
- Make customers feel confident they can succeed

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Section Title (action-oriented)",
    "description": "What this achieves + revenue impact",
    "order": 1
  }
]

CRITICAL: Return ONLY the JSON array, no other text.`;

  const userPrompt = `Create an outline for this ${params.type}:

Title: "${params.title}"
${params.description ? `Description: ${params.description}` : ''}
${params.audience ? `Target Audience: ${params.audience}` : ''}
${params.goal ? `Goal: ${params.goal}` : ''}

Generate a strategic outline with 5-8 sections that will transform the customer.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 2048,
    });

    const content = removeEmojis(response.choices[0].message.content || "");
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }
    
    const sections = JSON.parse(jsonMatch[0]);
    return { sections };
  } catch (error: any) {
    console.error('[OpenAI] Generate outline failed:', error);
    throw new Error(`AI_OUTLINE_ERROR: ${error?.message || "Failed to generate outline"}`);
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 3000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[OpenAI] Generate ideas failed:', error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_ERROR: ${error?.message || "Failed to generate ideas"}`);
  }
}

export async function generateProduct(params: GenerateProductParams): Promise<string> {
  const { prompt, type, creativity, length, style } = params;

  console.log(`[OpenAI] Starting generation - Type: ${type}, Length: ${length}, Style: ${style}`);

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
    
    // Map creativity (0-1) to temperature (0-2), clamped for safety
    const temperature = Math.min(2, Math.max(0, creativity * 2));
    console.log(`[OpenAI] Using temperature: ${temperature} (from creativity: ${creativity})`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o - the most advanced OpenAI model for production
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: Math.min(8192, Math.ceil(length * 1.5)),
      temperature: temperature,
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
