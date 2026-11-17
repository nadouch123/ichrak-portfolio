// End-to-end sabotage: the mid-stream failure renders the designed error, and Retry recovers.
// Run against the local server (npm run dev:full) or a preview: BASE_URL=https://… npm run test:e2e
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // playwright is not a dependency; install it or use a global copy
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5180';
const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(e.message));

try {
  await page.goto(BASE + '/?demo');
  await page.waitForSelector('.kfile');

  // 1. arm the sabotage and send
  await page.selectOption('.sabotage select', 'midstream');
  await page.getByRole('button', { name: 'Start my weekly review' }).click();

  // 2. part of the answer arrives, then the designed error appears
  const err = page.locator('.err--global[data-code="stream_cut"]');
  await err.waitFor({ timeout: 20000 });
  assert.match(await err.innerText(), /The answer was cut off/);
  assert.ok(await page.locator('.bubble').first().isVisible(), 'the partial answer is kept');
  assert.equal(await page.locator('.sabotage select').inputValue(), '', 'sabotage switched itself off');

  // 3. retry says what it will retry, and only fires once even on a double click
  const retry = page.getByRole('button', { name: /Retry/ });
  assert.match(await retry.innerText(), /weekly review/);
  await retry.dblclick();
  await page.waitForSelector('.err--global', { state: 'detached', timeout: 5000 });
  const userBubbles = await page.locator('.bubble--user').count();
  assert.equal(userBubbles, 1, 'retry re-sends the failed message, it does not add a second one');

  // 4. the retried turn completes
  await page.getByRole('button', { name: 'Approve and save' }).waitFor({ timeout: 60000 });
  const real = consoleErrors.filter((t) => !/Failed to load resource/.test(t));
  console.log('PASS mid-stream failure → designed error → retry → full review');
  if (real.length) console.log('console errors seen:', real);
} finally {
  await browser.close();
}
