# FE-05 — Accessible Component Fundamentals

## What I built

I built three interactive components from scratch in `playground/` using React + TypeScript and no component library:

- `AccessibleDialog.tsx`
- `AccessibleTabs.tsx`
- `AccessibleDisclosure.tsx`

The playground is a standalone practice area and is not a capstone feature.

## WAI-ARIA behavior implemented

### Modal dialog
The hand-built dialog uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby`. When it opens, focus moves into the dialog. `Tab` and `Shift+Tab` are intercepted at the ends of the focusable sequence so focus stays inside. `Escape` closes the dialog, and focus is restored to the invoking element after close. A visible close button is included in the tab sequence.

### Tabs
The tabs use `role="tablist"`, `role="tab"`, and `role="tabpanel"` with `aria-selected` and `aria-controls`. Only the active tab has `tabIndex={0}`; the other tabs have `tabIndex={-1}`. `Left Arrow` and `Right Arrow` wrap between tabs, and `Home`/`End` jump to the first/last tab. The focused tab is automatically activated.

### Disclosure
The disclosure uses a native `<button>` with `aria-expanded` and `aria-controls`. Native button behavior supplies keyboard activation through `Enter` and `Space`.

## What shadcn/ui handled that my hand-built version missed

I compared the hand-built dialog/tabs approach with the shadcn/ui source pattern. The major difference is that shadcn does not reimplement the difficult accessibility state machine itself. Its components wrap Radix primitives, which provide mature interaction and focus behavior underneath the readable component source.

### Gap 1 — Focus containment and modal semantics
My dialog manually collects focusable elements and traps focus with a `keydown` listener. That is a useful learning exercise, but it is easy to miss edge cases involving dynamic focusable content, focus guards, nested dialogs, or interaction outside the content. shadcn's dialog delegates this behavior to `@radix-ui/react-dialog`, which provides the modal/focus-management infrastructure instead of relying on my small selector-based implementation.

### Gap 2 — Interaction state and roving focus in tabs
My tabs manually manage `tabIndex`, arrow-key movement, wrapping, and active state. This demonstrates the APG pattern, but it leaves me responsible for every state transition. shadcn wraps `@radix-ui/react-tabs`, so keyboard navigation, selected state, orientation-aware behavior, and tab/tabpanel relationships come from a well-tested primitive.

### Gap 3 — Production-level edge cases
The hand-built components are intentionally small and educational. They do not try to reproduce the complete edge-case coverage of a mature primitive library. shadcn also provides composable subcomponents (`DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, etc.) that keep semantics and structure explicit while the underlying Radix primitive handles the difficult interaction details.

## Human keyboard test

1. Tab through the playground controls.
2. Open the dialog. Check that focus enters it, Tab/Shift+Tab loop within it, Escape closes it, and focus returns to **Open dialog**.
3. In the tabs widget, use Left/Right arrows and Home/End.
4. In the disclosure, focus the button and use Enter and Space to toggle it.

## Key takeaway

The main lesson is not “always use shadcn.” It is that accessibility behavior is part of component correctness. Building the widgets by hand exposed exactly what has to be reviewed, while reading shadcn's open source implementation showed how a production component can keep the source readable while delegating complex interaction behavior to a mature primitive library.
