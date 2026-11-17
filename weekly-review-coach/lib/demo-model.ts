// Demo model: a scripted stand-in used ONLY while the deployment has no model
// credits. It decides which tool to call next from the conversation so far and
// streams the tool input in small chunks, so every tool state is visible.
// The tools themselves still execute for real (files, live site fetch, source check).
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

type Part = any; // provider prompt parts (kept loose on purpose: this is a test double)

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 0, text: 0, reasoning: undefined },
};

let n = 0;
const id = () => `demo_${Date.now().toString(36)}_${n++}`;

function textChunks(text: string) {
  const tid = id();
  const words = text.split(/(?<= )/);
  return [{ type: 'text-start', id: tid }, ...words.map((w) => ({ type: 'text-delta', id: tid, delta: w })), { type: 'text-end', id: tid }];
}

function toolChunks(toolName: string, input: unknown) {
  const callId = id();
  const json = JSON.stringify(input);
  const size = Math.max(6, Math.ceil(json.length / 40));
  const deltas: any[] = [];
  for (let i = 0; i < json.length; i += size) deltas.push({ type: 'tool-input-delta', id: callId, delta: json.slice(i, i + size) });
  return [
    { type: 'tool-input-start', id: callId, toolName },
    ...deltas,
    { type: 'tool-input-end', id: callId },
    { type: 'tool-call', toolCallId: callId, toolName, input: json },
  ];
}

function plan(prompt: Part[]): any[] {
  const system = prompt.find((m: Part) => m.role === 'system')?.content ?? '';
  const week = Number(system.match(/current internship week is Week (\d+)/)?.[1]) || 5;
  const pad = (w: number) => `week-${String(w).padStart(2, '0')}.md`;

  let lastUser = -1;
  prompt.forEach((m: Part, i: number) => { if (m.role === 'user') lastUser = i; });
  const userText: string = (prompt[lastUser]?.content ?? []).map((p: Part) => p.text ?? '').join(' ').toLowerCase();

  // tool calls (with their inputs) and results since the last user message
  const inputs: Record<string, any> = {};
  const since: Record<string, Part[]> = {};
  prompt.slice(lastUser + 1).forEach((m: Part) => {
    if (m.role !== 'tool' && m.role !== 'assistant') return;
    for (const p of m.content) {
      if (p.type === 'tool-call') inputs[p.toolCallId] = typeof p.input === 'string' ? JSON.parse(p.input) : p.input;
      if (p.type === 'tool-result') (since[p.toolName] ??= []).push({ ...p, input: inputs[p.toolCallId] });
    }
  });
  const failed = (p: Part) => p.output?.type?.startsWith('error');

  // Answer to the plan card arrives as a tool result for proposePlan.
  if (since.proposePlan) {
    const out = since.proposePlan.at(-1).output?.value ?? {};
    return out.approved
      ? textChunks(`Saved. Your plan is now in your files as **${out.savedAs}**, so next week's review can check it. Good luck with Week ${week + 1}!`)
      : textChunks(`No problem, nothing was saved. ${out.feedback ? `You asked: “${out.feedback}”. ` : ''}With model credits I would rewrite the plan from your feedback; in demo mode, edit it in your files instead.`);
  }

  const wantsReview = /review|week|start/.test(userText) || Object.keys(since).length > 0;
  if (!wantsReview) {
    return textChunks('I’m running in **demo mode** (no model credits on this deployment yet), so I can only run the scripted weekly review. Click **Weekly review** to see every tool state. Once credits are added, I answer anything about your notes.');
  }

  if (!since.listFiles) return [...textChunks('Let me start with what you’ve given me.'), ...toolChunks('listFiles', { reason: 'See which notes and lists you uploaded before reading anything.' })];

  if (!since.readFile) {
    return [
      ...toolChunks('readFile', { name: pad(week), reason: `Week ${week} notes are the main source for this review.` }),
      ...toolChunks('readFile', { name: 'assignments.md', reason: 'Know which assignments are done and which are still open.' }),
    ];
  }

  const notes = since.readFile.find((p: Part) => p.input?.name === pad(week));
  const notesFailed = !notes || failed(notes);
  if (notesFailed) {
    return textChunks(`I can’t read **${pad(week)}**, so I won’t review an older week instead. Please upload your Week ${week} notes in the side panel (name the file \`${pad(week)}\`), then ask me again.`);
  }

  if (!since.checkPortfolio) return toolChunks('checkPortfolio', { reason: 'Confirm which portfolio pages are actually live, as evidence of what you shipped.' });

  if (!since.showWeeklyReview) {
    if (week !== 5) return textChunks(`Demo mode only has a scripted summary for the Week 5 starter notes. With model credits I would summarise your ${pad(week)}.`);
    return [
      ...textChunks('Here is your week.'),
      ...toolChunks('showWeeklyReview', {
        week: 5,
        finished: [
          { item: 'Built an accessible dialog, tabs and disclosure by hand (FE-05)', source: 'week-05.md' },
          { item: 'Explained how the portfolio nav links scroll to sections', source: 'week-05.md' },
          { item: 'Wrote the FL-06 Weekly Review Coach spec with 6 evals', source: 'week-05.md' },
          { item: 'Redesigned and deployed the portfolio', source: 'week-05.md' },
        ],
        learned: [
          'Accessibility behaviour is part of whether a component is correct: focus trap, Escape, roving tabindex.',
          'shadcn/ui wraps Radix primitives instead of rebuilding focus logic, which covers edge cases I missed.',
          'Writing evals before building forces you to say what “working” means.',
        ],
        open: [{ title: 'Checkpoint 1: build the agent + 2-min run capture', due: 'Week 6' }],
      }),
    ];
  }

  if (!since.proposePlan) {
    return [
      ...textChunks('With model credits I’d quiz you here first (3 questions, one at a time). In demo mode I go straight to the plan:'),
      ...toolChunks('proposePlan', {
        week: 6,
        items: [
          { task: 'Record the 2-minute run capture for Checkpoint 1', why: 'Only open item in assignments.md' },
          { task: 'Run the 6 spec evals against the live agent', why: 'Target 6/6 before calling it done' },
          { task: 'Fix the nav highlight so it follows scrolling', why: 'Limitation noted in your Week 5 notes' },
          { task: 'Add real GitHub and LinkedIn links to the portfolio' },
        ],
      }),
    ];
  }
  return textChunks('Done for this week.');
}

export const demoModel = new MockLanguageModelV4({
  provider: 'demo',
  modelId: 'scripted-demo',
  doStream: async (options: any) => {
    const body = plan(options.prompt);
    const calls = body.some((c) => c.type === 'tool-call');
    return {
      stream: simulateReadableStream({
        initialDelayInMs: 350,
        chunkDelayInMs: 28,
        chunks: [
          { type: 'stream-start', warnings: [] },
          ...body,
          { type: 'finish', finishReason: { unified: calls ? 'tool-calls' : 'stop', raw: undefined }, usage },
        ] as any[],
      }),
    };
  },
});
