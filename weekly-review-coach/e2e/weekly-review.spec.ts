// Primary flow, end to end in a real browser: open the coach, start the weekly review,
// watch the tools run, approve next week's plan, and find it saved in the knowledge files.
// The AI route is mocked with page.route, so the test never calls a model.
import { expect, test } from '@playwright/test';
import { SSE_HEADERS, reviewTurn, savedTurn, toSSE } from '../tests/support/ui-stream';

test('weekly review: start, see the review card, approve the plan, plan is saved', async ({ page }) => {
  const chatRequests: any[] = [];
  await page.route('**/api/status', (route) => route.fulfill({ json: { mode: 'demo', model: 'test double' } }));
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON();
    chatRequests.push(body);
    const chunks = chatRequests.length === 1 ? reviewTurn() : savedTurn();
    await route.fulfill({ status: 200, headers: SSE_HEADERS, body: toSSE(chunks) });
  });
  // Anything else leaving the page (besides the app itself and its fonts) is blocked and fails the test at the end.
  const unexpected: string[] = [];
  await page.route(/^https?:\/\/(?!localhost|fonts\.(googleapis|gstatic)\.com)/, (route) => {
    unexpected.push(route.request().url());
    return route.abort();
  });

  await page.goto('/');
  const files = page.getByRole('complementary');
  await expect(files.getByRole('button', { name: 'Remove week-05.md' })).toBeVisible();

  await page.getByRole('button', { name: 'Start my weekly review' }).click();

  const conversation = page.getByRole('log', { name: 'Conversation' });
  await expect(conversation.getByRole('article', { name: 'You' })).toHaveText('weekly review');
  await expect(conversation.getByRole('region', { name: 'List my files: Done' })).toBeVisible();
  await expect(conversation.getByRole('region', { name: 'Read a file: Done' })).toContainText('week-05.md · 6 lines');
  const review = conversation.getByRole('region', { name: 'Weekly review: Done' });
  await expect(review.getByRole('heading', { name: 'Week 5 review' })).toBeVisible();
  await expect(review).toContainText('FE-08 edge cases shipped');
  await expect(review).toContainText('FE-09 testing pass');

  // the coach sent the user's own notes with the request
  expect(chatRequests[0].files.map((f: { name: string }) => f.name)).toContain('week-05.md');

  const plan = conversation.getByRole('region', { name: 'Next week’s plan: Running' });
  await expect(plan).toContainText('Save this as your plan for Week 6?');
  await plan.getByRole('button', { name: 'Approve and save' }).click();

  await expect(conversation.getByRole('region', { name: 'Next week’s plan: Done' })).toContainText('Approved and saved as plan-week-06.md');
  await expect(conversation.getByRole('article', { name: 'Coach' }).last()).toContainText('Saved. Good luck with Week 6!');
  await expect(files.getByRole('button', { name: /plan-week-06\.md/ }).first()).toBeVisible();

  // the approval went back to the coach as the tool's result
  expect(chatRequests).toHaveLength(2);
  const planPart = chatRequests[1].messages.at(-1).parts.find((p: any) => p.type === 'tool-proposePlan');
  expect(planPart.output).toEqual({ approved: true, savedAs: 'plan-week-06.md' });
  expect(unexpected).toEqual([]);
});
