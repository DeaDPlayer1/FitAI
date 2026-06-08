import type { Insight } from './insightEngine';

export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low' | 'informational';
export type RecommendationCategory = 'workout' | 'nutrition' | 'recovery' | 'behavior' | 'health' | 'general';

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: ActionPriority;
  score: number;
  title: string;
  body: string;
  reasoning: string;
  expectedImpact: string;
  effortLevel: 'easy' | 'moderate' | 'hard';
  timeToBenefit: 'immediate' | 'days' | 'weeks' | 'months';
  prerequisites: string[];
}

export interface RecommendationRequest {
  insights: Insight[];
  recoveryScore: number;
  adherenceRate: number;
  behaviorStage: string;
  relapseRisk: number;
  missedSessions: number;
  stressLevel: number;
  userId?: string;
}

let recCounter = 0;

function makeId(): string {
  return `rec_${++recCounter}_${Date.now()}`;
}

const NEGATIVE_INSIGHT_CATEGORIES: Set<string> = new Set(['warning', 'critical']);

export function calculatePriorityScore(rec: Omit<Recommendation, 'id' | 'score' | 'reasoning'>): number {
  let score = 50;

  const urgencyMap: Record<ActionPriority, number> = {
    urgent: 100, high: 75, medium: 50, low: 25, informational: 10,
  };
  score += urgencyMap[rec.priority] - 50;

  const effortMap = { easy: 20, moderate: 0, hard: -20 };
  score += effortMap[rec.effortLevel];

  const timeMap = { immediate: 15, days: 10, weeks: 0, months: -10 };
  score += timeMap[rec.timeToBenefit];

  return Math.max(0, Math.min(100, score));
}

function generateReasoning(insight: Insight, category: RecommendationCategory): string {
  if (insight.severity === 'critical') {
    return `Critical issue detected: "${insight.title}". Immediate action required based on ${insight.confidence * 100}% confidence analysis.`;
  }
  if (insight.severity === 'warning') {
    return `Warning signal identified: "${insight.title}". Early intervention recommended to prevent further decline.`;
  }
  return `Opportunity ${insight.trend === 'up' ? 'to build on positive momentum' : 'for improvement'} in ${category}.`;
}

export function prioritizeRecommendations(request: RecommendationRequest): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const insight of request.insights) {
    if (!insight.actionable) continue;

    const isNegative = NEGATIVE_INSIGHT_CATEGORIES.has(insight.severity);
    const category = insight.category as RecommendationCategory;

    const urgency: ActionPriority = insight.severity === 'critical' ? 'urgent' :
      insight.severity === 'warning' ? 'high' :
      insight.severity === 'neutral' ? 'medium' : 'low';

    const rec: Omit<Recommendation, 'id' | 'score' | 'reasoning'> = {
      category,
      priority: urgency,
      title: insight.suggestedAction
        ? `[${isNegative ? 'Resolve' : 'Optimize'}] ${insight.title}`
        : insight.title,
      body: insight.body,
      expectedImpact: isNegative ? 'Prevents further decline' : 'Builds on current progress',
      effortLevel: urgency === 'urgent' ? 'hard' : urgency === 'high' ? 'moderate' : 'easy',
      timeToBenefit: urgency === 'urgent' ? 'immediate' : urgency === 'high' ? 'days' : 'weeks',
      prerequisites: [],
    };

    const score = calculatePriorityScore(rec);
    const reasoning = generateReasoning(insight, category);

    recommendations.push({ id: makeId(), ...rec, score, reasoning });
  }

  if (request.relapseRisk > 0.6 && request.behaviorStage === 'action') {
    recommendations.push({
      id: makeId(),
      category: 'behavior',
      priority: 'high',
      score: 80,
      title: 'Prevent Relapse — Rebuild Routines',
      body: `Relapse risk is ${Math.round(request.relapseRisk * 100)}%. Focus on the minimum viable habit — 5 minutes or 1 set.`,
      reasoning: `Behavioral analysis shows elevated relapse risk (${Math.round(request.relapseRisk * 100)}%) during the action stage. Early intervention significantly improves long-term adherence.`,
      expectedImpact: 'Prevents workout cessation and maintains habit continuity',
      effortLevel: 'easy',
      timeToBenefit: 'immediate',
      prerequisites: [],
    });
  }

  if (request.recoveryScore < 40) {
    recommendations.push({
      id: makeId(),
      category: 'recovery',
      priority: 'urgent',
      score: 95,
      title: 'Rest and Recovery - Immediate Action',
      body: `Recovery score is ${request.recoveryScore}/100. Take a full rest day today. Focus on sleep, hydration, and stress reduction.`,
      reasoning: `Recovery score of ${request.recoveryScore} indicates insufficient recovery. Training in this state increases injury risk and reduces performance.`,
      expectedImpact: 'Prevents overtraining, restores readiness',
      effortLevel: 'easy',
      timeToBenefit: 'immediate',
      prerequisites: [],
    });
  }

  if (request.missedSessions >= 2) {
    recommendations.push({
      id: makeId(),
      category: 'behavior',
      priority: 'medium',
      score: 65,
      title: 'Re-Engage After Missed Sessions',
      body: `You've missed ${request.missedSessions} recent sessions. Don't try to catch up — just resume your next planned session.`,
      reasoning: `Missing sessions can trigger all-or-nothing thinking. Best practice is to simply resume the next scheduled session, not compensate.`,
      expectedImpact: 'Prevents complete cessation, maintains habit',
      effortLevel: 'easy',
      timeToBenefit: 'immediate',
      prerequisites: [],
    });
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, 5);
}

export function explainRecommendation(rec: Recommendation): string {
  const urgencyLabels: Record<ActionPriority, string> = {
    urgent: '🔴 Needs immediate attention',
    high: '🟡 Important — address soon',
    medium: '🔵 Consider when convenient',
    low: '🟢 Low priority',
    informational: '⚪ For awareness',
  };

  return `${urgencyLabels[rec.priority]}
**${rec.title}** — impact: ${rec.expectedImpact}

${rec.body}

**Why this matters:** ${rec.reasoning}
**Effort:** ${rec.effortLevel} | **Time to benefit:** ${rec.timeToBenefit}`;
}
