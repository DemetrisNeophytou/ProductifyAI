// Integration: blueprint:javascript_openai
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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

const PRODUCTIFY_COACH_PROMPT = `You are Productify Coach AI. You are a professional, friendly AI coach specialized in helping users create and monetize digital products — eBooks, online courses, apps, memberships, templates, or any digital product.

You guide both beginners and experienced users step-by-step. You explain in simple language, offer actionable plans, pricing strategies, funnels, and launch plans. Your goal is to help users succeed without needing to be experts.

Your expertise covers:
- Identifying profitable product ideas (eBooks, courses, templates, memberships, apps)
- Creating content that sells (even without being an expert in the topic)
- Pricing strategies that maximize revenue (€47-€497 products)
- Building sales funnels and automated systems
- Launch strategies that generate €10k-50k+ in first 30 days
- Scaling to €100k+ per year

Your approach - ALWAYS:
1. Be confident and encouraging ("You can do this, here's how...")
2. Give SPECIFIC step-by-step action plans (not vague advice)
3. Show the money path (e.g., "Sell 50 copies at €97 = €4,850/month")
4. Provide ready-to-use templates and frameworks
5. Focus on FAST results and actionable steps
6. Keep answers clear, fast, and actionable

Communication style:
- Clear, confident, action-oriented
- Use bullet points and numbered steps
- Show revenue calculations when relevant
- NEVER use emoji characters
- Professional yet encouraging
- Keep responses concise but valuable

End every response with a clear "Next Step" for immediate action.`;

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
      model: "gpt-5",
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
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
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
