# FE-AA2 · Your first 3D experience on the web

**Live:** https://ichrak-matrouh.vercel.app/3d/

## What I built

A small product configurator for a ceramic mug, in React Three Fiber, on its own page of my portfolio.

- **Turn and zoom** the mug (drag or one finger; scroll or pinch). Two buttons turn it for keyboard users.
- **Configure it:** glaze colour (five glazes or any colour), finish (gloss, satin, matte = roughness), metallic lustre (metalness), handle (loop or strap: two real parts in the model, swapped by visibility), saucer on or off, inside cream or the same glaze, wireframe.
- **Light it:** Studio, Sunset or Night. Each preset is a few glowing panels baked once into an environment map, plus a soft contact shadow.
- **Load your own model:** drop any `.glb` on the stage (or use the button, which works on phones). It is centred, scaled to fit and stood on the floor, and the panel lists its materials so you can change colour, metalness and roughness. Meshopt and Draco files both work (the Draco decoder is fetched from Google's CDN only if a file needs it). The file never leaves the device.
- **Show frame rate:** a checkbox (or `?fps` in the URL) shows how many frames the canvas actually renders each second.

The mug is a real glTF model that I built from code (`3d/scripts/make-mug.mjs`): lathe profiles for the body, inside and foot, tubes for the two handles, a lathe for the saucer, exported with three's `GLTFExporter` and compressed with gltf-transform.

```
node 3d/scripts/make-mug.mjs studio-mug.raw.glb
npx @gltf-transform/cli optimize studio-mug.raw.glb public/3d/studio-mug.glb \
  --compress meshopt --texture-compress false --join false --instance false --flatten false --simplify false
```

### Files

| File | What it does |
| --- | --- |
| `3d/gate.ts` | Decides, with no three.js loaded, whether 3D starts by itself, waits for a tap, or isn't offered |
| `3d/Stage.tsx` | The still picture, the reason text and button, `React.lazy` import of the viewer, WebGL error boundary |
| `3d/Viewer.tsx` | The 3D chunk: canvas, mug, lighting, shadow, controls, configurator panel, `.glb` loading |
| `3d/App.tsx`, `3d/perf.ts` | The page and its measured numbers |
| `public/3d/studio-mug.glb` | The model (43 KB) |
| `public/3d/mug-poster.webp` | The still picture (14 KB), rendered from the same scene |
| `tests/three-d.test.jsx` | The gate rules, and that no 3D code is requested until the visitor asks |

## Perf note

**Sizes:** model **43 KB** (222 KB before meshopt + quantization, about 9,000 triangles, no textures), still picture **14 KB**, 3D code **255 KB gzipped** in its own chunk. The home page gets **0 KB of 3D code**: its bundle grew only by the new project card (10.57 → 10.82 KB gzipped).

**What I did to keep it sane:**

1. **Nothing 3D on first load.** The 3D code is a separate chunk behind `React.lazy`. On a laptop it is requested when the stage is within 300 px of the screen and the browser is idle. On phones, with reduced motion, Data Saver, ≤ 2 GB memory or ≤ 2 cores, it waits for a tap. Without WebGL it is never offered.
2. **A real fallback, not a spinner.** A still picture of the same mug, the same size as the canvas, so nothing jumps when 3D arrives (the stage adds 0 layout shift).
3. **Render on demand.** `frameloop="demand"`: a frame only when you drag, change something, or while auto-rotate runs. Idle = 0 frames per second. Scrolled out of view, rendering stops completely (`frameloop="never"`).
4. **Bake what doesn't move.** Lighting is baked once into an environment map, and the contact shadow renders once (`frames={1}`), re-baking only when the shape or the lighting changes.
5. **Cap the pixels.** Pixel ratio at most 1.75, and `PerformanceMonitor` drops it to 1 when frames slow down. `powerPreference: 'low-power'`.
6. **Trim the bundle.** Deep imports from drei, and my own 40-line lighting instead of drei's `<Environment>` (which brings HDR/EXR loaders I don't use): **−20 KB gzipped**.
7. **Reduced motion** starts with auto-rotate off and no damping.

**Measured (FE-10 lens):**

| | Result | How |
| --- | --- | --- |
| Home page | 0 KB of 3D code, no 3D requests | `vite build` on main and on this branch; Playwright request log |
| `/3d/` on a phone, before the tap | 173 KB, LCP 1.8 s, TBT 20 ms, CLS 0.07, **score 98** | Lighthouse 12, mobile preset |
| `/3d/` on a laptop, with 3D | 465 KB, LCP 0.5 s, **TBT 1.06 s**, score 67 | Lighthouse 12, desktop preset |
| Rotating | 11.7 fps | Headless Chrome, **software WebGL (no GPU)**, 1280 px, frames counted for 5 s |
| Idle / scrolled away | 0 frames per second | Same, auto-rotate off / page scrolled to the bottom |

Honest caveats: the test machine has no GPU, so WebGL ran on the CPU. That makes the blocking time (one long task compiling shaders and baking the light) and the frame rate worst cases; a real laptop or phone GPU does this far faster. The 0.07 layout shift is the web fonts swapping into the heading, as on every page of the site. And 255 KB of JavaScript is a lot for a mug: most of it is three.js, which React Three Fiber pulls in whole. That is why it never loads anywhere else.

## With more time

- Put a 3D piece in my capstone: a "week" object for the Weekly Review Coach, one block per day, height by hours, colour by mood.
- Real ceramic textures (speckled clay normal map, glaze pooling at the rim) as KTX2, loaded after the first frame.
- Put the configuration in the URL so a link opens the same mug.
- "View on your table" in AR on phones (model-viewer, plus a USDZ export for iOS).
- Measure frame rate on real devices across a few phones, not just the headless worst case.
