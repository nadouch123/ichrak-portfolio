// Keyboard-only pass through the coach chat. Mouse is never used.
fs.mkdirSync('fe10-out', { recursive: true });
import { chromium } from 'playwright'; import fs from 'node:fs';
const [,, url, tag] = process.argv; const log = []; const say = (s) => { log.push(s); console.log(s); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
const p = await ctx.newPage();
// record what the polite live regions would announce (text added/changed inside any aria-live / role=log|status|alert subtree)
await p.addInitScript(() => {
  window.__ann = [];
  const live = (n) => { for (let e = n.nodeType === 1 ? n : n.parentElement; e; e = e.parentElement) { const r = e.getAttribute('role'); const l = e.getAttribute('aria-live'); if (l === 'off') return null; if (l || ['log','status','alert'].includes(r)) return e; } return null; };
  new MutationObserver((ms) => { for (const m of ms) { const t = m.target; const reg = live(t); if (!reg) continue; const txt = (m.type === 'characterData' ? t.data : [...m.addedNodes].map((n) => n.textContent).join(' ')).trim(); if (txt) window.__ann.push(txt.slice(0, 80)); } })
    .observe(document, { subtree: true, childList: true, characterData: true });
});
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
const focus = () => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY (focus lost)'; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName.toLowerCase()}${e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label') + ']' : ''} "${(e.innerText || e.value || e.placeholder || '').trim().slice(0, 40)}" outline=${cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px' ? cs.outlineWidth + ' ' + cs.outlineColor : 'none'} shadow=${cs.boxShadow !== 'none' ? 'yes' : 'no'}`; });
// 1. tab order
const stops = []; for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); stops.push(await focus()); }
say('TAB ORDER (first 25 stops):'); stops.forEach((s, i) => say(`  ${i + 1}. ${s}`));
const uploadReachable = stops.some((s) => s.startsWith('input'));
say(`Upload input reachable by Tab: ${uploadReachable}`);
// 2. reach the composer, type, send with Enter
await p.focus('textarea[aria-label="Message the coach"]'); // shortcut after the tab audit above proved its position
let toComposer = stops.findIndex((s) => s.includes('Message the coach')) + 1; say(`Tabs to reach the composer: ${toComposer || 'not in first 25'}`);
await p.keyboard.type('weekly review'); await p.keyboard.press('Enter');
await p.waitForTimeout(250);
say(`After Enter: focus = ${await focus()}`);
await p.keyboard.press('Tab'); const st = await focus(); say(`One Tab later: ${st}`);
await p.screenshot({ path: `fe10-out/${tag}-kbd-stop-focused.png` });
const stopOk = /stop/i.test(st);
if (stopOk) { await p.keyboard.press('Enter'); await p.waitForTimeout(300); say(`Pressed Enter on Stop -> focus = ${await focus()}`); say('Status note: ' + await p.locator('.note').first().innerText().catch(() => 'none')); }
// Escape as a stop shortcut
await p.focus('textarea[aria-label="Message the coach"]'); await p.keyboard.type('weekly review'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
say(`Escape while streaming stops it: ${await p.locator('.btn--stop').count() === 0 ? 'yes' : 'no'}`);
await p.waitForFunction(() => !document.querySelector('.btn--stop'), null, { timeout: 30000 });
// 3. send with the Send button via keyboard
await p.focus('textarea[aria-label="Message the coach"]'); await p.keyboard.type('weekly review'); await p.keyboard.press('Tab');
say(`Tab from composer: ${await focus()}`); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
say(`After pressing Send with Enter: focus = ${await focus()}`);
// wait for the plan card
await p.waitForSelector('text=Approve and save', { timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('.btn--stop'), null, { timeout: 30000 });
say(`Stream finished: focus = ${await focus()}`);
const ann = await p.evaluate(() => window.__ann); say(`Live-region updates during the whole review: ${ann.length}`); say('  first 12: ' + JSON.stringify(ann.slice(0, 12)));
fs.writeFileSync(`fe10-out/${tag}-announcements.json`, JSON.stringify(ann, null, 1));
// 4. approve plan by keyboard: Shift+Tab back from the composer until we hit it
await p.focus('textarea[aria-label="Message the coach"]'); let found = false;
for (let i = 0; i < 30; i++) { await p.keyboard.press('Shift+Tab'); if ((await focus()).includes('Approve and save')) { found = true; break; } }
say(`Approve reachable by Shift+Tab: ${found}`); await p.screenshot({ path: `fe10-out/${tag}-kbd-approve-focused.png` });
if (found) { await p.keyboard.press('Enter'); await p.waitForTimeout(1500); say(`After approving: focus = ${await focus()}`); }
// 5. file modal: open by keyboard, try to Tab out, Escape, check focus restore
// on a phone the files live behind the "My knowledge files" toggle: open it by keyboard first
await p.locator('.side__toggle').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
say(`Files panel expanded: ${await p.locator('.side__toggle').getAttribute('aria-expanded')}`);
const sideStops = []; for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); sideStops.push(await focus()); }
say('Tab stops inside the files panel: ' + sideStops.map((s) => s.split(' outline')[0]).join(' | '));
say(`Upload input reachable by Tab (panel open): ${sideStops.some((s) => s.startsWith('input'))}`);
await p.locator('.side__toggle').focus(); await p.keyboard.press('Tab'); say(`First file button: ${await focus()}`);
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
say(`Modal open: focus = ${await focus()}`);
let escaped = false; for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); const inModal = await p.evaluate(() => !!document.activeElement?.closest('[role=dialog]')); if (!inModal) { escaped = true; break; } }
say(`Tab escapes the open modal: ${escaped}`);
await p.focus('[role=dialog] textarea').catch(() => {}); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
say(`After Escape: dialog open = ${await p.locator('[role=dialog]').count() > 0}, focus = ${await focus()}`);
fs.writeFileSync(`fe10-out/${tag}-kbd-coach.txt`, log.join('\n')); await b.close();
