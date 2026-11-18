// FE-AA3: "loss landscape" hero shader. Vanilla WebGL1, no library, loaded after first paint.
// The hero's CSS gradient stays underneath as the static fallback (reduced motion, no WebGL, before load).

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

export const FRAG = `
precision mediump float;
uniform vec2  u_resolution; // canvas size in device pixels
uniform float u_time;       // seconds since start
uniform vec2  u_mouse;      // cursor in 0..1 (eased in JS), y up

// 1. Value noise: random numbers on a grid, smoothly blended between corners.
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
// 2. fbm: 4 octaves of noise, each twice as fine and half as strong = a rolling "loss surface".
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main(){
  // 3. uv: 0..1 across the screen; q is aspect-corrected so shapes are not stretched.
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 q = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);

  // 4. Height field drifting slowly over time, plus a well at the cursor:
  //    the cursor is the "minimum" that gradient descent rolls toward.
  float t = u_time * 0.04;
  float h = fbm(q * 2.2 + vec2(t, -t * 0.6));
  float d = distance(q, m);
  h -= 0.35 * exp(-d * d * 6.0);

  // 5. Contour lines: fract() makes repeating bands of height; edge is 0 exactly on a line.
  //    Two widths: a crisp 1px core plus a soft halo, so each line glows instead of looking drawn.
  float bands = h * 14.0;
  float edge = 0.5 - abs(fract(bands) - 0.5);
  float w = fwidth(bands);
  float core = 1.0 - smoothstep(0.0, w * 1.1, edge);
  float halo = 1.0 - smoothstep(0.0, w * 7.0, edge);

  // 6. Aurora palette: line colour shifts with height and drifts with time
  //    (deep blue -> sky -> violet -> teal), so the landscape reads as layered depth.
  vec3 ink    = vec3(0.035, 0.063, 0.125);
  vec3 sky    = vec3(0.612, 0.761, 1.0);
  vec3 violet = vec3(0.663, 0.545, 1.0);
  vec3 teal   = vec3(0.373, 0.886, 0.851);
  float k = fract(h * 1.6 + u_time * 0.02);
  vec3 hue = mix(mix(sky, violet, smoothstep(0.0, 0.5, k)), teal, smoothstep(0.5, 1.0, k));

  // Background: two slow nebula glows (violet top-right, teal bottom-left) over the ink.
  vec3 col = ink;
  col += violet * 0.30 * exp(-2.2 * distance(uv, vec2(0.85 + 0.05 * sin(u_time * 0.1), 0.85)));
  col += teal   * 0.16 * exp(-2.6 * distance(uv, vec2(0.1, 0.05)));
  col += vec3(0.02, 0.035, 0.07) * h;

  // Lines: brighter on higher ground and near the cursor ("depth" + focus).
  float glow = exp(-d * 2.0);
  float lift = 0.35 + 0.65 * smoothstep(0.2, 0.8, h);
  col += hue * (core * 0.45 + halo * 0.14) * lift * (0.6 + 1.6 * glow);
  col += sky * 0.16 * exp(-d * d * 14.0);               // soft spotlight under the cursor

  // 7. Readability scrim + vignette: darken the left/bottom where the headline sits and the edges.
  col *= mix(0.5, 1.0, smoothstep(0.1, 0.9, uv.x * 0.7 + uv.y * 0.3));
  col *= 1.0 - 0.35 * pow(length(uv - 0.5) * 1.3, 2.0);

  // 8. Grain: per-frame noise breaks up gradient banding.
  col += (hash(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}`;

export function startHeroShader(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return () => {};
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, '#extension GL_OES_standard_derivatives : enable\n' + FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('u_resolution'), uTime = U('u_time'), uMouse = U('u_mouse');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const target = [0.75, 0.6], mouse = [0.75, 0.6];
  let raf = 0, visible = true, onScreen = true, t0 = performance.now();

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5); // DPR capped: 1.5x is plenty for a soft background
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const draw = (now) => {
    mouse[0] += (target[0] - mouse[0]) * 0.05; mouse[1] += (target[1] - mouse[1]) * 0.05;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
  const sync = () => {
    cancelAnimationFrame(raf); raf = 0;
    if (reduce.matches) { draw(t0 + 20000); return; }        // reduced motion: one still frame
    if (visible && onScreen) raf = requestAnimationFrame(loop); // paused when tab hidden or hero scrolled away
  };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    target[0] = (e.clientX - r.left) / r.width;
    target[1] = 1 - (e.clientY - r.top) / r.height;
  };
  const onVis = () => { visible = !document.hidden; sync(); };
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
  const ro = new ResizeObserver(() => { resize(); if (!raf) draw(performance.now()); });

  resize(); io.observe(canvas); ro.observe(canvas);
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  reduce.addEventListener('change', sync);
  canvas.classList.add('on');
  sync();
  return () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    reduce.removeEventListener('change', sync);
  };
}
