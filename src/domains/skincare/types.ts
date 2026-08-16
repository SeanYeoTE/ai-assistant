export type TimeOfDay = 'morning' | 'evening';

export type RoutineStep = {
  id: string;
  name: string;
  timeOfDay: TimeOfDay;
  order: number;
};

export type Product = {
  id: string;
  name: string;
};

/** A single instance of a routine step being completed — the domain's history/schema. */
export type LogEntry = {
  id: string;
  stepName: string;
  productName?: string;
  timeOfDay: TimeOfDay;
  loggedAt: string; // ISO timestamp
};

export type RoutineReminder = {
  timeOfDay: TimeOfDay;
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId: string | null;
};

export type SkincareState = {
  steps: RoutineStep[];
  products: Product[];
  logEntries: LogEntry[];
  reminders: Record<TimeOfDay, RoutineReminder>;
};
