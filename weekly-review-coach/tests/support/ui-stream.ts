// Builds AI SDK UI-message-stream responses (the SSE format /api/chat sends) for tests.
// Used by the Vitest component tests and the Playwright test, so neither ever reaches a real model.

export type Chunk = Record<string, unknown>;

export const sseLine = (chunk: Chunk | '[DONE]') => `data: ${chunk === '[DONE]' ? chunk : JSON.stringify(chunk)}\n\n`;
export const toSSE = (chunks: Chunk[]) => [...chunks.map(sseLine), sseLine('[DONE]')].join('');

export const SSE_HEADERS = {
  'content-type': 'text/event-stream',
  'cache-control': 'no-cache',
  'x-vercel-ai-ui-message-stream': 'v1',
};

/** One text part, split into word deltas. */
export function text(id: string, value: string): Chunk[] {
  return [
    { type: 'text-start', id },
    ...value.split(/(?<= )/).map((delta) => ({ type: 'text-delta', id, delta })),
    { type: 'text-end', id },
  ];
}

/** A tool call that runs on the server: input streams in, then the output (or an error) arrives. */
export function toolCall(toolCallId: string, toolName: string, input: unknown, result: { output: unknown } | { errorText: string }): Chunk[] {
  return [
    { type: 'tool-input-start', toolCallId, toolName },
    { type: 'tool-input-delta', toolCallId, inputTextDelta: JSON.stringify(input) },
    { type: 'tool-input-available', toolCallId, toolName, input },
    'output' in result
      ? { type: 'tool-output-available', toolCallId, output: result.output }
      : { type: 'tool-output-error', toolCallId, errorText: result.errorText },
  ];
}

/** A tool call the browser answers (proposePlan): input only, no output yet. */
export function clientToolCall(toolCallId: string, toolName: string, input: unknown): Chunk[] {
  return [
    { type: 'tool-input-start', toolCallId, toolName },
    { type: 'tool-input-available', toolCallId, toolName, input },
  ];
}

export const step = (...parts: Chunk[][]): Chunk[] => [{ type: 'start-step' }, ...parts.flat(), { type: 'finish-step' }];
export const turn = (steps: Chunk[][], finishReason = 'stop'): Chunk[] => [
  { type: 'start' },
  ...steps.flat(),
  { type: 'finish', finishReason, messageMetadata: { finishReason } },
];

/* ---------- the primary flow: a full weekly review that ends in a plan to approve ---------- */

export const REVIEW = {
  week: 5,
  finished: [
    { item: 'FE-08 edge cases shipped', source: 'week-05.md' },
    { item: 'Agent design spec', source: 'week-05.md' },
  ],
  learned: ['Design the error state first.', 'Tool parts have four states.', 'Retry should re-send, not duplicate.'],
  open: [{ title: 'FE-09 testing pass', due: 'Week 6' }],
};

export const PLAN = { week: 6, items: [{ task: 'Write component tests', why: 'FE-09' }, { task: 'Wire tests into CI' }] };

export function reviewTurn(): Chunk[] {
  return turn([
    step(text('t1', 'Let me look at your notes first. '), toolCall('c1', 'listFiles', { reason: 'See which notes you uploaded.' }, {
      output: { files: [{ name: 'week-05.md', kind: 'notes', chars: 2900, week: 5 }, { name: 'assignments.md', kind: 'assignments', chars: 635, week: null }] },
    })),
    step(toolCall('c2', 'readFile', { name: 'week-05.md', reason: 'Read this week’s notes.' }, {
      output: { name: 'week-05.md', kind: 'notes', lines: 6, content: '# Week 5\n- FE-08 edge cases shipped\n- Agent design spec\n- Learned: errors first\n- Learned: four tool states\n- Learned: safe retry' },
    })),
    step(toolCall('c3', 'showWeeklyReview', REVIEW, { output: { ...REVIEW, finished: REVIEW.finished.map((f) => ({ ...f, verified: true })), unverified: 0 } })),
    step(text('t2', 'Here is a plan for next week. '), clientToolCall('c4', 'proposePlan', PLAN)),
  ], 'tool-calls');
}

export function savedTurn(): Chunk[] {
  return turn([step(text('t3', 'Saved. Good luck with Week 6!'))]);
}
