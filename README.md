# Ichrak Matrouh — Portfolio React + AI

A standalone React portfolio exercise for FlyRank's **React app development with AI** assignment.

## What this project is

This is a React implementation of my professional portfolio, focused on AI, software engineering, web development, and technology.

The Week 3 assignment is a standalone practice exercise; FlyRank's Q&A states that it does not have to continue the Week 1–2 capstone.

## Features

- Responsive portfolio layout
- Hero / personal positioning
- About section
- Skills toolkit
- Selected projects
- Experience / education timeline
- Contact section
- Mobile navigation
- Smooth section navigation
- Existing portfolio logo integrated
- Accessible labels for navigation and icon links

## Run locally

```bash
npm install
npm run dev
```

## AI-assisted development prompts

### Prompt 1 — Architecture
> Build a responsive React portfolio for a computer science engineering student focused on AI and software engineering. Structure it into Home, About, Skills, Projects, Experience, and Contact sections. Keep the implementation component-oriented and easy to maintain.

### Prompt 2 — Visual direction
> Design a premium professional portfolio with a restrained blue-and-white technology identity. Use strong typography, generous whitespace, subtle borders, and an editorial feel. Avoid generic cyberpunk visuals and excessive gradients.

### Prompt 3 — Responsive behavior
> Make the portfolio responsive across desktop, tablet, and mobile. Add a mobile navigation menu and ensure cards, typography, buttons, and section spacing adapt cleanly.

### Prompt 4 — Content
> Organize the portfolio content around AI/software engineering skills, real projects, internship experience, education, and contact information. Do not invent project achievements or metrics.

### Prompt 5 — Review
> Review the React portfolio for UX, responsive layout, accessibility, navigation behavior, maintainability, and visual consistency. Suggest focused corrections rather than replacing the whole project.

## How AI assisted

AI was used as a development assistant to:
- propose the page architecture;
- draft React markup and interaction logic;
- suggest responsive CSS patterns;
- review navigation and accessibility;
- identify areas for simplification and refinement.

AI output was treated as a starting point. The final implementation was reviewed against the actual portfolio content and assignment requirements.

## Manual improvements / corrections / refactoring

After reviewing the AI-generated starting point, I manually:
- integrated the existing portfolio logo instead of generating a replacement;
- kept project descriptions grounded in my actual portfolio/project history;
- removed unnecessary UI elements and avoided fake project screenshots;
- refined the blue/white visual system to match the portfolio identity;
- added responsive breakpoints and a mobile menu;
- added smooth navigation between portfolio sections;
- added accessible labels for icon-only controls;
- added hover/focus-friendly interaction patterns;
- simplified the content hierarchy so projects remain the main proof;
- kept the app frontend-only because a backend is not needed for this portfolio exercise.

## AI judgment

The goal was not to accept AI-generated code blindly. I used AI for acceleration and review, then made decisions about what to keep, remove, simplify, and adapt to my actual portfolio.

## Submission

Submit:
1. Live hosted portfolio URL (Vercel/Netlify if deployed)
2. GitHub repository URL
3. This README documents the prompts, AI assistance, and manual improvements.

## FL-06 — Design Your Personal Agent (Week 5)

The agent design spec is published as its own page at `/agent-spec/` (source in `agent-spec/`), and linked from the **Weekly Review Coach** card in the Projects section.

- **Agent:** Weekly Review Coach, a Claude Project grounded in my weekly notes (read only)
- **Spec covers:** job to be done, user and frequency, tools and data with access plan, draft instructions, six eval cases, risks and guardrails, platform choice (vs. n8n and a custom GPT), and a 10-hour build plan

Run `npm run dev` and open `http://localhost:5173/agent-spec/` to view it locally.

## Week 5 redesign

The whole site was redesigned for a more premium, editorial look: dark navy hero and contact sections, Instrument Serif + Inter typography, a sticky glass navigation with active-section highlighting, scroll reveal animations (switched off for users who prefer reduced motion), grouped skills, linked project cards for the FlyRank assignments (FE-05 playground, FL-06 agent spec), and a matching layout for the `/agent-spec/` page. Fonts are preconnected, and the logo was compressed from 277 KB to 9 KB for faster loading.

## PF-04 — Personal website live

Live URL: **https://ichrak-matrouh.vercel.app** (HTTPS, Vercel free Hobby tier). The older `ichrak-portfolio-seven.vercel.app` still works.

How it is hosted: this GitHub repo is linked to a Vercel project. Every push to `main` builds the site (`vite build`) and publishes the `dist/` folder to production with an automatic HTTPS certificate.

What each deployed file does:
- `index.html` + `src/main.jsx` + `src/index.css`: the home page (positioning, work, writing & capstone, experience, contact).
- `src/links.js`: the single place for LinkedIn, GitHub, CV, booking and email links.
- `cv/index.html` + `cv/cv.css`: my CV as a web page; "Save as PDF" uses the browser's print dialog and a print stylesheet.
- `playground/`, `agent-spec/`, `agent-build/`, `tool-ui/`, `edge-cases/`: one folder per FlyRank assignment page, each its own HTML entry.
- `vite.config.ts`: tells Vite which HTML pages to build. `public/logo.jfif`: favicon and logo.
- `package.json` / `package-lock.json`: dependencies (React, lucide-react icons, Radix for the FE-05 comparison) and build scripts.
