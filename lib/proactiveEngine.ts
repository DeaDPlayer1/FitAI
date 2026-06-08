export type AlertPriority = 'notification' | 'suggestion' | 'insight' | 'milestone';
export type AlertCategory = 'recovery' | 'adherence' | 'milestone' | 'streak' | 'checkin' | 'insight';

export interface Alert {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  body: string;
  triggerReason: string;
  actionable: boolean;
  suggestedResponse?: string;
  timestamp: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakType: 'workout' | 'nutrition' | 'checkin';
  status: 'on_track' | 'at_risk' | 'broken';
  daysSinceLastAction: number;
}

export interface Milestone {
  id: string;
  category: string;
  name: string;
  achieved: boolean;
  achievedDate?: string;
  progress: number;
  total: number;
}

export interface ProactiveCheckin {
  question: string;
  context: string;
  type: 'quick' | 'detailed' | 'reflective';
}

let alertCounter = 0;

function makeId(): string {
  return `alert_${++alertCounter}_${Date.now()}`;
}

export function assessStreak(streakInfo: StreakInfo): Alert | null {
  if (streakInfo.status === 'broken') {
    const dayWord = streakInfo.daysSinceLastAction === 1 ? '1 day' : `${streakInfo.daysSinceLastAction} days`;
    return {
      id: makeId(),
      category: 'streak',
      priority: 'notification',
      title: 'Streak Broken — Get Back On Track',
      body: `Your ${streakInfo.streakType} streak of ${streakInfo.currentStreak} ${streakInfo.currentStreak === 1 ? 'day' : 'days'} was broken. It's been ${dayWord} since your last action.`,
      triggerReason: `Streak broken after ${streakInfo.currentStreak} days; ${streakInfo.daysSinceLastAction} days since last activity.`,
      actionable: true,
      suggestedResponse: `The best time to restart is now. Don't try to make up for lost time — just do 1 ${streakInfo.streakType === 'workout' ? 'set' : 'meal'} today.`,
      timestamp: new Date().toISOString(),
    };
  }

  if (streakInfo.status === 'at_risk' && streakInfo.daysSinceLastAction >= 1) {
    return {
      id: makeId(),
      category: 'streak',
      priority: 'notification',
      title: 'Streak At Risk — Act Now',
      body: `You're ${streakInfo.daysSinceLastAction} day(s) away from breaking your ${streakInfo.streakType} streak of ${streakInfo.currentStreak}. One more day keeps it alive.`,
      triggerReason: `Streak at risk: ${streakInfo.daysSinceLastAction} days since last action, current streak ${streakInfo.currentStreak}.`,
      actionable: true,
      suggestedResponse: 'Just 1 set. Just 1 meal logged. The minimum viable action is all you need right now.',
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

export function milestoneRecognition(milestones: Milestone[]): Alert[] {
  const alerts: Alert[] = [];

  for (const m of milestones) {
    if (m.achieved && m.achievedDate) {
      alerts.push({
        id: makeId(),
        category: 'milestone',
        priority: 'milestone',
        title: `Milestone Unlocked: ${m.name}`,
        body: `Congratulations! You've achieved "${m.name}". This is a significant step in your fitness journey.`,
        triggerReason: `Milestone "${m.name}" completed on ${m.achievedDate}.`,
        actionable: false,
        timestamp: new Date().toISOString(),
      });
    } else if (m.progress / m.total >= 0.75 && m.progress < m.total) {
      alerts.push({
        id: makeId(),
        category: 'milestone',
        priority: 'insight',
        title: `Almost There: ${m.name}`,
        body: `You're ${Math.round(m.progress / m.total * 100)}% of the way to "${m.name}". Keep going!`,
        triggerReason: `Milestone "${m.name}" at ${Math.round(m.progress / m.total * 100)}% completion.`,
        actionable: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

export function recoveryAlert(recoveryScore: number): Alert | null {
  if (recoveryScore < 20) {
    return {
      id: makeId(),
      category: 'recovery',
      priority: 'notification',
      title: 'Critical Recovery — Rest Today',
      body: `Your recovery score is ${recoveryScore}/100. This is critical. Take a complete rest day. No training. Your body needs this.`,
      triggerReason: `Recovery score ${recoveryScore} — critical threshold.`,
      actionable: true,
      suggestedResponse: 'Hydrate well. Aim for 8+ hours of sleep. Gentle stretching if you feel up to it. Today is a recovery day.',
      timestamp: new Date().toISOString(),
    };
  }

  if (recoveryScore < 40) {
    return {
      id: makeId(),
      category: 'recovery',
      priority: 'suggestion',
      title: 'Low Recovery — Light Day Recommended',
      body: `Recovery score is ${recoveryScore}/100. Consider active recovery: walking, light stretching, mobility work.`,
      triggerReason: `Recovery score ${recoveryScore} — below 40 threshold.`,
      actionable: true,
      suggestedResponse: 'Go for a 20-30 minute walk. Do 10 minutes of mobility work. Skip the heavy training today.',
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

export function adherenceAlert(missedSessions: number, adherenceRate: number): Alert | null {
  if (missedSessions >= 3 && adherenceRate < 0.3) {
    return {
      id: makeId(),
      category: 'adherence',
      priority: 'notification',
      title: 'Multiple Missed Sessions — Let\'s Reset',
      body: `You've missed ${missedSessions} recent sessions (adherence: ${Math.round(adherenceRate * 100)}%). This is a critical point — the best time to restart is now.`,
      triggerReason: `${missedSessions} missed sessions, ${Math.round(adherenceRate * 100)}% adherence rate.`,
      actionable: true,
      suggestedResponse: 'Tomorrow: 1 exercise. 2 sets. That\'s it. No more, no less. Let\'s just get moving again.',
      timestamp: new Date().toISOString(),
    };
  }

  if (missedSessions >= 2) {
    return {
      id: makeId(),
      category: 'adherence',
      priority: 'suggestion',
      title: 'Missed 2 Sessions — Nip It Now',
      body: `You've missed ${missedSessions} sessions in a row. Research shows 2 missed sessions is the inflection point. Act now.`,
      triggerReason: `${missedSessions} consecutive missed sessions — inflection point detected.`,
      actionable: true,
      suggestedResponse: 'The 5-minute rule: commit to just 5 minutes of movement. Remove friction entirely.',
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

export function generateDailyCheckin(context: {
  recoveryScore?: number;
  lastWorkoutDays?: number;
  streakDays?: number;
  nutritionLoggedYesterday?: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  stressLevel?: number;
  recentSessionIntensity?: number;
}): ProactiveCheckin {
  if (context.timeOfDay === 'morning') {
    if (context.recoveryScore != null && context.recoveryScore < 40) {
      return {
        question: 'How are you feeling this morning?',
        context: `Your recovery score was ${context.recoveryScore} yesterday. How's your body feeling today?`,
        type: 'quick',
      };
    }
    return {
      question: "What's one thing you want to accomplish today?",
      context: `Morning check-in: ${context.lastWorkoutDays != null && context.lastWorkoutDays > 0 ? `It\u2019s been ${context.lastWorkoutDays} day(s) since your last workout.` : 'Ready for today?'}`,
      type: 'quick',
    };
  }

  if (context.timeOfDay === 'afternoon') {
    if (context.stressLevel != null && context.stressLevel > 6) {
      return {
        question: 'Stress is elevated — need a movement break?',
        context: 'A 5-minute walk can reduce stress by 30%. Just 5 minutes.',
        type: 'reflective',
      };
    }
    return {
      question: "How's your energy for your workout today?",
      context: context.recentSessionIntensity != null
        ? `Last session intensity was RPE ${context.recentSessionIntensity}.`
        : 'Check in with your body before deciding on today\'s training.',
      type: 'quick',
    };
  }

  return {
    question: 'How did today go?',
    context: context.nutritionLoggedYesterday !== false
      ? 'Evening reflection: 3 things you did well today.'
      : 'Quick evening check-in: any wins to note?',
    type: 'reflective',
  };
}

export function generateAlerts(
  streakInfo: StreakInfo | null,
  milestones: Milestone[],
  recoveryScore: number | null,
  missedSessions: number,
  adherenceRate: number,
): Alert[] {
  const alerts: Alert[] = [];

  if (streakInfo) {
    const streakAlert = assessStreak(streakInfo);
    if (streakAlert) alerts.push(streakAlert);
  }

  alerts.push(...milestoneRecognition(milestones));

  if (recoveryScore != null) {
    const recAlert = recoveryAlert(recoveryScore);
    if (recAlert) alerts.push(recAlert);
  }

  const adhAlert = adherenceAlert(missedSessions, adherenceRate);
  if (adhAlert) alerts.push(adhAlert);

  return alerts;
}
