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

### Tests

```bash
npm test            # 6 route tests: mid-stream error event, 429, route throw, empty/too long, bad body, malformed tool data
npm run dev:full &  # then:
npm run test:e2e    # browser: mid-stream failure → designed error → double-clicked Retry sends once → full review
```

