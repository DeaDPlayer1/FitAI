import { Platform } from 'react-native';
import type { AiTrainerPhase } from '@/constants/aiTrainerStates';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

function supportsNotifications(): boolean {
  try {
    return !!require('expo-notifications');
  } catch {
    return false;
  }
}

async function scheduleLocalNotification(payload: NotificationPayload, trigger: { seconds?: number; hour?: number; minute?: number; repeats?: boolean }): Promise<void> {
  if (!supportsNotifications()) return;
  try {
    const Notifications = require('expo-notifications');
    const { scheduleNotificationAsync, TimeIntervalTriggerInput, CalendarTriggerInput } = Notifications;
    if (trigger.seconds) {
      await scheduleNotificationAsync({
        content: { title: payload.title, body: payload.body, data: payload.data },
        trigger: { type: 'timeInterval', seconds: trigger.seconds } as any,
      });
    } else if (trigger.hour != null && trigger.minute != null) {
      const { SchedulableTriggerInputTypes } = Notifications;
      await scheduleNotificationAsync({
        content: { title: payload.title, body: payload.body, data: payload.data },
        trigger: {
          type: SchedulableTriggerInputTypes?.DAILY || 'daily',
          hour: trigger.hour,
          minute: trigger.minute,
        } as any,
      });
    }
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  if (!supportsNotifications()) return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function scheduleWeeklyReviewNotification(weekNumber: number): Promise<void> {
  await scheduleLocalNotification(
    {
      title: 'Weekly Review Ready',
      body: `Your Week ${weekNumber} review is ready. New calories and training adjustments are waiting.`,
      data: { screen: 'weekly-review' },
    },
    { hour: 19, minute: 0 }
  );
}

export async function scheduleMorningCheckin(): Promise<void> {
  await scheduleLocalNotification(
    {
      title: 'Morning Check-in',
      body: 'How are you feeling today? A quick check-in helps Pulse AI adjust your plan.',
      data: { screen: 'morning-checkin' },
    },
    { hour: 8, minute: 0 }
  );
}

export async function schedulePostWorkoutPrompt(): Promise<void> {
  await scheduleLocalNotification(
    {
      title: 'Great Session!',
      body: 'Tap to log your RPE and how the workout felt.',
      data: { screen: 'post-workout-rpe' },
    },
    { seconds: 60 * 30 }
  );
}

export async function scheduleMissedSessionAlert(daysSinceLast: number): Promise<void> {
  if (daysSinceLast >= 2) {
    await scheduleLocalNotification(
      {
        title: 'Missed Sessions',
        body: `It's been ${daysSinceLast} days since your last workout. Want to adjust this week's plan?`,
        data: { screen: 'train' },
      },
      { seconds: 60 * 60 * 12 }
    );
  }
}

export async function scheduleDietBreakReminder(weeksInDeficit: number): Promise<void> {
  if (weeksInDeficit >= 6) {
    await scheduleLocalNotification(
      {
        title: 'Diet Break Time',
        body: `You've been in a deficit for ${weeksInDeficit} weeks. Consider a maintenance week to reset metabolic hormones.`,
        data: { screen: 'weekly-review' },
      },
      { seconds: 60 * 60 * 24 }
    );
  }
}

export function getNotificationForPhase(phase: AiTrainerPhase): NotificationPayload | null {
  switch (phase) {
    case 'plan_generated':
      return { title: 'Your Plan is Ready!', body: 'Pulse AI has created your personalized plan. Tap to review and apply.', data: { screen: 'confirm-plan' } };
    case 'weekly_review':
      return { title: 'Time for Your Weekly Review', body: 'Let\'s look at your progress and adjust for next week.', data: { screen: 'weekly-review' } };
    case 'plan_updated':
      return { title: 'Plan Updated', body: 'Your new week\'s plan is ready. Check out the adjustments.', data: { screen: 'confirm-plan' } };
    default:
      return null;
  }
}
