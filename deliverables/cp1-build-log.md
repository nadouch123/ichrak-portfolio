# Build log: Weekly Review Coach (Checkpoint 1)

Live agent: https://weekly-review-coach.vercel.app
Spec it follows: FL-06 `week5-agent-spec/agent-design-spec.md`

Times are 10 Nov 2026 (UTC). Entries were written as the build happened, not afterwards.

---

## 18:04 Start: re-read the spec, pick the narrowest version

Core job from the spec: "weekly review" → finished items (with sources) → 3 learnings → open items → 3-question quiz one at a time → next-week plan I approve.

Narrowest version that still counts as end to end: one chat, my notes as files, the 5 steps in one system prompt, and nothing else (no scheduling, no Drive connector, no login).

## 18:06 Deviation #1: platform changed from Claude Project to a small web app

**Spec said:** Claude Project (project knowledge + custom instructions).
**Problem:** the checkpoint has to be testable through a link, and a Claude Project can only be opened by me inside my own Claude account. There is no public link to a Project.
**Change:** a single-page web app on my Vercel account (same place as my portfolio) with one serverless function that runs Claude with tool use.
**What stayed the same:** the system prompt is the spec's "draft instructions" almost word for word, plus the 6 eval rules. It is still read-only: the agent has no tool that can write, send or post anything.

## 18:07 Deviation #2: "project knowledge" became real tools

In a Claude Project the notes are just stuffed into context. In the web app I gave the agent three tools instead, so you can see it actually fetch its data:

| Tool | What it does | Spec equivalent |
|---|---|---|
| `list_files` | Lists my knowledge files | Project knowledge |
| `read_file(name)` | Reads one file (week notes, `assignments.md`, template) | Project knowledge |
| `check_portfolio` | Fetches my live portfolio site and reports which pages are online, with title and description | Replaces "I paste `git log`" |

The files live in the browser: starter files load from the site, and I can edit them or upload my own `.md` notes in the side panel each Sunday (same "upload on Sunday" habit as in the spec).

## 18:08 Data: no Week 1 to 4 notes exist yet

The spec's build plan starts with "clean up Weeks 1 to 5 notes". I only have real material for Week 5 (FE-05 notes, the Explain It draft, the FL-06 spec, the portfolio redesign). I did not invent earlier weeks.
**Cut:** Weeks 1 to 4 notes. The coach is set up for Week 5, and choosing another week in the header makes it ask for that week's notes (eval 4).
`assignments.md` was built from what is actually in my submissions folder. **To check:** the statuses and the "EXPLAIN" / "CP-1" codes are my best guess; I need to correct them in the app if they're wrong.

## 18:09 Wrote the function and UI

- `api/coach.js`: manual tool-use loop (max 10 steps) with the Anthropic SDK, model Claude Opus 5.5, effort `low` to keep a review fast enough to record in 2 minutes. It streams each tool call to the page so the run shows "read_file · week-05.md" chips as it works.
- `index.html`: chat + file panel, same navy/paper look as my portfolio.

## 18:10 Broke: can't test from my build environment

`curl` to `*.vercel.app` was blocked by the sandbox's network proxy (403 on CONNECT), so I couldn't POST to my own API.
**Fix:** added a self-test mode to the function (`GET /api/coach?selftest=<secret>&q=...`) that runs one full turn with the starter files and returns the transcript as JSON. The secret lives in a Vercel environment variable so randoms can't spend my credits through it. Tested through Vercel's own fetch tool instead.

## 18:11 Broke: AI Gateway needs a credit card

First idea to avoid handling an API key at all: use Vercel AI Gateway, which signs in with the deployment's built-in OIDC token. The call reached the gateway and failed with:

> 403 customer_verification_required: AI Gateway requires a valid credit card on file to service requests.

**Status:** blocked on credentials. Two ways forward, my choice:
1. Add an `ANTHROPIC_API_KEY` environment variable to the Vercel project (from console.anthropic.com), or
2. Add a card on Vercel to unlock the AI Gateway free monthly credits (no key to manage).

The code already supports both: it uses the Anthropic key if it's set, otherwise the gateway.

## 18:12 Deploy trick

Each Vercel deploy is a full snapshot of all files. To avoid re-sending unchanged files I referenced them by SHA-1 hash from earlier uploads, and only sent the changed file.

## Day 2: tool results and structured output in the UI

### Changed: moved from a hand-written tool loop to the AI SDK
v1 (`app/`) ran its own Anthropic tool loop and streamed NDJSON. v2 (`app-v2/`) uses the AI SDK: `streamText` on the server, `useChat` in the browser, and every tool is a Zod schema plus an `execute` function in one file, `lib/tools.ts`. Each tool call now arrives in the browser as a typed part with a state (`input-streaming`, `input-available`, `output-available`, `output-error`), so the UI can draw each state instead of dumping JSON.

### Designed the error state first
Two ways to trigger it on purpose: a "Break a tool" switch in the header (makes `readFile` or `checkPortfolio` throw), and choosing Week 6, which has no notes file. Each error card says what failed, what the coach was trying to do, and what to do next, with a Try again button. A failed request (model or network) has its own card too.

### Added
- A `reason` field on every tool, shown as "Why this tool". This makes the moment the model chooses a tool visible.
- `showWeeklyReview` renders the week as a card. Its `execute` checks that every cited source is a real file and marks unverified ones.
- `checkPortfolio` fetches the four live portfolio pages and draws a response-time bar chart (hand-rolled SVG).
- `proposePlan` is a user-interaction tool with no `execute`: I approve it (it saves `plan-week-XX.md` into my files) or ask for changes.
- The 200 ms crossfade between states. Each state also gets its own border, colour and pill.

### Broke / fixed
- **"New chat" did nothing while an answer was still streaming.** It now stops the stream first.
- **The file card said "11 lines" while its button said "Show all 8 lines".** The button counted only non-empty lines. It now reads "Show the whole file".
- **The site check failed in my local test.** My sandbox can't reach *.vercel.app. I added a `COACH_PORTFOLIO_URL` override, used only for local testing, and pointed it at the local server to see the chart.

### Deviation: demo model
There are still no model credits (see 18:11). So that the preview isn't dead, the server falls back to a **scripted model** (`MockLanguageModelV4`) when there is no API key. It streams the same tool calls a real model would. The tools still run for real. The UI shows a "Demo model" badge and banner, so nobody mistakes it for Claude. Once `ANTHROPIC_API_KEY` is set, the same deploy uses Claude.

### Tested (Playwright, local)
Full review flow to plan approval (the plan file appears in the side panel); readFile broken; checkPortfolio broken; Week 6 missing notes; phone width. No console errors.

---

## Still to do
- [ ] Credentials (see 18:11), then first real end-to-end run
- [ ] Run the 6 eval cases from the spec and record pass/fail here
- [ ] Record the 2-minute raw run capture

## Cut from the spec (and why)
- **Google Drive connector:** marked "optional later" in the spec. File upload in the app covers the same need for the MVP.
- **Weeks 1 to 4 notes:** don't exist yet; not inventing them.
- **Scheduled Sunday run:** the spec already accepted "a phone reminder covers that".
- **Saving my edits server-side:** files and edits stay in my browser (localStorage). Fine for one user; a database would be the next step.

## Day 3 (11 Nov 2026): error states, empty states, edge cases (FE-08)

**Inventory first.** Before changing code I listed every way the primary flow (weekly review) can go wrong: network down before send, stream cut mid-answer, 429, 529 overloaded, route handler crash, malformed tool data, refusal, slow first token, empty input, oversized input, no files, missing week file, starter files failing to load, damaged localStorage, a component throwing during render, the device going offline, and the status endpoint failing.

**One shape for every failure.** The route now returns `{ code, message, retryAfter? }` for every failure, including stream errors (through `onError`) and its own crashes (a try/catch that returns a JSON 500 instead of an HTML page). The browser maps each code to a designed card: title, what happened, what now, and a retry.

**Sabotage switches, one-shot.** A header select breaks the next request in one of 10 ways, then switches itself off, so Retry demonstrates the recovery. Mid-stream and slow are done with a language-model middleware, so they work the same with the demo model and with Claude.

**Retry with a brain.** The button names what it retries ("Retry “weekly review”"), uses `regenerate()` so only the failed turn is re-sent, disables itself on the first click (a double click sends once; the e2e test checks this), and counts down on a 429.

**What broke while sabotaging, and the fixes:**
- Tool errors went through the same `onError` as stream errors and came out as JSON. Fix: tools throw a `ToolFailure`, whose message is passed through untouched.
- My error classifier matched "terminated" and labelled a malformed-JSON tool error ("Unterminated string") as a dropped connection. Fix: narrower pattern.
- After a mid-stream cut, the half-written tool card kept spinning forever. Fix: a part that is still "preparing/running" after its reply ended now shows an **Interrupted** state.
- "Reload the chat" after a component crash didn't recover in my test. The real cause was my Playwright selector clicking the paragraph "reload the chat" instead of the button; I also switched the reset to a key remount, which is more robust.
- Phone: the header overflowed by 11 px at 390 px wide and the placeholder wrapped. Fix: compact header, shorter placeholder.

**Mobile Safari:** `100dvh`, `interactive-widget=resizes-content`, 16 px input (no zoom), safe-area padding, contained overscroll, and auto-scroll that only follows when you are already at the bottom. Tested in Chromium with iPhone 13 emulation; I could not test on a real iPhone from my build environment.

**Tests:** `npm test` runs 6 route tests (mid-stream error event, 429 + Retry-After, route throw → JSON 500, empty/too-long input, bad body, malformed tool data). `npm run test:e2e` drives a browser through mid-stream failure → designed error → double-clicked retry → full review. Both pass. No console errors on the happy path.

**Deviation:** the brief mentions Next.js `error.tsx`. This app is Vite + React, so the same job is done by two React error boundaries: one for the whole page (with "Reset saved data") and one around the chat, plus one per tool result.
