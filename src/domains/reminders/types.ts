export type RepeatRule = 'none' | 'daily' | 'weekly';

export type Reminder = {
  id: string;
  title: string;
  notes?: string;
  /** ISO timestamp — the first (or only) time the reminder should fire. */
  dueAt: string;
  repeat: RepeatRule;
  /** expo-notifications identifier, so it can be cancelled/rescheduled. Null if scheduling failed (e.g. permission denied). */
  notificationId: string | null;
  completed: boolean;
  createdAt: string;
};

export type ReminderState = {
  reminders: Reminder[];
};
