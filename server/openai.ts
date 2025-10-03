// Integration: blueprint:javascript_openai
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.Productifykey });

interface GenerateProductParams {
  prompt: string;
  type: string;
  creativity: number;
  length: number;
  style: string;
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
