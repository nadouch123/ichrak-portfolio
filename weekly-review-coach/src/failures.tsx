// Client side of FE-08: error boundaries, the designed chat error with a safe retry,
// and the small hooks behind the offline banner and the slow-response notice.
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

export type Problem = { code: string; message: string; retryAfter?: number };

/** useChat gives us an Error; the server sends a JSON problem as its message. Decode it, or classify it. */
export function toProblem(error: Error | undefined): Problem | null {
  if (!error) return null;
  try {
    const p = JSON.parse(error.message);
    if (p && typeof p.code === 'string') return p;
  } catch { /* not JSON */ }
  if (error.name === 'TypeError' || /failed to fetch|network|load failed|offline/i.test(error.message)) {
    return { code: 'network', message: 'The request never reached the coach.' };
  }
  return { code: 'unknown', message: error.message || 'Something went wrong.' };
}

const COPY: Record<string, { title: string; next: string }> = {
  network: { title: 'Couldn’t reach the coach', next: 'Check your connection. Your message is kept, so you can send it again when you are back online.' },
  rate_limit: { title: 'Too many requests', next: 'The model asked us to slow down. Retry unlocks when the wait is over.' },
  overloaded: { title: 'The model is busy', next: 'This usually clears in a few seconds. Retry asks the same question again.' },
  stream_cut: { title: 'The answer was cut off', next: 'The part that arrived is kept above. Retry asks the same question again and replaces it.' },
  server_error: { title: 'The server hit an error', next: 'Nothing was lost. Retry sends the same message again.' },
  timeout: { title: 'The model took too long', next: 'Retry, or ask for something smaller like “What’s still open?”.' },
  auth: { title: 'The coach can’t reach its model', next: 'This needs fixing on the server (the API key). Retrying won’t help yet.' },
  bad_request: { title: 'The request was rejected', next: 'Start a new chat and try again.' },
  unknown: { title: 'Something went wrong', next: 'Retry sends the same message again.' },
};

/** The global chat error: what failed, what will be retried, and a retry that can't fire twice. */
export function ChatError({ problem, retryLabel, onRetry, busy }: { problem: Problem; retryLabel: string | null; onRetry: () => void; busy: boolean }) {
  const copy = COPY[problem.code] ?? COPY.unknown;
  const [wait, setWait] = useState(problem.retryAfter ?? 0);
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    setWait(problem.retryAfter ?? 0);
    setClicked(false);
  }, [problem]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const disabled = busy || clicked || wait > 0 || problem.code === 'auth';
  return (
    <div className="err err--global" role="alert" data-code={problem.code}>
      <div className="err__mark" aria-hidden="true">!</div>
      <div>
        <p className="err__title">{copy.title}</p>
        <p className="err__msg">{problem.message}</p>
        <p className="err__next"><b>What now:</b> {copy.next}</p>
        {retryLabel !== null && (
          <button
            className="btn btn--ghost btn--retry"
            disabled={disabled}
            aria-busy={clicked}
            onClick={() => { if (disabled) return; setClicked(true); onRetry(); }}
          >
            {clicked ? <><span className="spinner" aria-hidden="true" /> Retrying…</> : wait > 0 ? `Retry in ${wait}s` : <>Retry <q>{retryLabel}</q></>}
          </button>
        )}
      </div>
    </div>
  );
}

/** Route-level boundary: the Vite/React equivalent of Next's error.tsx. */
export class ErrorBoundary extends Component<{ fallback: (reset: () => void, error: Error) => ReactNode; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.warn('[boundary]', error.message); }
  reset = () => this.setState({ error: null });
  render() { return this.state.error ? this.props.fallback(this.reset, this.state.error) : this.props.children; }
}

export function AppCrash({ error }: { error: Error }) {
  return (
    <div className="crash" role="alert">
      <div className="crash__card">
        <p className="eyebrow">Something broke</p>
        <h1>The page stopped working.</h1>
        <p>Your notes are saved in this browser. Reloading usually fixes it. If it keeps happening, the saved data may be damaged: reset it to the starter files.</p>
        <p className="crash__detail">{error.message}</p>
        <div className="crash__btns">
          <button className="btn" onClick={() => location.reload()}>Reload the page</button>
          <button className="btn btn--ghost" onClick={() => { try { localStorage.removeItem('wrc2_files'); localStorage.removeItem('wrc2_week'); } catch { /* ignore */ } location.reload(); }}>Reset saved data</button>
        </div>
      </div>
    </div>
  );
}

/** Throws during render; used by the "page crash" sabotage switch to prove the boundary works. */
export function Bomb(): ReactNode {
  throw new Error('Sabotage: a component threw while rendering the chat.');
}

export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  return online;
}

/** true once `active` has been on for `ms` without a break. */
export function useSlow(active: boolean, ms = 5000) {
  const [slow, setSlow] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    setSlow(false);
    if (!active) return;
    t.current = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t.current);
  }, [active, ms]);
  return slow;
}
