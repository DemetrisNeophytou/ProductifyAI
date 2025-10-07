import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });

export const BRAND_SAFE_SYSTEM_PROMPT = `You are Productify AI, a neutral, brand-safe assistant that helps users create and sell digital products.

Hard rules (never break):
- Do NOT mention or reference any competitor brand or individual by name.
- Speak generically (e.g., "a competing platform", "another creator") when comparisons are necessary.
- No quotes, paraphrases, or summaries that could identify competitors.
- If the user asks you to name competitors, politely refuse and offer generic guidance.

Style:
- Positive, practical, step-by-step.
- Use our frameworks and templates only. No external sources unless explicitly allowed.
- NEVER use emoji characters in any response.
`;

const BANNED_PATTERNS = [
  // People (influencers/competitors)
  /iman\s+gadzhi/gi,
  /jordan\s+welch/gi,
  /alex\s+hormozi/gi,
  /russell\s+brunson/gi,
  
  // Competing platforms/products
  /monet(i|)se/gi,
  /lemon\s*squeezy/gi,
  /sellfy/gi,
  /gumroad/gi,
  /vonza/gi,
  /snapps(\.ai)?/gi,
  /the\s*leap/gi,
  /kajabi/gi,
  /teachable/gi,
  /podia/gi,
  /thinkific/gi,
  /clickfunnels/gi,
  /systeme\.io/gi,
  /kartra/gi,
  /builderall/gi,
  /convertkit/gi,
  /mailchimp/gi,
  /payhip/gi,
  /stan\s+store/gi,
  /beacons/gi,
  /linktree/gi,
];

export function containsBanned(text: string): boolean {
  return BANNED_PATTERNS.some(pattern => pattern.test(text));
}

export function sanitizeToGeneric(text: string): string {
  let sanitized = text;
  BANNED_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, 'a competing platform');
  });
  return sanitized;
}

export async function rewriteGeneric(text: string): Promise<string> {
  try {
    const prompt = `Rewrite the following text to remove ALL competitor names and individual names.
Replace with generic phrasing only (e.g., "a competing platform", "another creator", "other tools").
Keep the meaning and usefulness intact. Do NOT add commentary.

Text:
"""${text}"""`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      temperature: 0.3,
      max_completion_tokens: 500,
      messages: [
        { role: "system", content: "You are a brand-safe rewrite engine. Remove all competitor/individual names and replace with generic terms." },
        { role: "user", content: prompt }
      ]
    });

    return response.choices[0].message?.content || text;
  } catch (error) {
    console.error('[BrandGuard] Rewrite failed, using simple sanitization:', error);
    return sanitizeToGeneric(text);
  }
}

export async function filterChunk(chunk: string, useAIRewrite: boolean = false): Promise<string> {
  if (!containsBanned(chunk)) {
    return chunk;
  }

  console.log('[BrandGuard] Detected banned content in chunk');

  if (useAIRewrite) {
    return await rewriteGeneric(chunk);
  }

  return sanitizeToGeneric(chunk);
}

export class StreamingBrandGuard {
  private buffer: string = '';
  private readonly lookAheadSize: number = 15; // Hold back N chars to check for splits (longest banned word is ~15 chars)
  
  async processChunk(chunk: string): Promise<string> {
    // Add new chunk to buffer
    this.buffer += chunk;
    
    // Calculate safe zone (everything except the look-ahead window)
    const safeZoneEnd = Math.max(0, this.buffer.length - this.lookAheadSize);
    
    if (safeZoneEnd === 0) {
      // Not enough buffered yet - don't send anything
      return '';
    }
    
    // Check if ENTIRE buffer contains banned content
    if (containsBanned(this.buffer)) {
      console.log('[BrandGuard] Detected banned content in buffer');
      // Sanitize entire buffer
      const sanitizedBuffer = sanitizeToGeneric(this.buffer);
      
      // Send the sanitized safe zone
      const safeZoneSanitized = sanitizedBuffer.substring(0, safeZoneEnd);
      // Keep sanitized remainder in buffer
      this.buffer = sanitizedBuffer.substring(safeZoneEnd);
      return safeZoneSanitized;
    }
    
    // Buffer is clean - send safe zone
    const safeZone = this.buffer.substring(0, safeZoneEnd);
    this.buffer = this.buffer.substring(safeZoneEnd);
    return safeZone;
  }
  
  async flush(): Promise<string> {
    // At end of stream, process remaining buffer
    if (this.buffer.length === 0) {
      return '';
    }
    
    const remaining = this.buffer;
    this.buffer = '';
    
    if (containsBanned(remaining)) {
      console.log('[BrandGuard] Detected banned content in final flush');
      return sanitizeToGeneric(remaining);
    }
    
    return remaining;
  }
  
  reset(): void {
    this.buffer = '';
  }
}
