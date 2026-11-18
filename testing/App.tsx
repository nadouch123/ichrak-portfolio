import { ArrowLeft, ArrowUpRight, FlaskConical, FileCode2, ListChecks, Check, Bot, Workflow, MonitorCheck, Paintbrush } from 'lucide-react';
import chatSrc from './source/chat-states.test.tsx.txt?raw';
import e2eSrc from './source/weekly-review.spec.ts.txt?raw';
import formSrc from './source/contact-form.test.jsx.txt?raw';
import ciSrc from './source/tests.yml.txt?raw';

const REPO = 'https://github.com/nadouch123/ichrak-portfolio';
const PR = REPO + '/pull/5';
const ACTIONS = REPO + '/actions/workflows/tests.yml';

const sections = [
  { id: 'brief', label: 'What was asked' },
  { id: 'suites', label: 'The tests' },
  { id: 'ci', label: 'CI' },
  { id: 'ai-fix', label: 'The AI fixes a red test' },
  { id: 'found', label: 'What the tests found' },
  { id: 'code', label: 'Test code' },
];

const brief = [
  ['Vitest + React Testing Library', 'Set up in both packages: the portfolio (React 18, the contact form) and the Weekly Review Coach (React 19, the AI chat), each with its own config and jsdom.'],
  ['Highest-risk UI, tested', 'The chat message renderer (every part type), the contact form, and the tool-result components. Every query is by role, label or visible text, never by class or test id.'],
  ['The AI route is mocked', 'Component tests replace fetch and fail on any request they did not expect. The Playwright test answers /api/chat inside the browser. No test can reach a model.'],
  ['One Playwright test, primary flow', 'Start the weekly review, watch the tools run, see the review card, approve next week’s plan, and find it saved in the files panel.'],
  ['CI that blocks merging', 'GitHub Actions runs every suite on every push and pull request. A branch rule on main can require them, so a red run can’t be merged.'],
  ['AI fixes a failing test', 'A change broke a test. The AI assistant ran the suite itself, read the failure, fixed the code, re-ran it, and pushed. CI went red, then green.'],
];

const suites = [
  ['Chat states', 'chat-states.test.tsx', 6, 'The whole chat against a mocked route: pending (“Coach is choosing what to do”, Send becomes Stop), streaming (text and a tool card arriving chunk by chunk), 429 with a counting-down retry, a mid-stream cut that keeps the partial answer and retries once on a double click, a failed tool card, and input guards.'],
  ['Message renderer', 'message-view.test.tsx', 8, 'User text shown exactly as typed, assistant markdown with scripts stripped, unknown parts skipped, and each tool state: Preparing, Running, Failed with Try again, Interrupted, and a crashing result contained to its own card.'],
  ['Tool results', 'tool-results.test.tsx', 5, 'Review card with verified and unverified sources, file preview that expands, the site chart’s accessible summary, plan approval and “Ask for changes”, and the saved plan.'],
  ['Route', 'route.test.ts', 6, 'The /api/chat handler’s designed failures (moved from node:test to Vitest).'],
  ['Contact form', 'contact-form.test.jsx', 6, 'Success, locked while sending, server errors announced on the right field, errors clearing as you type, offline with the email fallback, and “Send another message”.'],
  ['Contact API', 'contact-api.test.js', 3, 'Validation rules, a 422 that sends nothing, and the spam trap.'],
  ['Primary flow (Playwright)', 'weekly-review.spec.ts', 1, 'Chromium, AI route mocked, outside requests blocked.'],
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
            <p className="eyebrow light"><span className="dot" /> FlyRank · FE-09 · Testing pass</p>
            <h1>Tests the AI can run, <em>and a red build it fixed.</em></h1>
            <p className="hero-lead">Component tests for my AI chat and contact form, one end-to-end test of the main flow, and CI on every push. Then I let the AI assistant fix a failing test by running the suite itself.</p>
            <div className="build-ctas">
              <a className="btn btn-light" href={ACTIONS} target="_blank" rel="noreferrer">See the CI runs <ArrowUpRight size={17} /><span className="sr-only"> (opens in a new tab)</span></a>
              <a className="ghost-link" href="#ai-fix">The AI fix</a>
              <a className="ghost-link" href="#code">Test code</a>
            </div>
            <dl className="meta-row">
              <div><dt>Component + unit tests</dt><dd>34</dd></div>
              <div><dt>Playwright</dt><dd>1 flow</dd></div>
              <div><dt>CI jobs</dt><dd>3, green</dd></div>
              <div><dt>Classes renamed, tests broken</dt><dd>155 / 0</dd></div>
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

        <section id="suites" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — The tests</p><h2>Tested the way <em>people use it.</em></h2></div><span className="head-icon"><FlaskConical size={24} /></span></div>
            <div className="table-wrap" role="region" aria-label="Test suites" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">Suite</th><th scope="col">File</th><th scope="col">Tests</th><th scope="col">What it checks</th></tr></thead>
                <tbody>{suites.map(([name, file, n, what]) => <tr key={file as string}><td data-label="Suite">{name}</td><td data-label="File"><code>{file}</code></td><td data-label="Tests">{n}</td><td data-label="What it checks">{what}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="req-list" style={{ marginTop: 28 }}>
              <article className="spec-card"><h3><Paintbrush size={16} /> Renaming a class breaks nothing</h3><p>To prove it, I prefixed every <code>className</code> in the tested components (155 of them) and ran everything again: 34 of 34 and the Playwright test still passed. Then I put the names back.</p></article>
              <article className="spec-card"><h3><MonitorCheck size={16} /> How the AI is mocked</h3><p>One helper builds the same event stream the real route sends (text, tool input, tool output, errors). Component tests feed it to a fake <code>fetch</code>, sometimes chunk by chunk to look at the screen mid-stream. Playwright serves it with <code>page.route</code>.</p></article>
            </div>
          </div>
        </section>

        <section id="ci" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — CI</p><h2>Green <em>on every push.</em></h2></div><span className="head-icon"><Workflow size={24} /></span></div>
            <div className="shot-grid">
              <figure className="shot">
                <img src="/fe09/ci-green.webp" width="1660" height="783" alt="GitHub Actions: the Tests workflow with all three jobs passed." loading="lazy" />
                <figcaption>The Tests workflow on GitHub Actions: three jobs, all green.</figcaption>
              </figure>
            </div>
            <p className="note">Three jobs: the portfolio (contact form tests, then the production build), the coach’s typecheck and Vitest suite, and the coach’s Playwright test in Chromium. With these three jobs required by a branch rule on main, a red run can’t be merged. <a href={ACTIONS} target="_blank" rel="noreferrer">All runs<span className="sr-only"> (opens in a new tab)</span></a> · <a href={PR} target="_blank" rel="noreferrer">The pull request<span className="sr-only"> (opens in a new tab)</span></a></p>
          </div>
        </section>

        <section id="ai-fix" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — The AI fixes a red test</p><h2>Red, read, fix, <em>green.</em></h2></div><span className="head-icon"><Bot size={24} /></span></div>
            <ol className="steps">
              <li>
                <h3>A change breaks a test</h3>
                <p>I pushed a change on purpose to see the loop work: render user messages as markdown too, “so pasted notes keep their formatting”. It sounds harmless. CI went red on that push.</p>
                <figure className="shot"><img src="/fe09/ci-red.webp" width="1312" height="850" alt="GitHub Actions run of the Tests workflow for the markdown change: the component and route tests job failed." loading="lazy" /><figcaption>CI on the breaking push: the component test job fails.</figcaption></figure>
              </li>
              <li>
                <h3>The assistant runs the suite itself</h3>
                <p>I asked the AI to make CI green. It ran <code>npm test</code> in the project and read the failure.</p>
                <pre className="term" tabIndex={0} aria-label="Failing test output">{`$ npm test
 ❯ tests/unit/message-view.test.tsx (8 tests | 1 failed)
     × user text is shown exactly as typed, never as HTML

 FAIL  MessageView: text parts > user text is shown exactly as typed, never as HTML
Expected element to have text content:
  Is <b>bold</b> allowed?
Received:
  Is bold allowed?

 Test Files  1 failed | 3 passed (4)
      Tests  1 failed | 24 passed (25)`}</pre>
              </li>
              <li>
                <h3>It decides what is wrong: the code, not the test</h3>
                <p>The test protects a rule: what someone types is shown exactly as typed. With markdown on, <code>&lt;b&gt;bold&lt;/b&gt;</code> turned into bold text, so the chat was reading the user’s words as HTML. Changing the test to match would have hidden that. The assistant put user messages back to plain text and wrote the reason next to the code.</p>
                <pre className="term" tabIndex={0} aria-label="The fix">{`- // Render user messages as markdown too, so pasted notes keep their formatting.
- return <div className={…} dangerouslySetInnerHTML={{ __html: sanitize(marked.parse(text)) }} />;
+ // User text stays plain text: what someone typed is shown exactly as typed.
+ return m.role === 'user'
+   ? <div className="bubble bubble--user">{part.text}</div>
+   : <div className="bubble" dangerouslySetInnerHTML={…} />;`}</pre>
              </li>
              <li>
                <h3>It re-runs the failing file, then everything, then pushes</h3>
                <pre className="term" tabIndex={0} aria-label="Passing test output">{`$ npx vitest run tests/unit/message-view.test.tsx
 Test Files  1 passed (1)
      Tests  8 passed (8)

$ npm test
 Test Files  4 passed (4)
      Tests  25 passed (25)`}</pre>
                <p>CI went green again on the fix (screenshot in section 03).</p>
              </li>
            </ol>
          </div>
        </section>

        <section id="found" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — What the tests found</p><h2>A real bug, <em>on the first run.</em></h2></div><span className="head-icon"><FlaskConical size={24} /></span></div>
            <div className="req-list">
              <article className="spec-card"><h3>Contact form: the error became part of the field’s name</h3><p>Asking for the Email field by its label failed after a bad send. The error text sat inside the <code>&lt;label&gt;</code>, so a screen reader heard “Email, That email does not look right” as the field’s name, then the error again. Fixed with <code>aria-labelledby</code>, no visual change. A test that queried by class would never have caught it.</p></article>
              <article className="spec-card"><h3>Chat: better roles to test against</h3><p>To test by role, the chat needed roles: the conversation is now a <code>log</code>, each message an <code>article</code> named “You” or “Coach”, and the message renderer has its own component, <code>MessageView</code>.</p></article>
            </div>
          </div>
        </section>

        <section id="code" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">06 — Test code</p><h2>Read <em>the tests.</em></h2></div><span className="head-icon"><FileCode2 size={24} /></span></div>
            {[
              ['weekly-review-coach/tests/unit/chat-states.test.tsx', 'Pending, streaming, error states', chatSrc],
              ['weekly-review-coach/e2e/weekly-review.spec.ts', 'Playwright primary flow', e2eSrc],
              ['tests/contact-form.test.jsx', 'The validated form', formSrc],
              ['.github/workflows/tests.yml', 'CI', ciSrc],
            ].map(([path, label, src], i) => (
              <div className="code-card" key={path} style={i ? { marginTop: 24 } : undefined}>
                <div className="code-head"><code>{path.split('/').pop()}</code><span>{label}</span><a href={`${REPO}/blob/main/${path}`} target="_blank" rel="noreferrer">View on GitHub<span className="sr-only"> (opens in a new tab)</span></a></div>
                <pre tabIndex={0} aria-label={`${path} source`}>{src}</pre>
              </div>
            ))}
          </div>
        </section>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">See it run</p>
            <h2>Every push, <em>every suite.</em></h2>
          </div>
          <a className="btn btn-light" href={ACTIONS} target="_blank" rel="noreferrer">Open the CI runs <ArrowUpRight size={17} /><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-09 · Testing pass</span></footer>
      </section>
      </main>
    </div>
  );
}
