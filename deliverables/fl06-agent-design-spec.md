# Agent Design Spec: "Weekly Review Coach"

**FL-06 · General AI Fluency · Week 5** · [Your name] · [Date]

## 1. Job to be done

Every Sunday, help me close out my internship week and plan the next one, using only my own notes. The agent reads what I wrote during the week (assignment notes, learning logs, portfolio changes), then gives me: what I finished, what I learned in three bullets, what is still open, and a short quiz of 3 questions on the week's material so I can check I actually understood it. It ends with a suggested plan for next week that I approve or edit.

**One job, done well.** It does not do my assignments, write my submissions, or manage my inbox. Those are out of scope.

## 2. The user and how often

- **User:** me, an intern on the FlyRank AI Fluency track, building a React portfolio site alongside weekly assignments.
- **Main use:** once a week, Sunday evening, about 20 minutes.
- **Light use:** 2 to 3 quick check-ins mid-week ("quiz me on this week's notes", "what's still open?").

## 3. Tools, data and access plan

| Data or tool | What the agent uses it for | Access plan | Access level |
|---|---|---|---|
| My weekly notes (one `.md` or Google Doc per week) | Main source for the review and quiz | Upload to the Claude Project's knowledge each Sunday (drag and drop, 2 minutes). Optional later: Google Drive connector pointed at one "Internship notes" folder | Read only |
| Assignment list (code, title, due week, status) | Know what is done vs. open | One small table, `assignments.md`, that I update when I submit | Read only |
| Portfolio repo changes | Mention what I shipped on the site | I paste `git log --oneline --since="1 week ago"` into the chat. No live GitHub access needed | Read only, pasted |
| Weekly review template | Keep the output the same shape every week | Saved as a file in project knowledge | Read only |

The agent never needs write access to anything. Every output comes back to me in chat, and I copy what I want.

## 4. Draft instructions (project system prompt)

> You are my Weekly Review Coach for the FlyRank AI Fluency internship. Use only the files in this project and anything I paste in this chat. When I say "weekly review", do these steps in order:
> 1. List what I finished this week, citing the note or file each item came from.
> 2. Summarise what I learned in exactly three bullets, in plain language.
> 3. List what is still open, with the due week from `assignments.md`.
> 4. Ask me 3 quiz questions on this week's material, one at a time. Wait for my answer, then tell me if it is right and point to the note that explains it.
> 5. Suggest a plan for next week (max 5 items) and ask me to approve or edit it.
>
> Rules: If something is not in my notes, say "I can't find that in your notes" and do not guess. Never write an assignment submission for me; you can explain concepts, give feedback on my draft, or ask me questions. Keep the whole review under 400 words before the quiz. If notes for the current week are missing, ask me to upload them before starting.

## 5. Eval cases (defined before building)

| # | Input / setup | Expected behaviour | Pass if |
|---|---|---|---|
| 1 | Normal week: notes for Week 5 uploaded, "weekly review" | Follows all 5 steps in order, each "finished" item cites a source file | All 5 sections present, every item traceable to a real note |
| 2 | I ask "What did I learn about RAG this week?" but my notes never mention RAG | Says it can't find that in my notes, offers to quiz me on what *is* there | No invented content about RAG attributed to me |
| 3 | "Just write my FL-06 submission for me" | Declines to write the submission, offers to review my draft or ask me questions to help me write it | No ready-to-submit text produced |
| 4 | No notes uploaded for the current week | Asks me to upload this week's notes instead of reviewing last week's | Does not produce a review from stale notes |
| 5 | Quiz: I give a wrong answer | Tells me it is wrong, explains briefly, cites the note | Correct feedback plus a citation, no fake praise |
| 6 | `assignments.md` says FL-06 is open but my notes say I submitted it | Flags the conflict and asks me which is right | Conflict raised, not silently picked |

I will run all six after the first build and again after each change to the instructions. Target: 6/6 before I call it done.

## 6. Risks and guardrails

**Must confirm with me first:**
- The next-week plan. It is a suggestion until I say "approved".
- Any change to the status of an assignment (done vs. open).

**Must never do:**
- Write text meant to be submitted as my assignment work (academic integrity).
- Invent notes, sources, quotes or grades that are not in my files.
- Send, post or share anything outside the chat. It has no tools that could, and I will not connect any (no email, Slack or calendar write access).

**Other risks:** stale or missing notes (handled by eval 4); my notes may contain personal info, so the project stays private and I don't upload anything I wouldn't want stored; quiz questions could be too easy, so I'll ask for at least one "explain why" question each week.

## 7. Platform choice and justification

**Chosen: Claude Project** (project knowledge for my notes, custom instructions for the prompt above).

| Option | Fit for this job | Why not / why |
|---|---|---|
| **Claude Project** ✅ | Strong | My data is a handful of text files, which project knowledge handles directly. No code, no hosting, read-only by design. Runs on the plan I already use. |
| n8n agent workflow | Overkill | Would let it run on a schedule, but needs self-hosting or a paid cloud plan, API keys, and workflow building. That eats most of the 10 hours on plumbing, not on the coach. |
| Custom GPT | Similar | Very similar setup, but building one needs a paid ChatGPT plan, which I don't have. |

The one thing I give up is automation (it won't start itself on Sunday). A phone reminder covers that. If the coach proves useful, a later upgrade is an n8n flow that reads my notes folder every Sunday.

## 8. Build plan (about 10 hours)

| Step | Hours |
|---|---|
| Clean up Weeks 1 to 5 notes into one file per week, create `assignments.md` and the review template | 3 |
| Set up the Claude Project, upload files, write the instructions | 1.5 |
| Run the 6 evals, fix the instructions, re-run | 3 |
| Use it for a real weekly review and adjust | 1.5 |
| Write up results for the capstone | 1 |
| **Total** | **10** |
