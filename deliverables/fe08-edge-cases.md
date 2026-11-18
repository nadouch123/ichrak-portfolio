# FE-08: Error states, empty states, edge cases

**App:** https://weekly-review-coach.vercel.app
**Portfolio page:** https://ichrak-portfolio-seven.vercel.app/edge-cases/
**Screenshots:** happy path (01–03), handled failures (10–19), empty states (20–23), phone (30–32)

For this assignment I took my Weekly Review Coach from FE-07 and tried to break it in every way I could think of. Then I gave each failure a designed state that says what happened and what to do next, and a retry that is safe to press.

## 1. Inventory first

Before changing any code, I listed every way the main flow (the weekly review) can go wrong:

- the network is down before I send
- the stream is cut in the middle of an answer
- a rate limit (429) or an overloaded model (529)
- the route handler crashes
- a tool returns malformed data
- the model refuses
- the first token is slow
- the input is empty, or too long
- no files are loaded, or the selected week has no notes file
- the starter files fail to load
- the data saved in localStorage is damaged
- a component throws while rendering
- the device goes offline
- the status endpoint fails

## 2. One shape for every failure

Every failure now leaves the server as a small JSON object: `{ code, message, retryAfter? }`. That includes stream errors (sent through `onError`) and crashes in the route itself, because I wrapped the handler in a try/catch that returns a JSON 500 instead of an HTML page. In the browser, each code maps to a designed card with a title, what happened, "What now", and a retry button.

The brief mentions Next.js `error.tsx`. My app is Vite + React, so I used React error boundaries for the same job, at three levels:

- one around the whole page, which offers "Reload the page" and "Reset saved data"
- one around the chat, so a crash there leaves the files panel working
- one around each tool result

## 3. Sabotage checklist

The header has a **Sabotage** menu. Each switch breaks the **next request only** and then turns itself off, so pressing Retry right after shows the recovery. I tested them in the order the mentor suggested (network, mid-stream, 429, malformed JSON) and then added the rest.

| # | Sabotage | What breaks | What you see | Recovery |
|---|---|---|---|---|
| 1 | Network down before send | `fetch` throws before the request leaves | "Couldn't reach the coach"; the message is kept | Retry re-sends the same message |
| 2 | Connection drops mid-stream | the model stream errors after about 14 chunks | partial answer kept; the cut tool card is marked **Interrupted**; "The answer was cut off" | Retry replaces only the failed reply |
| 3 | Rate limit (429) | the route returns 429 with `Retry-After: 12` | "Too many requests"; the button counts down "Retry in 12s" | unlocks itself |
| 4 | Tool returns malformed JSON | the `readFile` payload is cut in half, so `JSON.parse` fails | tool card **Failed**: "Unreadable tool result" | Try again |
| 5 | Route handler throws (500) | an exception inside `POST` | "The server hit an error" (JSON, never an HTML page) | Retry |
| 6 | Slow response (9 s) | 9 s before the first token | a reply-shaped skeleton; after 5 s, "This is taking longer than usual" with **Stop** | Stop keeps what arrived; "Ask again" |
| 7 | Model refuses | the answer ends with `finishReason: content-filter` | "The model declined to answer this" | Edit my question |
| 8 | readFile fails | the tool throws | tool card **Failed**, with what it was trying to do | Try again |
| 9 | checkPortfolio fails | the tool throws | tool card **Failed**; the review carries on without it | Try again |
| 10 | Page component crashes | a component throws while rendering | "The chat stopped working"; files untouched | Reload the chat |

These cases are handled without a switch:

- **Offline:** a banner appears and Send pauses.
- **Empty input:** Send is disabled, Enter shows a hint, and the server returns `empty_input`.
- **Input over 2,000 characters:** a counter appears, Send is disabled, and the server returns 413.
- **Malformed request body:** the server returns 400.
- **Damaged saved data:** it is validated when the page loads.
- **Starter files that fail to load:** a designed error with Try again.
- **Status endpoint down:** the badge says "Model status unknown".

Real provider errors use the same states. A 429 uses the provider's `Retry-After`. A 529 shows "The model is busy". A 401 or 403 shows no retry button, because retrying can't help.

## 4. The retry button

- **It says what it retries:** *Retry "weekly review"*, meaning the failed message, not the whole conversation. It uses `regenerate()`, which drops the failed reply and re-sends the last user message.
- **It can't fire twice:** it disables itself on the first click and shows "Retrying…". A double click sends one request, and my browser test checks this.
- **It waits on a 429:** it counts down from `Retry-After` and then unlocks.

## 5. Empty and pending states

| Where | When | What it offers |
|---|---|---|
| Chat | first run | Start my weekly review, Quiz me, and three example questions that fill the input box |
| Chat | no files loaded | "Nothing to review yet." with Load the example notes and Upload my notes |
| Chat | the selected week has no notes file | a warning that names the missing file, with Switch to Week 5 |
| Side panel | no files | "No files yet." with Load example notes |
| listFiles result | empty list | points to the side panel instead of showing an empty box |

While things load:

- the model badge shows a pill skeleton
- the file list shows three file-shaped skeletons
- the chat shows "Coach is choosing what to do" and a skeleton the same size as a reply bubble, so nothing jumps when the text arrives

## 6. Responsive and mobile Safari

- **Height:** `100dvh`, with a `100vh` fallback.
- **Keyboard:** `interactive-widget=resizes-content`, so the keyboard doesn't cover the input.
- **No zoom:** a 16 px input, so iOS doesn't zoom in when you tap it.
- **Safe areas:** safe-area padding under the input box.
- **Scrolling:** contained overscroll, and auto-scroll only when you are already at the bottom. Otherwise a "↓ Latest" button appears.
- **Layout at 390 px:** the header fits on one row and the files panel collapses into a toggle.

I checked this with iPhone-sized emulation in Chromium: there is no sideways scroll at 390 px. I haven't tested on a real iPhone yet.

## 7. Tests

- `npm test` runs 6 route tests: the mid-stream error event, 429 with Retry-After, a route throw becoming a JSON 500, empty and too-long input, an unreadable body, and malformed tool data.
- `npm run test:e2e` is the stretch goal: a browser test that arms the mid-stream switch, checks the designed error and the kept partial answer, double-clicks Retry, checks that only one message was re-sent, and waits for the full review.

All of them pass, and the happy path shows no console errors.

## 8. What broke while I sabotaged it

- **Tool errors showed up as JSON.** Tool errors went through the same `onError` as stream errors and came out as JSON. I gave tools their own `ToolFailure` error, whose message passes through unchanged.
- **The error classifier was too greedy.** It matched the word "terminated", so a malformed-JSON error ("Unterminated string") was labelled as a dropped connection. I narrowed the pattern.
- **A cut-off tool card spun forever.** After a mid-stream cut, the half-written tool card kept spinning. A tool step that is still "preparing" or "running" after its reply has ended now shows **Interrupted**.
- **"Reload the chat" seemed broken, but the test was wrong.** In my test it didn't recover the chat. The real problem was my test selector, which clicked the paragraph that says "reload the chat" instead of the button. I also changed the reset to remount the chat, which is more robust.
- **The phone layout overflowed.** At 390 px the header overflowed by 11 px and the placeholder text wrapped. I made the header compact and shortened the placeholder.

## 9. Honest notes

- The deployed app runs a labelled **demo model** because I haven't added model credits yet. The tools and every failure state run for real. The same code switches to Claude once an API key is set.
- I built this with Claude as a coding assistant. I decided the failure inventory, the order of the sabotage tests and the behaviour of each state, and I reviewed and tested the result.
