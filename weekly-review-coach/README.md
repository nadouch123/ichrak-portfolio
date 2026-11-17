# Weekly Review Coach: tool results in the UI

A chat agent that reviews my internship week from my own notes. Every tool the model calls is rendered as a typed tool part with four designed states, and the results show up as real components, not JSON.

- **Tool definition file:** [`lib/tools.ts`](lib/tools.ts)
- **Rendering of the states:** [`src/ToolParts.tsx`](src/ToolParts.tsx)
- **Route:** [`api/chat.ts`](api/chat.ts) (`streamText` + `toUIMessageStreamResponse`)
- Stack: Vite + React 19, AI SDK 7 (`ai`, `@ai-sdk/react`), Zod 4, Vercel functions.

## Run it

```bash
npm install
npm run dev:full                  # app + /api on http://localhost:5180
```

The model is chosen in `api/chat.ts`:

| Env | Model |
|---|---|
| `ANTHROPIC_API_KEY` set | Claude (`COACH_MODEL`, default `claude-opus-5-5`) |
| `COACH_USE_GATEWAY=1` | Claude through the Vercel AI Gateway |
| neither | **Demo model**: a scripted `MockLanguageModelV4` that streams the same tool calls a real model would. The tools still run for real. The UI shows a "Demo model" badge so nobody mistakes it for Claude. |

## The state machine

Each state answers a different question, so each one gets its own visual treatment:

```
                 model starts a tool call
                          │
                          ▼
              ┌──────────────────────┐
              │   input-streaming    │  "What is it doing?"
              │  dashed border,      │  tool name, "Writing the request…",
              │  pulsing pill        │  the reason as it streams in, and a
              └──────────┬───────────┘  skeleton shaped like the result
                         │ input complete (Zod-valid)
                         ▼
              ┌──────────────────────┐
              │   input-available    │  "With what input?"
              │  blue edge,          │  "Why this tool", input chips, spinner
              │  "Running" pill      │  (proposePlan: amber "Your call" card
              └─────┬──────────┬─────┘   with Approve / Ask for changes)
       execute ok   │          │  execute throws / user rejects input
                    ▼          ▼
  ┌──────────────────────┐  ┌──────────────────────┐
  │   output-available   │  │     output-error     │
  │  settled card,       │  │  red edge + head,    │
  │  green "Done" pill   │  │  "!" mark            │
  │  "What came back?"   │  │  "What went wrong?"  │
  │  a real component    │  │  what failed, what it│
  │  per tool            │  │  was trying to do,   │
  └──────────────────────┘  │  what to do now,     │
                            │  Try again           │
                            └──────────────────────┘
```

The body of each part is keyed by its state, so every transition plays a 200 ms crossfade (opacity, a small lift and blur) instead of swapping. `prefers-reduced-motion` turns it off.

The error state was designed first. You can trigger it two ways in the UI:

1. **Sabotage** (header select): "readFile fails" or "checkPortfolio fails" makes that tool throw on purpose.
2. **Week 6**: there is no `week-06.md`, so `readFile` throws "There is no file called…". The coach then asks for the notes instead of reviewing an older week.

A failed request (network, model) gets its own designed card with Try again, not a crash.

## Tool contract

All inputs are Zod schemas. Every field has a `.describe()`. Each tool takes a short `reason` that the UI shows as "Why this tool", which is the "choosing" moment made visible.

`reason`: `string, max 140`: one short sentence telling the user why the tool is being called now.

### `listFiles` (server)

| | |
|---|---|
| Input | `{ reason }` |
| Returns | `{ files: { name: string; kind: 'notes' \| 'assignments' \| 'template' \| 'plan' \| 'other'; chars: number; week: number \| null }[] }` |
| Errors | none |
| UI result | file chips with a kind badge and size |

### `readFile` (server)

| | |
|---|---|
| Input | `{ name: string /* exact file name, e.g. "week-05.md" */, reason }` |
| Returns | `{ name: string; kind: string; lines: number; content: string }` |
| Errors | `There is no file called "X". Files you have: …` · simulated failure (test switch) |
| UI result | file preview with kind badge, first lines, "Show the whole file" |
| UI error | "File not found" + "Upload week-XX.md in the side panel, then try again" |

### `checkPortfolio` (server, real network)

| | |
|---|---|
| Input | `{ reason }` |
| Returns | `{ site: string; checkedAt: string /* ISO */; pages: { path: string; ok: boolean; status: number \| null; ms: number; title: string \| null }[] }` |
| Errors | throws only when **every** page fails (6 s timeout each); a single failed page comes back as `ok: false` |
| UI result | "4/4 pages online" + SVG bar chart of response time per page (failed pages in red) |

### `showWeeklyReview` (server, verifies sources)

| | |
|---|---|
| Input | `{ week: int 1–52; finished: { item: string ≤120; source: string }[] ≤8; learned: string ≤160 [exactly 3]; open: { title: string ≤100; due: string ≤20 }[] ≤8; conflict?: string ≤200 }` |
| Returns | the input, plus `finished[].verified: boolean` (is `source` one of my files?) and `unverified: number` |
| UI result | review card: Finished with ✓/? source badges, Learned, Still open with due pills |
| Missing optional fields | no `conflict` → no banner at all; empty `finished`/`open` → a plain sentence ("Nothing marked as finished in your notes."), never an empty box; `unverified > 0` → amber warning |

### `proposePlan` (client: user interaction)

| | |
|---|---|
| Input | `{ week: int 1–52; items: { task: string ≤100; why?: string ≤120 }[] 1–5 }` |
| Output schema | `{ approved: boolean; savedAs?: string; feedback?: string }` |
| No `execute` | the browser answers with `addToolOutput` after I click **Approve and save** (writes `plan-week-XX.md` into my files) or **Ask for changes** (sends my feedback). Nothing is saved before that. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` then lets the model continue. |
| Missing optional fields | items without `why` render as a single line |

## Failure, empty and edge cases (FE-08)

Every failure leaves the server as a small JSON problem `{ code, message, retryAfter? }` (see `lib/failures.ts`), and the browser turns each code into a designed state (`src/failures.tsx`). Nothing shows a raw stack trace or an HTML error page.

### Sabotage checklist

Pick one under **Sabotage** in the header, then send a message. Each switch breaks the **next request only** and then turns itself off, so Retry shows the recovery.

| # | Sabotage | What breaks | What you should see | Recovery |
|---|---|---|---|---|
| 1 | Network down before send | `fetch` throws before the request leaves | "Couldn’t reach the coach", message kept | Retry “…” re-sends the same message |
| 2 | Connection drops mid-stream | the model stream errors after ~14 chunks | partial text kept, cut tool card marked **Interrupted**, "The answer was cut off" | Retry replaces only the failed reply |
| 3 | Rate limit (429) | route returns 429 + `Retry-After: 12` | "Too many requests", button counts down "Retry in 12s" | unlocks itself |
| 4 | Tool returns malformed JSON | `readFile` payload is cut in half, `JSON.parse` fails | tool card **Failed**: "Unreadable tool result"; coach explains and stops | Try again |
| 5 | Route handler throws (500) | an exception inside `POST` | "The server hit an error" (JSON 500, not an HTML page) | Retry |
| 6 | Slow response (9 s) | 9 s before the first token | skeleton bubble; after 5 s "This is taking longer than usual" with **Stop** | Stop keeps what arrived; "Ask again" |
| 7 | Model refuses | answer ends with `finishReason: content-filter` | "The model declined to answer this" + Edit my question | rephrase |
| 8 | readFile fails | tool throws | tool card **Failed** with what it was trying to do | Try again |
| 9 | checkPortfolio fails | tool throws | tool card **Failed**; review continues without it | Try again |
| 10 | Page component crashes | a component throws while rendering | chat-level boundary: "The chat stopped working", files untouched | Reload the chat |

Also handled without a switch: the device going offline (banner + Send paused), empty input (Send disabled, Enter shows a hint, server returns `empty_input`), input over 2,000 characters (counter, Send disabled, server returns 413 `too_long`), a malformed request body (400), damaged saved data in localStorage (validated on load; the top-level boundary offers "Reset saved data"), starter files that fail to load (designed error + Try again), and `/api/status` failing ("Model status unknown").

Real provider errors map to the same states: 429 → rate limit with the provider’s `Retry-After`, 529/"overloaded" → "The model is busy", 401/403 → "can’t reach its model" (no retry button, since retrying can’t help).

### The retry button

- It says what it will retry: **Retry “weekly review”** (the failed message, not the whole conversation). It calls `regenerate()`, which drops the failed reply and re-sends the last user message.
- It can’t fire twice: it disables itself on the first click and shows "Retrying…"; a double click sends one request (asserted in the e2e test).
- For a rate limit it counts down from `Retry-After` and unlocks itself.

### Empty states

| Where | When | What it offers |
|---|---|---|
| Chat | first run | **Start my weekly review**, **Quiz me**, and three "Or try asking" examples that fill the composer on click |
| Chat | no files loaded | "Nothing to review yet." + **Load the example notes** / **Upload my notes** |
| Chat | selected week has no notes file | warning naming the missing file + **Switch to Week 5** |
| Side panel | no files | "No files yet." + **Load example notes** |
| listFiles result | empty list | points to the side panel instead of an empty box |

### Pending states

- Model badge: a pill skeleton while `/api/status` loads.
- Files: three file-shaped skeletons while the starter files load.
- Chat: "Coach is choosing what to do" + a bubble-shaped skeleton (same padding as a reply bubble, so nothing jumps when the reply arrives). Tool cards keep their own result-shaped skeletons from FE-07.

### Mobile Safari

`100dvh` (with `100vh` fallback) instead of `100vh`; `interactive-widget=resizes-content` so the keyboard resizes the layout instead of covering the input; 16 px textarea so iOS doesn’t zoom; `env(safe-area-inset-bottom)` under the composer; `overscroll-behavior` so rubber-band scrolling stays inside the chat; auto-scroll only while you are already at the bottom (otherwise a **↓ Latest** button), so it never fights your thumb; files collapse into a toggle and the header fits on one row at 390 px.

### Tests (FE-09)

Vitest + React Testing Library for components, Playwright for the main flow. Every test queries by role, label or visible text, never by class or test id, so restyling can't break them. The AI route is always mocked: component tests replace `fetch` and fail on any request they did not expect; the Playwright test answers `/api/chat` with `page.route`; route tests use the scripted demo model.

```bash
npm test                   # Vitest: chat states, message renderer, tool results, route
npm run test:e2e           # Playwright: start review → tools run → review card → approve plan → plan saved
npm run test:e2e:sabotage  # FE-08 browser check against the real route (needs npm run dev:full)
```

| File | What it covers |
|---|---|
| `tests/unit/chat-states.test.tsx` | the whole chat against a mocked route: pending, streaming (text and a tool arriving chunk by chunk), 429, mid-stream cut + Retry once, failed tool, input guards |
| `tests/unit/message-view.test.tsx` | the message renderer, every part type: user text, sanitized markdown, skipped parts, each tool state, contained render crash |
| `tests/unit/tool-results.test.tsx` | tool result components: review card, file preview, site chart, plan approval |
| `tests/unit/route.test.ts` | the `/api/chat` handler's designed failures |
| `e2e/weekly-review.spec.ts` | the primary flow in Chromium |
| `tests/support/ui-stream.ts` | builds UI-message-stream responses for the mocks, shared by Vitest and Playwright |

CI: `.github/workflows/tests.yml` at the repo root runs all of this on every push.

## Files

```
api/chat.ts         POST: streamText with the tools, stopWhen stepCountIs(10)
api/status.ts       GET: which model is active (live or demo)
lib/tools.ts        the tool definitions (this assignment's deliverable)
lib/system.ts       system prompt
lib/demo-model.ts   scripted MockLanguageModelV4 for when there are no model credits
lib/failures.ts     problem codes, error mapping, sabotage middleware (FE-08)
src/failures.tsx    error boundaries, ChatError with retry, offline + slow hooks (FE-08)
tests/              Vitest suites + shared stream mocks (FE-09)
e2e/                Playwright primary flow + the FE-08 sabotage check
src/MessageView.tsx one chat message, part by part
src/ToolParts.tsx   the four states (+ Interrupted) + result components (FilePreview, SiteChart, ReviewCard, PlanDecision)
src/App.tsx         useChat, knowledge files panel, test switches
scripts/dev-server.ts  local server for app + api
```
