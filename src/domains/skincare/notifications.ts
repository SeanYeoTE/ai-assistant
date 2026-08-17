import * as Notifications from 'expo-notifications';

import type { TimeOfDay } from './types';

// expo-notifications' handler is configured once, app-wide, in
// src/app/_layout.tsx (see src/domains/reminders/notifications.ts).

async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

const ROUTINE_TITLE: Record<TimeOfDay, string> = {
  morning: 'Morning skincare routine',
  evening: 'Evening skincare routine',
};

export async function scheduleRoutineReminder(
  timeOfDay: TimeOfDay,
  hour: number,
  minute: number
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title: ROUTINE_TITLE[timeOfDay] },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelRoutineReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
