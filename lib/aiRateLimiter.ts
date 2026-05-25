// AI Rate Limiter: prevents abuse and controls API costs

type RateLimitConfig = {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  cooldownMs: number;
};

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 10,
  maxRequestsPerDay: 100,
  cooldownMs: 2000,
};

interface RateLimitState {
  timestamps: number[];
  dailyCount: number;
  lastDailyReset: string;
  lastRequestTime: number;
}

let state: RateLimitState = {
  timestamps: [],
  dailyCount: 0,
  lastDailyReset: new Date().toDateString(),
  lastRequestTime: 0,
};

export function resetRateLimit() {
  state = {
    timestamps: [],
    dailyCount: 0,
    lastDailyReset: new Date().toDateString(),
    lastRequestTime: 0,
  };
}

export function checkRateLimit(config: Partial<RateLimitConfig> = {}): { allowed: boolean; reason?: string; waitMs?: number } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  // Daily reset
  const today = new Date().toDateString();
  if (state.lastDailyReset !== today) {
    state.dailyCount = 0;
    state.lastDailyReset = today;
  }

  // Cooldown check
  const elapsedSinceLast = now - state.lastRequestTime;
  if (elapsedSinceLast < cfg.cooldownMs) {
    return { allowed: false, reason: 'Please wait before sending another message.', waitMs: cfg.cooldownMs - elapsedSinceLast };
  }

  // Per-minute check
  const oneMinuteAgo = now - 60000;
  state.timestamps = state.timestamps.filter(t => t > oneMinuteAgo);
  if (state.timestamps.length >= cfg.maxRequestsPerMinute) {
    return { allowed: false, reason: 'Rate limit reached. Please wait a moment.' };
  }

  // Daily check
  if (state.dailyCount >= cfg.maxRequestsPerDay) {
    return { allowed: false, reason: 'Daily AI request limit reached. Try again tomorrow.' };
  }

  return { allowed: true };
}

export function recordRequest() {
  state.timestamps.push(Date.now());
  state.dailyCount++;
  state.lastRequestTime = Date.now();
}

export function getRemainingDaily(): number {
  const today = new Date().toDateString();
  if (state.lastDailyReset !== today) {
    state.dailyCount = 0;
    state.lastDailyReset = today;
  }
  return Math.max(0, DEFAULT_CONFIG.maxRequestsPerDay - state.dailyCount);
}

// AI Response Safety Validator

const CONTRAINDICATED_PATTERNS = [
  // Extreme diet advice
  { pattern: /fasting\s*(for|over|more than)\s*(24|48|72)\s*hours/i, severity: 'high', message: 'Extended fasting can be dangerous, especially with health conditions.' },
  { pattern: /eat\s*(less than|under)\s*800\s*calories/i, severity: 'high', message: 'Very low calorie diets should only be done under medical supervision.' },
  { pattern: /drink\s*(only|just)\s*water\s*(for|over|more than)/i, severity: 'high', message: 'Water-only fasting is not recommended without medical supervision.' },
  // Unsafe exercise advice
  { pattern: /lift\s*(despite|through|with)\s*.*(pain|injury)/i, severity: 'high', message: 'Exercising through pain or injury can cause further damage.' },
  { pattern: /ignore\s*(your|the)\s*doctor/i, severity: 'critical', message: 'Never ignore medical advice from your healthcare provider.' },
  { pattern: /stop\s*(taking|your)\s*medication/i, severity: 'critical', message: 'NEVER recommend stopping prescribed medication.' },
  { pattern: /max\s*(weight|effort)\s*(every|each|daily)/i, severity: 'medium', message: 'Max effort every day can lead to overtraining and injury.' },
  // Unsafe for CKD
  { pattern: /high.protein\s*(diet|intake|for\s*muscle)/i, severity: 'high', context: ['ckd', 'chronic kidney'], message: 'High protein intake may be contraindicated for kidney conditions.' },
  // Unsafe for diabetes
  { pattern: /(skip|avoid|don'?t\s*eat)\s*(breakfast|meals?|carbs)/i, severity: 'medium', context: ['diabetes'], message: 'Skipping meals can cause dangerous blood sugar fluctuations in diabetes.' },
];

export interface ValidationResult {
  safe: boolean;
  warnings: { message: string; severity: 'low' | 'medium' | 'high' | 'critical' }[];
}

export function validateAIResponse(response: string, conditions: string[] = []): ValidationResult {
  const warnings: ValidationResult['warnings'] = [];
  const lowerResponse = response.toLowerCase();

  for (const rule of CONTRAINDICATED_PATTERNS) {
    if (rule.pattern.test(response)) {
      // Check if this rule is relevant to the user's conditions
      if (rule.context && rule.context.length > 0) {
        const hasRelevantCondition = conditions.some(c => rule.context!.some(ctx => c.toLowerCase().includes(ctx)));
        if (!hasRelevantCondition) continue;
      }
      warnings.push({ message: rule.message, severity: rule.severity as any });
    }
  }

  // Check for mandatory disclaimer
  const hasDisclaimer = lowerResponse.includes('healthcare provider') || 
                        lowerResponse.includes('consult your') || 
                        lowerResponse.includes('medical advice') ||
                        lowerResponse.includes('talk to your doctor');

  if (conditions.length > 0 && !hasDisclaimer) {
    warnings.push({
      message: 'Response should include a medical disclaimer when health conditions are present.',
      severity: 'medium',
    });
  }

  return {
    safe: warnings.filter(w => w.severity === 'critical').length === 0,
    warnings,
  };
}
