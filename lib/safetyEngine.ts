import { SAFETY_RULES, SAFETY_THRESHOLDS, getRulesForConditions, type SafetyAction, type Severity } from '@/constants/safetyRules';

export interface SafetyWarning {
  ruleId: string;
  domain: string;
  message: string;
  severity: Severity;
  action: SafetyAction;
  userExplanation?: string;
  safeAlternative?: string;
}

export interface SafetyResult {
  /** 0.0 to 1.0 confidence score */
  confidence: number;
  /** Whether the response is safe to deliver */
  safe: boolean;
  warnings: SafetyWarning[];
  /** Recommended action based on confidence */
  action: 'deliver' | 'caveat' | 'fallback' | 'refuse';
  /** Suggested fallback message if confidence is too low */
  fallbackMessage?: string;
}

export interface ValidationInput {
  response: string;
  userConditions: string[];
  userAge?: number;
  userWeight?: number;
  userWeightUnit?: string;
  userCalorieIntake?: number;
  userBMR?: number;
  userMedications?: string[];
  recentAdvice?: string[];
  currentGoals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// ─── Domain boundary — questions Pulse AI should NOT answer ───
const OUT_OF_DOMAIN_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /(diagnos|what\s*is\s*wrong|why\s*(do|am)\s*i\s*(have|feeling))/i, suggestion: 'I cannot diagnose medical conditions. Please consult a healthcare provider.' },
  { pattern: /(prescribe|prescription|medication\s*dosage)/i, suggestion: 'Medication prescriptions and dosages must come from your licensed healthcare provider.' },
  { pattern: /(x.ray|mri|ct\s*scan|blood\s*test\s*results?\s*interpret)/i, suggestion: 'I cannot interpret diagnostic imaging or lab results. Please review them with your doctor.' },
  { pattern: /(suicide|kill\s*myself|self.harm)/i, suggestion: 'If you are having thoughts of self-harm, please contact a mental health crisis service immediately.' },
];

// ─── Input sanitization — detect prompt injection ───
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|below)\s+(instructions|prompts?|commands?)/i,
  /forget\s+(all\s+)?(previous|above|below)/i,
  /you\s+are\s+(now|not)\s+(a\s+)?(free|unbound|unrestricted|DAN|jailbroken)/i,
  /system\s*(prompt|message|instruction)\s*:?\s*override/i,
  /new\s*(instructions|prompt|role|directive)\s*:?/i,
  /output\s+(in\s+)?base64|base64\s*(decode|encode)/i,
  /DAN|do.anything.now|jailbreak|prompt.injection/i,
  /role.play|pretend\s+(to\s+)?be|act\s+as\s+if/i,
  /translate.*to.*ignore|ignore.*translat/i,
  /you\s+will\s+now\s+follow|you\s+must\s+now\s+obey/i,
  /override\s+(mode|protocol|constraints|safety|filter)/i,
  /morals\s*:?\s*off|ethics\s*:?\s*bypass|no\s+(rules|limits|boundaries|restrictions)/i,
  /respond\s+in\s+a\s+language\s+other|use\s+leet|coded\s+message/i,
  /hypothetical.*(no|without)\s*(restrictions|limits|rules)/i,
  /fiction(al)?\s*(character|scenario|setting).*ignore/i,
];

// ─── BMR estimation using Mifflin-St Jeor ───
function estimateBMR(weightKg: number, age: number, isMale: boolean): number {
  if (isMale) {
    return 10 * weightKg + 6.25 * 175 - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * 165 - 5 * age - 161;
}

/**
 * Step 1: Input sanitization — reject prompt injections
 */
function stepInputSanitization(input: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push({
        ruleId: 'injection_detected',
        domain: 'general',
        message: 'Potential prompt injection detected.',
        severity: 'critical',
        action: 'block',
        userExplanation: 'I detected what looks like an attempt to override my instructions. I cannot process this request.',
      });
    }
  }
  return warnings;
}

/**
 * Step 2: Domain boundary check
 */
function stepDomainBoundary(input: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  for (const entry of OUT_OF_DOMAIN_PATTERNS) {
    if (entry.pattern.test(input)) {
      warnings.push({
        ruleId: 'out_of_domain',
        domain: 'general',
        message: 'Query is outside Pulse AI\'s domain.',
        severity: 'high',
        action: 'block',
        userExplanation: entry.suggestion,
      });
    }
  }
  return warnings;
}

/**
 * Step 3: Medical contraindication check
 */
function stepMedicalContraindication(response: string, conditions: string[]): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const rules = getRulesForConditions(conditions);

  for (const rule of rules) {
    if (rule.pattern.test(response)) {
      warnings.push({
        ruleId: rule.id,
        domain: rule.domain,
        message: rule.message,
        severity: rule.severity,
        action: rule.action,
        userExplanation: rule.userExplanation,
        safeAlternative: rule.safeAlternative,
      });
    }
  }
  return warnings;
}

/**
 * Step 4: Plausibility check
 */
function stepPlausibility(response: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  // Unrealistic muscle gain
  if (/(gain|add|build)\s*(5|6|7|8|9|10)\s*(kg|kgs|pound|lbs)\s*(of\s*)?muscle\s*(per|in|a|each)\s*(week|month)/i.test(response)) {
    warnings.push({
      ruleId: 'unrealistic_muscle_gain',
      domain: 'general',
      message: 'Claimed muscle gain rate is not physiologically plausible.',
      severity: 'high',
      action: 'flag',
      userExplanation: 'Realistic muscle gain is 0.25-0.5 kg (0.5-1 lb) per week for beginners, less for advanced lifters.',
    });
  }

  // Unrealistic fat loss
  if (/(lose|burn|drop)\s*(5|6|7|8|9|10)\s*(kg|kgs|pound|lbs)\s*(of\s*)?(fat|weight)\s*(per|in|a|each)\s*week/i.test(response)) {
    warnings.push({
      ruleId: 'unrealistic_fat_loss',
      domain: 'general',
      message: 'Claimed fat loss rate is not physiologically plausible.',
      severity: 'high',
      action: 'flag',
      userExplanation: 'Safe, sustainable fat loss is 0.5-1 kg (1-2 lb) per week. Faster rates typically involve water or muscle loss.',
    });
  }

  return warnings;
}

/**
 * Step 5: Consistency check with recent advice
 */
function stepConsistency(response: string, recentAdvice: string[]): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  if (recentAdvice.length === 0) return warnings;

  const responseLower = response.toLowerCase();

  for (const advice of recentAdvice) {
    const adviceLower = advice.toLowerCase();
    const adviceNgrams = extractSignificantPhrases(adviceLower);
    const contradictingPhrases = findContradictions(responseLower, adviceNgrams);
    if (contradictingPhrases.length > 0) {
      warnings.push({
        ruleId: 'contradictory_advice',
        domain: 'general',
        message: `This recommendation may contradict recent advice given to this user.`,
        severity: 'medium',
        action: 'flag',
        userExplanation: `This seems to differ from previous advice. Let me clarify: ${contradictingPhrases.join(', ')}`,
      });
      break;
    }
  }

  return warnings;
}

/**
 * Step 6: Extremism check
 */
function stepExtremismCheck(response: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  const extremePatterns = [
    { pattern: /eat\s*(less\s*than|under|below)\s*1000\s*calories\s*(per|a|each|every)\s*day/i, severity: 'critical' as Severity, message: 'Diets under 1000 calories require medical supervision.' },
    { pattern: /train\s*(every\s*day|7\s*days?\s*(a|per)\s*week)\s*(no\s*rest|without\s*rest)/i, severity: 'high' as Severity, message: 'Training daily without rest leads to overtraining and injury.' },
    { pattern: /(10|15|20)\s*(\+)?\s*(hours?|sets?)\s*(per|a|each|every)\s*(session|day|workout)\s*(for|of)\s*(the\s*)?(same\s*)?muscle/i, severity: 'medium' as Severity, message: 'Extreme volume per session is counterproductive.' },
  ];

  for (const ep of extremePatterns) {
    if (ep.pattern.test(response)) {
      warnings.push({
        ruleId: 'extreme_behaviour',
        domain: 'general',
        message: ep.message,
        severity: ep.severity,
        action: 'flag',
      });
    }
  }

  return warnings;
}

/**
 * Step 7: Confidence scoring
 */
function stepConfidenceScore(warnings: SafetyWarning[], input: ValidationInput): number {
  let score = 1.0;

  for (const w of warnings) {
    switch (w.severity) {
      case 'critical': score -= 0.5; break;
      case 'high': score -= 0.3; break;
      case 'medium': score -= 0.15; break;
      case 'low': score -= 0.05; break;
    }
    // Blocking actions reduce confidence more
    if (w.action === 'block') score -= 0.2;
  }

  // Additional checks for very low scores
  if (input.userCalorieIntake && input.userBMR) {
    if (input.userCalorieIntake < input.userBMR * 0.8) {
      score -= 0.1;
    }
  }

  return Math.max(0, Math.min(1, score));
}

function getActionFromConfidence(score: number): SafetyResult['action'] {
  if (score >= 0.9) return 'deliver';
  if (score >= 0.7) return 'caveat';
  if (score >= 0.5) return 'fallback';
  return 'refuse';
}

function buildFallbackMessage(warnings: SafetyWarning[], conditions: string[]): string {
  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const highWarnings = warnings.filter(w => w.severity === 'high');

  if (criticalWarnings.length > 0) {
    return `I'm unable to provide a response to this request. ${criticalWarnings[0].userExplanation || 'This falls outside what I can safely advise on.'}`;
  }

  if (highWarnings.length > 0) {
    const suggestion = highWarnings[0].safeAlternative
      ? `\n\nA safer approach: ${highWarnings[0].safeAlternative}`
      : '';
    return `${highWarnings[0].userExplanation || highWarnings[0].message}${suggestion}\n\nBecause of ${conditions.length > 0 ? 'your health history' : 'safety considerations'}, I recommend discussing this with your healthcare provider before making changes.`;
  }

  return 'I want to make sure I give you the most accurate guidance. Please consult your healthcare provider for personalized advice on this topic.';
}

function extractSignificantPhrases(text: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 3);
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  return phrases;
}

function findContradictions(response: string, pastPhrases: string[]): string[] {
  const contradictions: string[] = [];
  const negationPatterns = /(don'?t|do\s*not|avoid|skip|stop|reduce|decrease|never|shouldn'?t)/i;

  for (const phrase of pastPhrases) {
    if (negationPatterns.test(phrase) && response.includes(phrase)) {
      contradictions.push(phrase);
    }
  }
  return contradictions;
}

/**
 * Main safety validation pipeline.
 * Runs all 7 steps and returns a consolidated SafetyResult.
 */
export function validateResponse(input: ValidationInput): SafetyResult {
  const allWarnings: SafetyWarning[] = [];

  // Step 1: Input sanitization
  allWarnings.push(...stepInputSanitization(input.response));

  // Step 2: Domain boundary
  allWarnings.push(...stepDomainBoundary(input.response));

  // Step 3: Medical contraindication check
  allWarnings.push(...stepMedicalContraindication(input.response, input.userConditions));

  // Step 4: Plausibility check
  allWarnings.push(...stepPlausibility(input.response));

  // Step 5: Consistency check
  allWarnings.push(...stepConsistency(input.response, input.recentAdvice || []));

  // Step 6: Extremism check
  allWarnings.push(...stepExtremismCheck(input.response));

  // Step 7: Confidence scoring
  const confidence = stepConfidenceScore(allWarnings, input);
  const action = getActionFromConfidence(confidence);
  const hasCriticalOrHigh = allWarnings.some(w => w.severity === 'critical' || (w.severity === 'high' && w.action === 'block'));

  return {
    confidence,
    safe: !hasCriticalOrHigh,
    warnings: allWarnings,
    action,
    fallbackMessage: action === 'fallback' || action === 'refuse'
      ? buildFallbackMessage(allWarnings, input.userConditions)
      : undefined,
  };
}

/**
 * Quick check: is this query in Pulse AI's domain?
 */
export function isInDomain(query: string): boolean {
  for (const entry of OUT_OF_DOMAIN_PATTERNS) {
    if (entry.pattern.test(query)) return false;
  }
  return true;
}

/**
 * Check if a calorie recommendation is safe for the user.
 */
export function checkCalorieSafety(calories: number, weightKg: number, age: number, conditions: string[]): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const bmr = estimateBMR(weightKg, age, true);

  if (calories < bmr * 0.85) {
    warnings.push({
      ruleId: 'calorie_below_bmr',
      domain: 'nutrition',
      message: `Recommended ${calories} kcal is below estimated BMR (${Math.round(bmr)} kcal).`,
      severity: 'high',
      action: 'flag',
      userExplanation: `A calorie intake of ${calories} is below your body's basic energy needs. Prolonged intake this low can cause metabolic slowdown, muscle loss, and nutritional deficiencies. I recommend a minimum of ${Math.round(bmr)} kcal.`,
      safeAlternative: `Increase calories to at least ${Math.round(bmr)} kcal or discuss a medically supervised very-low-calorie approach with your doctor.`,
    });
  }

  if (conditions.some(c => c.toLowerCase().includes('ckd'))) {
    const weight = weightKg || 70;
    const proteinPerKg = 1.6 / weight * 1000;
    // This is a simplified check — the full logic needs macro breakdown
  }

  return warnings;
}
