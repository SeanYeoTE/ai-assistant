// Streak math ported from SeanYeoTE/Gymm's compute_streak() Postgres
// function (server/supabase/migrations/20260712120200_protected_rest_streak.sql)
// and the client-side grid-building companion logic in
// app/lib/data/supabaseProvider.ts's getStreak(). Same rules, adapted to run
// over locally-stored check-ins instead of a Supabase RPC + table read.
//
// Grace-day rule (see Gymm's server/README.md for the full rationale): a
// streak survives one missed day if a grace day is banked (2 banked to
// start, +1 every 7-day run, capped at 2). A single missed day right after
// a *real* logged split (not 'rest', not unlogged) is separately
// "protected" and never touches the grace bank. Two or more consecutive
// missed days always breaks the streak regardless of banked grace.

import type { CheckIn, DayTag, Split, StreakDay, StreakSummary } from './types';

const REAL_SPLITS: Split[] = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body'];

function isRealSplit(split: Split | null): split is Exclude<Split, 'rest'> {
  return split !== null && REAL_SPLITS.includes(split);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateOffsetStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function daysBetween(laterDate: string, earlierDate: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((new Date(laterDate).getTime() - new Date(earlierDate).getTime()) / MS_PER_DAY);
}

function computeStreakCounters(checkIns: CheckIn[]) {
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

  let prevDate: string | null = null;
  let prevSplit: Split | null = null;
  let runLength = 0;
  let graceBank = 2;
  let maxRun = 0;
  let lastDate: string | null = null;
  let lastSplit: Split | null = null;
  let total = 0;

  for (const rec of sorted) {
    total += 1;
    const gap = prevDate === null ? null : daysBetween(rec.date, prevDate);
    const protectedRest = gap === 2 && prevSplit !== null && prevSplit !== 'rest';

    if (gap === null) {
      runLength = 1;
      graceBank = 2;
    } else if (gap === 1) {
      runLength += 1;
    } else if (gap === 2 && protectedRest) {
      runLength += 1;
    } else if (gap === 2 && graceBank > 0) {
      graceBank -= 1;
      runLength += 1;
    } else {
      runLength = 1;
      graceBank = 2;
    }

    if (runLength % 7 === 0) graceBank = Math.min(graceBank + 1, 2);

    maxRun = Math.max(maxRun, runLength);
    prevDate = rec.date;
    prevSplit = rec.split;
    lastDate = rec.date;
    lastSplit = rec.split;
  }

  let currentStreak: number;
  let graceDaysRemaining: number;
  if (lastDate === null) {
    currentStreak = 0;
    graceDaysRemaining = 2;
  } else {
    const gap = daysBetween(todayStr(), lastDate);
    const protectedRest = gap === 2 && lastSplit !== null && lastSplit !== 'rest';
    if (gap <= 1 || protectedRest || (gap === 2 && graceBank > 0)) {
      currentStreak = runLength;
      graceDaysRemaining = graceBank;
    } else {
      currentStreak = 0;
      graceDaysRemaining = 2;
    }
  }

  return { currentStreak, longestStreak: maxRun, totalCheckIns: total, graceDaysRemaining };
}

function buildLast30DaysGrid(checkIns: CheckIn[]): StreakDay[] {
  const fromDate = dateOffsetStr(29);
  const bySplit = new Map(
    checkIns.filter((c) => c.date >= fromDate && c.date <= todayStr()).map((c) => [c.date, c.split])
  );

  const days: StreakDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = dateOffsetStr(i);
    const hasRow = bySplit.has(date);
    const prevSplit = bySplit.get(dateOffsetStr(i + 1)) ?? null;
    const prevWasRealSplit = isRealSplit(prevSplit);

    if (hasRow) {
      const split = bySplit.get(date) ?? null;
      if (split === 'rest') {
        days.push({ date, tag: 'rest', protectedRest: prevWasRealSplit });
      } else if (isRealSplit(split)) {
        days.push({ date, tag: split as DayTag, protectedRest: false });
      } else {
        // Attended (a check-in row exists) but no split logged yet.
        days.push({ date, tag: 'missed', protectedRest: false });
      }
    } else if (prevWasRealSplit) {
      days.push({ date, tag: 'rest', protectedRest: true });
    } else {
      days.push({ date, tag: 'missed', protectedRest: false });
    }
  }
  return days;
}

export function computeStreakSummary(checkIns: CheckIn[]): StreakSummary {
  return { ...computeStreakCounters(checkIns), last30Days: buildLast30DaysGrid(checkIns) };
}
