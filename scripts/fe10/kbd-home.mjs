// Keyboard-only pass through the portfolio's primary flow: skip link, menu, a case study link, contact form.
fs.mkdirSync('fe10-out', { recursive: true });
import { chromium } from 'playwright'; import fs from 'node:fs';
const [,, url, tag] = process.argv; const log = []; const say = (s) => { log.push(s); console.log(s); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/api/contact', async (r) => { await new Promise((x) => setTimeout(x, 600)); r.fulfill({ json: { ok: true } }); });
const errors = []; p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
const focus = () => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY (focus lost)'; const cs = getComputedStyle(e); return `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.innerText || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 34)}" ring=${cs.outlineStyle !== 'none' ? cs.outlineWidth + ' ' + cs.outlineColor : 'none'}`; });
await p.keyboard.press('Tab'); say(`1st Tab: ${await focus()}`);
await p.screenshot({ path: `fe10-out/${tag}-home-skip.png` });
await p.keyboard.press('Enter'); await p.keyboard.press('Tab'); say(`After skip link + Tab: ${await focus()}`);
// menu
await p.goto(url, { waitUntil: 'networkidle' });
let menuStops = 0; for (; menuStops < 6; menuStops++) { await p.keyboard.press('Tab'); if ((await focus()).includes('menu')) break; }
say(`Menu button: ${await focus()}`); await p.keyboard.press('Enter'); await p.keyboard.press('Tab'); say(`Menu open, next Tab: ${await focus()}`);
await p.screenshot({ path: `fe10-out/${tag}-home-menu.png` });
await p.keyboard.press('Escape'); say(`Escape closes the menu: ${await p.locator('.menu').getAttribute('aria-expanded') === 'false'}`);
// contact form by keyboard
await p.goto(url + '#contact', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
await p.locator('input[name=name]').focus();
say(`Name field: ${await focus()}`);
await p.screenshot({ path: `fe10-out/${tag}-home-form-focus.png` });
await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); say(`Tab x3 from Name, empty form: ${await focus()}`);
await p.keyboard.press('Enter'); await p.waitForTimeout(200); say(`Submit empty form: focus = ${await focus()}`);
await p.locator('input[name=name]').focus(); await p.keyboard.type('Test Person'); await p.keyboard.press('Tab'); await p.keyboard.type('test@example.com'); await p.keyboard.press('Tab'); await p.keyboard.type('Hello from a keyboard-only test run.');
for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); if ((await focus()).includes('Send message')) break; }
say(`On submit: ${await focus()}`); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
say(`While sending: focus = ${await focus()}`); await p.waitForTimeout(1200);
say(`After sent: focus = ${await focus()}`);
await p.screenshot({ path: `fe10-out/${tag}-home-sent.png` });
for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); if ((await focus()).includes('Send another')) break; }
say(`Next Tab: ${await focus()}`); await p.keyboard.press('Enter'); await p.waitForTimeout(200); say(`"Send another message": focus = ${await focus()}`);
say(`Console errors (hydration etc.): ${errors.length ? errors.join(' | ').slice(0, 300) : 'none'}`);
fs.writeFileSync(`fe10-out/${tag}-kbd-home.txt`, log.join('\n')); await b.close();
