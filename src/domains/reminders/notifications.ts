import * as Notifications from 'expo-notifications';

import type { Reminder } from './types';

/**
 * Foreground notification behavior. Called once from the root layout —
 * see AMP_HANDOVER.md §5: reminders must fire independently of a live app
 * session, which is the whole reason this domain requires Expo over a PWA.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function buildTrigger(dueAt: string, repeat: Reminder['repeat']): Notifications.SchedulableNotificationTriggerInput {
  const date = new Date(dueAt);
  if (repeat === 'daily') {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: date.getHours(), minute: date.getMinutes() };
  }
  if (repeat === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: date.getDay() + 1, // expo-notifications: 1 = Sunday
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
}

export async function scheduleReminderNotification(
  title: string,
  notes: string | undefined,
  dueAt: string,
  repeat: Reminder['repeat']
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title, body: notes },
    trigger: buildTrigger(dueAt, repeat),
  });
}

export async function cancelReminderNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
