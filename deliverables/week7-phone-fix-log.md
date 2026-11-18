# Fix log: Open It on Your Phone (week 7)

**Live site:** https://ichrak-matrouh.vercel.app (PR #3 merged and deployed 16 Nov 2026)
**Pull request:** https://github.com/nadouch123/ichrak-portfolio/pull/3
**Date:** 16 Nov 2026

## How I checked
- I opened every page (home, FE-05 playground, FL-06 spec, Checkpoint 1 build, FE-07 tool UI, FE-08 edge cases) at **320, 390, 768 and 1280 px** wide.
- I ran an automated accessibility audit (axe-core, WCAG 2 A and AA) on each page at phone and desktop width.
- A script flagged any sideways scrolling, any tap target smaller than 24 px, and any text smaller than 12 px.
- I clicked every link: all project pages, the live demo (weekly-review-coach.vercel.app), the GitHub repo and the source files.
- I checked image weight and sharpness. The only image is the logo, which was 8.7 KB, so weight was fine, but it was not readable (see fix 2).
- On a real phone (iPhone, Safari): before = `screenshots/phone-before-iphone.jpg`, taken 16 Nov 2026 before the fixes. You can see the logo text "PORTFOLIO FOR ICHRAK MATROUH" squeezed into a 40 px square, too small to read. After = `screenshots/phone-after-iphone.jpg`, taken on the live site after PR #3 was merged. The logo is now a sharp briefcase icon.

  ![phone before and after](screenshots/00-phone-before-after.jpg)

**Before:** 12 automated accessibility errors, a menu that trapped the keyboard, half of each table hidden on phones, and one page that scrolled sideways.
**After:** 0 automated errors on every page, and no sideways scroll at any width.

## What was broken, what I changed

| # | What was broken | Where | What I changed |
|---|---|---|---|
| 1 | The closed phone menu was invisible, but its 6 links were still in the tab order and read aloud by screen readers. A keyboard user tabbed through 6 invisible links. | Home, phone width | The closed menu is now fully hidden and comes back when you tap the menu button. |
| 2 | The logo was a 300×240 wordmark ("PORTFOLIO FOR ICHRAK MATROUH") squeezed into a 40 px square. The text was unreadable and looked blurry. | Every page header | I cropped the briefcase mark into a sharp 192 px square (5 KB), which works on 3× phone screens. It is also the browser tab icon and the home-screen icon. ![logo](screenshots/01-logo.png) |
| 3 | The server sent the logo file as `application/octet-stream` (not as an image), so some browsers could skip it as a tab icon. | Server | A `vercel.json` rule now sends it as `image/jpeg`. |
| 4 | The tables were 680 px wide inside a 356 px box. On a phone the most important column ("What you see", "The build does") was cut off, with no sign that you could scroll. | FE-07, FE-08, Checkpoint 1, FL-06 | Under 640 px, each row becomes a small card that shows every column with its name. On desktop, the table can now be scrolled with the keyboard. ![table](screenshots/02-table-phone.png) |
| 5 | Project card numbers had a contrast of 2.1:1 (light grey on white). The minimum is 4.5:1. | Home, work section | Darkened to 4.9:1. ![contrast](screenshots/03-card-number-contrast.png) |
| 6 | Contact form field borders were about 1.4:1 on navy, so the empty fields were hard to see. Input borders need 3:1. | Home, contact | Borders and labels are brighter. ![form](screenshots/05-contact-form.png) |
| 7 | Form fields used 15 px text, so iPhone zoomed the whole page in when you tapped one. | Home, contact | Fields use 16 px on phones, so the page no longer zooms. |
| 8 | Body text was 15 px on phones and badges were 11 px. | All pages | Body text is 16 px on phones, and nothing is smaller than 12 px. |
| 9 | The FE-05 playground was a dead end: no link back to the portfolio, no tab icon, and it scrolled sideways on a 320 px phone. | Playground | Added a "Back to portfolio" button (44 px tall), a tab icon and a description, and fixed the sideways scroll. ![playground](screenshots/04-playground.png) |
| 10 | Nothing on the site linked to the code. | Home, FE-07, FE-08 | The "AI Portfolio" card now opens the GitHub repo, and every code box has a "View on GitHub" link. |

## Links I clicked (all work)
- Home → all 5 project pages → "Back to portfolio" on each ✔
- Live demo: https://weekly-review-coach.vercel.app ✔
- Repo: https://github.com/nadouch123/ichrak-portfolio ✔, plus the 4 source-file links ✔
- Email link ✔
- **Still to fix (in PR #1):** the GitHub and LinkedIn icons in the contact section go to the general github.com and linkedin.com home pages, not to my profiles. PR #1 fixes this once I add my LinkedIn URL.

Full before/after screenshots of the home page at 390 px are in `screenshots/`.
