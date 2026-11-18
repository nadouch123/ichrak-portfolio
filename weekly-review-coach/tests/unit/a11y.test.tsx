// FE-10: streamed output is announced politely in sentences, and the chat works from the keyboard alone.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from '../../src/App';
import { lastSentenceEnd, speakable } from '../../src/a11y';
import { controlledStream, mockAiRoute, never } from '../support/mock-ai-route';

async function renderChat() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('button', { name: 'Remove week-05.md' });
  return user;
}

describe('announcer helpers', () => {
  test('speakable strips markdown a screen reader would read out', () => {
    expect(speakable('**Done:** see `week-05.md` and [the plan](/plan)\n- one\n- two')).toBe('Done: see week-05.md and the plan one two');
  });
  test('lastSentenceEnd only cuts after a finished sentence', () => {
    expect(lastSentenceEnd('Reading your')).toBe(-1);
    expect(lastSentenceEnd('Reading your notes. Then the')).toBe('Reading your notes.'.length);
  });
});

describe('chat accessibility', () => {
  test('the conversation is not a chatty live region; one polite region speaks whole sentences', async () => {
    const stream = controlledStream();
    mockAiRoute(() => stream.response());
    const user = await renderChat();
    expect(screen.getByRole('log', { name: 'Conversation' })).toHaveAttribute('aria-live', 'off');
    const announcer = screen.getByTestId('announcer');
    expect(announcer).toHaveAttribute('aria-live', 'polite');

    await user.click(screen.getByRole('button', { name: 'Start my weekly review' }));
    await waitFor(() => expect(announcer).toHaveTextContent('Coach is answering.'));
    stream.push({ type: 'start' }, { type: 'start-step' }, { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Reading your ' });
    await new Promise((r) => setTimeout(r, 50));
    expect(announcer).not.toHaveTextContent('Reading your'); // half a sentence is never read
    stream.push({ type: 'text-delta', id: 't', delta: 'notes now. Then I' });
    await waitFor(() => expect(announcer).toHaveTextContent('Reading your notes now.'), { timeout: 3000 });
    expect(announcer).not.toHaveTextContent('Then I');
    stream.push({ type: 'text-delta', id: 't', delta: ' check the site' }, { type: 'text-end', id: 't' }, { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' });
    stream.end();
    await waitFor(() => expect(announcer).toHaveTextContent('Then I check the site'), { timeout: 3000 });
  });

  test('keyboard: Send by Enter on the button moves focus to Stop, Escape stops, focus returns to the message box', async () => {
    const stream = controlledStream();
    mockAiRoute(() => stream.response());
    const user = await renderChat();
    const box = screen.getByRole('textbox', { name: 'Message the coach' });
    await user.click(box);
    await user.keyboard('What did I finish?');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Send' })).toHaveFocus();
    await user.keyboard('{Enter}');
    const stop = await screen.findByRole('button', { name: 'Stop the answer' });
    await waitFor(() => expect(stop).toHaveFocus());
    expect(stop).toHaveAttribute('aria-keyshortcuts', 'Escape');
    stream.push({ type: 'start' }, { type: 'start-step' }, { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Looking at your notes' });
    await screen.findByText(/Looking at your notes/);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop the answer' })).not.toBeInTheDocument());
    expect(screen.getByText(/You stopped this answer/)).toBeInTheDocument();
    await waitFor(() => expect(box).toHaveFocus());
  });

  test('the upload control is reachable by keyboard (it used to be `hidden`)', async () => {
    mockAiRoute(() => never());
    await renderChat();
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    expect(input.hidden).toBe(false);
    expect(input.tabIndex).toBe(0);
  });
});
