export type UserMessageType =
  | 'workout_complete' | 'felt_weak' | 'skipped_session' | 'exercise_swap'
  | 'sore' | 'ate_badly' | 'nutrition_advice' | 'should_i_train'
  | 'new_pr' | 'general_question' | 'goal_change';

export interface ClassifiedMessage {
  type: UserMessageType;
  confidence: number;
  detected_metrics?: {
    exercise?: string;
    weight?: number;
    reps?: number;
    body_part?: string;
  };
}

const PATTERNS: { type: UserMessageType; patterns: RegExp[] }[] = [
  {
    type: 'workout_complete',
    patterns: [
      /(completed|finished|done|did)\s.*(workout|session|training|gym)/i,
      /just\s.*(finished|done|completed)/i,
      /workout.*(done|complete|finished)/i,
    ],
  },
  {
    type: 'felt_weak',
    patterns: [
      /felt\s(weak|tired|fatigued|low\senergy)/i,
      /(weak|low\senergy|no\senergy)\s(today|this\smorning)/i,
      /struggled?\s.*(workout|lift|session)/i,
    ],
  },
  {
    type: 'skipped_session',
    patterns: [
      /(skipped|missed|couldn't|didn't)\s.*(workout|session|gym|training)/i,
      /(skip|miss|can't)\s.*(today|workout)/i,
    ],
  },
  {
    type: 'exercise_swap',
    patterns: [
      /(swap|replace|change|substitute)\s.*(exercise|movement|drill)/i,
      /(don't|dont|doesn't)\s.*(like|enjoy)\s.*(exercise|movement)/i,
      /(can|could|want)\s.*(swap|change|replace)/i,
      /(alternative|variation|different)\s.*(exercise|movement)/i,
    ],
  },
  {
    type: 'sore',
    patterns: [
      /(sore|tight|stiff)\s.*(muscle|body|leg|arm|back|chest)/i,
      /(muscle|body)\s.*(sore|ache)/i,
      /really\s(sore|tight)/i,
      /can't\s(move|walk|lift)\s.*(sore)/i,
    ],
  },
  {
    type: 'ate_badly',
    patterns: [
      /(ate|eating|diet|food).*(bad|badly|unhealthy|junk|cheat)/i,
      /(cheated|cheat\sday|binge|overate)/i,
      /(went|fallen)\s.*(off\strack|offtrack)/i,
      /(bad|unhealthy)\s.*(meal|food|eat)/i,
    ],
  },
  {
    type: 'nutrition_advice',
    patterns: [
      /(what|how|when)\s.*(eat|meal|food|nutrition|diet|protein|carbs?)/i,
      /(meal|food|nutrition)\s.*(idea|plan|suggestion|recommendation)/i,
      /what\s.*(breakfast|lunch|dinner|snack|pre.?workout|post.?workout)/i,
      /(recipe|what\sto\seat|what\sshould\si\seat)/i,
    ],
  },
  {
    type: 'should_i_train',
    patterns: [
      /should\s(i|we)\s(today|workout|train|go\sto\sthe\sgym)/i,
      /(is\sit|should\si)\s.*(rest|skip|take\soff)/i,
      /(tired|fatigued)\s.*(train|workout|gym)/i,
    ],
  },
  {
    type: 'new_pr',
    patterns: [
      /(pr|personal\srecord|pb|personal\sbest)/i,
      /new\s.*(record|best|max)/i,
      /(hit|got|achieved)\s.*(pr|pb|record)/i,
      /(lifted|pressed|squatted|deadlifted)\s.*(more|heavier|new)/i,
    ],
  },
  {
    type: 'goal_change',
    patterns: [
      /(switch|change|new)\s.*(goal|objective|focus)/i,
      /(want|like|thinking)\s.*(to\sbulk|to\scut|to\srecomp)/i,
      /(start\sover|reset|restart)/i,
      /(different|new)\s.*(plan|program|routine)/i,
    ],
  },
];

export function classifyMessage(text: string): ClassifiedMessage {
  const lower = text.toLowerCase();

  for (const { type, patterns } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        const detected_metrics: ClassifiedMessage['detected_metrics'] = {};

        if (type === 'exercise_swap') {
          const exMatch = text.match(/(?:swap|replace|change)\s+(?:the\s+)?(\w+\s?\w*)/i);
          if (exMatch) detected_metrics.exercise = exMatch[1];
        }

        if (type === 'new_pr') {
          const liftMatch = text.match(/(bench|squat|deadlift|press|curl|row)/i);
          if (liftMatch) detected_metrics.exercise = liftMatch[1];
          const weightMatch = text.match(/(\d+[\.\d]*)\s*(kg|lbs?)/i);
          if (weightMatch) detected_metrics.weight = parseFloat(weightMatch[1]);
        }

        return { type, confidence: 0.9, detected_metrics };
      }
    }
  }

  return { type: 'general_question', confidence: 0.4 };
}

export function getPhase3ResponseTemplate(type: UserMessageType): string {
  switch (type) {
    case 'workout_complete':
      return `Great work! Let me log that. Quick question — how did the weight/reps feel?
a) Easier than expected
b) About right
c) Struggled a bit
d) Had to drop weight`;

    case 'felt_weak':
      return `Happens to everyone. Let's figure out why — how was your sleep last night, and when did you last eat before training?`;

    case 'skipped_session':
      return `No worries at all — life happens. Want to try rescheduling it for [suggested day], or should we just move forward and keep the rhythm going?`;

    case 'exercise_swap':
      return `Sure, I can swap that out. Which exercise were you thinking of changing, and what's the reason — injury, equipment, or just not feeling it?`;

    case 'sore':
      return `Soreness is normal — it means you stimulated the muscle. If it's joint pain or sharp, let me know. If it's muscle soreness, light movement and hydration will help.`;

    case 'ate_badly':
      return `One meal doesn't define your progress. The key is how you respond — get back on track with your next meal. What's your next meal plan?`;

    case 'nutrition_advice':
      return `Based on your plan, you want to hit roughly Xg protein and Yg carbs per meal. Here are a couple practical ideas: [suggest based on diet type]`;

    case 'should_i_train':
      return `Quick check: how's your energy on a scale of 1–10, did you sleep at least 6 hours, and is the soreness muscular or joint-related? That'll help me give you the right call.`;

    case 'new_pr':
      return `🔥 That's amazing! A new PR means your programming is working. I've noted this for next week's progression — we'll build on this momentum.`;

    case 'goal_change':
      return `Got it — shifting gears. Let me check a couple things before I build a new plan. What's the main reason for the change?`;

    default:
      return '';
  }
}
