// Renders every tool part through the same 4-state machine:
//   input-streaming  -> "What is it doing?"   (tool chosen, request being written, skeleton of the result)
//   input-available  -> "With what input?"    (why it chose the tool + the exact input, running)
//   output-available -> "What came back?"     (a real component per tool)
//   output-error     -> "What went wrong?"    (designed error: what failed, what it means, what to do)
// The body is keyed by state so each transition crossfades (200ms) instead of swapping.
import { useState, type ReactNode } from 'react';
import type { CoachMessage } from '../lib/tools';

type Part = CoachMessage['parts'][number];
export type ToolPart = Extract<Part, { type: `tool-${string}` }>;

const META: Record<string, { label: string; icon: string; running: string }> = {
  'tool-listFiles': { label: 'List my files', icon: '🗂️', running: 'Looking at your knowledge files' },
  'tool-readFile': { label: 'Read a file', icon: '📄', running: 'Reading the file' },
  'tool-checkPortfolio': { label: 'Check live portfolio', icon: '🌐', running: 'Fetching each page of your live site' },
  'tool-showWeeklyReview': { label: 'Weekly review', icon: '🗓️', running: 'Checking every cited source' },
  'tool-proposePlan': { label: 'Next week’s plan', icon: '✅', running: 'Waiting for your decision' },
};

const STATE_LABEL: Record<string, string> = {
  'input-streaming': 'Preparing',
  'input-available': 'Running',
  'output-available': 'Done',
  'output-error': 'Failed',
  'approval-requested': 'Needs approval',
  'approval-responded': 'Answered',
  'output-denied': 'Denied',
  interrupted: 'Interrupted',
};

export function ToolPartView({ part, live = true, busy = false, onApprovePlan, onRejectPlan, onRetry }: {
  part: ToolPart;
  /** false once the reply this part belongs to has stopped streaming (finished, failed or stopped) */
  live?: boolean;
  busy?: boolean;
  onApprovePlan: (part: ToolPart) => void;
  onRejectPlan: (part: ToolPart, feedback: string) => void;
  onRetry: () => void;
}) {
  const meta = META[part.type] ?? { label: part.type.replace('tool-', ''), icon: '🔧', running: 'Working' };
  const waitingOnUser = part.type === 'tool-proposePlan' && part.state === 'input-available';
  // A part still "preparing" or "running" after its reply has ended was cut off by a failure or by Stop.
  const interrupted = !live && !waitingOnUser && (part.state === 'input-streaming' || part.state === 'input-available');
  const state = interrupted ? 'interrupted' : part.state;
  const cls = `tool tool--${state}${waitingOnUser ? ' tool--waiting' : ''}`;

  return (
    <section className={cls} aria-live="polite" aria-label={`${meta.label}: ${STATE_LABEL[state] ?? state}`}>
      <header className="tool__head">
        <span className="tool__icon" aria-hidden="true">{meta.icon}</span>
        <span className="tool__name">{meta.label}</span>
        <span className={`tool__state tool__state--${state}`}>
          <i aria-hidden="true" />
          {waitingOnUser ? 'Your call' : STATE_LABEL[state] ?? state}
        </span>
      </header>
      <div className="tool__body" key={state + (waitingOnUser ? 'w' : '')}>
        {interrupted
          ? <p className="muted">This step was cut off before it finished, so it didn’t run. Retry the message to run it again.</p>
          : renderBody(part, meta.running, { onApprovePlan, onRejectPlan, onRetry, busy })}
      </div>
    </section>
  );
}

function Why({ reason }: { reason?: string }) {
  if (!reason) return null;
  return <p className="why"><span>Why this tool</span>{reason}</p>;
}

function renderBody(part: ToolPart, running: string, h: { onApprovePlan: (p: ToolPart) => void; onRejectPlan: (p: ToolPart, f: string) => void; onRetry: () => void; busy: boolean }): ReactNode {
  const input: any = (part as any).input ?? {};
  switch (part.state) {
    case 'input-streaming':
      return (
        <div className="streaming">
          <p className="streaming__line">Writing the request<span className="dots" aria-hidden="true" /></p>
          {input.reason && <p className="why why--draft"><span>Why this tool</span>{input.reason}</p>}
          <Skeleton part={part} input={input} />
        </div>
      );

    case 'input-available':
      if (part.type === 'tool-proposePlan') return <PlanDecision part={part} onApprove={h.onApprovePlan} onReject={h.onRejectPlan} />;
      return (
        <div className="running">
          <Why reason={input.reason} />
          <InputChips part={part} input={input} />
          <p className="running__line"><span className="spinner" aria-hidden="true" />{running}…</p>
        </div>
      );

    case 'output-available':
      return <Result part={part} />;

    case 'output-error':
      return <ToolError part={part} onRetry={h.onRetry} busy={h.busy} />;

    case 'output-denied':
      return <p className="muted">You declined this step, so it did not run.</p>;

    default:
      return <p className="muted">{STATE_LABEL[part.state] ?? part.state}</p>;
  }
}

/* ---------- input-available: the exact input, readable ---------- */
function InputChips({ part, input }: { part: ToolPart; input: any }) {
  if (part.type === 'tool-readFile') return <div className="chips"><span className="chip chip--file">📄 {input.name}</span></div>;
  if (part.type === 'tool-checkPortfolio') return <div className="chips"><span className="chip">ichrak-portfolio-seven.vercel.app</span><span className="chip">6 pages</span></div>;
  if (part.type === 'tool-showWeeklyReview')
    return <div className="chips"><span className="chip">Week {input.week}</span><span className="chip">{input.finished?.length ?? 0} finished</span><span className="chip">{input.open?.length ?? 0} open</span><span className="chip">{(input.finished ?? []).length} sources to verify</span></div>;
  return null;
}

/* ---------- input-streaming: skeleton shaped like the coming result ---------- */
function Skeleton({ part, input }: { part: ToolPart; input: any }) {
  if (part.type === 'tool-showWeeklyReview') {
    const fin: any[] = input.finished ?? [];
    const learned: any[] = input.learned ?? [];
    return (
      <div className="review review--draft">
        <div className="review__col">
          <h4>Finished</h4>
          {fin.length ? fin.map((f, i) => <p key={i} className="draft-line">{f?.item ?? ''}</p>) : <><span className="sk" /><span className="sk sk--short" /></>}
        </div>
        <div className="review__col">
          <h4>Learned</h4>
          {learned.length ? learned.map((l, i) => <p key={i} className="draft-line">{l}</p>) : <><span className="sk" /><span className="sk" /><span className="sk sk--short" /></>}
        </div>
      </div>
    );
  }
  if (part.type === 'tool-checkPortfolio') return <div className="sk-chart">{[70, 45, 85, 55].map((w, i) => <span key={i} className="sk" style={{ width: w + '%' }} />)}</div>;
  if (part.type === 'tool-proposePlan') return <div>{(input.items ?? []).map((it: any, i: number) => <p key={i} className="draft-line">{i + 1}. {it?.task ?? ''}</p>)}{!(input.items ?? []).length && <span className="sk" />}</div>;
  return <div><span className="sk" /><span className="sk sk--short" /></div>;
}

/* ---------- output-error: designed, specific, recoverable ---------- */
function ToolError({ part, onRetry, busy }: { part: ToolPart; onRetry: () => void; busy: boolean }) {
  const input: any = (part as any).input ?? {};
  const msg: string = (part as any).errorText ?? 'Unknown error';
  const simulated = msg.startsWith('Simulated failure');
  const malformed = msg.startsWith('Malformed data');
  const missingFile = part.type === 'tool-readFile' && !simulated && !malformed;
  const next = malformed
    ? 'The file is fine; its data got damaged on the way. Trying again usually works.'
    : missingFile
    ? `Upload ${input.name ?? 'the file'} in the side panel (or check the file name), then try again.`
    : part.type === 'tool-checkPortfolio'
      ? 'The review can still go on without it; the coach just can’t confirm what is live.'
      : 'Try again. If it keeps failing, the coach will carry on with what it has.';
  return (
    <div className="err" role="alert">
      <div className="err__mark" aria-hidden="true">!</div>
      <div>
        <p className="err__title">{malformed ? 'Unreadable tool result' : missingFile ? 'File not found' : simulated ? 'Tool failed (test switch)' : 'This step failed'}</p>
        <p className="err__msg">{msg}</p>
        {input.reason && <p className="err__ctx">It was trying to: {input.reason}</p>}
        <p className="err__next"><b>What now:</b> {next}</p>
        <button className="btn btn--ghost" onClick={onRetry} disabled={busy}>Try again</button>
      </div>
    </div>
  );
}

/* ---------- output-available: one real component per tool ---------- */
function Result({ part }: { part: ToolPart }) {
  if (part.state !== 'output-available') return null;
  switch (part.type) {
    case 'tool-listFiles': {
      const files = part.output.files;
      if (!files.length) return <p className="muted">No files loaded, so there is nothing to review. Use <b>Load example notes</b> or upload your own in the side panel.</p>;
      return <ul className="files">{files.map((f) => <li key={f.name}><span className={`kind kind--${f.kind}`}>{f.kind}</span>{f.name}<small>{(f.chars / 1000).toFixed(1)}k</small></li>)}</ul>;
    }
    case 'tool-readFile':
      return <FilePreview name={part.output.name} kind={part.output.kind} lines={part.output.lines} content={part.output.content} />;
    case 'tool-checkPortfolio':
      return <SiteChart pages={part.output.pages} checkedAt={part.output.checkedAt} />;
    case 'tool-showWeeklyReview':
      return <ReviewCard r={part.output} />;
    case 'tool-proposePlan':
      return <PlanResult items={part.input.items} out={part.output} />;
  }
  return null;
}

function FilePreview({ name, kind, lines, content }: { name: string; kind: string; lines: number; content: string }) {
  const [open, setOpen] = useState(false);
  const body = content.split('\n').filter((l) => l.trim());
  return (
    <div className="filecard">
      <p className="filecard__meta"><span className={`kind kind--${kind}`}>{kind}</span><b>{name}</b> · {lines} lines</p>
      <pre className={open ? 'filecard__text open' : 'filecard__text'}>{(open ? body : body.slice(0, 4)).join('\n')}</pre>
      {body.length > 4 && <button className="linkbtn" onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Show the whole file'}</button>}
    </div>
  );
}

function SiteChart({ pages, checkedAt }: { pages: { path: string; ok: boolean; status: number | null; ms: number; title: string | null }[]; checkedAt: string }) {
  const max = Math.max(...pages.map((p) => p.ms), 1);
  const up = pages.filter((p) => p.ok).length;
  const W = 300, row = 30;
  return (
    <figure className="site">
      <figcaption><b>{up}/{pages.length} pages online</b> · response time, checked {new Date(checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</figcaption>
      <svg viewBox={`0 0 ${W + 150} ${pages.length * row}`} role="img" aria-label={`Response times: ${pages.map((p) => `${p.path} ${p.ms} ms`).join(', ')}`}>
        {pages.map((p, i) => {
          const w = Math.max(4, (p.ms / max) * W);
          return (
            <g key={p.path} transform={`translate(0 ${i * row})`}>
              <text x="0" y="19" className="site__path">{p.path}</text>
              <rect x="110" y="7" width={w} height="16" rx="4" className={p.ok ? 'bar bar--ok' : 'bar bar--down'} style={{ animationDelay: `${i * 60}ms` }} />
              <text x={110 + w + 8} y="19" className="site__ms">{p.ok ? `${p.ms} ms` : p.status ? `HTTP ${p.status}` : 'no answer'}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function ReviewCard({ r }: { r: any }) {
  return (
    <article className="review">
      <h3 className="review__title">Week {r.week} review</h3>
      {r.conflict && <p className="review__conflict">⚠️ {r.conflict}</p>}
      <div className="review__grid">
        <div className="review__col">
          <h4>Finished</h4>
          {r.finished.length ? (
            <ul>{r.finished.map((f: any, i: number) => <li key={i}>{f.item}<span className={f.verified ? 'src src--ok' : 'src src--bad'} title={f.verified ? 'This file exists in your knowledge files' : 'This file is not in your knowledge files'}>{f.verified ? '✓' : '?'} {f.source}</span></li>)}</ul>
          ) : <p className="muted">Nothing marked as finished in your notes.</p>}
        </div>
        <div className="review__col">
          <h4>Learned</h4>
          <ol>{r.learned.map((l: string, i: number) => <li key={i}>{l}</li>)}</ol>
        </div>
        <div className="review__col">
          <h4>Still open</h4>
          {r.open.length ? <ul className="open">{r.open.map((o: any, i: number) => <li key={i}><span>{o.title}</span><em>{o.due}</em></li>)}</ul> : <p className="muted">Nothing open. Nice.</p>}
        </div>
      </div>
      {r.unverified > 0 && <p className="review__warn">{r.unverified} source{r.unverified > 1 ? 's' : ''} could not be matched to your files. Treat {r.unverified > 1 ? 'those items' : 'that item'} with care.</p>}
    </article>
  );
}

function PlanDecision({ part, onApprove, onReject }: { part: ToolPart; onApprove: (p: ToolPart) => void; onReject: (p: ToolPart, f: string) => void }) {
  const input: any = (part as any).input;
  const [editing, setEditing] = useState(false);
  const [fb, setFb] = useState('');
  return (
    <div className="plan">
      <p className="plan__q">Save this as your plan for <b>Week {input.week}</b>?</p>
      <ol className="plan__items">{input.items.map((it: any, i: number) => <li key={i}><b>{it.task}</b>{it.why ? <small>{it.why}</small> : null}</li>)}</ol>
      {editing ? (
        <form className="plan__edit" onSubmit={(e) => { e.preventDefault(); onReject(part, fb.trim()); }}>
          <label htmlFor={'fb' + part.toolCallId}>What should change?</label>
          <textarea id={'fb' + part.toolCallId} value={fb} onChange={(e) => setFb(e.target.value)} rows={2} placeholder="e.g. swap item 3 for finishing FE-06" autoFocus />
          <div className="plan__btns"><button className="btn" type="submit">Send changes</button><button className="btn btn--ghost" type="button" onClick={() => setEditing(false)}>Back</button></div>
        </form>
      ) : (
        <div className="plan__btns">
          <button className="btn" onClick={() => onApprove(part)}>Approve and save</button>
          <button className="btn btn--ghost" onClick={() => setEditing(true)}>Ask for changes</button>
        </div>
      )}
      <p className="plan__note">Nothing is saved until you approve.</p>
    </div>
  );
}

function PlanResult({ items, out }: { items: { task: string }[]; out: { approved: boolean; savedAs?: string; feedback?: string } }) {
  return out.approved ? (
    <div className="plan plan--done">
      <p className="plan__ok">✓ Approved and saved as <b>{out.savedAs}</b></p>
      <ol className="plan__items plan__items--compact">{items.map((it, i) => <li key={i}>{it.task}</li>)}</ol>
    </div>
  ) : (
    <div className="plan plan--done">
      <p className="plan__no">Not saved. You asked for changes{out.feedback ? `: “${out.feedback}”` : '.'}</p>
    </div>
  );
}
