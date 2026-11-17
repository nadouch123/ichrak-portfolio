// The chat message renderer, one part type at a time.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { MessageView } from '../../src/MessageView';
import type { CoachMessage } from '../../lib/tools';

const noop = () => {};
function show(message: { role?: 'user' | 'assistant'; parts: any[] }, opts: { live?: boolean; onRetryTool?: () => void } = {}) {
  const m = { id: 'm1', role: 'assistant', ...message } as unknown as CoachMessage;
  return render(<MessageView message={m} live={opts.live ?? true} busy={false} onApprovePlan={noop} onRejectPlan={noop} onRetryTool={opts.onRetryTool ?? noop} />);
}
const tool = (type: string, state: string, extra: object = {}): any => ({ type, toolCallId: 'c1', state, ...extra });

describe('MessageView: text parts', () => {
  test('user text is shown exactly as typed, never as HTML', () => {
    show({ role: 'user', parts: [{ type: 'text', text: 'Is <b>bold</b> allowed?' }] });
    const msg = screen.getByRole('article', { name: 'You' });
    expect(msg).toHaveTextContent('Is <b>bold</b> allowed?');
    expect(within(msg).queryByText('bold', { selector: 'b' })).not.toBeInTheDocument();
  });

  test('assistant markdown becomes real lists and emphasis, with scripts stripped', () => {
    show({ parts: [{ type: 'text', text: 'You **finished** two things:\n\n- FE-08\n- the spec\n\n<img src=x onerror="alert(1)"><script>alert(2)</script>' }] });
    const msg = screen.getByRole('article', { name: 'Coach' });
    expect(within(msg).getByText('finished', { selector: 'strong' })).toBeInTheDocument();
    expect(within(msg).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['FE-08', 'the spec']);
    expect(msg.querySelector('script')).toBeNull();
    expect(msg.querySelector('[onerror]')).toBeNull();
  });

  test('blank text and part types the UI does not know are skipped without breaking the message', () => {
    show({ parts: [{ type: 'step-start' }, { type: 'text', text: '   ' }, { type: 'reasoning', text: 'hidden' }, { type: 'text', text: 'Only this.' }] });
    expect(screen.getByRole('article', { name: 'Coach' })).toHaveTextContent(/^Only this\.$/);
  });
});

describe('MessageView: tool parts in each state', () => {
  test('input-streaming: names the tool, says the request is being written, and shows the reason as it arrives', () => {
    show({ parts: [tool('tool-readFile', 'input-streaming', { input: { reason: 'Read this week' } })] });
    const card = screen.getByRole('region', { name: 'Read a file: Preparing' });
    expect(card).toHaveTextContent('Writing the request');
    expect(card).toHaveTextContent('Why this toolRead this week');
  });

  test('input-available: shows why the tool was chosen and the exact input while it runs', () => {
    show({ parts: [tool('tool-readFile', 'input-available', { input: { name: 'week-05.md', reason: 'Read this week’s notes.' } })] });
    const card = screen.getByRole('region', { name: 'Read a file: Running' });
    expect(card).toHaveTextContent('Read this week’s notes.');
    expect(card).toHaveTextContent('📄 week-05.md');
    expect(card).toHaveTextContent('Reading the file…');
  });

  test('output-error: explains what failed and what to do, and Try again asks the coach to retry', async () => {
    const onRetryTool = vi.fn();
    show({ parts: [tool('tool-checkPortfolio', 'output-error', { input: { reason: 'Confirm what is live.' }, errorText: 'None of the 6 portfolio pages answered.' })] }, { onRetryTool });
    const card = screen.getByRole('region', { name: 'Check live portfolio: Failed' });
    const alert = within(card).getByRole('alert');
    expect(alert).toHaveTextContent('This step failed');
    expect(alert).toHaveTextContent('None of the 6 portfolio pages answered.');
    expect(alert).toHaveTextContent('the coach just can’t confirm what is live');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(onRetryTool).toHaveBeenCalledOnce();
  });

  test('a tool still running when its reply has ended is shown as interrupted, not as spinning forever', () => {
    show({ parts: [tool('tool-listFiles', 'input-available', { input: { reason: 'x' } })] }, { live: false });
    expect(screen.getByRole('region', { name: 'List my files: Interrupted' })).toHaveTextContent('cut off before it finished');
  });

  test('a result that cannot be drawn is contained to its own card; the rest of the message still shows', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    show({ parts: [
      { type: 'text', text: 'Here are your files.' },
      tool('tool-listFiles', 'output-available', { input: { reason: 'x' }, output: { files: null } }),
    ] });
    expect(screen.getByRole('alert')).toHaveTextContent('This result couldn’t be shown. The rest of the chat is fine.');
    expect(screen.getByRole('article', { name: 'Coach' })).toHaveTextContent('Here are your files.');
  });
});
