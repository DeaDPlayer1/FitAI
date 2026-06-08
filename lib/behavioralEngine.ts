export type BehaviorStage = 'precontemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
export type BehaviorGoal = 'exercise' | 'nutrition' | 'sleep' | 'stress' | 'general';

export interface FoggAssessment {
  motivation: number;
  ability: number;
  prompt: number;
  behaviorScore: number;
  bottleneck: 'motivation' | 'ability' | 'prompt' | 'none';
}

export interface BehaviorProfile {
  stage: BehaviorStage;
  confidence: number;
  stageDuration: number;
  relapseRisk: number;
  recentAdherence: number;
}

export interface BehavioralIntervention {
  technique: string;
  framework: 'fogg' | 'sdt' | 'com-b' | 'transtheoretical';
  description: string;
  suggestedPrompt: string;
  priority: number;
}

export interface SdtProfile {
  autonomy: number;
  competence: number;
  relatedness: number;
  dominantNeed: 'autonomy' | 'competence' | 'relatedness';
}

export interface ComBAssessment {
  capability: number;
  opportunity: number;
  motivation: number;
  barrier: 'capability' | 'opportunity' | 'motivation' | 'none';
}

export function assessFoggModel(
  selfReportedMotivation: number,
  taskDifficulty: number,
  externalPrompt: number,
): FoggAssessment {
  const motivation = Math.max(0, Math.min(10, selfReportedMotivation));
  const ability = Math.max(0, Math.min(10, 10 - taskDifficulty));
  const prompt = Math.max(0, Math.min(10, externalPrompt));

  const behaviorScore = (motivation / 10) * (ability / 10) * (prompt / 10);

  const scores = [
    { label: 'motivation' as const, value: motivation },
    { label: 'ability' as const, value: ability },
    { label: 'prompt' as const, value: prompt },
  ];
  const minScore = scores.reduce((min, s) => s.value < min.value ? s : min, scores[0]);
  const bottleneck = minScore.value < 5 ? minScore.label : 'none';

  return { motivation, ability, prompt, behaviorScore, bottleneck };
}

export function assessSDT(answers: { autonomy: number; competence: number; relatedness: number }): SdtProfile {
  const needs = [
    { key: 'autonomy' as const, value: Math.max(0, Math.min(10, answers.autonomy)) },
    { key: 'competence' as const, value: Math.max(0, Math.min(10, answers.competence)) },
    { key: 'relatedness' as const, value: Math.max(0, Math.min(10, answers.relatedness)) },
  ];
  const dominant = needs.reduce((min, n) => n.value < min.value ? n : min, needs[0]);

  return {
    autonomy: needs[0].value,
    competence: needs[1].value,
    relatedness: needs[2].value,
    dominantNeed: dominant.key,
  };
}

export function assessComB(capability: number, opportunity: number, motivation: number): ComBAssessment {
  const scores = [
    { key: 'capability' as const, value: Math.max(0, Math.min(10, capability)) },
    { key: 'opportunity' as const, value: Math.max(0, Math.min(10, opportunity)) },
    { key: 'motivation' as const, value: Math.max(0, Math.min(10, motivation)) },
  ];
  const barrier = scores.reduce((min, s) => s.value < min.value ? s : min, scores[0]);

  return {
    capability: scores[0].value,
    opportunity: scores[1].value,
    motivation: scores[2].value,
    barrier: barrier.value < 5 ? barrier.key : 'none',
  };
}

export function determineStage(
  adherenceRate: number,
  activeWeeks: number,
  selfReportedCommitment: number,
): BehaviorStage {
  if (activeWeeks < 1) return 'precontemplation';
  if (activeWeeks < 2) return 'contemplation';
  if (activeWeeks < 4 || selfReportedCommitment < 5) return 'preparation';
  if (activeWeeks < 24) return 'action';
  return 'maintenance';
}

export function calculateRelapseRisk(
  adherenceRate: number,
  recentMissedSessions: number,
  lifeStress: number,
  confidence: number,
): number {
  let risk = 0;

  if (adherenceRate < 0.3) risk += 0.3;
  else if (adherenceRate < 0.5) risk += 0.2;
  else if (adherenceRate < 0.7) risk += 0.1;

  risk += Math.min(0.3, recentMissedSessions * 0.05);
  risk += Math.min(0.2, lifeStress * 0.02);

  if (confidence < 4) risk += 0.2;
  else if (confidence < 6) risk += 0.1;

  return Math.min(1, risk);
}

export function generateFoggIntervention(fogg: FoggAssessment, goal: BehaviorGoal): BehavioralIntervention {
  switch (fogg.bottleneck) {
    case 'ability':
      return {
        technique: 'Tiny Habits — make it absurdly easy',
        framework: 'fogg',
        description: 'Reduce the behavior to 30 seconds or less. Remove friction points.',
        suggestedPrompt: 'Start with just 1 set of 1 exercise. Do it right after your morning coffee.',
        priority: 1,
      };
    case 'motivation':
      return {
        technique: 'Motivation Wave Riding',
        framework: 'fogg',
        description: 'Link the behavior to a powerful emotion or identity. Use celebration after completion.',
        suggestedPrompt: 'Think about how you feel after a workout — the energy, the accomplishment. Do it for that feeling.',
        priority: 2,
      };
    case 'prompt':
      return {
        technique: 'Implementation Intention + Habit Stacking',
        framework: 'fogg',
        description: 'Create an explicit when/then plan. Stack on an existing habit.',
        suggestedPrompt: 'When I finish brushing my teeth in the morning, I will do 5 push-ups.',
        priority: 3,
      };
    default:
      return {
        technique: 'Celebration + Reinforcement',
        framework: 'fogg',
        description: 'Fireworks celebration after each completion to wire the habit.',
        suggestedPrompt: 'After you complete the behavior, do a fist pump and say "Yes!" — wire in the feeling of success.',
        priority: 4,
      };
  }
}

export function generateSDTIntervention(sdt: SdtProfile): BehavioralIntervention {
  const interventions: Record<string, BehavioralIntervention> = {
    autonomy: {
      technique: 'Autonomy Support — offer choices',
      framework: 'sdt',
      description: 'Provide 2-3 options and explain the "why" behind each.',
      suggestedPrompt: 'You can do this workout today OR swap it for a walk. The important thing is you choose what feels right.',
      priority: 1,
    },
    competence: {
      technique: 'Competence Building — scaffolded progression',
      framework: 'sdt',
      description: 'Set achievable micro-goals. Give clear, immediate feedback.',
      suggestedPrompt: 'Last week you did 3 sets of 8. Let\'s aim for 3 sets of 9 this week — that\'s just 1 more rep per set.',
      priority: 2,
    },
    relatedness: {
      technique: 'Relatedness — social connection + accountability',
      framework: 'sdt',
      description: 'Connect to a community or partner. Use shared goals.',
      suggestedPrompt: 'I\'m here with you on this journey. Let\'s check in after your workout — I want to hear how it went.',
      priority: 3,
    },
  };

  return interventions[sdt.dominantNeed] || interventions.autonomy;
}

export function generateComBIntervention(comb: ComBAssessment): BehavioralIntervention {
  const interventions: Record<string, BehavioralIntervention> = {
    capability: {
      technique: 'Skill Building — knowledge + practice',
      framework: 'com-b',
      description: 'Provide education, demonstrations, and guided practice.',
      suggestedPrompt: 'Let me walk you through proper form first. Watch this 2-minute video on the squat pattern.',
      priority: 1,
    },
    opportunity: {
      technique: 'Environment Redesign — make it easy',
      framework: 'com-b',
      description: 'Change the physical and social environment to support the behavior.',
      suggestedPrompt: 'Lay your workout clothes out tonight. Put your gym bag by the door.',
      priority: 2,
    },
    motivation: {
      technique: 'Motivational Interviewing — explore values',
      framework: 'com-b',
      description: 'Connect behavior to deeply held values and identity.',
      suggestedPrompt: 'Why does this matter to you? Not what you "should" do, but what truly matters?',
      priority: 3,
    },
  };

  return interventions[comb.barrier] || interventions.motivation;
}

export function generateRelapsePreventionPlan(risk: number, stage: BehaviorStage): BehavioralIntervention[] {
  const plan: BehavioralIntervention[] = [];

  if (risk > 0.7) {
    plan.push({
      technique: 'Emergency Protocol — lowest bar possible',
      framework: 'transtheoretical',
      description: 'When risk is very high, the only goal is to maintain ANY engagement.',
      suggestedPrompt: 'Today\'s goal: just put on your workout clothes. That\'s it. If you do nothing else, you win.',
      priority: 1,
    });
  }

  if (risk > 0.4) {
    plan.push({
      technique: 'If-Then Planning for High-Risk Situations',
      framework: 'transtheoretical',
      description: 'Pre-plan responses to specific triggers (travel, stress, holidays).',
      suggestedPrompt: 'If I feel too tired after work, then I will do a 10-minute walk before sitting down.',
      priority: 2,
    });
  }

  plan.push({
    technique: 'The 5-Minute Rule',
    framework: 'transtheoretical',
    description: 'Commit to just 5 minutes. Starting is the hardest part.',
    suggestedPrompt: 'Just 5 minutes. If you want to stop after 5, you can. Most likely you\'ll keep going.',
    priority: 3,
  });

  return plan;
}

export function buildBehaviorProfile(
  adherenceRate: number,
  activeWeeks: number,
  commitment: number,
  missedSessions: number,
  stress: number,
  confidence: number,
): BehaviorProfile {
  const stage = determineStage(adherenceRate, activeWeeks, commitment);
  const relapseRisk = calculateRelapseRisk(adherenceRate, missedSessions, stress, confidence);

  return {
    stage,
    confidence,
    stageDuration: activeWeeks,
    relapseRisk,
    recentAdherence: adherenceRate,
  };
}
