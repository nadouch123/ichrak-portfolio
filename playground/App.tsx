import { useState } from 'react';
import { AccessibleDialog } from './components/AccessibleDialog';
import { AccessibleTabs } from './components/AccessibleTabs';
import { AccessibleDisclosure } from './components/AccessibleDisclosure';

const tabs = [
  { id: 'dialog', label: 'Dialog', content: 'The modal demonstrates focus placement, a Tab/Shift+Tab focus loop, Escape-to-close, aria-labelledby/aria-describedby, and focus restoration.' },
  { id: 'tabs', label: 'Tabs', content: 'The tabs use roving tabindex with Left/Right arrow navigation plus Home/End. Arrow keys move focus and automatically activate the focused tab.' },
  { id: 'disclosure', label: 'Disclosure', content: 'The disclosure uses a native button with aria-expanded and aria-controls. Enter and Space are provided by the native button behavior.' },
];

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <main className="playground-page">
      <header className="playground-header">
        <p className="play-eyebrow">FE-05 · Accessibility drill</p>
        <h1>Accessible component playground</h1>
        <p>Three hand-built React + TypeScript widgets aligned to WAI-ARIA Authoring Practices, followed by a shadcn/ui source comparison.</p>
      </header>

      <section className="playground-grid" aria-label="Accessible components">
        <article className="play-card">
          <span className="play-number">01</span>
          <h2>Modal dialog</h2>
          <p>Focus enters the dialog, stays inside with Tab/Shift+Tab, closes with Escape, and returns to the trigger.</p>
          <button className="play-primary" type="button" onClick={() => setDialogOpen(true)}>Open dialog</button>
        </article>

        <article className="play-card play-card-wide">
          <span className="play-number">02</span>
          <h2>Tabs</h2>
          <p>Arrow keys move between tabs while only the active tab is in the page Tab sequence.</p>
          <AccessibleTabs items={tabs} />
        </article>

        <article className="play-card play-card-wide">
          <span className="play-number">03</span>
          <h2>Disclosure</h2>
          <p>Native button semantics provide keyboard activation while ARIA communicates the expanded state.</p>
          <AccessibleDisclosure title="Show accessibility notes">
            <p>Use Tab to reach the button. Press Enter or Space to toggle the content. The button exposes the state through <code>aria-expanded</code>.</p>
          </AccessibleDisclosure>
        </article>
      </section>

      <section className="playground-notice" aria-labelledby="keyboard-title">
        <h2 id="keyboard-title">Keyboard test script</h2>
        <p><kbd>Tab</kbd> through every control. Open the dialog and test <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>, <kbd>Escape</kbd>. In tabs, test <kbd>←</kbd>, <kbd>→</kbd>, <kbd>Home</kbd>, <kbd>End</kbd>. In disclosure, test <kbd>Enter</kbd> and <kbd>Space</kbd>.</p>
      </section>

      <AccessibleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Accessible modal"
        description="This is a hand-built dialog designed to demonstrate focus management and keyboard behavior."
      >
        <div className="play-modal-actions">
          <button type="button" className="play-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="button" className="play-primary" onClick={() => setDialogOpen(false)}>Done</button>
        </div>
      </AccessibleDialog>
    </main>
  );
}
