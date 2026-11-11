import { ArrowLeft, ArrowUpRight, ShieldAlert, FileCode2, BookOpen, ListChecks, Check, Inbox, Smartphone, FlaskConical, RotateCcw } from 'lucide-react';
import failuresSrc from './source/failures.ts.txt?raw';
import readmeSrc from './source/README-fe08.md.txt?raw';

const APP_URL = 'https://weekly-review-coach.vercel.app';

const sections = [
  { id: 'brief', label: 'What was asked' },
  { id: 'sabotage', label: 'Sabotage checklist' },
  { id: 'retry', label: 'The retry button' },
  { id: 'empty', label: 'Empty and pending states' },
  { id: 'mobile', label: 'Mobile Safari' },
  { id: 'tests', label: 'Tests' },
  { id: 'code', label: 'Failure code and README' },
];

const brief = [
  ['Failure inventory', 'Every way the weekly review can go wrong, listed before any code: network, mid-stream cut, 429, 529, route crash, malformed tool data, refusal, slow first token, empty or oversized input, no files, missing week, damaged saved data, offline.'],
  ['One shape for every failure', 'The server sends { code, message, retryAfter? } for every failure, even its own crashes. The browser turns each code into a designed card: what happened, what now, and a retry.'],
  ['Error boundaries', 'Vite + React, so the job of Next’s error.tsx is done by boundaries: one for the page (with “Reset saved data”), one for the chat, one per tool result.'],
  ['Designed empty states', 'First run, no files, a week with no notes, an empty file list: each one offers the next step instead of a blank box.'],
  ['Skeletons and slow responses', 'Pill, file and reply-shaped skeletons. After 5 seconds: “This is taking longer than usual” with Stop.'],
  ['Sabotage test', 'A switch in the app header breaks the next request in one of 10 ways, then turns itself off so Retry shows the recovery.'],
  ['Responsive, mobile Safari', 'One-row header at 390 px, collapsible files, 100dvh, keyboard-aware layout, no iOS input zoom, safe areas.'],
  ['Stretch goals', 'Calm motion (one short fade, off with reduced motion) and an automated browser test of the mid-stream failure.'],
];

const sabotage = [
  ['Network down before send', 'Couldn’t reach the coach; the message is kept', 'Retry re-sends the same message'],
  ['Connection drops mid-stream', 'Partial answer kept, cut tool card marked Interrupted, “The answer was cut off”', 'Retry replaces only the failed reply'],
  ['Rate limit (429)', 'Too many requests, button counts down from Retry-After', 'Unlocks itself after 12 s'],
  ['Tool returns malformed JSON', 'Tool card Failed: “Unreadable tool result”', 'Try again on the card'],
  ['Route handler throws (500)', 'The server hit an error (JSON, never an HTML page)', 'Retry'],
  ['Slow response (9 s)', 'Reply skeleton, then “taking longer than usual” with Stop', 'Stop keeps what arrived'],
  ['Model refuses', 'The model declined to answer this', 'Edit my question'],
  ['readFile fails', 'Tool card Failed, with what it was trying to do', 'Try again'],
  ['checkPortfolio fails', 'Tool card Failed; the review carries on without it', 'Try again'],
  ['A component crashes', 'The chat stopped working; files untouched', 'Reload the chat'],
];

const retry = [
  ['Says what it retries', 'The button reads Retry “weekly review”: the failed message, not the whole conversation. It calls regenerate(), which drops the failed reply and re-sends the last question.'],
  ['Can’t fire twice', 'It disables itself on the first click and shows “Retrying…”. A double click sends one request, and the browser test checks that.'],
  ['Respects the wait', 'On a 429 it counts down from Retry-After and unlocks itself. On an auth error there is no retry, because retrying can’t help.'],
];

const empty = [
  ['First run', 'Start my weekly review, Quiz me, and three example questions that fill the composer.'],
  ['No files loaded', '“Nothing to review yet.” with Load the example notes and Upload my notes.'],
  ['Week with no notes', 'A warning that names the missing file, with Switch to Week 5.'],
  ['Waiting for a reply', '“Coach is choosing what to do” and a reply-shaped skeleton, so nothing jumps when the text arrives.'],
];

const mobile = [
  ['100dvh', 'The app fits the visible screen, not the one behind Safari’s toolbars (100vh fallback).'],
  ['Keyboard', 'interactive-widget=resizes-content, so the keyboard pushes the composer up instead of covering it.'],
  ['No zoom', '16 px input text, so iOS doesn’t zoom in when you tap the box.'],
  ['Thumb-friendly scroll', 'Auto-scroll only when you are already at the bottom; otherwise a “↓ Latest” button. Safe-area padding under the composer.'],
];

export default function App() {
  return (
    <div className="site spec build">
      <a className="skip" href="#brief">Skip to the content</a>
      <header className="nav scrolled">
        <div className="nav-inner">
          <a className="brand" href="/" aria-label="Ichrak Matrouh, portfolio home">
            <img src="/logo.jfif" alt="" width="40" height="40" />
            <span>Ichrak Matrouh</span>
          </a>
          <a className="back-link" href="/#work"><ArrowLeft size={16} /> Back to portfolio</a>
        </div>
      </header>

      <main>
        <section className="hero spec-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="wrap">
            <p className="eyebrow light"><span className="dot" /> FlyRank · FE-08 · Error states, empty states, edge cases</p>
            <h1>Break it on purpose, <em>recover on screen.</em></h1>
            <p className="hero-lead">My Weekly Review Coach, sabotaged ten ways. Every failure becomes a designed state that says what happened, what to do now, and retries safely.</p>
            <div className="build-ctas">
              <a className="btn btn-light" href={APP_URL} target="_blank" rel="noreferrer">Open the live app <ArrowUpRight size={17} /></a>
              <a className="ghost-link" href="#sabotage">Sabotage checklist</a>
              <a className="ghost-link" href="#code">Failure code</a>
            </div>
            <dl className="meta-row">
              <div><dt>Sabotage switches</dt><dd>10</dd></div>
              <div><dt>Error codes</dt><dd>11</dd></div>
              <div><dt>Tests</dt><dd>6 + 1 e2e</dd></div>
              <div><dt>Phone width</dt><dd>390 px</dd></div>
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

        <section id="sabotage" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — Sabotage checklist</p><h2>Ten ways <em>to break it.</em></h2></div><span className="head-icon"><ShieldAlert size={24} /></span></div>
            <div className="table-wrap">
              <table className="contract">
                <thead><tr><th scope="col">#</th><th scope="col">Sabotage</th><th scope="col">What you see</th><th scope="col">Recovery</th></tr></thead>
                <tbody>{sabotage.map(([what, see, fix], i) => <tr key={what}><td><span className="sab-num">{i + 1}</span></td><td>{what}</td><td>{see}</td><td>{fix}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">To try it: open the app, pick a switch under “Sabotage” in the header, then press Start my weekly review. Each switch breaks one request and then turns itself off.</p>
          </div>
        </section>

        <section id="retry" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — The retry button</p><h2>A retry <em>you can trust.</em></h2></div><span className="head-icon"><RotateCcw size={24} /></span></div>
            <div className="card-grid">
              {retry.map(([t, x]) => <article className="spec-card state-card state-output-error" key={t}><h3>{t}</h3><p>{x}</p></article>)}
            </div>
          </div>
        </section>

        <section id="empty" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — Empty and pending states</p><h2>Never <em>a blank box.</em></h2></div><span className="head-icon"><Inbox size={24} /></span></div>
            <div className="req-list">
              {empty.map(([t, x]) => <article className="spec-card" key={t}><h3>{t}</h3><p>{x}</p></article>)}
            </div>
          </div>
        </section>

        <section id="mobile" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — Mobile Safari</p><h2>Works <em>on a phone.</em></h2></div><span className="head-icon"><Smartphone size={24} /></span></div>
            <div className="req-list">
              {mobile.map(([t, x]) => <article className="spec-card" key={t}><h3>{t}</h3><p>{x}</p></article>)}
            </div>
            <p className="note">Checked with iPhone-sized emulation in Chromium: no sideways scroll at 390 px. Not yet checked on a real iPhone.</p>
          </div>
        </section>

        <section id="tests" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">06 — Tests</p><h2>Failures, <em>tested.</em></h2></div><span className="head-icon"><FlaskConical size={24} /></span></div>
            <div className="req-list">
              <article className="spec-card"><span className="badge"><Check size={11} /> 6 passing</span><h3>Route tests</h3><ul className="tests-list"><li>Mid-stream cut sends an error event</li><li>429 with Retry-After</li><li>Route throw becomes a JSON 500</li><li>Empty and too-long input</li><li>Unreadable request body</li><li>Malformed tool data</li></ul></article>
              <article className="spec-card"><span className="badge"><Check size={11} /> Passing</span><h3>Browser test (stretch goal)</h3><p>Arms the mid-stream switch, checks the designed error and that the partial answer is kept, double-clicks Retry, asserts one request, then waits for the full review.</p></article>
            </div>
          </div>
        </section>

        <section id="code" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">07 — Failure code and README</p><h2><em>lib/failures.ts</em></h2></div><span className="head-icon"><FileCode2 size={24} /></span></div>
            <div className="code-card">
              <div className="code-head"><code>lib/failures.ts</code><span>Problem codes + sabotage middleware</span></div>
              <pre tabIndex={0} aria-label="lib/failures.ts source">{failuresSrc}</pre>
            </div>
            <div className="code-card" style={{ marginTop: 24 }}>
              <div className="code-head"><code>README.md</code><span><BookOpen size={14} /> FE-08 section</span></div>
              <pre tabIndex={0} aria-label="README FE-08 section">{readmeSrc}</pre>
            </div>
          </div>
        </section>
      </main>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">Try it</p>
            <h2>Pick a sabotage, <em>watch it recover.</em></h2>
          </div>
          <a className="btn btn-light" href={APP_URL} target="_blank" rel="noreferrer">Open the live app <ArrowUpRight size={17} /></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-08 · Error states, empty states, edge cases</span></footer>
      </section>
    </div>
  );
}
