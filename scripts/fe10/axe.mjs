// axe-core (WCAG 2.2 A/AA + best practices) on every page, phone and desktop widths.
import { createRequire } from 'node:module';
import { chromium } from 'playwright'; import fs from 'node:fs';
const axeSrc = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const [,, base, coach, out] = process.argv;
const pages = ['/', '/audit/', '/tool-ui/', '/edge-cases/', '/testing/', '/3d/', '/playground/', '/agent-build/', '/agent-spec/', '/cv/'].map(p => [p, base + p]);
pages.push(['coach', coach + '/']);
const b = await chromium.launch(); const res = {};
for (const [w, h, tag] of [[390, 844, 'phone'], [1280, 900, 'desktop']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  for (const [name, url] of pages) {
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }));
    res[tag + ' ' + name] = r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary||'').split('\n').slice(1,2).join(' ')) }));
    console.log(tag, name, r.violations.length ? r.violations.map(v => `${v.id}[${v.impact}]x${v.nodes.length}`).join(', ') : 'clean');
    await p.close();
  }
}
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
