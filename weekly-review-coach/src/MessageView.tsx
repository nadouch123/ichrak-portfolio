// Renders one chat message, part by part: user text, assistant markdown (sanitized),
// and every tool part through ToolPartView. Unknown part types render nothing.
// Pulled out of App.tsx in FE-09 so it can be tested on its own.
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { CoachMessage } from '../lib/tools';
import { ToolPartView, type ToolPart } from './ToolParts';
import { ErrorBoundary } from './failures';

export function MessageView({ message, live, busy, onApprovePlan, onRejectPlan, onRetryTool }: {
  message: CoachMessage;
  /** true while this message is the one still streaming */
  live: boolean;
  busy: boolean;
  onApprovePlan: (part: ToolPart) => void;
  onRejectPlan: (part: ToolPart, feedback: string) => void;
  onRetryTool: () => void;
}) {
  const m = message;
  return (
    <article className={`msg msg--${m.role}`} aria-label={m.role === 'user' ? 'You' : 'Coach'}>
      {m.parts.map((part, i) => {
        if (part.type === 'text') {
          if (!part.text.trim()) return null;
          // Render user messages as markdown too, so pasted notes keep their formatting.
          return <div key={i} className={m.role === 'user' ? 'bubble bubble--user' : 'bubble'} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(part.text, { async: false }) as string) }} />;
        }
        if (part.type.startsWith('tool-')) {
          const tp = part as ToolPart;
          return (
            <ErrorBoundary key={tp.toolCallId} fallback={() => <p className="err err--inline" role="alert">This result couldn’t be shown. The rest of the chat is fine.</p>}>
              <ToolPartView part={tp} live={live} busy={busy} onApprovePlan={onApprovePlan} onRejectPlan={onRejectPlan} onRetry={onRetryTool} />
            </ErrorBoundary>
          );
        }
        return null;
      })}
    </article>
  );
}
