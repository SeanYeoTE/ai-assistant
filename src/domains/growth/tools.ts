import type Anthropic from '@anthropic-ai/sdk';

import { addHabit, addJournalEntry, toggleHabitToday } from './actions';
import type { ToolExecutor } from '@/voice/types';

// Tool definitions in Anthropic tool-use format — see AMP_HANDOVER.md §3.
// The LLM only ever requests these; it never touches storage directly.
export const growthToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'add_journal_entry',
    description: 'Add a personal journal/reflection entry.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The journal entry content.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'create_habit',
    description: 'Create a new habit to track daily.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short name of the habit, e.g. "Drink water".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'toggle_habit_today',
    description: "Mark a habit as done (or undone) for today. Requires the habit's id.",
    input_schema: {
      type: 'object',
      properties: {
        habitId: { type: 'string', description: 'The id of the habit to toggle.' },
      },
      required: ['habitId'],
    },
  },
];

export const growthToolExecutors: Record<string, ToolExecutor> = {
  add_journal_entry: async (input) => {
    const entry = await addJournalEntry(String(input.text));
    return { summary: `Journal entry added.`, result: entry };
  },
  create_habit: async (input) => {
    const habit = await addHabit(String(input.name));
    return { summary: `Habit "${habit.name}" created.`, result: habit };
  },
  toggle_habit_today: async (input) => {
    const habit = await toggleHabitToday(String(input.habitId));
    const nowDone = habit.completedDates.includes(new Date().toISOString().slice(0, 10));
    return {
      summary: `${habit.name} marked ${nowDone ? 'done' : 'not done'} for today.`,
      result: habit,
    };
  },
};
