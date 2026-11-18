# Weekly Review Coach (capstone)

**Live:** https://weekly-review-coach.vercel.app · **Source:** [`../weekly-review-coach/`](../weekly-review-coach/) · **Demo video:** _add link_

## What it does, and for whom

A chat agent for an intern (me) at the end of a week. It reads **only my own notes files**, writes a weekly review where every "finished" item cites the file it came from, quizzes me on what I learned, and proposes next week's plan, which stays a suggestion until I approve it. It is read-only: it has no tool that can write, send or post anything.

## Setup (from zero)

Needs Node 20+ and git.

```bash
git clone https://github.com/nadouch123/ichrak-portfolio
cd ichrak-portfolio/weekly-review-coach
npm install
npm run dev:full          # app + API on http://localhost:5180
```

Open http://localhost:5180 and click **Start my weekly review**.

**Model.** With no key it runs a clearly labelled **Demo model** (a scripted stream of the same tool calls a real model makes; the tools still run for real). To use Claude:

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # from console.anthropic.com
export COACH_MODEL=claude-opus-5-5       # optional, this is the default
npm run dev:full
```

**Tests:** `npm test` (unit + route), `npm run test:e2e` (browser run).
**Deploy:** import the `weekly-review-coach` folder as a Vercel project and add `ANTHROPIC_API_KEY` as an environment variable.

## Usage examples

| You type / click | It does |
|---|---|
| **Start my weekly review** | `listFiles` → `readFile week-05.md` → `readFile assignments.md` → `checkPortfolio` → review card with Finished (with sources), Learnings, Still open, quiz |
| "What did I learn about RAG?" (not in the notes) | Says it can't find it and offers a quiz on what is there |
| "Write my FL-06 submission for me" | Declines and offers to review my draft instead |
| Pick Week 6 in the header (no notes) | Asks for Week 6 notes instead of reusing Week 5 |
| Type **approved** after the plan | Plan is saved; until then it is only a proposal |

## Architecture

```
 Browser (Vite + React 19, @ai-sdk/react useChat)
   │  chat messages                ▲ streamed text + typed tool parts
   ▼                               │ (4 designed states per tool)
 /api/chat  (Vercel function, AI SDK streamText)
   │  system prompt = spec rules + 6 eval rules
   ▼
 Model: Claude (ANTHROPIC_API_KEY)  or  Demo model (no key)
   │  tool calls (Zod-validated)
   ▼
 Tools (read-only): listFiles · readFile · checkPortfolio · proposePlan (needs my approval)
   │
   ▼
 My notes (public/data/*.md)   +   my live portfolio (HTTP check)
```

## Eval results (v2)

| Check | Result |
|---|---|
| Unit + route tests (`npm test`) | **30/30 pass** (run 2026-11-18) |
| Browser e2e: mid-stream failure → designed error → double-clicked retry → full review | **Pass** |
| 10 sabotage cases (network, mid-stream cut, 429, malformed tool JSON, 500, slow, refusal, 2 tool failures, render crash) | **10/10 show a designed state with a recovery**, screenshots in the FE-08 submission |
| Lighthouse mobile on the chat | **100 performance / 100 accessibility** (FE-10 audit) |
| The 6 behaviour evals from my spec, against real Claude | _Fill in: x/6_ (see limitation 1) |

## Limitations

1. **The behaviour evals have only run on the demo model.** The live site has no API key yet, so the demo model follows a script; it cannot show whether Claude really refuses to invent RAG notes. Until the 6 spec evals run against Claude, the review quality is unproven.
2. **Week 5 only.** Notes for weeks 1–4 were cut; other weeks ask for notes.
3. **Notes are files I ship with the app**, not uploads saved per user. No accounts, no storage.
4. **One person.** It is built for my notes and my assignments list, not a general product.
5. **Portfolio check is shallow:** it confirms the page answers, not that the content is right.

## Built with AI

I built this with Claude (Claude Code) as my coding partner. I wrote the job, the spec, the 6 evals and the guardrails (read-only, cite sources, plan needs approval), chose the failure states and their order, and decided what to cut. Claude wrote most of the code and tests. I checked it by running every sabotage case by hand, reading each state on desktop and phone, and reviewing every pull request before merging.
