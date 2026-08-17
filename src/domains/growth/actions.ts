import { loadGrowthState, saveGrowthState } from './storage';
import type { Habit, JournalEntry } from './types';

// These are the ONLY functions that read/write Growth domain data. Both the
// manual UI (src/app screens) and the voice tool executor (src/voice) call
// these same functions — see AMP_HANDOVER.md §1: "same functions, two input
// paths."

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function addJournalEntry(text: string): Promise<JournalEntry> {
  const state = await loadGrowthState();
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  };
  state.journalEntries = [entry, ...state.journalEntries];
  await saveGrowthState(state);
  return entry;
}

export async function listJournalEntries(): Promise<JournalEntry[]> {
  const state = await loadGrowthState();
  return state.journalEntries;
}

export async function addHabit(name: string): Promise<Habit> {
  const state = await loadGrowthState();
  const habit: Habit = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    completedDates: [],
  };
  state.habits = [...state.habits, habit];
  await saveGrowthState(state);
  return habit;
}

export async function listHabits(): Promise<Habit[]> {
  const state = await loadGrowthState();
  return state.habits;
}

export async function toggleHabitToday(habitId: string): Promise<Habit> {
  const state = await loadGrowthState();
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) throw new Error(`Habit not found: ${habitId}`);

  const today = todayISODate();
  habit.completedDates = habit.completedDates.includes(today)
    ? habit.completedDates.filter((d) => d !== today)
    : [...habit.completedDates, today];

  await saveGrowthState(state);
  return habit;
}

/** Consecutive days (ending today or yesterday) the habit has been completed. */
export function getHabitStreak(habit: Habit): number {
  const dates = new Set(habit.completedDates);
  let streak = 0;
  const cursor = new Date();

  // Allow the streak to still count if today isn't marked yet but yesterday was.
  if (!dates.has(todayISODate())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
