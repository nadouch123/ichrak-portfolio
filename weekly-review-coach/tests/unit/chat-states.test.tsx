// The whole chat (App) against a mocked /api/chat: pending, streaming, error and recovery.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from '../../src/App';
import { controlledStream, mockAiRoute, never, problem, sseResponse } from '../support/mock-ai-route';
import { step, text, toolCall, turn } from '../support/ui-stream';

async function renderChat() {
  const user = userEvent.setup();
  render(<App />);
  // starter notes are loaded from /data before the review can start
  await screen.findByRole('button', { name: 'Remove week-05.md' });
  return user;
}
const conversation = () => screen.getByRole('log', { name: 'Conversation' });
const coachMessages = () => within(conversation()).queryAllByRole('article', { name: 'Coach' });

describe('chat states', () => {
  test('pending: while the request is out, the coach says it is choosing and Send becomes Stop', async () => {
    const { calls } = mockAiRoute(() => never());
    const user = await renderChat();

    await user.type(screen.getByRole('textbox', { name: 'Message the coach' }), 'What did I finish?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/Coach is choosing what to do/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop the answer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    expect(within(conversation()).getByRole('article', { name: 'You' })).toHaveTextContent('What did I finish?');
    // the request carries the user's notes, so the coach can only answer from them
    expect(calls[0].files.map((f) => f.name)).toEqual(['week-05.md', 'assignments.md', 'review-template.md']);
  });

  test('streaming: partial text and a preparing tool show up as they arrive, then the turn settles', async () => {
    const stream = controlledStream();
    mockAiRoute(() => stream.response());
    const user = await renderChat();

    await user.click(screen.getByRole('button', { name: 'Start my weekly review' }));
    stream.push({ type: 'start' }, { type: 'start-step' }, { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Reading your ' });

    await waitFor(() => expect(coachMessages()[0]).toHaveTextContent('Reading your'));
    expect(screen.queryByText(/Coach is choosing what to do/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop the answer' })).toBeInTheDocument();

    stream.push({ type: 'text-delta', id: 't', delta: 'notes now.' }, { type: 'text-end', id: 't' });
    stream.push({ type: 'tool-input-start', toolCallId: 'c1', toolName: 'listFiles' });
    expect(await screen.findByRole('region', { name: 'List my files: Preparing' })).toHaveTextContent('Writing the request');
    expect(coachMessages()[0]).toHaveTextContent('Reading your notes now.');

    stream.push(
      { type: 'tool-input-available', toolCallId: 'c1', toolName: 'listFiles', input: { reason: 'See what you uploaded.' } },
      { type: 'tool-output-available', toolCallId: 'c1', output: { files: [{ name: 'week-05.md', kind: 'notes', chars: 40, week: 5 }] } },
      { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' },
    );
    stream.end();

    expect(await screen.findByRole('region', { name: 'List my files: Done' })).toHaveTextContent('week-05.md');
    expect(await screen.findByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop the answer' })).not.toBeInTheDocument();
  });

  test('error: a rate limit shows the designed message and a retry that waits', async () => {
    mockAiRoute(() => problem(429, { code: 'rate_limit', message: 'The model is getting too many requests right now.', retryAfter: 12 }));
    const user = await renderChat();

    await user.click(screen.getByRole('button', { name: 'Start my weekly review' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Too many requests');
    expect(alert).toHaveTextContent('The model is getting too many requests right now.');
    expect(within(alert).getByRole('button', { name: /Retry in 1[12]s/ })).toBeDisabled();
  });

  test('error mid-stream: the partial answer is kept, and Retry re-sends the same message once', async () => {
    mockAiRoute((_body, call) => call === 1
      ? sseResponse([{ type: 'start' }, { type: 'start-step' }, ...text('t', 'Your week started well '), { type: 'error', errorText: JSON.stringify({ code: 'stream_cut', message: 'The connection dropped.' }) }])
      : sseResponse(turn([step(text('t2', 'Here is the full review.'))])));
    const user = await renderChat();

    await user.click(screen.getByRole('button', { name: 'Start my weekly review' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The answer was cut off');
    expect(coachMessages()[0]).toHaveTextContent('Your week started well');

    await user.dblClick(within(alert).getByRole('button', { name: /Retry .*weekly review/ }));

    await waitFor(() => expect(coachMessages().at(-1)).toHaveTextContent('Here is the full review.'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(within(conversation()).getAllByRole('article', { name: 'You' })).toHaveLength(1);
  });

  test('error: a failed tool shows in its own card and the rest of the answer still renders', async () => {
    mockAiRoute(() => sseResponse(turn([
      step(toolCall('c1', 'readFile', { name: 'week-06.md', reason: 'Read Week 6 notes.' }, { errorText: 'There is no file called “week-06.md”. Files you have: week-05.md.' })),
      step(text('t', 'I could not find your Week 6 notes. Can you upload them?')),
    ])));
    const user = await renderChat();

    await user.click(screen.getByRole('button', { name: 'Start my weekly review' }));

    const card = await screen.findByRole('region', { name: 'Read a file: Failed' });
    expect(within(card).getByRole('alert')).toHaveTextContent('File not found');
    expect(card).toHaveTextContent('It was trying to: Read Week 6 notes.');
    expect(coachMessages()[0]).toHaveTextContent('Can you upload them?');
  });

  test('input: empty and over-long messages are stopped before any request is made', async () => {
    const { calls } = mockAiRoute(() => never());
    const user = await renderChat();
    const box = screen.getByRole('textbox', { name: 'Message the coach' });

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.type(box, '   {Enter}');
    expect(box).toHaveAccessibleDescription('Type a question first, or pick one of the starters above.');

    await user.click(box);
    await user.paste('x'.repeat(2001));
    expect(box).toBeInvalid();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(calls).toHaveLength(0);
  });
});
