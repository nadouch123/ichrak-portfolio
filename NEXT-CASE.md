# How to add the next case study

**Where it goes:** a new folder `<slug>/` (copy `audit/` as the template: `index.html` + page files), registered in `vite.config.ts` (`build.rollupOptions.input`), plus one card at the top of the `projects` array in `src/App.jsx` (and optionally a `writing` entry above it).

## Steps (about an hour with my Claude Project)
1. Copy `audit/` to `<slug>/`, rename, and add `<slug>: resolve(__dirname, '<slug>/index.html')` to `vite.config.ts`.
2. Write the page in three beats:
   - **Problem:** what was broken or missing, for whom, in 2-3 sentences.
   - **What I did:** the build, the key decision, one screenshot or code snippet.
   - **What came of it:** a real result (number, link, before/after). No invented metrics.
3. Add the card to `projects` in `src/App.jsx`: `title`, `tag`, `meta`, `desc` (one beat each), `tech`, `href: '/<slug>/'`, `cta`, `icon`.
4. Add the page to `public/sitemap.xml` and a line to `INDEX.md`.
5. `npm test && npm run build`, open a PR, merge, check it live on https://ichrak-matrouh.vercel.app.

## Next piece of work
**Weekly Review Coach, for real:** add an Anthropic API key to the coach, run its 6 eval cases from the FL-06 spec, and publish the pass/fail table as the case study (problem: the agent only ran a demo model; did: real model + evals; result: the scores).

Reminder: Friday 4 December 2026, 10:00, calendar event "Add next case study: Coach evals" (screenshot in submission).
