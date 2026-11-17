import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import type { CoachMessage, KnowledgeFile } from '../lib/tools';
import type { ToolPart } from './ToolParts';
import { MessageView } from './MessageView';
import { Bomb, ChatError, ErrorBoundary, toProblem, useOnline, useSlow } from './failures';

const STARTER = ['week-05.md', 'assignments.md', 'review-template.md'];
const MAX_INPUT = 2000;
const EXAMPLES = ['What did I finish this week?', 'Explain why shadcn/ui wraps Radix', 'What’s due in Week 6?'];

// Sabotage switches (FE-08). Each one breaks the next request only, so Retry can show recovery.
const SABOTAGE: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'network', label: '1. Network down before send' },
  { value: 'midstream', label: '2. Connection drops mid-stream' },
  { value: 'rate-limit', label: '3. Rate limit (429)' },
  { value: 'malformed', label: '4. Tool returns malformed JSON' },
  { value: 'route-throw', label: '5. Route handler throws (500)' },
  { value: 'slow', label: '6. Slow response (9 s)' },
  { value: 'refusal', label: '7. Model refuses' },
  { value: 'readFile', label: '8. readFile fails' },
  { value: 'checkPortfolio', label: '9. checkPortfolio fails' },
  { value: 'crash', label: '10. Page component crashes' },
];

const store = {
  get<T>(k: string, d: T, ok: (v: any) => boolean = () => true): T {
    try { const v = localStorage.getItem(k); if (!v) return d; const p = JSON.parse(v); return ok(p) ? p : d; } catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode or full */ } },
};
const validFiles = (v: any) => Array.isArray(v) && v.every((f) => f && typeof f.name === 'string' && typeof f.content === 'string');
const pad = (w: number) => String(w).padStart(2, '0');
const textOf = (m: CoachMessage | undefined) => (m?.parts.find((p) => p.type === 'text') as any)?.text ?? '';
const clip = (s: string, n = 38) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export default function App() {
  const [files, setFiles] = useState<KnowledgeFile[] | null>(() => store.get('wrc2_files', null, validFiles));
  const [starterError, setStarterError] = useState(false);
  const [week, setWeek] = useState<number>(() => store.get('wrc2_week', 5, (v) => Number.isInteger(v) && v >= 1 && v <= 52));
  const [sabotage, setSabotage] = useState('');
  const [crash, setCrash] = useState(false);
  const [mode, setMode] = useState<{ mode: 'live' | 'demo'; model: string } | null | 'unknown'>(null);
  const [input, setInput] = useState('');
  const [inputHint, setInputHint] = useState('');
  const [editing, setEditing] = useState<number>(-1);
  const [filesOpen, setFilesOpen] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [boundaryKey, setBoundaryKey] = useState(0);
  const online = useOnline();
  const forceDemo = new URLSearchParams(location.search).has('demo');
  const composer = useRef<HTMLTextAreaElement>(null);

  // The transport reads the latest values through a ref, so the body is always current.
  // A sabotage switch is consumed by the request that uses it.
  const ctx = useRef({ files: files ?? [], week, sabotage, demo: forceDemo });
  ctx.current = { files: files ?? [], week, sabotage, demo: forceDemo };
  const sent = useRef('');
  const transport = useMemo(() => new DefaultChatTransport<CoachMessage>({
    api: '/api/chat',
    body: () => {
      sent.current = ctx.current.sabotage;
      if (ctx.current.sabotage) setTimeout(() => setSabotage(''), 0);
      return { files: ctx.current.files, week: ctx.current.week, demo: ctx.current.demo, sabotage: ctx.current.sabotage || undefined };
    },
    fetch: async (url, init) => {
      if (sent.current === 'network') {
        await new Promise((r) => setTimeout(r, 300));
        throw new TypeError('Failed to fetch (sabotage switch: network down before send).');
      }
      if (!navigator.onLine) throw new TypeError('Failed to fetch: this device is offline.');
      return fetch(url as RequestInfo, init);
    },
  }), []);

  const { messages, sendMessage, regenerate, addToolOutput, status, error, setMessages, clearError, stop } = useChat<CoachMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  useEffect(() => { if (!files) loadStarter(); }, []);
  useEffect(() => { if (files) store.set('wrc2_files', files); }, [files]);
  useEffect(() => { store.set('wrc2_week', week); }, [week]);
  useEffect(() => {
    fetch('/api/status').then((r) => (r.ok ? r.json() : Promise.reject())).then(setMode).catch(() => setMode('unknown'));
  }, []);

  // Auto-scroll only while the reader is already at the bottom; otherwise offer a jump button.
  const scroller = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const onScroll = () => {
    const el = scroller.current;
    if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  };
  const toBottom = (smooth = true) => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  useEffect(() => { if (atBottom) toBottom(false); }, [messages, status, error]);

  async function loadStarter() {
    setStarterError(false);
    try {
      const loaded = await Promise.all(STARTER.map(async (n) => {
        const r = await fetch('/data/' + n);
        if (!r.ok) throw new Error(n);
        return { name: n, content: await r.text() };
      }));
      setFiles(loaded);
    } catch {
      setStarterError(true);
      setFiles((f) => f ?? []);
    }
  }

  const busy = status === 'submitted' || status === 'streaming';
  const slow = useSlow(status === 'submitted', 5000);
  const tooLong = input.length > MAX_INPUT;
  const problem = toProblem(error);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistant = messages.at(-1)?.role === 'assistant' ? messages.at(-1) : undefined;

  function ask(text: string) {
    const t = text.trim();
    if (busy) return;
    if (!t) { setInputHint('Type a question first, or pick one of the starters above.'); composer.current?.focus(); return; }
    if (t.length > MAX_INPUT) { setInputHint(`That is ${t.length} characters; the limit is ${MAX_INPUT}. Upload long notes as a file instead.`); return; }
    if (sabotage === 'crash') { setCrash(true); setSabotage(''); return; }
    setInputHint(''); setStopped(false); clearError();
    sendMessage({ text: t });
    setInput('');
    setAtBottom(true);
  }

  function retry() {
    if (busy) return;
    setStopped(false);
    clearError();
    // regenerate() drops the failed assistant reply (if any) and re-sends the last user message: only the failed turn is retried.
    regenerate();
  }

  function fill(text: string) {
    setInput(text);
    setInputHint('');
    requestAnimationFrame(() => { composer.current?.focus(); composer.current?.setSelectionRange(text.length, text.length); });
  }

  function approvePlan(part: ToolPart) {
    const p: any = (part as any).input;
    const name = `plan-week-${pad(p.week)}.md`;
    const content = `# Plan for Week ${p.week}\n\n> Approved ${new Date().toLocaleDateString()} in the Weekly Review Coach.\n\n${p.items.map((it: any, i: number) => `${i + 1}. ${it.task}${it.why ? ` (${it.why})` : ''}`).join('\n')}\n`;
    setFiles((fs) => [...(fs ?? []).filter((f) => f.name !== name), { name, content }]);
    addToolOutput({ tool: 'proposePlan', toolCallId: part.toolCallId, output: { approved: true, savedAs: name } });
  }
  function rejectPlan(part: ToolPart, feedback: string) {
    addToolOutput({ tool: 'proposePlan', toolCallId: part.toolCallId, output: { approved: false, feedback: feedback || undefined } });
  }

  const isDemo = forceDemo || (mode !== null && mode !== 'unknown' && mode.mode === 'demo');
  const noFiles = files !== null && files.length === 0;
  const weekFile = `week-${pad(week)}.md`;
  const missingWeek = !!files?.length && !files.some((f) => f.name === weekFile);
  const finish = lastAssistant?.metadata?.finishReason;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Weekly Review <em>Coach</em></h1>
          <p>Reviews my internship week from my own notes, then quizzes me on it.</p>
        </div>
        <div className="controls">
          <span className={isDemo ? 'mode mode--demo' : 'mode'} title={mode && mode !== 'unknown' ? mode.model : undefined}>
            {mode === null ? <span className="sk sk--pill" aria-label="Checking the model" /> : mode === 'unknown' ? 'Model status unknown' : isDemo ? 'Demo model' : 'Live · Claude'}
          </span>
          <label><span className="lbl">Week</span> <select aria-label="Week" value={week} onChange={(e) => setWeek(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Week {i + 1}</option>)}</select></label>
          <label className={sabotage ? 'sabotage sabotage--on' : 'sabotage'} title="Break the next request on purpose, to test the error states"><span className="lbl">Sabotage</span>
            <select aria-label="Sabotage the next request" value={sabotage} onChange={(e) => setSabotage(e.target.value)} aria-describedby="sabotage-help">
              {SABOTAGE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <span id="sabotage-help" hidden>Applies to the next message only, then switches itself off.</span>
          <button className="btn btn--dark" onClick={async () => { await stop(); setMessages([]); clearError(); setStopped(false); setCrash(false); setBoundaryKey((k) => k + 1); }}>New chat</button>
        </div>
      </header>

      {!online && <p className="banner banner--offline" role="status"><b>You’re offline.</b> Your notes and this chat are kept. Sending works again as soon as you reconnect.</p>}
      {isDemo && online && (
        <p className="banner">
          <b>Demo model.</b> <span className="long">No model credits on this deployment yet, so a scripted model chooses the tools. The tools are real: they read your files, fetch your live portfolio and check your sources.</span><span className="short">Scripted model, real tools.</span>
        </p>
      )}
      {sabotage && <p className="banner banner--sabotage" role="status">Sabotage armed: <b>{SABOTAGE.find((s) => s.value === sabotage)?.label.replace(/^\d+\. /, '')}</b>. It applies to your next message only.</p>}

      <main className="layout">
        <aside className={filesOpen ? 'side side--open' : 'side'}>
          <button className="side__toggle" aria-expanded={filesOpen} onClick={() => setFilesOpen(!filesOpen)}>
            My knowledge files <span>{files?.length ?? 0}</span>
          </button>
          <h2>My knowledge files</h2>
          <div className="side__body">
            {files === null && <><span className="sk sk--file" /><span className="sk sk--file" /><span className="sk sk--file" /></>}
            {starterError && (
              <div className="side__empty side__empty--err" role="alert">
                <b>Couldn’t load the starter files.</b>
                <span>Check your connection, or upload your own notes below.</span>
                <button className="btn btn--ghost" onClick={loadStarter}>Try again</button>
              </div>
            )}
            {noFiles && !starterError && (
              <div className="side__empty">
                <b>No files yet.</b>
                <span>The coach only reads what you give it. Upload <code>{weekFile}</code>, or load the example notes.</span>
                <button className="btn btn--ghost" onClick={loadStarter}>Load example notes</button>
              </div>
            )}
            {(files ?? []).map((f, i) => (
              <div className="kfile" key={f.name}>
                <button className="kfile__name" onClick={() => setEditing(i)}>{f.name.startsWith('plan-') ? '✅' : '📄'} {f.name}</button>
                <button className="kfile__x" aria-label={`Remove ${f.name}`} onClick={() => setFiles((fs) => (fs ?? []).filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <label className="upload">+ Upload notes (.md / .txt)
              <input type="file" accept=".md,.txt,.markdown,text/plain,text/markdown" multiple hidden onChange={async (e) => {
                const picked = [...(e.target.files ?? [])];
                const added = (await Promise.all(picked.map(async (f) => ({ name: f.name, content: await f.text() })))).filter((f) => f.content.trim());
                if (added.length < picked.length) alert('Empty files were skipped: the coach would have nothing to read in them.');
                setFiles((fs) => [...(fs ?? []).filter((f) => !added.some((a) => a.name === f.name)), ...added]);
                e.target.value = '';
              }} />
            </label>
            {!!files?.length && <button className="linkbtn" onClick={() => confirm('Replace your files with the starter files?') && loadStarter()}>Restore starter files</button>}
            <p className="tip">The coach can only see these files. Name weekly notes like <code>week-{pad(week + 1)}.md</code>.</p>
          </div>
        </aside>

        <ErrorBoundary key={boundaryKey} fallback={(_reset, err) => (
          <section className="chat chat--crashed" role="alert">
            <div className="err err--global">
              <div className="err__mark" aria-hidden="true">!</div>
              <div>
                <p className="err__title">The chat stopped working</p>
                <p className="err__msg">{err.message}</p>
                <p className="err__next"><b>What now:</b> reload the chat. Your knowledge files are not affected.</p>
                <button className="btn" onClick={() => { setCrash(false); setBoundaryKey((k) => k + 1); }}>Reload the chat</button>
              </div>
            </div>
          </section>
        )}>
          <section className="chat">
            {crash && <Bomb />}
            <div className="scroll" ref={scroller} onScroll={onScroll} role="log" aria-label="Conversation">
              {!messages.length && (
                <div className="empty">
                  {noFiles ? (
                    <>
                      <h2>Nothing to review yet.</h2>
                      <p>The coach only works from your own notes, and you have none loaded. Start with the example Week 5 notes, or upload your own.</p>
                      <div className="quick">
                        <button className="quick__main" onClick={loadStarter}>Load the example notes</button>
                        <button onClick={() => setFilesOpen(true)}>Upload my notes</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2>Close out your week.</h2>
                      <p>I read your notes, check your live portfolio, show your week as a review card, quiz you, and propose a plan you approve.</p>
                      {missingWeek && (
                        <p className="empty__warn">There is no <code>{weekFile}</code> in your files yet, so a Week {week} review will ask you for it. <button className="linkbtn" onClick={() => setWeek(5)}>Switch to Week 5</button></p>
                      )}
                      <div className="quick">
                        <button className="quick__main" onClick={() => ask('weekly review')} disabled={!online || files === null}>Start my weekly review</button>
                        <button onClick={() => ask('Quiz me on this week’s notes')} disabled={!online || files === null}>Quiz me</button>
                      </div>
                      <p className="examples__label">Or try asking</p>
                      <div className="examples">{EXAMPLES.map((q) => <button key={q} onClick={() => fill(q)}>{q}</button>)}</div>
                      <p className="hint">Testing failures? Pick one under <b>Sabotage</b>, then send a message.</p>
                    </>
                  )}
                </div>
              )}

              {messages.map((m, mi) => (
                <MessageView
                  key={m.id}
                  message={m}
                  live={busy && mi === messages.length - 1}
                  busy={busy}
                  onApprovePlan={approvePlan}
                  onRejectPlan={rejectPlan}
                  onRetryTool={() => ask('That step failed. Please try it again.')}
                />
              ))}

              {status === 'submitted' && (
                <div className="pending" aria-live="polite">
                  <p className="thinking">Coach is choosing what to do<span className="dots" /></p>
                  <div className="bubble bubble--skeleton" aria-hidden="true"><span className="sk" /><span className="sk sk--short" /></div>
                  {slow && (
                    <div className="slow" role="status">
                      <span>This is taking longer than usual. Models can be slow when they are busy.</span>
                      <button className="btn btn--ghost" onClick={() => { stop(); setStopped(true); }}>Stop</button>
                    </div>
                  )}
                </div>
              )}

              {!busy && !error && finish === 'content-filter' && (
                <div className="note note--refusal" role="status">
                  <b>The model declined to answer this.</b> It can only help with your own notes and assignments. Try rephrasing, or ask about something in your files.
                  <button className="linkbtn" onClick={() => fill(textOf(lastUser))}>Edit my question</button>
                </div>
              )}
              {!busy && !error && finish === 'length' && (
                <div className="note" role="status">
                  <b>The answer hit the length limit.</b> <button className="linkbtn" onClick={() => ask('Please continue where you stopped.')}>Continue</button>
                </div>
              )}
              {!busy && !error && stopped && (
                <div className="note" role="status">
                  You stopped this answer. Anything that arrived is kept. <button className="linkbtn" onClick={retry}>Ask again</button>
                </div>
              )}

              {problem && <ChatError problem={problem} busy={busy} retryLabel={lastUser ? clip(textOf(lastUser)) : null} onRetry={retry} />}
            </div>

            {!atBottom && messages.length > 0 && <button className="jump" onClick={() => { setAtBottom(true); toBottom(); }}>↓ Latest</button>}

            <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <div className="composer__field">
                <textarea
                  ref={composer}
                  value={input}
                  rows={1}
                  aria-label="Message the coach"
                  aria-invalid={tooLong}
                  aria-describedby="composer-hint"
                  placeholder={noFiles ? 'Load or upload notes first…' : 'Ask about your week…'}
                  onChange={(e) => { setInput(e.target.value); if (inputHint) setInputHint(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(input); } }}
                />
                <p id="composer-hint" className={tooLong || inputHint ? 'composer__hint composer__hint--warn' : 'composer__hint'}>
                  {inputHint || (input.length > MAX_INPUT * 0.8 ? `${input.length} / ${MAX_INPUT}` : !online ? 'Offline: sending is paused.' : '')}
                </p>
              </div>
              {busy
                ? <button type="button" className="btn btn--stop" onClick={() => { stop(); setStopped(true); }} aria-label="Stop the answer">■ Stop</button>
                : <button className="btn" disabled={!online || tooLong || !input.trim()}>Send</button>}
            </form>
          </section>
        </ErrorBoundary>
      </main>

      {editing >= 0 && files?.[editing] && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={files[editing].name} onKeyDown={(e) => e.key === 'Escape' && setEditing(-1)}>
          <div className="modal__card">
            <header><b>{files[editing].name}</b><button aria-label="Close" onClick={() => setEditing(-1)}>×</button></header>
            <textarea defaultValue={files[editing].content} id="edit-area" spellCheck={false} autoFocus />
            <footer>
              <button className="btn btn--ghost" onClick={() => setEditing(-1)}>Cancel</button>
              <button className="btn" onClick={() => { const v = (document.getElementById('edit-area') as HTMLTextAreaElement).value; setFiles((fs) => (fs ?? []).map((f, j) => (j === editing ? { ...f, content: v } : f))); setEditing(-1); }}>Save</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
