// FIX: Avoid non-null assertion; surface a user-friendly error if env is missing.
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export type GroqModel =
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'mixtral-8x7b-32768'
  | 'meta-llama/llama-4-scout-17b-16e-instruct';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Low-level: Send chat messages to Groq.
 */
export async function groqChatRaw(
  messages: ChatMessage[],
  model: GroqModel = 'llama-3.3-70b-versatile',
  maxTokens: number = 2000
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY. Add it to .env and restart Expo.');
  }

  const sanitizedMessages = messages.map(msg => {
    if (msg.role === 'system' && typeof msg.content !== 'string') {
      if (Array.isArray(msg.content)) {
        const textContent = msg.content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
        return { ...msg, content: textContent };
      }
      return { ...msg, content: String(msg.content) };
    }
    return msg;
  });

  let lastError: Error | null = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 3s
        await new Promise(r => setTimeout(r, attempt * 2000));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: sanitizedMessages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = `Groq API error (${response.status}): ${errorData?.error?.message || response.statusText}`;
        
        // Retry on 429 (rate limit) or 5xx (server errors)
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      
      if (!data?.choices?.[0]?.message?.content) {
        console.error('Unexpected Groq Response:', JSON.stringify(data));
        throw new Error('Groq API returned an empty or malformed response.');
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      if (error.message?.includes('Groq API error') && attempt < maxRetries) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('AI Service Error: Max retries exceeded');
}

/**
 * Convenience: system + user message shorthand.
 */
export async function groqChat(
  systemPrompt: string,
  userMessage: string,
  model?: GroqModel
): Promise<string> {
  return groqChatRaw(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    model
  );
}

/**
 * Parse a JSON response from Groq, handling markdown code block wrappers.
 */
export function parseGroqJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  // Strip ```json ... ``` wrappers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Ask Groq for a structured JSON response and parse it automatically.
 */
export async function groqJSON<T>(
  prompt: string,
  model: GroqModel = 'llama-3.3-70b-versatile'
): Promise<T> {
  const raw = await groqChatRaw(
    [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Return ONLY valid JSON. No explanation, no markdown fences around it, just raw JSON.',
      },
      { role: 'user', content: prompt },
    ],
    model,
    4000
  );
  return parseGroqJSON<T>(raw);
}
