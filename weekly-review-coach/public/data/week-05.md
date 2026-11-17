# Week 5 notes

> Starter notes built from my real Week 5 project files (FE-05 NOTES.md, the FL-06 spec, the Explain It draft, and the portfolio redesign). Edit or replace with my own wording.

## FE-05: Accessible component fundamentals (portfolio `playground/`)

- Built three components by hand in React + TypeScript, no component library: `AccessibleDialog.tsx`, `AccessibleTabs.tsx`, `AccessibleDisclosure.tsx`.
- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`. Focus moves into the dialog on open. Tab and Shift+Tab are caught at the ends so focus stays inside (focus trap). Escape closes it, and focus goes back to the button that opened it.
- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`. Only the active tab has `tabIndex={0}`, the others `-1` (roving tabindex). Left/Right arrows wrap, Home/End jump to first/last.
- Disclosure: a native `<button>` with `aria-expanded` and `aria-controls`. Enter and Space work for free because it is a real button.
- Compared with shadcn/ui: shadcn does not rebuild the hard focus logic itself, it wraps Radix primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`). My selector-based focus trap can miss edge cases (dynamic content, nested dialogs).
- Takeaway: accessibility behaviour is part of whether a component is correct, not an extra.

## Explain It Like You Built It: the portfolio nav bar

- Every `<section>` has an `id` (home, about, skills, projects, experience, contact).
- The menu is built from one list with `.map(...)`, so links and sections always use the same names.
- Clicking runs `go(id)`: sets the active link, closes the phone menu, and calls `scrollIntoView({behavior:'smooth'})`.
- Under 850px the CSS hides the links and shows a hamburger. Tapping it flips `open`, and `.nav-links.open{display:flex}` shows the list.
- Limitation I found: the blue highlight only changes on click, not when I scroll. Fixing it would need something that watches scroll position (e.g. an IntersectionObserver).

## FL-06: Design my personal agent (Weekly Review Coach)

- Job: every Sunday, review my week from my own notes: what I finished, 3 things I learned, what is open, a 3-question quiz, and a plan for next week that I approve.
- Wrote 6 eval cases before building (normal week, topic not in notes, "write my submission", missing notes, wrong quiz answer, assignment status conflict).
- Guardrails: never write submission text for me, never invent notes, the plan is only a suggestion until I say "approved".
- Platform choice: Claude Project, compared against n8n (overkill, needs hosting and API keys) and a Custom GPT (needs a paid ChatGPT plan).

## Portfolio

- Redesigned the portfolio to look more premium: navy and paper colours, Instrument Serif + Inter fonts.
- Added the FL-06 spec as its own page (`/agent-spec/`) and deployed the site to Vercel: https://ichrak-portfolio-seven.vercel.app
- Still to do: real GitHub and LinkedIn links in the contact icons.
