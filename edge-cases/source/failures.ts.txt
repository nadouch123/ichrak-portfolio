// Failure handling for the chat route (FE-08).
// 1. Every failure leaves the server as a small JSON "problem" { code, message, retryAfter? }
//    so the browser can show a designed state instead of a raw error string.
// 2. Sabotage switches let a reviewer break the flow on purpose, one failure at a time.
import { APICallError, type LanguageModelMiddleware } from 'ai';

export const SABOTAGES = ['network', 'route-throw', 'rate-limit', 'midstream', 'slow', 'malformed', 'refusal', 'readFile', 'checkPortfolio', 'crash'] as const;
export type Sabotage = (typeof SABOTAGES)[number];

export type ProblemCode =
  | 'empty_input' | 'too_long' | 'bad_request' | 'rate_limit' | 'overloaded'
  | 'auth' | 'server_error' | 'stream_cut' | 'network' | 'timeout' | 'unknown';

export type Problem = { code: ProblemCode; message: string; retryAfter?: number };

export const MAX_INPUT = 2000;

export function problemResponse(status: number, p: Problem): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (p.retryAfter) headers['retry-after'] = String(p.retryAfter);
  return new Response(JSON.stringify(p), { status, headers });
}

/** Turn any error from the model provider or the stream into a Problem. */
export function toProblem(e: unknown): Problem {
  const status = APICallError.isInstance(e) ? e.statusCode : undefined;
  const msg = e instanceof Error ? e.message : String(e ?? '');
  if (status === 429 || /rate.?limit/i.test(msg)) {
    const ra = APICallError.isInstance(e) ? Number(e.responseHeaders?.['retry-after']) : NaN;
    return { code: 'rate_limit', message: 'The model is getting too many requests right now.', retryAfter: Number.isFinite(ra) && ra > 0 ? ra : 15 };
  }
  if (status === 529 || /overloaded/i.test(msg)) return { code: 'overloaded', message: 'The model is overloaded at the moment.', retryAfter: 10 };
  if (status === 401 || status === 403) return { code: 'auth', message: 'The server could not sign in to the model provider.' };
  if (/stream_cut|ECONNRESET|socket hang up/i.test(msg)) return { code: 'stream_cut', message: 'The connection to the model dropped in the middle of the answer.' };
  if (/timeout|timed out/i.test(msg)) return { code: 'timeout', message: 'The model took too long to answer.' };
  return { code: 'unknown', message: msg || 'The coach hit an unexpected error.' };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Middleware that breaks the model stream on purpose. Works for the demo model and for Claude.
 * - midstream: lets ~14 chunks through (some text, part of a tool call), then errors.
 * - slow: waits 9 s before the first token.
 * - refusal: answers with a short refusal and finishReason "content-filter".
 */
export function sabotageMiddleware(kind: Sabotage | null): LanguageModelMiddleware {
  return {
    specificationVersion: 'v4',
    wrapStream: async ({ doStream }) => {
      if (kind === 'slow') await sleep(9000);
      if (kind === 'refusal') {
        const id = 'refusal';
        const chunks: any[] = [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id },
          { type: 'text-delta', id, delta: 'I can’t help with that request.' },
          { type: 'text-end', id },
          { type: 'finish', finishReason: { unified: 'content-filter', raw: 'refusal' }, usage: { inputTokens: { total: 0, noCache: 0 }, outputTokens: { total: 0, text: 0 } } },
        ];
        return { stream: new ReadableStream({ start(c) { chunks.forEach((x) => c.enqueue(x)); c.close(); } }) } as any;
      }
      const result = await doStream();
      if (kind !== 'midstream') return result;
      let n = 0;
      const cut = new TransformStream<any, any>({
        transform(chunk, c) {
          n += 1;
          if (n === 14) {
            c.enqueue({ type: 'error', error: new Error('stream_cut: the model connection dropped mid-stream (sabotage switch).') });
            c.terminate();
            return;
          }
          c.enqueue(chunk);
        },
      });
      return { ...result, stream: result.stream.pipeThrough(cut) };
    },
  };
}
