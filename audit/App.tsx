import { ArrowLeft, ArrowUpRight, Gauge, Keyboard, ListChecks, Check, Megaphone, Wrench, ScanSearch, FileText } from 'lucide-react';

const REPO = 'https://github.com/nadouch123/ichrak-portfolio';
const AUDIT_MD = REPO + '/blob/main/AUDIT.md';
const APP_URL = 'https://weekly-review-coach.vercel.app';
const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

const sections = [
  { id: 'brief', label: 'What was asked' },
  { id: 'scores', label: 'Lighthouse' },
  { id: 'found', label: 'What I found' },
  { id: 'ai', label: 'AI-specific' },
  { id: 'changes', label: 'Every change' },
  { id: 'left', label: 'What is left' },
];

const brief = [
  ['Lighthouse mobile baseline', 'Mobile preset on the production build of all 9 portfolio pages and the AI chat. Home and chat: median of 3 runs.'],
  ['WAVE and a keyboard-only pass', 'WAVE’s error rules and common alerts, plus axe-core (WCAG 2.2 AA), on every page. Then the whole primary flow, chat included, with Tab, Enter and Escape only.'],
  ['Fix, then re-run', 'The AI assistant proposed each fix from the audit logs. A fix counted once the same audit, re-run, no longer found the problem.'],
  ['Streamed output, announced politely', 'One polite live region reads the answer in whole sentences and each tool step once, instead of 174 one-token updates.'],
  ['A keyboard-reachable Stop', 'Stop gets focus when an answer starts, Escape stops it from anywhere, and focus comes back to the message box.'],
  ['AUDIT.md', 'Before scores, every change, after scores, and before/after screenshots. In the repository and summarised on this page.'],
];

const scores: [string, string, string, string, string, string][] = [
  ['Home (median of 3)', '92 → 100', '96 → 100', '2.6 s → 0.8 s', '220 → 0 ms', '0.087 → 0'],
  ['AI chat (median of 3)', '99 → 100', '100', '1.5 s → 0.8 s', '40 → 70 ms', '0.041 → 0'],
  ['/3d/', '98 → 100', '100', '0.9 s', '160 → 20 ms', '0'],
  ['/testing/', '100', '100', '0.9 s', '10 → 0 ms', '0.024 → 0'],
  ['/tool-ui/, /edge-cases/, /playground/, /agent-build/, /agent-spec/, /cv/', '100', '100', '0.8–1.0 s', '0–20 ms', '0'],
];

const keyboard: [string, string, string][] = [
  ['Chat: press Send with Enter', 'Focus dropped to the page', 'Focus moves to Stop'],
  ['Chat: press Stop, or Escape', 'Focus dropped / Escape did nothing', 'Stops; focus back in the message box'],
  ['Chat: answer ends, plan approved', 'Focus dropped to the page', 'Focus back in the message box'],
  ['Chat: upload notes', 'Not reachable (hidden input)', 'Reachable, with a focus ring'],
  ['Chat: file dialog', 'Tab left it; Escape lost focus', 'Focus kept inside; returns to the file'],
  ['Chat: focus ring', '1 px browser default on navy', '3 px ring, sky on navy'],
  ['Home: open the menu, Tab', 'Skipped the whole menu', 'Lands on the first link; Escape closes'],
  ['Home: focus ring on dark sections', 'Blue on navy, 2.6:1', 'Sky on navy, about 9:1'],
  ['Home: send the contact form', 'Focus dropped twice', 'Stays on “Sending…”, then “Message sent.”'],
];

const changes: [string, string, string][] = [
  ['Self-hosted, preloaded fonts with metric-matched fallbacks', 'Text jumped when Google Fonts swapped in (CLS 0.087)', 'CLS 0 everywhere'],
  ['Home page prerendered at build time, then hydrated', 'The hero waited for React and a fade-in (LCP 2.6 s)', 'LCP 0.8 s'],
  ['Menu button before the links; Escape closes the menu', 'Tab skipped the open menu', 'Keyboard pass'],
  ['Sky focus ring on dark sections; real ring on form fields', 'Ring 2.6:1 on navy; fields had outline: none', 'Keyboard pass'],
  ['Badge label 7:1 and named by its visible text', 'axe: contrast 3.3:1, label not in name', 'axe clean'],
  ['80 px WebP logo, WebP screenshots with width and height', 'Oversized and unsized images', 'Lighthouse'],
  ['Closing section inside <main>; chat banners in a landmark', 'axe: content outside landmarks', 'axe clean'],
  ['Playground panels always rendered, hidden when closed', 'WAVE: 3 broken ARIA references', 'WAVE-style clean'],
  ['New-tab links say so to screen readers', '22 unannounced new-tab links', 'WAVE-style clean'],
  ['Chat messages in their own chunk, loaded when idle', '498 KB of JS up front', '423 KB up front'],
  ['Space reserved for the chat’s demo banner', 'The chat jumped down (CLS 0.041)', 'CLS 0'],
  ['robots.txt for the chat', 'SEO 91', 'SEO 100'],
];

export default function App() {
  return (
    <div className="site spec build">
      <a className="skip" href="#brief">Skip to the content</a>
      <header className="nav scrolled">
        <div className="nav-inner">
          <a className="brand" href="/" aria-label="Ichrak Matrouh, portfolio home">
            <img src="/logo-mark-80.webp" alt="" width="40" height="40" />
            <span>Ichrak Matrouh</span>
          </a>
          <a className="back-link" href="/#work"><ArrowLeft size={16} /> Back to portfolio</a>
        </div>
      </header>

      <main>
        <section className="hero spec-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="wrap">
            <p className="eyebrow light"><span className="dot" /> FlyRank · FE-10 · Accessibility and performance audit</p>
            <h1>100 on every page, <em>and a chat you can use without a mouse.</em></h1>
            <p className="hero-lead">I audited my portfolio and my AI chat with Lighthouse (mobile), WAVE-style checks, axe and a keyboard-only pass. The scores were already high, so the real findings were the ones Lighthouse can’t see: focus that vanished mid-chat, a menu Tab skipped, and a stream that asked a screen reader to say 174 fragments.</p>
            <div className="build-ctas">
              <a className="btn btn-light" href={AUDIT_MD} target="_blank" rel="noreferrer"><FileText size={17} /> Read AUDIT.md <ArrowUpRight size={17} />{NEW_TAB}</a>
              <a className="ghost-link" href="#scores">Scores</a>
              <a className="ghost-link" href="#ai">AI-specific fixes</a>
            </div>
            <dl className="meta-row">
              <div><dt>Lighthouse mobile</dt><dd>100 / 100</dd></div>
              <div><dt>WAVE and axe errors</dt><dd>0</dd></div>
              <div><dt>Home LCP</dt><dd>2.6 → 0.8 s</dd></div>
              <div><dt>Live-region updates</dt><dd>174 → 10</dd></div>
            </dl>
            <nav className="spec-toc" aria-label="Page sections">
              {sections.map((s, i) => <a key={s.id} href={'#' + s.id}><span>{String(i + 1).padStart(2, '0')}</span>{s.label}</a>)}
            </nav>
          </div>
        </section>

        <section id="brief" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">01 — What was asked</p><h2>The brief, <em>point by point.</em></h2></div><span className="head-icon"><ListChecks size={24} /></span></div>
            <div className="req-list">
              {brief.map(([title, text]) => (
                <article className="spec-card" key={title}><span className="badge"><Check size={11} /> Done</span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="scores" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — Lighthouse, mobile</p><h2>Before <em>and after.</em></h2></div><span className="head-icon"><Gauge size={24} /></span></div>
            <div className="table-wrap" role="region" aria-label="Lighthouse scores before and after" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">Page</th><th scope="col">Performance</th><th scope="col">Accessibility</th><th scope="col">LCP</th><th scope="col">TBT</th><th scope="col">CLS</th></tr></thead>
                <tbody>{scores.map(([page, perf, a11y, lcp, tbt, cls]) => <tr key={page}><td data-label="Page">{page}</td><td data-label="Performance">{perf}</td><td data-label="Accessibility">{a11y}</td><td data-label="LCP">{lcp}</td><td data-label="TBT">{tbt}</td><td data-label="CLS">{cls}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">Best practices and SEO are 100 on every page after (the chat was 91 for SEO). The chat’s TBT moves between 0 and 70 ms from run to run, before and after. Measured on the production build served the way Vercel serves it.</p>
            <div className="shot-grid" style={{ marginTop: 24 }}>
              <figure className="shot"><img src="/fe10/lh-home.webp" width="1872" height="902" alt="Lighthouse mobile for the home page. Before: performance 92, accessibility 96, LCP 2.6 s, CLS 0.087. After: 100 and 100, LCP 0.8 s, CLS 0." loading="lazy" /><figcaption>Home page: before (left) and after (right).</figcaption></figure>
              <figure className="shot"><img src="/fe10/lh-coach.webp" width="1872" height="902" alt="Lighthouse mobile for the AI chat. Before: performance 99, SEO 91, LCP 1.5 s. After: all four scores 100, LCP 0.8 s." loading="lazy" /><figcaption>The AI chat: before (left) and after (right).</figcaption></figure>
            </div>
          </div>
        </section>

        <section id="found" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — What I found</p><h2>WAVE, axe, <em>and the keyboard.</em></h2></div><span className="head-icon"><ScanSearch size={24} /></span></div>
            <div className="req-list">
              <article className="spec-card"><h3>WAVE-style checks</h3><p>Before: <b>3 errors</b> (broken ARIA references on the playground) and 34 alerts. After: <b>0 errors</b> on all 10 pages, and 1 alert I kept on purpose. That alert is a <code>&lt;noscript&gt;</code> style that turns off the scroll fade-in when JavaScript is off.</p></article>
              <article className="spec-card"><h3>axe-core, WCAG 2.2 AA</h3><p>Before: low contrast and a link name that didn’t match its visible text on the FlyRank badge, plus content outside landmarks on 6 case-study pages and in the chat. After: clean on every page, at phone and desktop widths.</p></article>
            </div>
            <h3 className="sub-head"><Keyboard size={18} /> The keyboard-only pass</h3>
            <div className="table-wrap" role="region" aria-label="Keyboard pass, before and after" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">Step</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
                <tbody>{keyboard.map(([step, before, after]) => <tr key={step}><td data-label="Step">{step}</td><td data-label="Before">{before}</td><td data-label="After">{after}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="shot-grid shot-grid--2" style={{ marginTop: 24 }}>
              <figure className="shot"><img src="/fe10/kbd-menu.webp" width="1072" height="656" alt="The phone menu opened by keyboard, then Tab. Before: no link has focus. After: Work has a sky-blue focus ring." loading="lazy" /><figcaption>Menu, then Tab: before, focus skipped the menu.</figcaption></figure>
              <figure className="shot"><img src="/fe10/kbd-form.webp" width="1072" height="656" alt="The Name field of the contact form with keyboard focus. Before: a faint border change. After: a clear 2 px ring." loading="lazy" /><figcaption>Contact form focus: before and after.</figcaption></figure>
            </div>
          </div>
        </section>

        <section id="ai" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — AI-specific accessibility</p><h2>A stream you can <em>listen to.</em></h2></div><span className="head-icon"><Megaphone size={24} /></span></div>
            <div className="req-list">
              <article className="spec-card"><h3>Before: 174 announcements</h3><p>The conversation was a live region, and so was every tool card. The answer arrives a few characters at a time, so one weekly review asked the screen reader to say “Let”, “Let me”, “Let me start”… 174 times.</p></article>
              <article className="spec-card"><h3>After: 10, all whole sentences</h3><p>The conversation is <code>aria-live="off"</code> (and <code>aria-busy</code> while streaming). One hidden polite region reads the answer in whole sentences, at most once every 1.5 s, and says each tool step once (“Read a file: done.”). Errors stay <code>role="alert"</code>.</p></article>
              <article className="spec-card"><h3>Stop, by keyboard</h3><p>Send moves focus to Stop. <b>Escape stops the answer from anywhere</b>, and it is announced with <code>aria-keyshortcuts</code> and shown on the button. After Stop, focus returns to the message box and “Stopped. Anything that arrived is kept.” is announced.</p></article>
              <article className="spec-card"><h3>Tested</h3><p>New unit tests check three things: the announcer never reads half a sentence; Enter on Send, then Escape, ends with focus back in the message box; the upload input can be focused. The existing 25 tests and the Playwright flow still pass.</p></article>
            </div>
            <figure className="shot" style={{ marginTop: 24 }}><img src="/fe10/kbd-stop.webp" width="1272" height="378" alt="The chat's Stop button with keyboard focus. Before: a thin default ring. After: a 3 px blue ring and an Esc hint on the button." loading="lazy" /><figcaption>Stop with keyboard focus: before and after.</figcaption></figure>
          </div>
        </section>

        <section id="changes" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — Every change</p><h2>What changed, <em>and how I checked it.</em></h2></div><span className="head-icon"><Wrench size={24} /></span></div>
            <div className="table-wrap" role="region" aria-label="Changes" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">Change</th><th scope="col">Problem it fixes</th><th scope="col">Verified by</th></tr></thead>
                <tbody>{changes.map(([change, problem, check]) => <tr key={change}><td data-label="Change">{change}</td><td data-label="Problem">{problem}</td><td data-label="Verified by">{check}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="left" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">06 — What is left</p><h2>Honest <em>limits.</em></h2></div></div>
            <div className="req-list">
              <article className="spec-card"><h3>Unused JavaScript</h3><p>Lighthouse still lists it as an opportunity. That code is React DOM itself, plus the AI SDK and its Zod checks in the chat. Scores are 100, and removing them would cost more than it saves.</p></article>
              <article className="spec-card"><h3>No real screen reader yet</h3><p>I checked the announcer by recording exactly what the live regions say, not by listening to it. A VoiceOver run on my iPhone is the next step.</p></article>
              <article className="spec-card"><h3>Measured on the build, not the live URL</h3><p>My audit environment can’t reach the live site, so the numbers come from the production build, served the same way. PageSpeed Insights on the live URLs confirms them.</p></article>
            </div>
          </div>
        </section>

        <section className="contact spec-end">
          <div className="wrap end-grid">
            <div>
              <p className="eyebrow light">The full audit</p>
              <h2>Read <em>AUDIT.md.</em></h2>
            </div>
            <div className="build-ctas">
              <a className="btn btn-light" href={AUDIT_MD} target="_blank" rel="noreferrer"><FileText size={17} /> AUDIT.md on GitHub <ArrowUpRight size={17} />{NEW_TAB}</a>
              <a className="ghost-link" href={APP_URL} target="_blank" rel="noreferrer">Try the chat{NEW_TAB}</a>
            </div>
          </div>
          <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-10 · Accessibility and performance audit</span></footer>
        </section>
      </main>
    </div>
  );
}
