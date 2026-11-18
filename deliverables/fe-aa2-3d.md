# FE-AA2 · Your first 3D experience on the web

**Live:** https://ichrak-matrouh.vercel.app/3d/

## What I built

My work in AI and data science, drawn as a living 3D neural network, in React Three Fiber with custom GLSL shaders.

Four layers run left to right like a network diagram: **Data in** (notes, live websites, user input, sensor data, datasets) → **Skills** (Python, AI/ML, TypeScript, React, SQL & MongoDB, Laravel, Docker) → **AI & data capabilities** (LLM tool use, evals & guardrails, streaming AI UI, data pipelines, data analysis, testing, …) → **Projects** (Weekly Review Coach, Tool results UI, Edge cases, Testing pass, Agent spec, UtopiaHire, Smart Bracelet, A11y playground). Every one of the 61 edges is a real "this was built with that" link, defined in one data file (`3d/graph.ts`).

Interactions, beyond orbiting:

- **Trace a lineage:** tap or hover any node (or pick it from the chips in the panel) and the whole path lights up: everything it is built from and everything it feeds. The rest dims, a card explains the node, and project nodes link to their page.
- **Run a forward pass:** a wave of light moves through the layers, left to right, like activations in a network.
- **Embedding view:** the same nodes and 1,600 data points fold out of the layered network into four clusters (AI, Data, Frontend, Systems), like a 2D projection of embeddings. The colours shift from layer colours to theme colours as it morphs.
- **Data flow:** pulses of data travel along every edge. Can be switched off.
- **Show frame rate:** a checkbox (or `?fps` in the URL).

How it is drawn:

- Nodes are one `InstancedMesh` (one draw call), with an invisible, larger instanced mesh for easy tapping on phones.
- Edges are curved Bézier lines in one `LineSegments`, with a shader that draws the moving pulses, the forward-pass wave and the highlight.
- The glow is additive point sprites, not a bloom pass. The 1,600 points are one `Points` object whose shader drifts them.
- Labels are text drawn into small canvas textures, so no font file or text library is downloaded.

## How it loads

1. The page, the panel and a still picture (`public/3d/network-poster.webp`, 52 KB) load first. The picture is the same size as the canvas, so nothing jumps.
2. A tiny gate (`3d/gate.ts`, no three.js) checks reduced motion, Data Saver, device memory, CPU cores, touch-only input and WebGL.
3. On a laptop, the 3D chunk is fetched with `React.lazy` once the stage is within 300 px of the screen and the browser is idle. On a phone, low-power device, Data Saver or reduced motion, it waits for a tap. Without WebGL it never loads; you keep the picture.
4. The whole network is also written out as a table on the page, so nothing depends on the canvas.

Mobile: one finger turns, pinch zooms, tap selects. The camera steps back on narrow screens so all four layers fit, and the selection card sits below the canvas instead of covering it. Pixel ratio is capped at 1.5 and dropped to 1 by `PerformanceMonitor` if frames slow down. Rendering stops off screen. With reduced motion, data flow and auto-rotate start off.

## Perf note (FE-10 lens)

| What | Number |
| --- | --- |
| 3D code on the home page | 0 KB (Lighthouse lists no 3D request; home score 99) |
| /3d/ on a phone, before the tap | 214 KB · LCP 1.9 s · TBT 90 ms · CLS 0 · score 98 (Lighthouse mobile) |
| The 3D chunk | 233 KB gzipped, almost all three.js + R3F |
| /3d/ on a laptop, with 3D | 444 KB · LCP 0.4 s · TBT 240 ms · score 92 (Lighthouse desktop) |
| Frame rate while it moves | 55 fps with software WebGL (no GPU) at 1280 px |
| Frames when nothing moves | 0 per second (and 0 when scrolled away) |

The main lesson: every effect (glow, moving data, the wave, the points) is a small shader on geometry that is already on the GPU, instead of a post-processing pass or per-frame CPU work. Each frame the CPU only updates 28 node matrices. That is why it holds 55 fps even on a machine with no GPU, and why desktop blocking time dropped from 1.06 s (my first version, a mug with a baked environment map) to 240 ms. The honest cost is the 233 KB of three.js, which is why it never loads on the home page and waits for a tap on phones.

How I measured: Lighthouse 12 against `vite preview`, headless Chromium with SwiftShader; frames counted by wrapping `gl.clear` for 5 s in Playwright.

## What I'd add with more time

- **Real embeddings:** embed my project write-ups with a text-embedding model and place each node by its real vector (reduced with UMAP) instead of hand-picked themes.
- **Live in my capstone:** show the Weekly Review Coach's tool calls in the network, each call lighting the path from my notes to the review.
- **Bloom, done cheaply:** a real bloom pass on desktops with a good GPU, keeping the sprite glow for phones.
- **Share a view:** put the selected node and view in the URL.

## Files

- `3d/graph.ts`: the nodes, edges, lineage and the two layouts (no three.js, unit tested).
- `3d/Viewer.tsx`: the R3F scene, shaders and panel (lazy-loaded chunk).
- `3d/Stage.tsx`, `3d/gate.ts`: the still picture, the gate and lazy loading.
- `3d/App.tsx`, `3d/perf.ts`: the page and its numbers.
