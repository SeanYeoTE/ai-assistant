import type Anthropic from '@anthropic-ai/sdk';

import { growthToolDefinitions, growthToolExecutors } from '@/domains/growth/tools';
import type { DomainKey } from '@/design-system/tokens';
import type { ToolExecutor } from './types';

// Add each new domain's tool defs/executors here as they're built (Reminders,
// Fitness, Skincare, Meds — see AMP_HANDOVER.md §7 for build order).
export const allToolDefinitions: Anthropic.Tool[] = [...growthToolDefinitions];

export const allToolExecutors: Record<string, ToolExecutor> = {
  ...growthToolExecutors,
};

export const toolDomain: Record<string, DomainKey> = {
  add_journal_entry: 'growth',
  create_habit: 'growth',
  toggle_habit_today: 'growth',
};
