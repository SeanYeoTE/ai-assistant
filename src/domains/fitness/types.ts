// Ported from SeanYeoTE/Gymm (app/lib/data/types.ts) — trimmed to the
// solo lifting/streak slice that's in scope for A.M.P's Fitness domain
// (AMP_HANDOVER.md §2: "log a set/workout, adjust a routine, query
// progress trends"). Gymm's social features (friends, presence, outlets,
// high-fives) require Supabase auth, which A.M.P doesn't have set up yet —
// out of scope for this pass.

export type Split = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest';

export type DayTag = Split | 'missed';

export interface LiftSet {
  weight: number;
  reps: number;
}

export interface LoggedExercise {
  name: string;
  sets: LiftSet[];
}

/** One row per calendar day attended — the local equivalent of Gymm's `check_ins` table. */
export interface CheckIn {
  date: string; // ISO date, YYYY-MM-DD
  split: Split | null;
  exercises: LoggedExercise[];
}

export interface StreakDay {
  date: string; // ISO date, YYYY-MM-DD
  tag: DayTag;
  protectedRest: boolean;
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  graceDaysRemaining: number;
  last30Days: StreakDay[]; // oldest first, always 30 entries
}

export interface FitnessState {
  checkIns: CheckIn[];
}

// Exercise suggestions per split — ported verbatim from Gymm's design
// handoff token table.
export const EXERCISES_BY_SPLIT: Record<Exclude<Split, 'rest'>, string[]> = {
  push: ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Triceps pushdown'],
  pull: ['Deadlift', 'Lat pulldown', 'Barbell row', 'Bicep curl'],
  legs: ['Squat', 'Leg press', 'Walking lunge', 'Calf raise'],
  upper: ['Bench press', 'Barbell row', 'Overhead press', 'Lat pulldown'],
  lower: ['Squat', 'Deadlift', 'Leg press', 'Calf raise'],
  full_body: ['Squat', 'Bench press', 'Deadlift', 'Pull-up'],
};
