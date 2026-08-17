import type Anthropic from '@anthropic-ai/sdk';

import { fitnessToolDefinitions, fitnessToolExecutors } from '@/domains/fitness/tools';
import { growthToolDefinitions, growthToolExecutors } from '@/domains/growth/tools';
import { remindersToolDefinitions, remindersToolExecutors } from '@/domains/reminders/tools';
import { skincareToolDefinitions, skincareToolExecutors } from '@/domains/skincare/tools';
import type { DomainKey } from '@/design-system/tokens';
import type { ToolExecutor } from './types';

// Add each new domain's tool defs/executors here as they're built (Meds —
// see AMP_HANDOVER.md §7 for build order).
export const allToolDefinitions: Anthropic.Tool[] = [
  ...growthToolDefinitions,
  ...remindersToolDefinitions,
  ...fitnessToolDefinitions,
  ...skincareToolDefinitions,
];

export const allToolExecutors: Record<string, ToolExecutor> = {
  ...growthToolExecutors,
  ...remindersToolExecutors,
  ...fitnessToolExecutors,
  ...skincareToolExecutors,
};

export const toolDomain: Record<string, DomainKey> = {
  add_journal_entry: 'growth',
  create_habit: 'growth',
  toggle_habit_today: 'growth',
  create_reminder: 'reminders',
  complete_reminder: 'reminders',
  delete_reminder: 'reminders',
  set_split: 'fitness',
  add_exercise: 'fitness',
  log_lift: 'fitness',
  log_skincare_step: 'skincare',
  add_routine_step: 'skincare',
  add_skincare_product: 'skincare',
};
