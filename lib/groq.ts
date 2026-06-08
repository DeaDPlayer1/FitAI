// FIX: Avoid non-null assertion; surface a user-friendly error if env is missing.
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ── Inline Rate Limiter ──
let requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < 60000);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, reason: 'Rate limit reached. Please wait before sending another message.' };
  }
  return { allowed: true };
}

function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

export type GroqModel =
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'mixtral-8x7b-32768'
  | 'meta-llama/llama-4-scout-17b-16e-instruct'
  | 'llama-4-scout-17b-16e-instruct';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

// ── Circuit Breaker ──
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

let circuitState: CircuitState = 'CLOSED';
let consecutiveFailures = 0;
let lastFailureTime = 0;
const COOLDOWN_MS = 60000;
const CONSECUTIVE_THRESHOLD = 3;

function getCircuitState(): CircuitState {
  if (circuitState === 'OPEN' && Date.now() - lastFailureTime > COOLDOWN_MS) {
    circuitState = 'HALF_OPEN';
  }
  return circuitState;
}

function recordSuccess(): void {
  circuitState = 'CLOSED';
  consecutiveFailures = 0;
}

function recordFailure(): void {
  consecutiveFailures++;
  lastFailureTime = Date.now();
  if (consecutiveFailures >= CONSECUTIVE_THRESHOLD) {
    circuitState = 'OPEN';
    console.warn(`[groq-circuit] Circuit OPEN after ${consecutiveFailures} consecutive failures. Cooldown: ${COOLDOWN_MS}ms`);
  } else if (circuitState === 'HALF_OPEN') {
    circuitState = 'OPEN';
    lastFailureTime = Date.now();
  }
}

function isCircuitOpen(): boolean {
  return getCircuitState() === 'OPEN';
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

  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason || 'Rate limit reached. Please wait before sending another message.');
  }

  if (isCircuitOpen()) {
    throw new Error('AI Service Unavailable: The service is temporarily unavailable due to repeated failures. Please try again in a few minutes.');
  }

  const sanitizedMessages = messages.map(msg => {
    if (msg.role === 'system' && Array.isArray(msg.content)) {
      const textContent = msg.content
        .filter((part) => part.type === 'text')
        .map((part) => part.text || '')
        .join(' ');
      return { ...msg, content: textContent };
    }
    if (typeof msg.content === 'string') return msg;
    return { ...msg, content: String(msg.content) };
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

      const content = data.choices[0].message.content;
      const maxChars = maxTokens * 4;
      if (content.length > maxChars) {
        console.warn(`[groq] Response truncated: ${content.length} chars (max ${maxChars})`);
        return content.slice(0, maxChars);
      }
      recordSuccess();
      recordRequest();
      return content;
    } catch (error: any) {
      if (error.message?.includes('Groq API error') && attempt < maxRetries) {
        lastError = error;
        continue;
      }
      recordFailure();
      throw error;
    }
  }

  recordFailure();
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
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[groq] parseGroqJSON: malformed JSON response', error);
    throw new Error('Groq returned malformed JSON. Please try again.');
  }
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
