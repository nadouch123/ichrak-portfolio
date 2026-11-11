import { ArrowLeft, ArrowUpRight, Bot, FileText, Globe, GitBranch, Wrench, Scissors, FlaskConical, Check, CalendarCheck, ListChecks, Layers } from 'lucide-react';

const AGENT_URL = 'https://weekly-review-coach.vercel.app';

const sections = [
  { id: 'how', label: 'How it works' },
  { id: 'tools', label: 'Live tools' },
  { id: 'states', label: 'Tool states' },
  { id: 'deviations', label: 'Spec vs. build' },
  { id: 'log', label: 'Build log' },
  { id: 'cut', label: 'What I cut' },
  { id: 'evals', label: 'Evals' },
];

const flow = [
  { step: 'Request', text: 'I type “weekly review” (or “quiz me”, “what’s still open?”).' },
  { step: 'Read', text: 'The agent calls listFiles, then readFile on my week notes and assignments.md.' },
  { step: 'Check', text: 'It calls checkPortfolio to confirm which pages of my live site are online.' },
  { step: 'Review', text: 'showWeeklyReview draws a card: finished items with a checked source file, 3 learnings, what is still open.' },
  { step: 'Quiz', text: 'Three questions, one at a time. It says when I’m wrong and points to the note.' },
  { step: 'Plan', text: 'proposePlan shows a next-week plan (max 5 items). Nothing is saved until I click Approve.' },
];

const tools = [
  { icon: FileText, name: 'listFiles', kind: 'My files', text: 'Lists the knowledge files I loaded: weekly notes, assignments.md, the review template and approved plans. Shown as file chips.' },
  { icon: FileText, name: 'readFile', kind: 'My files', text: 'Reads one file in full and shows a preview. A missing file comes back as a designed “File not found” error.' },
  { icon: Globe, name: 'checkPortfolio', kind: 'Live web', text: 'Fetches the pages of this portfolio and draws a response-time bar chart. It replaces the “paste your git log” step in the spec.' },
  { icon: CalendarCheck, name: 'showWeeklyReview', kind: 'Result card', text: 'Renders the review as a card. Its execute checks that every cited source is one of my files and flags any that aren’t.' },
  { icon: ListChecks, name: 'proposePlan', kind: 'Needs me', text: 'Has no execute. The plan card waits for me: Approve saves plan-week-XX.md, Ask for changes sends my feedback.' },
];

const states = [
  { name: 'input-streaming', label: 'Preparing', q: 'What is it doing?', text: 'Dashed card, pulsing pill, the reason as it streams in and a skeleton shaped like the result.' },
  { name: 'input-available', label: 'Running', q: 'With what input?', text: 'Blue edge, “Why this tool” and the exact input as chips, with a spinner.' },
  { name: 'output-available', label: 'Done', q: 'What came back?', text: 'A real component per tool: file preview, response-time chart, review card, plan.' },
  { name: 'output-error', label: 'Failed', q: 'What went wrong?', text: 'Red edge: what failed, what it was trying to do, what to do now, and Try again. Never a crash.' },
];

const deviations = [
  { spec: 'Claude Project with project knowledge', build: 'Small web app on Vercel calling Claude with tool use', why: 'The checkpoint must be testable through a link. A Claude Project can only be opened inside my own Claude account.' },
  { spec: 'Notes stuffed into project knowledge', build: 'Tools the agent calls itself', why: 'You can watch it fetch its data step by step, and it only reads what it needs.' },
  { spec: 'I paste git log for portfolio changes', build: 'checkPortfolio fetches the live site', why: 'The portfolio is deployed by upload, with no git history to paste. Checking the live site is more honest evidence of what shipped.' },
  { spec: 'Claude answers every run', build: 'A labelled demo model until credits are added', why: 'The model gateway needs a card on file. Rather than ship a dead link, a scripted model drives the real tools, and the same deploy switches to Claude once a key is set.' },
  { spec: 'Weeks 1 to 5 notes', build: 'Week 5 only', why: 'I only have real material for Week 5, and the coach must never invent notes. Picking another week makes it ask me for that week’s notes.' },
];

const log = [
  { t: '18:04', title: 'Start narrow', text: 'Re-read the spec and picked the smallest end-to-end loop: one chat, my notes as files, the 5 steps in one system prompt. No scheduling, no Drive connector, no login.' },
  { t: '18:06', title: 'Changed platform', text: 'A Claude Project has no public link, so I moved to a web app on Vercel. The system prompt stayed the spec’s draft instructions plus the 6 eval rules, and it stays read-only.' },
  { t: '18:08', title: 'No Week 1 to 4 notes', text: 'The build plan assumed notes for every week. Only Week 5 exists, so I cut the rest instead of inventing them.' },
  { t: '18:09', title: 'Function + UI', text: 'A manual tool-use loop (max 10 steps) that streams each tool call to the page, so the run shows “read_file · week-05.md” chips as it works.' },
  { t: '18:10', title: 'Broke: couldn’t test my own API', text: 'My build sandbox blocked requests to *.vercel.app. I added a secret-protected self-test mode that runs one full turn and returns the transcript as JSON.' },
  { t: '18:11', title: 'Broke: model gateway refused', text: 'Vercel’s AI Gateway answered 403 “requires a valid credit card on file”. The code now supports both the gateway and an Anthropic API key, picked by environment variable.' },
  { t: '18:12', title: 'Faster redeploys', text: 'Each Vercel deploy is a full snapshot. I reference unchanged files by their SHA-1 hash and only upload what changed.' },
  { t: '18:50', title: 'Moved to the AI SDK', text: 'Rebuilt the loop with streamText and useChat. Each tool is now a Zod schema plus execute in lib/tools.ts, and every call reaches the page as a typed part with a state.' },
  { t: '18:52', title: 'Error state first', text: 'Designed the failed card before the others, then added a “Break a tool” switch and the Week 6 case so a reviewer can trigger it on purpose.' },
  { t: '18:53', title: 'Broke: New chat mid-stream', text: 'Clicking New chat while an answer was streaming did nothing. It now stops the stream first. Also fixed a file card that counted lines two different ways.' },
  { t: '19:27', title: 'Demo model, labelled', text: 'Still no model credits, so without an API key the server uses a scripted model that calls the same tools. The tools run for real and the app shows a Demo model badge.' },
];

const cut = [
  ['Google Drive connector', 'Marked “optional later” in the spec. Uploading notes in the app covers the MVP.'],
  ['Weeks 1 to 4 notes', 'They don’t exist yet, and inventing them would break the coach’s main rule.'],
  ['Scheduled Sunday run', 'The spec already accepted a phone reminder instead.'],
  ['Server-side storage', 'My notes and edits stay in my browser. Fine for one user; a database is the next step.'],
];

const evals = [
  'Normal week: all 5 steps, every finished item cites a file',
  'Topic not in my notes (RAG): says it can’t find it, no invention',
  '“Write my submission for me”: declines, offers help instead',
  'No notes for the current week: asks me to upload them',
  'Wrong quiz answer: says it’s wrong, explains, cites the note',
  'Status conflict between notes and assignments.md: flags it and asks',
];

export default function App() {
  return (
    <div className="site spec build">
      <a className="skip" href="#how">Skip to the build</a>
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
            <p className="eyebrow light"><span className="dot" /> Checkpoint 1 · Build the agent · MVP</p>
            <h1>Weekly Review <em>Coach, live.</em></h1>
            <p className="hero-lead">The working version of my FL-06 agent. It reads my own notes through tools, checks my live portfolio, reviews my week, quizzes me, and suggests next week’s plan.</p>
            <div className="build-ctas">
              <a className="btn btn-light" href={AGENT_URL} target="_blank" rel="noreferrer">Open the live agent <ArrowUpRight size={17} /></a>
              <a className="ghost-link" href="/agent-spec/">Read the original spec</a>
              <a className="ghost-link" href="/tool-ui/">FE-07: tool definitions and README</a>
              <a className="ghost-link" href="/edge-cases/">FE-08: error and empty states</a>
            </div>
            <dl className="meta-row">
              <div><dt>Platform</dt><dd>Vercel web app</dd></div>
              <div><dt>Model</dt><dd>Claude</dd></div>
              <div><dt>Tools</dt><dd>5</dd></div>
              <div><dt>Writes</dt><dd>Only after I approve</dd></div>
            </dl>
            <nav className="spec-toc" aria-label="Build sections">
              {sections.map((s, i) => <a key={s.id} href={'#' + s.id}><span>{String(i + 1).padStart(2, '0')}</span>{s.label}</a>)}
            </nav>
          </div>
        </section>

        <section id="how" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">01 — How it works</p><h2>From request <em>to result.</em></h2></div><span className="head-icon"><Bot size={24} /></span></div>
            <ol className="flow">
              {flow.map((f, i) => (
                <li key={f.step}><span className="flow-n">{String(i + 1).padStart(2, '0')}</span><h3>{f.step}</h3><p>{f.text}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="tools" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — Live tools</p><h2>It fetches its own <em>data.</em></h2></div><span className="head-icon"><Wrench size={24} /></span></div>
            <div className="card-grid three">
              {tools.map(t => {
                const Icon = t.icon;
                return (
                  <article className="spec-card" key={t.name}>
                    <span className="badge">{t.kind}</span>
                    <h3 className="tool-name"><Icon size={20} /> <code>{t.name}</code></h3>
                    <p>{t.text}</p>
                  </article>
                );
              })}
            </div>
            <p className="note">Every tool is a small Zod schema with an execute function, in one file. None of them can send or post anything; the only write is the plan file, and only after I approve it.</p>
          </div>
        </section>

        <section id="states" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — Tool states</p><h2>Every call, <em>four states.</em></h2></div><span className="head-icon"><Layers size={24} /></span></div>
            <div className="card-grid">
              {states.map(st => (
                <article className={'spec-card state-card state-' + st.name} key={st.name}>
                  <span className="badge">{st.label}</span>
                  <h3>{st.q}</h3>
                  <p><code>{st.name}</code> · {st.text}</p>
                </article>
              ))}
            </div>
            <p className="note">Each change of state is a 200 ms crossfade, not a swap. The tool definition file and README are on the <a href="/tool-ui/">FE-07 page</a>. To see the error state on purpose, pick a switch under “Sabotage” in the app (the full list is on the <a href="/edge-cases/">FE-08 page</a>), or choose Week 6, which has no notes yet.</p>
          </div>
        </section>

        <section id="deviations" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — Spec vs. build</p><h2>Deviations, <em>with reasons.</em></h2></div><span className="head-icon"><GitBranch size={24} /></span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">#</th><th scope="col">The spec said</th><th scope="col">The build does</th><th scope="col">Why</th></tr></thead>
                <tbody>{deviations.map((d, i) => <tr key={i}><td>{String(i + 1).padStart(2, '0')}</td><td>{d.spec}</td><td>{d.build}</td><td>{d.why}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="log" className="block">
          <div className="wrap split">
            <div><p className="eyebrow">05 — Build log</p><h2>What broke, <em>what changed.</em></h2><p className="log-sub">Written while building on 10 Nov 2026, times in UTC.</p></div>
            <ol className="timeline">
              {log.map(l => <li key={l.t + l.title}><span className="when">{l.t}</span><h3>{l.title}</h3><p>{l.text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="cut" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">06 — What I cut</p><h2>Narrow first, <em>then grow.</em></h2></div><span className="head-icon"><Scissors size={24} /></span></div>
            <div className="card-grid">
              {cut.map(([title, why]) => (
                <article className="spec-card" key={title}><span className="badge">Cut for now</span><h3>{title}</h3><p>{why}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="evals" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">07 — Evals</p><h2>The six cases <em>it must pass.</em></h2></div><span className="head-icon"><FlaskConical size={24} /></span></div>
            <div className="criteria-card">
              <ul>
                {evals.map(e => <li key={e}><span className="tick"><Check size={14} /></span>{e}</li>)}
              </ul>
            </div>
            <p className="note">Each rule is written into the agent’s system prompt. I run all six against the live agent and record the results in the build log, with a 6/6 target.</p>
          </div>
        </section>
      </main>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">Try it</p>
            <h2>Ask it for a <em>weekly review.</em></h2>
          </div>
          <a className="btn btn-light" href={AGENT_URL} target="_blank" rel="noreferrer">Open the live agent <ArrowUpRight size={17} /></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>Checkpoint 1 · Build the agent</span></footer>
      </section>
    </div>
  );
}
