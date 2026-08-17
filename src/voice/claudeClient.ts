import Anthropic from '@anthropic-ai/sdk';

import { allToolDefinitions } from './registry';

// NOTE: calling the Anthropic API directly from the device (with the API key
// bundled client-side) is fine for personal/dev use but should NOT ship to
// the App Store as-is — proxy this through a small backend before wider
// distribution so the key isn't embedded in the binary.
const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are A.M.P, a voice-driven personal companion. Decide which tool(s) to
call based on the user's utterance. Only call tools — never claim an action succeeded without
calling the corresponding tool. If a request is ambiguous (e.g. an unrecognized habit name),
ask a clarifying question instead of guessing.`;

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

export async function requestToolUse(
  transcript: string,
  history: ConversationTurn[] = []
): Promise<Anthropic.Message> {
  return client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: allToolDefinitions,
    messages: [...history.map((t) => ({ role: t.role, content: t.content })), { role: 'user', content: transcript }],
  });
}
