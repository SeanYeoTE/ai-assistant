import { cancelRoutineReminder, scheduleRoutineReminder } from './notifications';
import { loadSkincareState, saveSkincareState } from './storage';
import type { LogEntry, Product, RoutineReminder, RoutineStep, TimeOfDay } from './types';

// These are the ONLY functions that read/write Skincare data or touch
// expo-notifications. Both the manual UI (src/app screens) and the voice
// tool executor (src/voice) call these same functions — see
// AMP_HANDOVER.md §1: "same functions, two input paths."

export async function addRoutineStep(name: string, timeOfDay: TimeOfDay): Promise<RoutineStep> {
  const state = await loadSkincareState();
  const order = state.steps.filter((s) => s.timeOfDay === timeOfDay).length;
  const step: RoutineStep = { id: crypto.randomUUID(), name, timeOfDay, order };
  state.steps = [...state.steps, step];
  await saveSkincareState(state);
  return step;
}

export async function listRoutineSteps(): Promise<RoutineStep[]> {
  const state = await loadSkincareState();
  return [...state.steps].sort((a, b) => a.order - b.order);
}

export async function removeRoutineStep(stepId: string): Promise<void> {
  const state = await loadSkincareState();
  state.steps = state.steps.filter((s) => s.id !== stepId);
  await saveSkincareState(state);
}

export async function addProduct(name: string): Promise<Product> {
  const state = await loadSkincareState();
  const existing = state.products.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const product: Product = { id: crypto.randomUUID(), name };
  state.products = [...state.products, product];
  await saveSkincareState(state);
  return product;
}

export async function listProducts(): Promise<Product[]> {
  const state = await loadSkincareState();
  return state.products;
}

export async function logStepDone(stepName: string, timeOfDay: TimeOfDay, productName?: string): Promise<LogEntry> {
  const state = await loadSkincareState();
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    stepName,
    productName,
    timeOfDay,
    loggedAt: new Date().toISOString(),
  };
  state.logEntries = [entry, ...state.logEntries];
  await saveSkincareState(state);
  return entry;
}

export async function listLogEntries(): Promise<LogEntry[]> {
  const state = await loadSkincareState();
  return state.logEntries;
}

/** Today's log entries for a given time of day, so the UI can show which steps are already done. */
export async function todaysLoggedStepNames(timeOfDay: TimeOfDay): Promise<Set<string>> {
  const state = await loadSkincareState();
  const today = new Date().toISOString().slice(0, 10);
  return new Set(
    state.logEntries
      .filter((e) => e.timeOfDay === timeOfDay && e.loggedAt.slice(0, 10) === today)
      .map((e) => e.stepName)
  );
}

export async function setRoutineReminder(
  timeOfDay: TimeOfDay,
  enabled: boolean,
  hour: number,
  minute: number
): Promise<RoutineReminder> {
  const state = await loadSkincareState();
  const existing = state.reminders[timeOfDay];

  await cancelRoutineReminder(existing.notificationId);

  const notificationId = enabled ? await scheduleRoutineReminder(timeOfDay, hour, minute) : null;
  const reminder: RoutineReminder = { timeOfDay, enabled: enabled && notificationId !== null, hour, minute, notificationId };
  state.reminders = { ...state.reminders, [timeOfDay]: reminder };
  await saveSkincareState(state);
  return reminder;
}

export async function getRoutineReminders(): Promise<Record<TimeOfDay, RoutineReminder>> {
  const state = await loadSkincareState();
  return state.reminders;
}
