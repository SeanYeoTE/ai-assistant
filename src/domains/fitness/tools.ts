import type Anthropic from '@anthropic-ai/sdk';

import { addExercise, getTodaysLog, saveLift, setSplit } from './actions';
import type { LiftSet, Split } from './types';
import type { ToolExecutor } from '@/voice/types';

// Tool definitions in Anthropic tool-use format — see AMP_HANDOVER.md §3.
// The LLM only ever requests these; it never touches storage directly.
export const fitnessToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'set_split',
    description: "Set today's workout split (or mark today as rest).",
    input_schema: {
      type: 'object',
      properties: {
        split: {
          type: 'string',
          enum: ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'rest'],
        },
      },
      required: ['split'],
    },
  },
  {
    name: 'add_exercise',
    description: "Add an exercise to today's workout, e.g. \"Bench press\".",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exercise name.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'log_lift',
    description: 'Log a completed set for an exercise in today\'s workout (adds to that exercise\'s set list).',
    input_schema: {
      type: 'object',
      properties: {
        exerciseName: { type: 'string', description: 'Must match an exercise already added today.' },
        weight: { type: 'number' },
        reps: { type: 'integer' },
      },
      required: ['exerciseName', 'weight', 'reps'],
    },
  },
];

export const fitnessToolExecutors: Record<string, ToolExecutor> = {
  set_split: async (input) => {
    const checkIn = await setSplit(input.split as Split);
    return { summary: `Today's split set to ${checkIn.split}.`, result: checkIn };
  },
  add_exercise: async (input) => {
    const checkIn = await addExercise(String(input.name));
    return { summary: `${input.name} added to today's workout.`, result: checkIn };
  },
  log_lift: async (input) => {
    const { exercises } = await getTodaysLog();
    const exerciseName = String(input.exerciseName);
    const existing = exercises.find((e) => e.name === exerciseName)?.sets ?? [];
    const newSet: LiftSet = { weight: Number(input.weight), reps: Number(input.reps) };
    const checkIn = await saveLift(exerciseName, [...existing, newSet]);
    return { summary: `Logged ${newSet.weight}×${newSet.reps} for ${exerciseName}.`, result: checkIn };
  },
};
