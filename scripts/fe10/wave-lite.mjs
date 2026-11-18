// WAVE-style pass: re-implements WAVE's error rules and its most common alerts in the page,
// so it runs headless in CI (the WAVE extension itself needs a real browser profile).
import { chromium } from 'playwright'; import fs from 'node:fs';
const [,, base, coach, out] = process.argv;
const pages = ['/', '/audit/', '/tool-ui/', '/edge-cases/', '/testing/', '/3d/', '/playground/', '/agent-build/', '/agent-spec/', '/cv/'].map((p) => [p, base + p]); pages.push(['coach', coach + '/']);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const res = {};
for (const [name, url] of pages) {
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  res[name] = await p.evaluate(() => {
    const E = {}, A = {}; const add = (o, k, el) => { (o[k] ??= []).push((el.outerHTML || '').slice(0, 90)); };
    const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[hidden],[aria-hidden=true]'); };
    const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') || '').split(' ').map((id) => document.getElementById(id)?.textContent || '').join(' ') || el.textContent || el.querySelector('img[alt]')?.alt || el.getAttribute('title') || '').trim();
    // ERRORS
    if (!document.documentElement.lang) add(E, 'language_missing', document.documentElement);
    if (!document.title.trim()) add(E, 'title_invalid', document.documentElement);
    document.querySelectorAll('img:not([alt])').forEach((el) => add(E, el.closest('a') ? 'alt_link_missing' : 'alt_missing', el));
    document.querySelectorAll('a[href]').forEach((el) => { if (vis(el) && !name(el)) add(E, 'link_empty', el); });
    document.querySelectorAll('button').forEach((el) => { if (vis(el) && !name(el)) add(E, 'button_empty', el); });
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => { if (vis(el) && !el.textContent.trim()) add(E, 'heading_empty', el); });
    document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea').forEach((el) => {
      if (el.closest('[aria-hidden=true]')) return;
      const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.title;
      if (!labelled) add(E, 'label_missing', el);
    });
    document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]').forEach((el) => {
      for (const a of ['aria-labelledby', 'aria-describedby', 'aria-controls']) (el.getAttribute(a) || '').split(/\s+/).filter(Boolean).forEach((id) => { if (!document.getElementById(id)) add(E, 'aria_reference_broken', el); });
    });
    document.querySelectorAll('a[href^="#"]').forEach((el) => { const id = el.getAttribute('href').slice(1); if (id && !document.getElementById(id)) add(E, 'link_skip_broken', el); });
    // ALERTS
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis); let prev = 0;
    hs.forEach((h) => { const l = +h.tagName[1]; if (prev && l > prev + 1) add(A, 'heading_skipped', h); prev = l; });
    if (!hs.some((h) => h.tagName === 'H1')) add(A, 'h1_missing', document.body);
    if (!document.querySelector('main,[role=main]')) add(A, 'region_main_missing', document.body);
    const links = [...document.querySelectorAll('a[href]')].filter(vis);
    links.forEach((a, i) => { const n = links[i + 1]; if (n && n.href === a.href && a.parentElement === n.parentElement) add(A, 'link_redundant', a); });
    document.querySelectorAll('[tabindex]').forEach((el) => { if (+el.getAttribute('tabindex') > 0) add(A, 'tabindex', el); });
    document.querySelectorAll('noscript').forEach((el) => add(A, 'noscript', el));
    document.querySelectorAll('img[alt]').forEach((el) => { if (el.alt.length > 150) add(A, 'alt_long', el); });
    document.querySelectorAll('*').forEach((el) => { if (el.children.length === 0 && el.textContent.trim() && vis(el)) { const cs = getComputedStyle(el); if (parseFloat(cs.fontSize) < 10) add(A, 'text_small', el); if (cs.textAlign === 'justify') add(A, 'text_justified', el); } });
    document.querySelectorAll('a[target=_blank]').forEach((el) => { if (!/new tab|new window/i.test(name(el) + (el.querySelector('.sr-only')?.textContent || ''))) add(A, 'link_new_window_unannounced', el); });
    return { errors: Object.fromEntries(Object.entries(E).map(([k, v]) => [k, v.length])), alerts: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, v.length])), sample: { ...E, ...A } };
  });
  const r = res[name]; console.log(name.padEnd(12), 'errors', JSON.stringify(r.errors), '| alerts', JSON.stringify(r.alerts));
  await p.close();
}
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
