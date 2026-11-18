// The 3D part of /3d/: my work as a living neural network.
// This file and everything it imports (three, React Three Fiber, drei) is its own chunk:
// Stage.tsx loads it with React.lazy only when the gate says so.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
// Deep imports: the drei barrel would also pull in text, HTML and other helpers this page never uses.
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import * as THREE from 'three';
import { ArrowUpRight, Network, Sparkles, X, Zap } from 'lucide-react';
import { EDGES, LAYERS, NODES, THEMES, THEME_CENTERS, embeddingLayout, lineage, networkLayout, rng } from './graph';
import type { Theme, Vec3 } from './graph';

type View = 'network' | 'embedding';

const LAYER_COLORS = ['#9cc2ff', '#5b8def', '#e3bf7a', '#f4f1ea'].map(c => new THREE.Color(c));
const THEME_COLORS: Record<Theme, THREE.Color> = {
  ai: new THREE.Color('#a597ff'), data: new THREE.Color('#4fd1c5'), web: new THREE.Color('#5b8def'), systems: new THREE.Color('#f0a35e'),
};
const THEME_HEX: Record<Theme, string> = { ai: '#a597ff', data: '#4fd1c5', web: '#5b8def', systems: '#f0a35e' };
const LAYER_HEX = ['#9cc2ff', '#5b8def', '#e3bf7a', '#f4f1ea'];
const PARTICLES = 1600;
const SEGMENTS = 18; // per curved edge
const WAVE_MS = 650; // per layer

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp3 = (a: Vec3, b: Vec3, t: number, out: THREE.Vector3) => out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);

// ---------- shaders ----------

const edgeVert = /* glsl */ `
  attribute float aT; attribute float aLayer; attribute float aHi; attribute float aSeed; attribute vec3 aColor;
  varying float vT; varying float vLayer; varying float vHi; varying float vSeed; varying vec3 vColor;
  void main() {
    vT = aT; vLayer = aLayer; vHi = aHi; vSeed = aSeed; vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const edgeFrag = /* glsl */ `
  uniform float uTime; uniform float uFlow; uniform float uWave; uniform float uSel;
  varying float vT; varying float vLayer; varying float vHi; varying float vSeed; varying vec3 vColor;
  void main() {
    float off = uSel * (1.0 - vHi);              // edges outside the selection fade back
    float base = mix(0.3, 0.05, off) + uSel * vHi * 0.4;
    float p = fract(vT - uTime * 0.32 + vSeed);  // a short bright packet travelling along the edge
    float pulse = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.16, p)) * uFlow * mix(1.0, 0.1, off);
    float w = uWave - (vLayer + vT);             // the forward-pass wave front
    float wave = uWave > -0.5 ? exp(-w * w * 16.0) : 0.0;
    float k = base + pulse * 1.1 + wave * 1.6;
    gl_FragColor = vec4(vColor + vec3(max(k - 1.0, 0.0)), min(k, 1.0)); // alpha = brightness, so the transparent canvas stays clear
  }`;

const haloVert = /* glsl */ `
  attribute float aSize; attribute vec3 aColor; uniform float uScale;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const haloFrag = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = pow(max(1.0 - d, 0.0), 2.2) * 0.8;
    gl_FragColor = vec4(vColor, a);
  }`;

const fieldVert = /* glsl */ `
  attribute vec3 aCluster; attribute vec3 aColor; attribute float aRand;
  uniform float uMorph; uniform float uTime; uniform float uScale;
  varying vec3 vColor; varying float vA;
  void main() {
    vec3 p = mix(position, aCluster, uMorph);
    p += vec3(sin(uTime * 0.4 + aRand * 6.28), cos(uTime * 0.33 + aRand * 9.1), sin(uTime * 0.27 + aRand * 4.0)) * 0.06;
    vColor = aColor;
    vA = mix(0.35, 0.6, uMorph) * (0.5 + 0.5 * aRand);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = mix(2.0, 2.8, uMorph) * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const fieldFrag = /* glsl */ `
  varying vec3 vColor; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    gl_FragColor = vec4(vColor, vA * (1.0 - d * d));
  }`;

// ---------- labels: text drawn once into small canvas textures (no font library needed) ----------

function makeLabel(text: string, opts: { size: number; color: string; weight?: number; caps?: boolean }) {
  const px = 64;
  const font = `${opts.weight ?? 600} ${px}px Inter, ui-sans-serif, system-ui, sans-serif`;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const s = opts.caps ? text.toUpperCase() : text;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(s).width + (opts.caps ? s.length * 6 : 0)) + 24;
  c.width = w; c.height = px + 28;
  ctx.font = font;
  if (opts.caps) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '6px';
  ctx.fillStyle = opts.color;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(5,10,20,.9)';
  ctx.shadowBlur = 12;
  ctx.fillText(s, 12, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((opts.size * c.width) / c.height, opts.size, 1);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 10;
  return sprite;
}

// ---------- the scene ----------

type SceneProps = {
  view: View; sel: number | null; hover: number | null; flow: boolean; reduced: boolean; wave: number;
  onSelect: (i: number | null) => void; onHover: (i: number | null) => void; onReady: () => void;
};

function Scene({ view, sel, hover, flow, reduced, wave, onSelect, onHover, onReady }: SceneProps) {
  const gl = useThree(s => s.gl);
  const invalidate = useThree(s => s.invalidate);
  const controls = useThree(s => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const net = useMemo(networkLayout, []);
  const floor = useMemo(() => Math.min(...net.map(p => p[1])) - 0.7, [net]);
  const emb = useMemo(embeddingLayout, []);
  const morph = useRef(view === 'embedding' ? 1 : 0);
  const pos = useMemo(() => NODES.map(() => new THREE.Vector3()), []);
  const nodes = useRef<THREE.InstancedMesh>(null!);
  const hits = useRef<THREE.InstancedMesh>(null!);
  const labelGroup = useRef<THREE.Group>(null!);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), c: new THREE.Color(), v: new THREE.Vector3(), q: new THREE.Quaternion() }), []);
  const focus = sel ?? hover;
  const lit = useMemo(() => (focus === null ? null : lineage(focus)), [focus]);

  // Edges: one LineSegments for every curved edge, animated entirely in the shader.
  const edges = useMemo(() => {
    const n = EDGES.length * SEGMENTS * 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const aT = new Float32Array(n), aLayer = new Float32Array(n), aSeed = new Float32Array(n), aHi = new Float32Array(n), aColor = new Float32Array(n * 3);
    const r = rng(7);
    EDGES.forEach((e, k) => {
      const seed = r();
      const col = LAYER_COLORS[NODES[e.b].layer];
      for (let s = 0; s < SEGMENTS; s++) for (let j = 0; j < 2; j++) {
        const v = (k * SEGMENTS + s) * 2 + j;
        aT[v] = (s + j) / SEGMENTS;
        aLayer[v] = NODES[e.a].layer;
        aSeed[v] = seed;
        col.toArray(aColor, v * 3);
      }
    });
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
    g.setAttribute('aLayer', new THREE.BufferAttribute(aLayer, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    g.setAttribute('aHi', new THREE.BufferAttribute(aHi, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: edgeVert, fragmentShader: edgeFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uFlow: { value: 1 }, uWave: { value: -1 }, uSel: { value: 0 } },
    });
    return new THREE.LineSegments(g, m);
  }, []);

  // Halos: one point sprite per node, additive, for the glow (cheaper than a bloom pass).
  const halos = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NODES.length * 3), 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(NODES.length * 3), 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(NODES.length), 1));
    const m = new THREE.ShaderMaterial({ vertexShader: haloVert, fragmentShader: haloFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: 1 } } });
    return new THREE.Points(g, m);
  }, []);

  // The data field: points scattered through space that condense into theme clusters in the embedding view.
  const field = useMemo(() => {
    const r = rng(42);
    const themes = Object.keys(THEME_CENTERS) as Theme[];
    const pos = new Float32Array(PARTICLES * 3), cl = new Float32Array(PARTICLES * 3), col = new Float32Array(PARTICLES * 3), rnd = new Float32Array(PARTICLES);
    const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
    for (let i = 0; i < PARTICLES; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, rad = 3 + Math.cbrt(r()) * 6.5;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * rad * 1.3, u * rad * 0.7, Math.sin(th) * s * rad], i * 3);
      const t = themes[i % themes.length];
      const c = THEME_CENTERS[t];
      cl.set([c[0] + gauss() * 0.55, c[1] + gauss() * 0.42, c[2] + gauss() * 0.5], i * 3);
      THEME_COLORS[t].toArray(col, i * 3);
      rnd[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aCluster', new THREE.BufferAttribute(cl, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: fieldVert, fragmentShader: fieldFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uMorph: { value: 0 }, uTime: { value: 0 }, uScale: { value: 1 } },
    });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false; // the shader moves points, so the CPU bounding sphere would be wrong
    return p;
  }, []);

  // Labels, drawn after the web font is ready so they match the page.
  const [labels, setLabels] = useState<{ nodes: THREE.Sprite[]; layers: THREE.Sprite[]; themes: THREE.Sprite[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const ready = fonts ? Promise.race([fonts.load('600 64px Inter').then(() => undefined), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
    ready.catch(() => undefined).then(() => {
      if (!alive) return;
      setLabels({
        nodes: NODES.map(n => makeLabel(n.label, { size: n.layer === 3 ? 0.26 : 0.2, color: n.layer === 3 ? '#ffffff' : '#dbe5f7', weight: n.layer === 3 ? 600 : 500 })),
        layers: LAYERS.map((l, i) => makeLabel(l, { size: 0.17, color: LAYER_HEX[i], caps: true })),
        themes: (Object.keys(THEMES) as Theme[]).map(t => makeLabel(THEMES[t], { size: 0.3, color: THEME_HEX[t], caps: true })),
      });
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => {
    labels && [...labels.nodes, ...labels.layers, ...labels.themes].forEach(s => { s.material.map?.dispose(); s.material.dispose(); });
  }, [labels]);
  useEffect(() => { if (labels) { onReady(); invalidate(); } }, [labels, onReady, invalidate]);

  // Which edges belong to the focused node's lineage.
  useEffect(() => {
    const hi = edges.geometry.getAttribute('aHi') as THREE.BufferAttribute;
    EDGES.forEach((e, k) => {
      const on = lit && lit.has(e.a) && lit.has(e.b) ? 1 : 0;
      for (let v = 0; v < SEGMENTS * 2; v++) hi.setX(k * SEGMENTS * 2 + v, on);
    });
    hi.needsUpdate = true;
    (edges.material as THREE.ShaderMaterial).uniforms.uSel.value = lit ? 1 : 0;
    invalidate();
  }, [lit, edges, invalidate]);

  useEffect(() => { (edges.material as THREE.ShaderMaterial).uniforms.uFlow.value = flow ? 1 : 0; invalidate(); }, [flow, edges, invalidate]);
  useEffect(() => () => { [edges, halos, field].forEach(o => { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }); }, [edges, halos, field]);

  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  // Narrow screens see less sideways, so the camera starts further back there.
  const camera = useThree(s => s.camera);
  const aspect = useThree(s => s.size.width / Math.max(1, s.size.height));
  useEffect(() => { camera.position.setLength(aspect < 0.9 ? 15 : aspect < 1.15 ? 12.5 : 10.5); invalidate(); }, [aspect, camera, invalidate]);
  const last = useRef({ morph: -1, focus: -2 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    let busy = false;

    // Morph between the two layouts.
    const goal = view === 'embedding' ? 1 : 0;
    if (morph.current !== goal) {
      morph.current = reduced ? goal : THREE.MathUtils.damp(morph.current, goal, 3.2, Math.min(dt, 0.05));
      if (Math.abs(morph.current - goal) < 0.002) morph.current = goal;
      busy = true;
    }
    const mt = ease(morph.current);
    NODES.forEach((_, i) => lerp3(net[i], emb[i], mt, pos[i]));

    // The forward-pass wave: -1 when idle, then 0 → 4 across the layers.
    const w = wave > 0 ? (performance.now() - wave) / WAVE_MS - 0.3 : -1;
    const waveOn = w > -0.5 && w < 4.5;
    if (waveOn) busy = true;
    const em = edges.material as THREE.ShaderMaterial;
    em.uniforms.uWave.value = waveOn ? w : -1;
    em.uniforms.uTime.value = t;
    const fm = field.material as THREE.ShaderMaterial;
    fm.uniforms.uTime.value = reduced ? 0 : t;
    fm.uniforms.uMorph.value = mt;
    // Point sizes are in CSS pixels at the camera's usual distance (about 10 units).
    const scale = gl.getPixelRatio() * 10;
    fm.uniforms.uScale.value = scale;
    (halos.material as THREE.ShaderMaterial).uniforms.uScale.value = scale;

    // Nodes, hit targets, halos and labels follow the layout.
    const hp = halos.geometry.getAttribute('position') as THREE.BufferAttribute;
    const hc = halos.geometry.getAttribute('aColor') as THREE.BufferAttribute;
    const hs = halos.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    NODES.forEach((n, i) => {
      const inLit = !lit || lit.has(i);
      const flash = waveOn ? Math.exp(-((w - n.layer) ** 2) * 10) : 0;
      const breathe = reduced ? 0 : Math.sin(t * 1.6 + i) * 0.04;
      const base = n.layer === 3 ? 0.17 : 0.12;
      const s = base * (inLit ? 1 : 0.7) * (i === focus ? 1.35 : 1) * (1 + flash * 0.6 + breathe);
      tmp.m.compose(pos[i], tmp.q, tmp.v.setScalar(s));
      nodes.current.setMatrixAt(i, tmp.m);
      tmp.m.compose(pos[i], tmp.q, tmp.v.setScalar(0.32));
      hits.current.setMatrixAt(i, tmp.m);
      tmp.c.copy(LAYER_COLORS[n.layer]).lerp(THEME_COLORS[n.theme], mt).multiplyScalar(inLit ? 1 + flash : 0.3);
      nodes.current.setColorAt(i, tmp.c);
      hp.setXYZ(i, pos[i].x, pos[i].y, pos[i].z);
      hc.setXYZ(i, tmp.c.r, tmp.c.g, tmp.c.b);
      hs.setX(i, (n.layer === 3 ? 44 : 32) * (inLit ? 1 : 0.5) * (i === focus ? 1.5 : 1) * (1 + flash * 1.2));
      if (labels) {
        const l = labels.nodes[i];
        l.position.set(pos[i].x, pos[i].y + s + 0.06, pos[i].z);
        l.material.opacity = !inLit ? 0.12 : (n.layer === 3 || i === focus || lit) ? 1 : (n.layer === 1 ? 1 - mt * 0.35 : 0.8 - mt * 0.45);
      }
    });
    nodes.current.instanceMatrix.needsUpdate = true;
    if (nodes.current.instanceColor) nodes.current.instanceColor.needsUpdate = true;
    hits.current.instanceMatrix.needsUpdate = true;
    hits.current.computeBoundingSphere();
    hp.needsUpdate = hc.needsUpdate = hs.needsUpdate = true;
    if (labels) {
      labels.layers.forEach((l, i) => { l.position.set((i - 1.5) * 2.5, floor, 0.4); l.material.opacity = 1 - mt; l.visible = mt < 0.98; });
      (Object.keys(THEMES) as Theme[]).forEach((th, i) => {
        const c = THEME_CENTERS[th];
        const l = labels.themes[i];
        l.position.set(c[0], c[1] + 0.95, c[2]);
        l.material.opacity = mt; l.visible = mt > 0.02;
      });
    }

    // Curved edges between the current node positions (only rebuilt while something moves).
    const key = { morph: morph.current, focus: focus ?? -1 };
    if (busy || last.current.morph !== key.morph || !edges.userData.built) {
      const p = edges.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c1 = new THREE.Vector3(), c2 = new THREE.Vector3(), q = new THREE.Vector3();
      const curve = new THREE.CubicBezierCurve3(a, c1, c2, b);
      EDGES.forEach((e, k) => {
        a.copy(pos[e.a]); b.copy(pos[e.b]);
        const dx = (b.x - a.x) * 0.5, lift = 0.35 * mt;
        c1.set(a.x + dx, a.y + lift, a.z + lift); c2.set(b.x - dx, b.y + lift, b.z - lift);
        for (let s = 0; s < SEGMENTS; s++) for (let j = 0; j < 2; j++) {
          curve.getPoint((s + j) / SEGMENTS, q);
          p.setXYZ((k * SEGMENTS + s) * 2 + j, q.x, q.y, q.z);
        }
      });
      p.needsUpdate = true;
      edges.geometry.computeBoundingSphere();
      edges.userData.built = true;
    }
    last.current = key;

    // Ease the camera's aim toward the focused node (only a little on narrow screens, so the whole network stays in view).
    if (controls) {
      const goalT = focus !== null && sel !== null ? tmp.v.copy(pos[focus]).multiplyScalar(aspect < 1.15 ? 0 : 0.55) : target.set(0, 0, 0);
      if (controls.target.distanceTo(goalT) > 0.003) {
        if (reduced) controls.target.copy(goalT); else controls.target.lerp(goalT, Math.min(1, dt * 3));
        controls.update();
        busy = true;
      }
    }
    if (busy) invalidate();
  });

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); if (e.instanceId !== undefined) { onHover(e.instanceId); document.body.style.cursor = 'pointer'; } };
  const out = () => { onHover(null); document.body.style.cursor = ''; };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || e.instanceId === undefined) return; // a drag, not a tap
    onSelect(e.instanceId === sel ? null : e.instanceId);
  };
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  return (
    <>
      <primitive object={field} />
      <primitive object={edges} />
      <primitive object={halos} />
      <instancedMesh ref={nodes} args={[undefined, undefined, NODES.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={hits} args={[undefined, undefined, NODES.length]} visible={false} onPointerOver={over} onPointerOut={out} onClick={click}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>
      {labels && <group ref={labelGroup}>{[...labels.nodes, ...labels.layers, ...labels.themes].map(s => <primitive key={s.uuid} object={s} />)}</group>}
    </>
  );
}

// ---------- frame-rate probe ----------

function FpsProbe({ onSample }: { onSample: (n: number) => void }) {
  const frames = useRef(0);
  useFrame(() => { frames.current++; });
  useEffect(() => {
    const t = setInterval(() => { onSample(frames.current); frames.current = 0; }, 1000);
    return () => clearInterval(t);
  }, [onSample]);
  return null;
}

function Kick({ deps }: { deps: unknown[] }) {
  const invalidate = useThree(s => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { invalidate(); }, deps);
  return null;
}

// ---------- the viewer: canvas + controls ----------

export default function Viewer({ reducedMotion, onReady, cover }: { reducedMotion: boolean; onReady: () => void; cover?: ReactNode }) {
  const [view, setView] = useState<View>('network');
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [flow, setFlow] = useState(!reducedMotion);
  const [spin, setSpin] = useState(reducedMotion ? 0 : 0.5);
  const [wave, setWave] = useState(0);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  const [inView, setInView] = useState(true);
  const [showFps, setShowFps] = useState(() => new URLSearchParams(location.search).has('fps'));
  const [fps, setFps] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  // Stop rendering entirely while the viewer is scrolled out of sight.
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const focus = sel ?? hover;
  const node = focus !== null ? NODES[focus] : null;
  const parents = node ? (node.from ?? []).map(id => NODES.find(n => n.id === id)!.label) : [];
  const children = node ? NODES.filter(n => n.from?.includes(node.id)).map(n => n.label) : [];
  const animating = flow || spin > 0;
  const onHover = useCallback((i: number | null) => setHover(i), []);
  const counts = LAYERS.map((_, l) => NODES.filter(n => n.layer === l).length);
  const label = `3D network of my work: ${counts[0]} kinds of data flow through ${counts[1]} skills and ${counts[2]} AI and data capabilities into ${counts[3]} projects.`
    + (view === 'embedding' ? ' Shown as an embedding: nodes grouped by theme.' : '')
    + (node ? ` Selected: ${node.label}.` : '') + ' The same network is listed as a table further down the page.';

  return (
    <div className="viewer">
      <div className="stage-col">
      <div ref={stage} className="stage stage--net">
        <Canvas
          role="img"
          aria-label={label}
          frameloop={!inView ? 'never' : animating ? 'always' : 'demand'}
          dpr={dpr}
          camera={{ position: [0.6, 1.0, 10.5], fov: 42, near: 0.1, far: 60 }}
          gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
          onPointerMissed={() => setSel(null)}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} />
          <Kick deps={[view, sel, flow, spin, wave]} />
          {showFps && <FpsProbe onSample={setFps} />}
          <Scene view={view} sel={sel} hover={hover} flow={flow} reduced={reducedMotion} wave={wave}
            onSelect={setSel} onHover={onHover} onReady={onReady} />
          <OrbitControls makeDefault enablePan={false} enableDamping={!reducedMotion} minDistance={4.5} maxDistance={15}
            autoRotate={spin > 0 && sel === null} autoRotateSpeed={spin} />
        </Canvas>
        {cover}
        {showFps && <div className="fps" aria-live="off">{fps === null ? '…' : `${fps} fps`}{fps === 0 ? ' (idle, not rendering)' : ''}</div>}
        <div className="legend" aria-hidden="true">
          {view === 'network'
            ? LAYERS.map((l, i) => <span key={l}><i style={{ background: LAYER_HEX[i] }} />{l}</span>)
            : (Object.keys(THEMES) as Theme[]).map(t => <span key={t}><i style={{ background: THEME_HEX[t] }} />{THEMES[t]}</span>)}
        </div>
      </div>
        {node ? (
          <div className="node-card" role="status">
            <p className="node-kind">{LAYERS[node.layer]} · {THEMES[node.theme]}</p>
            <h3>{node.label}</h3>
            <p>{node.desc}</p>
            {parents.length > 0 && <p className="node-rel"><span>Built from</span> {parents.join(' · ')}</p>}
            {children.length > 0 && <p className="node-rel"><span>Feeds</span> {children.join(' · ')}</p>}
            <div className="node-actions">
              {node.href && <a className="btn-small" href={node.href}>Open the project <ArrowUpRight size={15} /></a>}
              {sel !== null && <button type="button" className="icon-btn" onClick={() => setSel(null)} aria-label="Clear the selection"><X size={16} /></button>}
            </div>
          </div>
        ) : (
          <p className="stage-hint">Tap a node to light up what it’s built from and what it feeds.</p>
        )}
      </div>

      <form className="panel" onSubmit={e => e.preventDefault()} aria-label="Explore the network">
        <fieldset>
          <legend>View</legend>
          <Seg name="view" value={view} options={[['network', 'Network'], ['embedding', 'Embedding']]} onChange={v => setView(v as View)} />
        </fieldset>
        <button type="button" className="btn-small" onClick={() => setWave(performance.now())}><Zap size={15} /> Run a forward pass</button>
        <fieldset>
          <legend>Projects</legend>
          <div className="chips">
            {NODES.map((n, i) => n.layer === 3 && (
              <button key={n.id} type="button" className="chip" aria-pressed={sel === i} onClick={() => setSel(sel === i ? null : i)}>{n.label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Skills</legend>
          <div className="chips">
            {NODES.map((n, i) => n.layer === 1 && (
              <button key={n.id} type="button" className="chip" aria-pressed={sel === i} onClick={() => setSel(sel === i ? null : i)}>{n.label}</button>
            ))}
          </div>
        </fieldset>
        <div className="checks">
          <label><input type="checkbox" checked={flow} onChange={e => setFlow(e.target.checked)} /> Data flow</label>
          <label><input type="checkbox" checked={showFps} onChange={e => { setShowFps(e.target.checked); setFps(null); }} /> Show frame rate</label>
        </div>
        <Range label="Auto-rotate" min={0} max={2} step={0.1} value={spin} onChange={setSpin} format={v => (v === 0 ? 'Off' : v.toFixed(1) + '×')} />
        <p className="hint">{view === 'network'
          ? <><Network size={13} /> Left to right: data in, skills, capabilities, projects. Each moving light is a “built with” link.</>
          : <><Sparkles size={13} /> The same nodes regrouped by theme, the way an embedding puts similar things close together.</>}</p>
      </form>
    </div>
  );
}

function Seg({ name, value, options, onChange }: { name: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <label key={v}><input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} /><span>{l}</span></label>
      ))}
    </div>
  );
}

function Range({ label, value, onChange, format, ...rest }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const id = `range-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="field">
      <span><label htmlFor={id}>{label}</label><output htmlFor={id} aria-hidden="true">{format(value)}</output></span>
      <input id={id} type="range" value={value} aria-valuetext={format(value)} onChange={e => onChange(Number(e.target.value))} {...rest} />
    </div>
  );
}
