import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AskLLMOptions {
  system: string;
  user: string;
  schema?: any;
  mode?: 'fast' | 'quality';
  stream?: boolean;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter
 */
function getBackoffDelay(attempt: number): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}

/**
 * Main LLM client with streaming, retries, and timeouts
 * 
 * @param options Configuration options
 * @returns Promise resolving to LLM response or stream
 */
export async function askLLM(options: AskLLMOptions): Promise<LLMResponse | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const {
    system,
    user,
    schema,
    mode = 'fast',
    stream = false,
    maxTokens,
    timeout = 25000,
    retries = 2
  } = options;

  const model = process.env.OPENAI_MODEL || 'gpt-5';
  // Note: GPT-5 only supports temperature=1, so we omit the temperature parameter

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add backoff delay for retries
      if (attempt > 0) {
        const delay = getBackoffDelay(attempt - 1);
        console.log(`[LLM] Retry attempt ${attempt} after ${Math.round(delay)}ms backoff`);
        await sleep(delay);
      }

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[LLM] Request timeout after ${timeout}ms`);
        abortController.abort();
      }, timeout);

      try {
        const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          ...(maxTokens && { max_completion_tokens: maxTokens }),
          ...(schema && { 
            response_format: { 
              type: 'json_schema', 
              json_schema: schema 
            } 
          }),
          ...(stream && { stream: true })
        };

        console.log(`[LLM] Request - Model: ${model}, Mode: ${mode}, Stream: ${stream}, Attempt: ${attempt + 1}/${retries + 1}`);

        if (stream) {
          // Return the stream directly for streaming requests
          const streamResponse = await client.chat.completions.create(
            { ...requestOptions, stream: true } as OpenAI.Chat.ChatCompletionCreateParamsStreaming,
            { signal: abortController.signal }
          );
          clearTimeout(timeoutId);
          return streamResponse;
        } else {
          // Regular non-streaming request
          const response = await client.chat.completions.create(
            { ...requestOptions, stream: false } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
            { signal: abortController.signal }
          );
          clearTimeout(timeoutId);

          const content = response.choices[0].message.content || '';
          const usage = response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          } : undefined;

          console.log(`[LLM] Success - Tokens: ${usage?.totalTokens || 'unknown'}, Length: ${content.length} chars`);

          return {
            content,
            usage
          };
        }
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error: any) {
      lastError = error;

      // Don't retry on certain error types
      if (error?.status === 401) {
        throw new Error('INVALID_API_KEY: OpenAI API key is invalid or missing');
      }
      if (error?.status === 400) {
        throw new Error(`INVALID_REQUEST: ${error?.message || 'Bad request to OpenAI API'}`);
      }

      // Log retriable errors
      if (error.name === 'AbortError') {
        console.error(`[LLM] Timeout on attempt ${attempt + 1}/${retries + 1}`);
      } else if (error?.status === 429) {
        console.error(`[LLM] Rate limit on attempt ${attempt + 1}/${retries + 1}`);
      } else if (error?.status === 500 || error?.status === 503) {
        console.error(`[LLM] Server error on attempt ${attempt + 1}/${retries + 1}:`, error?.message);
      } else {
        console.error(`[LLM] Error on attempt ${attempt + 1}/${retries + 1}:`, error?.message);
      }

      // If this was the last attempt, throw
      if (attempt === retries) {
        throw new Error(`LLM_ERROR: ${error?.message || 'Failed after retries'}`);
      }

      // Otherwise continue to next retry
    }
  }

  // This should never be reached, but TypeScript doesn't know that
  throw new Error(`LLM_ERROR: ${lastError?.message || 'Failed after all retries'}`);
}

/**
 * Simplified helper for quick non-streaming requests
 */
export async function askLLMQuick(system: string, user: string, mode: 'fast' | 'quality' = 'fast'): Promise<string> {
  const response = await askLLM({ system, user, mode }) as LLMResponse;
  return response.content;
}

/**
 * Helper for JSON schema responses
 */
export async function askLLMJSON<T = any>(
  system: string, 
  user: string, 
  schema: any,
  mode: 'fast' | 'quality' = 'fast'
): Promise<T> {
  const response = await askLLM({ system, user, schema, mode }) as LLMResponse;
  try {
    return JSON.parse(response.content) as T;
  } catch (error) {
    console.error('[LLM] Failed to parse JSON response:', error);
    throw new Error('LLM_JSON_PARSE_ERROR: Failed to parse LLM JSON response');
  }
}

/**
 * Health check endpoint to verify API key and model availability
 */
export async function healthCheck(): Promise<{ ok: boolean; model: string; error?: string; response?: string }> {
  try {
    const response = await askLLM({
      system: 'You are a helpful assistant.',
      user: 'Say "OK"',
      mode: 'fast',
      timeout: 5000,
      retries: 0
    }) as LLMResponse;

    // Verify we got a valid response
    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from LLM');
    }

    return {
      ok: true,
      model: process.env.OPENAI_MODEL || 'gpt-5',
      response: response.content.substring(0, 50)
    };
  } catch (error: any) {
    return {
      ok: false,
      model: process.env.OPENAI_MODEL || 'gpt-5',
      error: error?.message || 'Health check failed'
    };
  }
}


