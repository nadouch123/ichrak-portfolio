// Tool results render as real components, not JSON.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ToolPartView, type ToolPart } from '../../src/ToolParts';

const done = (type: string, input: object, output: object) => ({ type, toolCallId: 'c1', state: 'output-available', input, output }) as unknown as ToolPart;
function show(part: ToolPart, h: { onApprovePlan?: any; onRejectPlan?: any } = {}) {
  return render(<ToolPartView part={part} onApprovePlan={h.onApprovePlan ?? vi.fn()} onRejectPlan={h.onRejectPlan ?? vi.fn()} onRetry={vi.fn()} />);
}

describe('tool results', () => {
  test('weekly review card: finished items with their source, learnings, open work, and a warning for unverified sources', () => {
    show(done('tool-showWeeklyReview', {}, {
      week: 5,
      finished: [{ item: 'FE-08 shipped', source: 'week-05.md', verified: true }, { item: 'Spec', source: 'week-04.md', verified: false }],
      learned: ['Errors first.', 'Four states.', 'Safe retry.'],
      open: [{ title: 'FE-09 testing pass', due: 'Week 6' }],
      unverified: 1,
    }));
    const card = screen.getByRole('article');
    expect(within(card).getByRole('heading', { name: 'Week 5 review' })).toBeInTheDocument();
    const finished = within(card).getByRole('heading', { name: 'Finished' }).parentElement!;
    expect(within(finished).getByText('✓ week-05.md')).toHaveAccessibleDescription('This file exists in your knowledge files');
    expect(within(finished).getByText('? week-04.md')).toHaveAccessibleDescription('This file is not in your knowledge files');
    expect(within(card).getAllByRole('listitem')).toHaveLength(2 + 3 + 1);
    expect(card).toHaveTextContent('1 source could not be matched to your files.');
  });

  test('file preview shows the first lines and expands to the whole file on request', async () => {
    const content = ['# Week 5', 'one', 'two', 'three', 'four', 'five'].join('\n');
    show(done('tool-readFile', { name: 'week-05.md' }, { name: 'week-05.md', kind: 'notes', lines: 6, content }));
    const region = screen.getByRole('region', { name: 'Read a file: Done' });
    expect(region).toHaveTextContent('week-05.md · 6 lines');
    expect(region).not.toHaveTextContent('five');
    await userEvent.click(within(region).getByRole('button', { name: 'Show the whole file' }));
    expect(region).toHaveTextContent('five');
    expect(within(region).getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  test('portfolio check draws a chart with an accessible summary of every page', () => {
    show(done('tool-checkPortfolio', {}, {
      checkedAt: '2026-11-17T10:00:00Z',
      pages: [{ path: '/', ok: true, status: 200, ms: 120, title: 'Home' }, { path: '/cv/', ok: false, status: 404, ms: 80, title: null }],
    }));
    expect(screen.getByText('1/2 pages online')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Response times: / 120 ms, /cv/ 80 ms' })).toBeInTheDocument();
    expect(screen.getByText('HTTP 404')).toBeInTheDocument();
  });

  test('plan proposal waits for the user: Approve saves, Ask for changes sends the feedback', async () => {
    const user = userEvent.setup();
    const onApprovePlan = vi.fn();
    const onRejectPlan = vi.fn();
    const part = { type: 'tool-proposePlan', toolCallId: 'p1', state: 'input-available', input: { week: 6, items: [{ task: 'Write tests', why: 'FE-09' }] } } as unknown as ToolPart;
    show(part, { onApprovePlan, onRejectPlan });

    expect(screen.getByRole('region', { name: 'Next week’s plan: Running' })).toHaveTextContent('Your call');
    expect(screen.getByText('Nothing is saved until you approve.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Approve and save' }));
    expect(onApprovePlan).toHaveBeenCalledWith(part);

    await user.click(screen.getByRole('button', { name: 'Ask for changes' }));
    await user.type(screen.getByRole('textbox', { name: 'What should change?' }), 'Add CI');
    await user.click(screen.getByRole('button', { name: 'Send changes' }));
    expect(onRejectPlan).toHaveBeenCalledWith(part, 'Add CI');
  });

  test('approved plan shows where it was saved', () => {
    show(done('tool-proposePlan', { week: 6, items: [{ task: 'Write tests' }] }, { approved: true, savedAs: 'plan-week-06.md' }));
    expect(screen.getByRole('region', { name: 'Next week’s plan: Done' })).toHaveTextContent('✓ Approved and saved as plan-week-06.md');
  });
});
