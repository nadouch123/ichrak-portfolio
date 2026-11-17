// Replaces window.fetch for component tests. /api/chat is answered by the test, the starter files
// and /api/status get canned answers, and ANY other request fails the test, so a test can never
// reach a real model or the network.
import { vi } from 'vitest';
import { SSE_HEADERS, sseLine, toSSE, type Chunk } from './ui-stream';

export type ChatRequest = { messages: any[]; files: { name: string }[]; week: number; demo?: boolean; sabotage?: string };
type Handler = (body: ChatRequest, call: number) => Response | Promise<Response>;

export const STARTER_FILES: Record<string, string> = {
  'week-05.md': '# Week 5\n- FE-08 edge cases shipped',
  'assignments.md': '- FE-09 testing pass (Week 6)',
  'review-template.md': '## Finished\n## Learned\n## Open',
};

export function mockAiRoute(handler: Handler) {
  const calls: ChatRequest[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith('/api/status')) return Response.json({ mode: 'demo', model: 'test double' });
    const file = url.match(/\/data\/([\w.-]+)$/)?.[1];
    if (file && STARTER_FILES[file]) return new Response(STARTER_FILES[file]);
    if (url.endsWith('/api/chat')) {
      const body = JSON.parse(String(init?.body)) as ChatRequest;
      calls.push(body);
      return handler(body, calls.length);
    }
    throw new Error(`Unexpected network call in a test: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

export const sseResponse = (chunks: Chunk[]) => new Response(toSSE(chunks), { headers: SSE_HEADERS });
export const problem = (status: number, body: { code: string; message: string; retryAfter?: number }) =>
  Response.json(body, { status, headers: body.retryAfter ? { 'retry-after': String(body.retryAfter) } : {} });

/** A stream the test feeds by hand, to look at the UI between chunks. */
export function controlledStream() {
  const enc = new TextEncoder();
  let ctrl!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({ start: (c) => { ctrl = c; } });
  return {
    response: () => new Response(stream, { headers: SSE_HEADERS }),
    push: (...chunks: Chunk[]) => chunks.forEach((c) => ctrl.enqueue(enc.encode(sseLine(c)))),
    end: () => { ctrl.enqueue(enc.encode(sseLine('[DONE]'))); ctrl.close(); },
  };
}

/** A promise that never settles: the request stays "submitted". */
export const never = () => new Promise<Response>(() => {});
