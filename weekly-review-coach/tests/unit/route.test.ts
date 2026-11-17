// @vitest-environment node
// Sabotage that runs on every commit: `npm test`.
// Calls the real route handler with the demo model and checks each failure leaves as a designed problem.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { POST } from '../../api/chat';

const files = [{ name: 'week-05.md', content: '# Week 5\n- did things' }, { name: 'assignments.md', content: '- FE-08 open' }];
const userMsg = (text: string) => ({ id: 'u1', role: 'user', parts: [{ type: 'text', text }] });
const call = (body: unknown) => POST(new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify(body) }));

test('mid-stream failure: partial output, then an error event with code stream_cut', async () => {
  const res = await call({ messages: [userMsg('weekly review')], files, demo: true, sabotage: 'midstream' });
  assert.equal(res.status, 200, 'the stream starts normally');
  const sse = await res.text();
  assert.match(sse, /"type":"text-delta"/, 'some of the answer arrived before the cut');
  const err = sse.split('\n').find((l) => l.includes('"type":"error"'));
  assert.ok(err, 'an error event is sent');
  assert.match(err!, /stream_cut/, 'the error is the designed stream_cut problem');
});

test('rate limit: 429 with Retry-After and a JSON problem', async () => {
  const res = await call({ messages: [userMsg('weekly review')], files, sabotage: 'rate-limit' });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '12');
  assert.equal((await res.json()).code, 'rate_limit');
});

test('route handler throws: 500 JSON problem, not an HTML error page', async () => {
  const res = await call({ messages: [userMsg('weekly review')], files, sabotage: 'route-throw' });
  assert.equal(res.status, 500);
  assert.equal((await res.json()).code, 'server_error');
});

test('empty and oversized input are rejected with a reason', async () => {
  assert.equal((await (await call({ messages: [] })).json()).code, 'empty_input');
  assert.equal((await (await call({ messages: [userMsg('   ')] })).json()).code, 'empty_input');
  const long = await call({ messages: [userMsg('x'.repeat(2001))] });
  assert.equal(long.status, 413);
  assert.equal((await long.json()).code, 'too_long');
});

test('malformed request body is a 400 problem', async () => {
  const res = await POST(new Request('http://x/api/chat', { method: 'POST', body: '{not json' }));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).code, 'bad_request');
});

test('malformed tool data becomes a tool error, not a crash', async () => {
  const res = await call({ messages: [userMsg('weekly review')], files, demo: true, sabotage: 'malformed' });
  const sse = await res.text();
  assert.match(sse, /"type":"tool-output-error"[^\n]*Malformed data/);
});
