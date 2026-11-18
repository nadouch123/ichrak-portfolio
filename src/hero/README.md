# FE-AA3: Signature hero shader

The home page hero (`/`) renders `shader.js` behind the headline: a slowly drifting
"loss landscape" drawn as contour lines. The cursor digs a minimum into it, like
gradient descent rolling toward the lowest point, and the lines glow near it.

Uniforms: `u_time`, `u_resolution`, `u_mouse` (all three). Shader blocks, in order:
1. value noise, 2. fbm (4 octaves), 3. aspect-correct uv, 4. height field + cursor well,
5. contour lines with `fwidth` for 1px edges, 6. site palette (ink + sky),
7. readability scrim behind the text, 8. film grain.

**Fallback one-liner:** the hero's existing CSS gradient is always underneath; the shader
loads only after first paint (idle), caps DPR at 1.5, pauses when the tab is hidden or the
hero is scrolled away, and under `prefers-reduced-motion` draws one still frame (no WebGL = gradient only).
