# Plant Your Flag: domain, analytics and graduate badge

*Draft submission. Rewrite it in your own words before you send it.*

**Live address:** https://ichrak-matrouh.vercel.app
**Shipped in:** [PR #7](https://github.com/nadouch123/ichrak-portfolio/pull/7), merged 17 Nov 2026

## 1. The address

I chose the free fallback. My portfolio lives on a clean subdomain, **ichrak-matrouh.vercel.app**: my name, no random letters, no project codes. The old address (ichrak-portfolio-seven.vercel.app) permanently redirects (301) to it, so older links still work.

I priced personal domains before deciding (Vercel registrar, 17 Nov 2026):

| Domain | First year | Renewal |
|---|---|---|
| ichrakmatrouh.com | $12.03 | $12.03 |
| ichrakmatrouh.dev | $9.99 | $13 |
| ichrakmatrouh.me | $13.99 | $20 |

All three are still available. When I upgrade, buying ichrakmatrouh.com in Vercel is enough. Vercel sets up the DNS and the certificate, and I'd change one line in `src/links.js` plus the canonical/sitemap URLs.

## 2. HTTPS

The site is served only over HTTPS with a valid certificate. Vercel also sends `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, so browsers refuse plain HTTP. (Checked on production, see the verification table below.)

## 3. Analytics

I installed **Vercel Web Analytics**. It's free and cookieless, so there's no cookie banner and no personal data. Every page (the home page, 7 project pages and the 404 page) loads `/_vercel/insights/script.js`. Page views show up in the Vercel dashboard under ichrak-portfolio → Analytics.

*Screenshot to add:* the Analytics tab showing the first page views. → `screenshots/analytics.png`

## 4. Launch hygiene

| Check | Result |
|---|---|
| Social-share preview | Title, description and 1200×630 image (`/og-image.png`) on every page, with `og:url` and `canonical` pointing at ichrak-matrouh.vercel.app |
| Favicon | `/favicon.ico` (16/32/48), JPG icon, and a 180px `apple-touch-icon.png` for iPhone home screens |
| Page titles | Every page has its own title, e.g. "Ichrak Matrouh \| Frontend AI Engineering Intern Portfolio", "FE-09 Testing pass \| Ichrak Matrouh", "Page not found \| Ichrak Matrouh" |
| Phone | Footer and badge checked at 390px and 280px, no sideways scrolling. *Open the live address on your own phone once more and add a photo:* `screenshots/phone-final.jpg` |

## 5. FlyRank graduate badge

The official FlyRank badge (the compact pill, made with internship-badge.netlify.app) sits in the footer of the home page. It shows "Verified credential" and my credential ID **FR-D1-T668H-R789R**, and it links to my verification page:
https://internship.flyrank.ai/verify?id=FR-D1-T668H-R789R&first_name=Ichrak%20Matrouh

Screenshots: `screenshots/footer-desktop.png`, `screenshots/footer-phone.png`, `screenshots/footer-280.png` (on screens narrower than 340px the small "Verify" chip hides so nothing overlaps; the whole badge is still the link).

## Production verification

Checked on production with the Vercel fetch tool, 17 Nov 2026, 19:28 UTC, after PR #7 deployed (commit d03dffe):

| Check | Result |
|---|---|
| `https://ichrak-matrouh.vercel.app/` | 200, served over HTTPS, HSTS header present |
| Title | "Ichrak Matrouh \| Frontend AI Engineering Intern Portfolio" |
| `og:url` / `canonical` / `og:image` | all on https://ichrak-matrouh.vercel.app |
| `/favicon.ico` | 200, image/vnd.microsoft.icon |
| `/apple-touch-icon.png` | 200, image/png, 180×180 |
| Analytics script tag | present in the page head |
| `/_vercel/insights/script.js` (19:28 UTC) | 404, Web Analytics not yet switched on in the dashboard |
| Re-check 20:00 UTC (after PR #8, the pill badge) | `/_vercel/insights/script.js` now 200: Web Analytics is on and counting |
| Badge | in the home page footer, links to the verify URL above (unit test pins the link) |
