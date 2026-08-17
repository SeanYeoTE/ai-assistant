import type Anthropic from '@anthropic-ai/sdk';

import { createReminder, deleteReminder, toggleReminderComplete } from './actions';
import type { RepeatRule } from './types';
import type { ToolExecutor } from '@/voice/types';

// Tool definitions in Anthropic tool-use format — see AMP_HANDOVER.md §3.
// The LLM only ever requests these; it never touches storage or
// expo-notifications directly.
export const remindersToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'create_reminder',
    description:
      'Create a reminder that fires a local notification at a specific date/time, optionally repeating.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short reminder text, e.g. "Stretch".' },
        dueAt: {
          type: 'string',
          description: 'ISO 8601 date-time for when the reminder should first fire.',
        },
        repeat: {
          type: 'string',
          enum: ['none', 'daily', 'weekly'],
          description: 'Whether the reminder repeats. Defaults to "none".',
        },
        notes: { type: 'string', description: 'Optional extra detail shown in the notification body.' },
      },
      required: ['title', 'dueAt'],
    },
  },
  {
    name: 'complete_reminder',
    description: "Mark a reminder as done (or undone). Requires the reminder's id.",
    input_schema: {
      type: 'object',
      properties: {
        reminderId: { type: 'string', description: 'The id of the reminder to toggle.' },
      },
      required: ['reminderId'],
    },
  },
  {
    name: 'delete_reminder',
    description: "Permanently delete a reminder and cancel its notification. Requires the reminder's id.",
    input_schema: {
      type: 'object',
      properties: {
        reminderId: { type: 'string', description: 'The id of the reminder to delete.' },
      },
      required: ['reminderId'],
    },
  },
];

export const remindersToolExecutors: Record<string, ToolExecutor> = {
  create_reminder: async (input) => {
    const reminder = await createReminder(
      String(input.title),
      String(input.dueAt),
      (input.repeat as RepeatRule | undefined) ?? 'none',
      input.notes ? String(input.notes) : undefined
    );
    return { summary: `Reminder "${reminder.title}" set for ${new Date(reminder.dueAt).toLocaleString()}.`, result: reminder };
  },
  complete_reminder: async (input) => {
    const reminder = await toggleReminderComplete(String(input.reminderId));
    return {
      summary: `${reminder.title} marked ${reminder.completed ? 'done' : 'not done'}.`,
      result: reminder,
    };
  },
  delete_reminder: async (input) => {
    await deleteReminder(String(input.reminderId));
    return { summary: 'Reminder deleted.', result: null };
  },
};
