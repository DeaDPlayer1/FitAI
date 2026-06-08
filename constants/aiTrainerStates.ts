export type AiTrainerPhase =
  | 'idle'
  | 'consultation'
  | 'plan_generated'
  | 'plan_active'
  | 'weekly_review'
  | 'plan_updated'
  | 'paused';

export const AI_TRAINER_PHASE_LABELS: Record<AiTrainerPhase, string> = {
  idle: 'Not started',
  consultation: 'Getting to know you',
  plan_generated: 'Plan ready for review',
  plan_active: 'Active coaching',
  weekly_review: 'Weekly review in progress',
  plan_updated: 'Updated plan ready',
  paused: 'AI Trainer paused',
};

export const AI_TRAINER_PHASE_ICONS: Record<AiTrainerPhase, string> = {
  idle: 'circle',
  consultation: 'message-circle',
  plan_generated: 'file-text',
  plan_active: 'play-circle',
  weekly_review: 'bar-chart-2',
  plan_updated: 'refresh-cw',
  paused: 'pause-circle',
};

export const DEFAULT_CALORIE_FLOOR = {
  male: 1600,
  female: 1400,
  other: 1500,
};

export const MIN_PROTEIN_CKD = 0.55;
export const MAX_PROTEIN_CKD = 0.8;
export const MAX_SODIUM_CKD = 2000;
export const MAX_SODIUM_LUPUS = 2300;

export const TARGET_WEIGHT_LOSS_RATE = { min: 0.005, max: 0.01 };
export const MAX_WEEKS_IN_DEFICIT = 6;
export const CALORIE_DROP_STEP = 100;
export const CALORIE_DROP_MAX = 150;

export const SESSION_RPE_MIN = 1;
export const SESSION_RPE_MAX = 10;
export const WELLNESS_MIN = 1;
export const WELLNESS_MAX = 10;
