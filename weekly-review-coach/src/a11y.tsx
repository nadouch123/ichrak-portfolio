// FE-10: accessibility helpers for the streamed chat.
//
// Why not just make the conversation a live region? Because the answer arrives a few
// characters at a time. A live region on the message list re-announces on every chunk
// ("Let", "Let me", "Let me start", ...): 173 updates for one weekly review in the
// FE-10 baseline. Screen readers either drop most of them or read fragments.
//
// Instead the conversation is aria-live="off" and this one polite region speaks:
//   - "Coach is answering." when a request goes out,
//   - the answer in whole sentences, at most one batch every ANNOUNCE_MS,
//   - each tool step once when it finishes or fails,
//   - the rest of the answer when the stream ends.
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CoachMessage } from '../lib/tools';

export const ANNOUNCE_MS = 1500;

const TOOL_NAMES: Record<string, string> = {
  'tool-listFiles': 'List my files',
  'tool-readFile': 'Read a file',
  'tool-checkPortfolio': 'Check live portfolio',
  'tool-showWeeklyReview': 'Weekly review',
  'tool-proposePlan': 'Next week’s plan',
};

/** Markdown to something a screen reader can say: drop emphasis marks, code ticks, heading hashes, list bullets. */
export const speakable = (md: string) =>
  md.replace(/```[\s\S]*?```/g, ' (code block) ')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const assistantText = (m: CoachMessage) =>
  m.parts.filter((p) => p.type === 'text').map((p: any) => p.text as string).join('\n\n');

/** Index just past the last finished sentence in `s` (., !, ? or : followed by a space or the end). */
export function lastSentenceEnd(s: string) {
  let end = -1;
  for (const m of s.matchAll(/[.!?:…](?=\s|$)/g)) end = m.index! + 1;
  return end;
}

export function useStreamAnnouncer(messages: CoachMessage[], status: string) {
  const [text, setText] = useState('');
  const spoken = useRef<{ id: string; upto: number }>({ id: '', upto: 0 });
  const toolsSaid = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaid = useRef(0);

  const flush = () => {
    timer.current = null;
    if (!queue.current.length) return;
    // A trailing zero-width space makes the string differ from the previous one, so a repeat is still read.
    setText(queue.current.join(' ') + (lastSaid.current % 2 ? '​' : ''));
    queue.current = [];
    lastSaid.current = Date.now();
  };
  const say = (s: string, now = false) => {
    if (!s.trim()) return;
    queue.current.push(s.trim());
    if (now) { if (timer.current) clearTimeout(timer.current); flush(); return; }
    if (!timer.current) timer.current = setTimeout(flush, Math.max(0, ANNOUNCE_MS - (Date.now() - lastSaid.current)));
  };

  // Request goes out.
  useEffect(() => { if (status === 'submitted') say('Coach is answering.', true); }, [status]);

  useEffect(() => {
    const last = messages.at(-1);
    if (!last || last.role !== 'assistant') return;
    if (spoken.current.id !== last.id) spoken.current = { id: last.id, upto: 0 };

    // Tool steps: once each, when they settle.
    for (const p of last.parts as any[]) {
      if (!p.type?.startsWith('tool-')) continue;
      const name = TOOL_NAMES[p.type] ?? p.type.slice(5);
      const key = `${p.toolCallId}:${p.state}`;
      if (toolsSaid.current.has(key)) continue;
      if (p.state === 'output-available') { toolsSaid.current.add(key); say(`${name}: done.`); }
      else if (p.state === 'output-error') { toolsSaid.current.add(key); say(`${name}: failed.`); }
      else if (p.type === 'tool-proposePlan' && p.state === 'input-available') { toolsSaid.current.add(key); say(`${name} is ready. Approve it or ask for changes.`); }
    }

    // Answer text: whole sentences while streaming, everything when done.
    const full = speakable(assistantText(last));
    const fresh = full.slice(spoken.current.upto);
    const streaming = status === 'streaming' || status === 'submitted';
    const cut = streaming ? lastSentenceEnd(fresh) : fresh.length;
    if (cut > 0) {
      say(fresh.slice(0, cut));
      spoken.current.upto += cut;
    }
  }, [messages, status]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { text, say };
}

/** The one polite live region for the chat. Visually hidden. */
export function Announcer({ text }: { text: string }) {
  return <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="announcer">{text}</div>;
}

/** Keeps Tab inside a dialog, focuses `initial` on open and gives focus back to the opener on close. */
export function useDialogFocus(open: boolean, dialog: RefObject<HTMLElement | null>, initial: RefObject<HTMLElement | null>, fallback: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    (initial.current ?? dialog.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, input, select, a[href], [tabindex="0"]')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const back = opener && opener.isConnected && opener !== document.body ? opener : fallback.current;
      requestAnimationFrame(() => back?.focus());
    };
  }, [open]);
}
