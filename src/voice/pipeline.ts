import * as Speech from 'expo-speech';

import type { ProposedAction } from '@/design-system/ConfirmationSheet';
import { requestToolUse, type ConversationTurn } from './claudeClient';
import { allToolExecutors, toolDomain } from './registry';

export type PendingToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type TranscriptOutcome =
  | { kind: 'no_action'; assistantText: string }
  | { kind: 'confirm'; actions: ProposedAction[]; calls: PendingToolCall[] };

/**
 * Step 1 of the pipeline (see AMP_HANDOVER.md §3): transcript → LLM tool_use.
 * Returns proposed actions for the confirmation sheet; nothing is executed yet.
 */
export async function interpretTranscript(
  transcript: string,
  history: ConversationTurn[] = []
): Promise<TranscriptOutcome> {
  const message = await requestToolUse(transcript, history);

  const toolUseBlocks = message.content.filter((block) => block.type === 'tool_use');
  if (toolUseBlocks.length === 0) {
    const textBlock = message.content.find((block) => block.type === 'text');
    return { kind: 'no_action', assistantText: textBlock?.type === 'text' ? textBlock.text : '' };
  }

  const calls: PendingToolCall[] = toolUseBlocks.map((block) => ({
    id: block.id,
    name: block.name,
    input: block.input as Record<string, unknown>,
  }));

  const actions: ProposedAction[] = calls.map((call) => ({
    id: call.id,
    domain: toolDomain[call.name] ?? 'growth',
    summary: describeCall(call),
  }));

  return { kind: 'confirm', actions, calls };
}

function describeCall(call: PendingToolCall): string {
  const inputSummary = Object.entries(call.input)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
  return `${call.name.replace(/_/g, ' ')} (${inputSummary})`;
}

/**
 * Step 2: user confirms in the ConfirmationSheet → app code executes the
 * real read/write. The LLM never touches storage directly.
 */
export async function executeConfirmedCalls(calls: PendingToolCall[]): Promise<string[]> {
  const summaries: string[] = [];
  for (const call of calls) {
    const executor = allToolExecutors[call.name];
    if (!executor) {
      summaries.push(`Unknown action: ${call.name}`);
      continue;
    }
    const { summary } = await executor(call.input);
    summaries.push(summary);
  }
  return summaries;
}

/** Step 3: spoken confirmation. */
export function speak(text: string): void {
  Speech.speak(text);
}
