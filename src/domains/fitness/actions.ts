import { computeStreakSummary } from './streak';
import { loadFitnessState, saveFitnessState } from './storage';
import type { CheckIn, LiftSet, LoggedExercise, Split, StreakSummary } from './types';

// These are the ONLY functions that read/write Fitness data. Both the
// manual UI (src/app screens) and the voice tool executor (src/voice) call
// these same functions — see AMP_HANDOVER.md §1: "same functions, two
// input paths." Write behavior (split-switch clears exercises, addExercise
// dedupes, saveLift replaces a set list wholesale) is ported from
// SeanYeoTE/Gymm's mockProvider.ts/supabaseProvider.ts to keep the same
// semantics the rest of that app already relies on.

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateTodaysCheckIn(): Promise<{ state: Awaited<ReturnType<typeof loadFitnessState>>; checkIn: CheckIn }> {
  const state = await loadFitnessState();
  const today = todayStr();
  let checkIn = state.checkIns.find((c) => c.date === today);
  if (!checkIn) {
    checkIn = { date: today, split: null, exercises: [] };
    state.checkIns = [...state.checkIns, checkIn];
  }
  return { state, checkIn };
}

export async function getTodaysLog(): Promise<{ split: Split | null; exercises: LoggedExercise[] }> {
  const state = await loadFitnessState();
  const today = state.checkIns.find((c) => c.date === todayStr());
  return today ? { split: today.split, exercises: today.exercises } : { split: null, exercises: [] };
}

export async function setSplit(split: Split): Promise<CheckIn> {
  const { state, checkIn } = await getOrCreateTodaysCheckIn();
  // Switching to a *different* split (including Rest) clears exercises
  // logged under the previous one — see Gymm's setSplit comment.
  if (split !== checkIn.split) checkIn.exercises = [];
  checkIn.split = split;
  await saveFitnessState(state);
  return checkIn;
}

export async function addExercise(name: string): Promise<CheckIn> {
  const { state, checkIn } = await getOrCreateTodaysCheckIn();
  if (!checkIn.exercises.some((e) => e.name === name)) {
    checkIn.exercises = [...checkIn.exercises, { name, sets: [] }];
  }
  await saveFitnessState(state);
  return checkIn;
}

export async function saveLift(exerciseName: string, sets: LiftSet[]): Promise<CheckIn> {
  const { state, checkIn } = await getOrCreateTodaysCheckIn();
  if (!checkIn.exercises.some((e) => e.name === exerciseName)) {
    checkIn.exercises = [...checkIn.exercises, { name: exerciseName, sets }];
  } else {
    checkIn.exercises = checkIn.exercises.map((e) => (e.name === exerciseName ? { ...e, sets } : e));
  }
  await saveFitnessState(state);
  return checkIn;
}

export async function getStreak(): Promise<StreakSummary> {
  const state = await loadFitnessState();
  return computeStreakSummary(state.checkIns);
}
