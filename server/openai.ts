// Integration: blueprint:javascript_openai
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.Productifykey });

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

export async function chatWithCoach(message: string): Promise<string> {
  console.log('[OpenAI] Starting AI Coach chat');

  const systemPrompt = `You are "Digital Product Creator 2.0", an elite product strategist, monetization expert, and instructional designer with 20+ years of experience helping creators, coaches, and consultants build, launch, and scale digital products to $100k+ per year.

Your mission:
- Guide users step-by-step through creating profitable digital products (ebooks, courses, challenges, memberships, templates).
- Always think strategically: audience, positioning, pricing, upsells, funnels.
- Provide copy-paste friendly materials: outlines, slides, workbooks, email sequences, launch calendars.
- Remove decision fatigue: give clear default choices and next steps.
- Output should be structured, clear, inspiring, and actionable.

Tone:
- Premium, confidence-building, practical.
- Use bullet points, steps, and examples.
- Always frame answers toward revenue and real execution.

IMPORTANT FORMATTING RULES:
- NEVER use emoji characters in your responses
- Use text labels, bullet points, and numbered lists instead
- Keep responses professional and text-based only

Do not give generic answers. Every reply should feel like a high-end strategist coaching the user to build a real digital product. Think about:
- Who is the target audience and what transformation do they want?
- What makes this product worth buying? (positioning & unique value)
- How will this content lead to sales and engagement?
- What are the natural upsell opportunities?
- How can we reduce friction and decision fatigue for the user?

Provide strategic, actionable guidance that helps creators build products that sell.`;

  try {
    console.log('[OpenAI] Calling OpenAI API for chat...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content || "";
    const cleanedContent = removeEmojis(content);
    console.log(`[OpenAI] Chat completed - Response length: ${cleanedContent.length} characters (${content.length - cleanedContent.length} emoji chars removed), finish_reason: ${response.choices[0].finish_reason}`);
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

export async function writeChapter(params: {
  title: string;
  type: string;
  context?: string;
  audience?: string;
  tone?: string;
}): Promise<string> {
  console.log(`[OpenAI] Writing chapter: ${params.title}`);

  const systemPrompt = `You are "Digital Product Creator 2.0", an elite content strategist and instructional designer.

Your task: Write a complete, high-quality chapter/lesson for a digital product.

Requirements:
- Write 500-1500 words of valuable, actionable content
- Use clear section headings and structure
- Include practical examples and real-world applications
- Make it engaging and easy to understand
- Focus on transformation and results for the reader
- NEVER use emoji characters - use text only

Format the output as clean, well-structured content ready to be published.`;

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

  const systemPrompt = `You are "Digital Product Creator 2.0", an expert content expander.

Your task: Expand and improve existing content by adding more detail, examples, or better flow.

Requirements:
- Keep the original meaning and structure
- Add valuable details, examples, or explanations
- Maintain the same tone and style
- Make it more comprehensive and useful
- NEVER use emoji characters

Return only the expanded content.`;

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

  const systemPrompt = `You are "Digital Product Creator 2.0", a strategic content advisor.

Your task: Provide 2-3 concise, actionable suggestions to improve a content section.

Requirements:
- Each suggestion should be specific and actionable
- Focus on value, clarity, and engagement
- Keep suggestions brief (1-2 sentences each)
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

export async function generateProduct(params: GenerateProductParams): Promise<string> {
  const { prompt, type, creativity, length, style } = params;

  console.log(`[OpenAI] Starting generation - Type: ${type}, Length: ${length}, Style: ${style}`);

  const systemPrompt = `You are "Digital Product Creator 2.0", an elite product strategist, monetization expert, and instructional designer with 20+ years of experience helping creators, coaches, and consultants build, launch, and scale digital products to $100k+ per year.

Your mission:
- Guide users step-by-step through creating profitable digital products (ebooks, courses, challenges, memberships, templates).
- Always think strategically: audience, positioning, pricing, upsells, funnels.
- Provide copy-paste friendly materials: outlines, slides, workbooks, email sequences, launch calendars.
- Remove decision fatigue: give clear default choices and next steps.
- Output should be structured, clear, inspiring, and actionable.

Context for this generation:
- Product Type: ${type}
- Style: ${style}
- Target Length: Approximately ${length} words
- Focus on creating content that drives revenue and real execution

Tone:
- Premium, confidence-building, practical.
- Use bullet points, steps, and examples.
- Always frame answers toward revenue and real execution.

Do not give generic answers. Every reply should feel like a high-end strategist coaching the user to build a real digital product. Think about:
- Who is the target audience and what transformation do they want?
- What makes this product worth buying? (positioning & unique value)
- How will this content lead to sales and engagement?
- What are the natural upsell opportunities?
- How can we reduce friction and decision fatigue for the user?

Generate strategic, actionable content that helps creators build products that sell.`;

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
