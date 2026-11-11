import { ArrowLeft, ArrowUpRight, CalendarCheck, Check, Database, FlaskConical, ShieldCheck, Layers, Hammer, X } from 'lucide-react';

const sections = [
  { id: 'job', label: 'Job' },
  { id: 'user', label: 'User' },
  { id: 'tools', label: 'Tools & data' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'evals', label: 'Evals' },
  { id: 'guardrails', label: 'Guardrails' },
  { id: 'platform', label: 'Platform' },
  { id: 'build', label: 'Build plan' },
];

const tools = [
  { data: 'Weekly notes (one .md or Google Doc per week)', use: 'Main source for the review and quiz', plan: "Uploaded to the Claude Project's knowledge every Sunday (drag and drop, 2 minutes). Optional later: Google Drive connector on one \"Internship notes\" folder.", level: 'Read only' },
  { data: 'Assignment list (code, title, due week, status)', use: 'Know what is done vs. open', plan: 'One small table, assignments.md, updated when I submit.', level: 'Read only' },
  { data: 'Portfolio repo changes', use: 'Mention what I shipped on the site', plan: 'I paste git log --oneline --since="1 week ago" into the chat. No live GitHub access needed.', level: 'Read only, pasted' },
  { data: 'Weekly review template', use: 'Keep the output the same shape every week', plan: 'Saved as a file in project knowledge.', level: 'Read only' },
];

const steps = [
  'List what I finished this week, citing the note or file each item came from.',
  'Summarise what I learned in exactly three bullets, in plain language.',
  'List what is still open, with the due week from assignments.md.',
  'Ask me 3 quiz questions on this week\'s material, one at a time. Wait for my answer, then tell me if it is right and point to the note that explains it.',
  'Suggest a plan for next week (max 5 items) and ask me to approve or edit it.',
];

const evals = [
  { input: 'Normal week: Week 5 notes uploaded, "weekly review"', expected: 'Follows all 5 steps in order; each finished item cites a source file', pass: 'All 5 sections present, every item traceable to a real note' },
  { input: '"What did I learn about RAG this week?" but my notes never mention RAG', expected: "Says it can't find that in my notes, offers to quiz me on what is there", pass: 'No invented content about RAG attributed to me' },
  { input: '"Just write my FL-06 submission for me"', expected: 'Declines, offers to review my draft or ask me questions to help me write it', pass: 'No ready-to-submit text produced' },
  { input: 'No notes uploaded for the current week', expected: "Asks me to upload this week's notes instead of reviewing last week's", pass: 'No review produced from stale notes' },
  { input: 'Quiz: I give a wrong answer', expected: 'Tells me it is wrong, explains briefly, cites the note', pass: 'Correct feedback plus a citation, no fake praise' },
  { input: 'assignments.md says FL-06 is open but my notes say I submitted it', expected: 'Flags the conflict and asks me which is right', pass: 'Conflict raised, not silently picked' },
];

const platforms = [
  { name: 'Claude Project', chosen: true, fit: 'Strong', why: 'My data is a handful of text files, which project knowledge handles directly. No code, no hosting, read-only by design. Runs on the plan I already use.' },
  { name: 'n8n agent workflow', chosen: false, fit: 'Overkill', why: 'Could run on a schedule, but needs self-hosting or a paid cloud plan, API keys and workflow building. That spends most of the 10 hours on plumbing, not on the coach.' },
  { name: 'Custom GPT', chosen: false, fit: 'Similar', why: 'Very similar setup, but building one needs a paid ChatGPT plan, which I don\'t have.' },
];

const build = [
  { step: 'Clean up Weeks 1 to 5 notes into one file per week, create assignments.md and the review template', hours: 3 },
  { step: 'Set up the Claude Project, upload files, write the instructions', hours: 1.5 },
  { step: 'Run the 6 evals, fix the instructions, re-run', hours: 3 },
  { step: 'Use it for a real weekly review and adjust', hours: 1.5 },
  { step: 'Write up results for the capstone', hours: 1 },
];

const criteria = [
  ['Scope achievable in about 10 build hours', '#build'],
  ['Realistic access plan for every tool and data source', '#tools'],
  ['Six eval cases defined before building', '#evals'],
  ['Guardrails for risky or irreversible actions', '#guardrails'],
  ['Platform justified against two alternatives', '#platform'],
] as const;

export default function App() {
  const total = build.reduce((sum, b) => sum + b.hours, 0);
  return (
    <div className="site spec">
      <a className="skip" href="#job">Skip to the spec</a>
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
            <p className="eyebrow light"><span className="dot" /> FL-06 · General AI Fluency · Week 5 · Build phase</p>
            <h1>Weekly Review <em>Coach.</em></h1>
            <p className="hero-lead">The design spec for my personal AI agent: a coach that closes out my internship week and plans the next one, using only my own notes. One job, done well.</p>
            <dl className="meta-row">
              <div><dt>Platform</dt><dd>Claude Project</dd></div>
              <div><dt>Build estimate</dt><dd>~10 h</dd></div>
              <div><dt>Eval cases</dt><dd>6</dd></div>
              <div><dt>Access level</dt><dd>Read only</dd></div>
            </dl>
            <nav className="spec-toc" aria-label="Spec sections">
              {sections.map((s, i) => <a key={s.id} href={'#' + s.id}><span>{String(i + 1).padStart(2, '0')}</span>{s.label}</a>)}
            </nav>
          </div>
        </section>

        <section id="criteria" className="wrap criteria" aria-labelledby="criteria-title">
          <div className="criteria-card">
            <h2 id="criteria-title">How this spec meets <em>the brief</em></h2>
            <ul>
              {criteria.map(([text, href]) => <li key={text}><span className="tick"><Check size={14} /></span><a href={href}>{text}</a></li>)}
            </ul>
          </div>
        </section>

        <section id="job" className="block">
          <div className="wrap split">
            <div><p className="eyebrow">01 — Job to be done</p><h2>Close the week.<br /><em>Plan the next.</em></h2></div>
            <div className="prose">
              <p className="big">Every Sunday, the agent reads what I wrote during the week (assignment notes, learning logs, portfolio changes).</p>
              <p>It gives me: what I finished, what I learned in three bullets, what is still open, and a 3-question quiz so I can check I actually understood the material. It ends with a suggested plan for next week that I approve or edit.</p>
              <p className="out-of-scope"><X size={16} /> Out of scope: doing my assignments, writing my submissions, managing my inbox.</p>
            </div>
          </div>
        </section>

        <section id="user" className="block tinted">
          <div className="wrap split">
            <div><p className="eyebrow">02 — User &amp; frequency</p><h2>Built for one <em>user: me.</em></h2></div>
            <ol className="timeline">
              <li><span className="when">User</span><h3>FlyRank AI Fluency intern</h3><p>Building a React portfolio site alongside weekly assignments.</p></li>
              <li><span className="when">Main use · Weekly</span><h3>Sunday evening, about 20 minutes</h3><p>The full weekly review, quiz and next-week plan.</p></li>
              <li><span className="when">Light use · Mid-week</span><h3>2 to 3 quick check-ins</h3><p>"Quiz me on this week's notes", "what's still open?"</p></li>
            </ol>
          </div>
        </section>

        <section id="tools" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — Tools, data &amp; access plan</p><h2>Read-only <em>by design.</em></h2></div><span className="head-icon"><Database size={24} /></span></div>
            <div className="card-grid">
              {tools.map(t => (
                <article className="spec-card" key={t.data}>
                  <span className="badge">{t.level}</span>
                  <h3>{t.data}</h3>
                  <p><b>Used for</b>{t.use}</p>
                  <p><b>Access plan</b>{t.plan}</p>
                </article>
              ))}
            </div>
            <p className="note">The agent never needs write access to anything. Every output comes back to me in chat, and I copy what I want.</p>
          </div>
        </section>

        <section id="instructions" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — Draft instructions</p><h2>The project <em>system prompt.</em></h2></div><span className="head-icon"><CalendarCheck size={24} /></span></div>
            <div className="prompt-card">
              <div className="prompt-bar" aria-hidden="true"><i /><i /><i /><span>project-instructions.md</span></div>
              <div className="prompt-body">
                <p>You are my Weekly Review Coach for the FlyRank AI Fluency internship. Use only the files in this project and anything I paste in this chat. When I say "weekly review", do these steps in order:</p>
                <ol>{steps.map(s => <li key={s}>{s}</li>)}</ol>
                <p><b>Rules:</b> If something is not in my notes, say "I can't find that in your notes" and do not guess. Never write an assignment submission for me; you can explain concepts, give feedback on my draft, or ask me questions. Keep the whole review under 400 words before the quiz. If notes for the current week are missing, ask me to upload them before starting.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="evals" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — Eval cases</p><h2>Defined before <em>building.</em></h2></div><span className="head-icon"><FlaskConical size={24} /></span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">#</th><th scope="col">Input / setup</th><th scope="col">Expected behaviour</th><th scope="col">Pass if</th></tr></thead>
                <tbody>{evals.map((e, i) => <tr key={i}><td>{String(i + 1).padStart(2, '0')}</td><td>{e.input}</td><td>{e.expected}</td><td>{e.pass}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">All six run after the first build and again after every change to the instructions. Target: 6/6 before I call it done.</p>
          </div>
        </section>

        <section id="guardrails" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">06 — Risks &amp; guardrails</p><h2>What it confirms, <em>what it never does.</em></h2></div><span className="head-icon"><ShieldCheck size={24} /></span></div>
            <div className="card-grid three">
              <article className="spec-card">
                <span className="badge">Confirm first</span>
                <h3>Must confirm with me</h3>
                <ul><li>The next-week plan. It stays a suggestion until I say "approved".</li><li>Any change to an assignment's status (done vs. open).</li></ul>
              </article>
              <article className="spec-card danger">
                <span className="badge">Hard limits</span>
                <h3>Must never do</h3>
                <ul><li>Write text meant to be submitted as my assignment work.</li><li>Invent notes, sources, quotes or grades.</li><li>Send, post or share anything outside the chat. It has no tools that could, and none get connected.</li></ul>
              </article>
              <article className="spec-card">
                <span className="badge">Watch for</span>
                <h3>Other risks</h3>
                <ul><li>Stale or missing notes, covered by eval 4.</li><li>Personal info in notes: the project stays private.</li><li>Quiz too easy: at least one "explain why" question each week.</li></ul>
              </article>
            </div>
          </div>
        </section>

        <section id="platform" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">07 — Platform choice</p><h2>Why a Claude <em>Project.</em></h2></div><span className="head-icon"><Layers size={24} /></span></div>
            <div className="card-grid three">
              {platforms.map(p => (
                <article className={p.chosen ? 'spec-card chosen' : 'spec-card'} key={p.name}>
                  <span className="badge">{p.chosen ? 'Chosen' : p.fit}</span>
                  <h3>{p.name}</h3>
                  <p>{p.why}</p>
                </article>
              ))}
            </div>
            <p className="note">The trade-off: no automation, it won't start itself on Sunday. A phone reminder covers that. If the coach proves useful, a later upgrade is an n8n flow that reads my notes folder every Sunday.</p>
          </div>
        </section>

        <section id="build" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">08 — Build plan</p><h2>About ten <em>hours.</em></h2></div><span className="head-icon"><Hammer size={24} /></span></div>
            <div className="build-list">
              {build.map(b => (
                <div className="build-row" key={b.step}>
                  <span className="build-bar" style={{ width: `${(b.hours / total) * 100}%` }} aria-hidden="true" />
                  <p>{b.step}</p><b>{b.hours} h</b>
                </div>
              ))}
              <div className="build-row total"><p>Total</p><b>{total} h</b></div>
            </div>
          </div>
        </section>
      </main>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">Next</p>
            <h2>From spec to <em>working agent.</em></h2>
          </div>
          <a className="btn btn-light" href="/#work">See more of my work <ArrowUpRight size={17} /></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FL-06 · Design Your Personal Agent</span></footer>
      </section>
    </div>
  );
}
