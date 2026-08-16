import type Anthropic from '@anthropic-ai/sdk';

import { growthToolDefinitions, growthToolExecutors } from '@/domains/growth/tools';
import { remindersToolDefinitions, remindersToolExecutors } from '@/domains/reminders/tools';
import type { DomainKey } from '@/design-system/tokens';
import type { ToolExecutor } from './types';

// Add each new domain's tool defs/executors here as they're built (Fitness,
// Skincare, Meds — see AMP_HANDOVER.md §7 for build order).
export const allToolDefinitions: Anthropic.Tool[] = [...growthToolDefinitions, ...remindersToolDefinitions];

export const allToolExecutors: Record<string, ToolExecutor> = {
  ...growthToolExecutors,
  ...remindersToolExecutors,
};

export const toolDomain: Record<string, DomainKey> = {
  add_journal_entry: 'growth',
  create_habit: 'growth',
  toggle_habit_today: 'growth',
  create_reminder: 'reminders',
  complete_reminder: 'reminders',
  delete_reminder: 'reminders',
};
