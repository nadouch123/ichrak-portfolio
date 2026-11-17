// @vitest-environment node
// The server half of the form: validation rules and the spam trap. Resend is never called.
import { describe, expect, test, vi } from 'vitest';
import handler, { validate } from '../api/contact.js';

function call(body) {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return handler({ method: 'POST', body }, res).then(() => res);
}

describe('contact API', () => {
  test('validate: trims input and names every problem field', () => {
    expect(validate({ name: '  Sam   Lee ', email: ' sam@example.com ', message: 'A full sentence here.' }))
      .toEqual({ name: 'Sam Lee', email: 'sam@example.com', message: 'A full sentence here.', errors: {} });
    expect(Object.keys(validate({ name: '', email: 'nope', message: 'hi' }).errors)).toEqual(['name', 'email', 'message']);
  });

  test('invalid input gets a 422 with field errors, and nothing is sent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await call({ name: 'Sam', email: 'bad', message: 'A full sentence here.' });
    expect(res.statusCode).toBe(422);
    expect(res.body.fields).toEqual({ email: 'That email does not look right.' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('the hidden spam-trap field makes the request look successful but sends nothing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await call({ name: 'Bot', email: 'bot@example.com', message: 'Buy now buy now', company: 'Spam Inc' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
