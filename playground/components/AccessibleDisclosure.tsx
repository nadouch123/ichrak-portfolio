import { useId, useState } from 'react';

interface AccessibleDisclosureProps {
  title: string;
  children: React.ReactNode;
}

export function AccessibleDisclosure({ title, children }: AccessibleDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  return (
    <div className="play-disclosure">
      <button
        type="button"
        className="play-disclosure-button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{title}</span>
        <span aria-hidden="true" className={expanded ? 'play-chevron is-open' : 'play-chevron'}>›</span>
      </button>
      {/* FE-10: the panel is always in the DOM (hidden when closed), so aria-controls never points at a missing id. */}
      <div id={id} className="play-disclosure-panel" hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}
