import { convertToModelMessages, gateway, streamText, stepCountIs, wrapLanguageModel, type LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { ToolFailure, createCoachTools, type CoachMessage, type FailSwitch, type KnowledgeFile } from '../lib/tools.js';
import { demoModel } from '../lib/demo-model.js';
import { SYSTEM } from '../lib/system.js';
import { MAX_INPUT, SABOTAGES, problemResponse, sabotageMiddleware, toProblem, type Sabotage } from '../lib/failures.js';

export const maxDuration = 300;

export function pickModel(forceDemo: boolean): { model: LanguageModel; mode: 'live' | 'demo'; label: string } {
  if (!forceDemo && process.env.ANTHROPIC_API_KEY) {
    const id = process.env.COACH_MODEL || 'claude-opus-5-5';
    return { model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(id), mode: 'live', label: id };
  }
  if (!forceDemo && process.env.COACH_USE_GATEWAY === '1') {
    const id = process.env.COACH_MODEL || 'anthropic/claude-opus-5.5';
    return { model: gateway(id), mode: 'live', label: id };
  }
  return { model: demoModel, mode: 'demo', label: 'scripted demo model' };
}

const cleanFiles = (arr: unknown): KnowledgeFile[] =>
  (Array.isArray(arr) ? arr : [])
    .filter((f) => f && typeof f.name === 'string' && typeof f.content === 'string')
    .slice(0, 20)
    .map((f) => ({ name: String(f.name).slice(0, 80), content: String(f.content).slice(0, 60000) }));

const lastUserText = (messages: CoachMessage[]) => {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  return last ? last.parts.filter((p) => p.type === 'text').map((p: any) => p.text).join(' ') : null;
};

export async function POST(req: Request) {
  // Everything below is wrapped so that even a crash in the handler leaves as a designed JSON problem, never an HTML 500 page.
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return problemResponse(400, { code: 'bad_request', message: 'The request could not be read.' });
    }
    const sabotage: Sabotage | null = SABOTAGES.includes(body?.sabotage) ? body.sabotage : null;

    if (sabotage === 'route-throw') throw new Error('Sabotage: the route handler threw before it could start streaming.');
    if (sabotage === 'rate-limit') return problemResponse(429, { code: 'rate_limit', message: 'The model is getting too many requests right now.', retryAfter: 12 });

    const messages: CoachMessage[] = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return problemResponse(400, { code: 'empty_input', message: 'There is nothing to answer yet. Type a question or pick a starter.' });
    const text = lastUserText(messages);
    const lastIsUser = messages.at(-1)?.role === 'user';
    if (lastIsUser && !text?.trim()) return problemResponse(400, { code: 'empty_input', message: 'Your message was empty. Type a question or pick a starter.' });
    if (lastIsUser && text && text.length > MAX_INPUT) return problemResponse(413, { code: 'too_long', message: `Your message is ${text.length} characters. The limit is ${MAX_INPUT}; paste long notes as a file instead.` });

    const files = cleanFiles(body.files);
    const week = Math.min(52, Math.max(1, Number(body.week) || 5));
    const fail: FailSwitch = sabotage === 'readFile' || sabotage === 'checkPortfolio' || sabotage === 'malformed' ? sabotage : null;
    const picked = pickModel(body.demo === true);
    const model = sabotage === 'midstream' || sabotage === 'slow' || sabotage === 'refusal'
      ? wrapLanguageModel({ model: picked.model as any, middleware: sabotageMiddleware(sabotage) })
      : picked.model;

    const result = streamText({
      model,
      system: `${SYSTEM}\n\nToday is ${new Date().toISOString().slice(0, 10)}. The current internship week is Week ${week}; its notes file would be week-${String(week).padStart(2, '0')}.md.`,
      messages: await convertToModelMessages(messages),
      tools: createCoachTools({ files, fail }),
      stopWhen: stepCountIs(10),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({
      // finishReason travels with the message so the UI can tell a refusal or a cut-off answer from a normal one
      messageMetadata: ({ part }) => (part.type === 'finish' ? { finishReason: part.finishReason } : undefined),
      // tool failures keep their own user-facing message (shown in the tool card); stream/model failures become a JSON problem
      onError: (e) => (e instanceof ToolFailure || (e as any)?.name === 'ToolFailure' ? (e as Error).message : JSON.stringify(toProblem(e))),
    });
  } catch (e) {
    console.error('chat route failed', e);
    return problemResponse(500, { code: 'server_error', message: 'The coach’s server hit an error before it could answer.' });
  }
}
