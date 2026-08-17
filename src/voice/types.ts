export type ToolExecutionResult = {
  /** Short human-readable confirmation, spoken back via TTS. */
  summary: string;
  result: unknown;
};

export type ToolExecutor = (input: Record<string, unknown>) => Promise<ToolExecutionResult>;
