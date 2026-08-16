import { cancelReminderNotification, scheduleReminderNotification } from './notifications';
import { loadReminderState, saveReminderState } from './storage';
import type { Reminder, RepeatRule } from './types';

// These are the ONLY functions that read/write Reminders data or touch
// expo-notifications. Both the manual UI (src/app screens) and the voice
// tool executor (src/voice) call these same functions — see
// AMP_HANDOVER.md §1: "same functions, two input paths."

export async function createReminder(
  title: string,
  dueAt: string,
  repeat: RepeatRule = 'none',
  notes?: string
): Promise<Reminder> {
  const notificationId = await scheduleReminderNotification(title, notes, dueAt, repeat);

  const reminder: Reminder = {
    id: crypto.randomUUID(),
    title,
    notes,
    dueAt,
    repeat,
    notificationId,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const state = await loadReminderState();
  state.reminders = [...state.reminders, reminder].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );
  await saveReminderState(state);
  return reminder;
}

export async function listReminders(): Promise<Reminder[]> {
  const state = await loadReminderState();
  return state.reminders;
}

export async function toggleReminderComplete(reminderId: string): Promise<Reminder> {
  const state = await loadReminderState();
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (!reminder) throw new Error(`Reminder not found: ${reminderId}`);

  reminder.completed = !reminder.completed;
  // One-time reminders stop firing once completed; recurring ones keep
  // firing on schedule regardless of today's completion state.
  if (reminder.completed && reminder.repeat === 'none') {
    await cancelReminderNotification(reminder.notificationId);
    reminder.notificationId = null;
  }

  await saveReminderState(state);
  return reminder;
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const state = await loadReminderState();
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (!reminder) return;

  await cancelReminderNotification(reminder.notificationId);
  state.reminders = state.reminders.filter((r) => r.id !== reminderId);
  await saveReminderState(state);
}
