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

1. **Break a tool** (header select): makes `readFile` or `checkPortfolio` throw on purpose.
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

## Files

```
api/chat.ts         POST: streamText with the tools, stopWhen stepCountIs(10)
api/status.ts       GET: which model is active (live or demo)
lib/tools.ts        the tool definitions (this assignment's deliverable)
lib/system.ts       system prompt
lib/demo-model.ts   scripted MockLanguageModelV4 for when there are no model credits
src/ToolParts.tsx   the four states + result components (FilePreview, SiteChart, ReviewCard, PlanDecision)
src/App.tsx         useChat, knowledge files panel, test switches
scripts/dev-server.ts  local server for app + api
```
