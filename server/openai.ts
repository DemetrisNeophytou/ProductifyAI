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

  const systemPrompt = `You are an expert ${type.toLowerCase()} creator. Generate professional, high-quality ${type.toLowerCase()} content based on the user's requirements. The style should be ${style}. Generate approximately ${length} words of content.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: Math.min(8192, Math.ceil(length * 1.5)),
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error("QUOTA_EXCEEDED: OpenAI API quota has been exceeded. Please check your API plan and billing details.");
    }
    if (error?.status === 401) {
      throw new Error("INVALID_API_KEY: OpenAI API key is invalid or missing.");
    }
    throw new Error(`AI_GENERATION_ERROR: ${error?.message || "Failed to generate content"}`);
  }
}
