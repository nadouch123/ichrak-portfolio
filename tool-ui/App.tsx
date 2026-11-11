import { ArrowLeft, ArrowUpRight, Layers, FileCode2, BookOpen, ListChecks, Check } from 'lucide-react';
import toolsSrc from './source/tools.ts.txt?raw';
import readmeSrc from './source/README.md.txt?raw';

const APP_URL = 'https://weekly-review-coach.vercel.app';

const sections = [
  { id: 'brief', label: 'What was asked' },
  { id: 'states', label: 'Four states' },
  { id: 'contract', label: 'Tool contract' },
  { id: 'tools-file', label: 'Tool definition file' },
  { id: 'readme', label: 'README' },
];

const brief = [
  ['Server-side tools', 'Four tools with a Zod input schema and an execute function: listFiles, readFile, checkPortfolio, showWeeklyReview.'],
  ['Four tool states', 'input-streaming, input-available, output-available and output-error each look different, with a 200 ms crossfade between them.'],
  ['Result as a component', 'File preview, response-time bar chart, review card and plan card. No raw JSON on screen.'],
  ['Confirmation tool', 'proposePlan has no execute. The plan waits for Approve or Ask for changes, then the browser answers it.'],
  ['README tool contract', 'For each tool: input, return shape, errors, what the UI shows, and how missing optional fields render.'],
  ['Stretch goals', 'A chart (checkPortfolio) and the “choosing” moment: every call shows “Why this tool” while its input streams in.'],
];

const states = [
  { name: 'input-streaming', label: 'Preparing', q: 'What is it doing?', text: 'Dashed card, pulsing pill, the reason as it streams in and a skeleton shaped like the result.' },
  { name: 'input-available', label: 'Running', q: 'With what input?', text: 'Blue edge, “Why this tool” and the exact input as chips, with a spinner.' },
  { name: 'output-available', label: 'Done', q: 'What came back?', text: 'A real component per tool: file preview, response-time chart, review card, plan.' },
  { name: 'output-error', label: 'Failed', q: 'What went wrong?', text: 'Red edge: what failed, what it was trying to do, what to do now, and Try again.' },
];

const contract = [
  { tool: 'listFiles', where: 'Server', input: '{ reason }', returns: 'files: { name, kind, chars, week }[]', ui: 'File chips with kind and size' },
  { tool: 'readFile', where: 'Server', input: '{ name, reason }', returns: '{ name, kind, lines, content }', ui: 'File preview; “File not found” error card' },
  { tool: 'checkPortfolio', where: 'Server, live web', input: '{ reason }', returns: '{ site, checkedAt, pages: { path, ok, status, ms, title }[] }', ui: 'Bar chart of response time per page' },
  { tool: 'showWeeklyReview', where: 'Server, checks sources', input: '{ week, finished[], learned[3], open[], conflict? }', returns: 'input + finished[].verified, unverified', ui: 'Review card; no empty boxes for missing fields' },
  { tool: 'proposePlan', where: 'Browser, needs me', input: '{ week, items: { task, why? }[1–5] }', returns: '{ approved, savedAs?, feedback? }', ui: 'Plan card with Approve and Ask for changes' },
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
            <p className="eyebrow light"><span className="dot" /> FlyRank · FE-07 · Tool results and structured output in the UI</p>
            <h1>Tool calls you <em>can see.</em></h1>
            <p className="hero-lead">My Weekly Review Coach, rebuilt so every tool call is a typed part with four designed states, and every result is a real component instead of JSON.</p>
            <div className="build-ctas">
              <a className="btn btn-light" href={APP_URL} target="_blank" rel="noreferrer">Open the live app <ArrowUpRight size={17} /></a>
              <a className="ghost-link" href="#tools-file">Tool definition file</a>
              <a className="ghost-link" href="#readme">README</a>
            </div>
            <dl className="meta-row">
              <div><dt>Stack</dt><dd>AI SDK 7</dd></div>
              <div><dt>Schemas</dt><dd>Zod 4</dd></div>
              <div><dt>Tools</dt><dd>5</dd></div>
              <div><dt>States</dt><dd>4 per call</dd></div>
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
            <p className="note">The app runs a labelled demo model until model credits are added. The tools themselves run for real, and the same deploy switches to Claude once an API key is set.</p>
          </div>
        </section>

        <section id="states" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — Four states</p><h2>Every call, <em>four states.</em></h2></div><span className="head-icon"><Layers size={24} /></span></div>
            <div className="card-grid">
              {states.map(st => (
                <article className={'spec-card state-card state-' + st.name} key={st.name}>
                  <span className="badge">{st.label}</span>
                  <h3>{st.q}</h3>
                  <p><code>{st.name}</code> · {st.text}</p>
                </article>
              ))}
            </div>
            <p className="note">To see the error state on purpose, open the app, pick “readFile fails” under “Sabotage”, or choose Week 6, which has no notes yet. All ten sabotage switches are on the <a href="/edge-cases/">FE-08 page</a>.</p>
          </div>
        </section>

        <section id="contract" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — Tool contract</p><h2>Inputs, outputs, <em>errors.</em></h2></div><span className="head-icon"><ListChecks size={24} /></span></div>
            <div className="table-wrap">
              <table className="contract">
                <thead><tr><th scope="col">Tool</th><th scope="col">Runs</th><th scope="col">Input</th><th scope="col">Returns</th><th scope="col">In the UI</th></tr></thead>
                <tbody>{contract.map(c => <tr key={c.tool}><td><code>{c.tool}</code></td><td>{c.where}</td><td><code>{c.input}</code></td><td><code>{c.returns}</code></td><td>{c.ui}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">Every tool also takes a short <code>reason</code>, shown as “Why this tool”. The full contract, with error cases and missing-field rules, is in the README below.</p>
          </div>
        </section>

        <section id="tools-file" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — Tool definition file</p><h2><em>lib/tools.ts</em></h2></div><span className="head-icon"><FileCode2 size={24} /></span></div>
            <div className="code-card">
              <div className="code-head"><code>lib/tools.ts</code><span>Zod schemas + execute functions</span></div>
              <pre tabIndex={0} aria-label="lib/tools.ts source">{toolsSrc}</pre>
            </div>
          </div>
        </section>

        <section id="readme" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — README</p><h2>State machine and <em>tool contract.</em></h2></div><span className="head-icon"><BookOpen size={24} /></span></div>
            <div className="code-card">
              <div className="code-head"><code>README.md</code><span>From the app repository</span></div>
              <pre tabIndex={0} aria-label="README.md">{readmeSrc}</pre>
            </div>
          </div>
        </section>
      </main>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">Try it</p>
            <h2>Watch the tools <em>run.</em></h2>
          </div>
          <a className="btn btn-light" href={APP_URL} target="_blank" rel="noreferrer">Open the live app <ArrowUpRight size={17} /></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-07 · Tool results in the UI</span></footer>
      </section>
    </div>
  );
}
