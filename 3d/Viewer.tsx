// The 3D part of /3d/. This file and everything it imports (three, React Three Fiber, drei)
// is its own chunk: App.tsx loads it with React.lazy only when the gate says so.
import { Suspense, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// Deep imports: the drei barrel would also pull in text, HTML and other helpers this page never uses.
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import { useGLTF } from '@react-three/drei/core/Gltf';
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib';
import * as THREE from 'three';
import { RotateCcw, RotateCw, Upload, Undo2 } from 'lucide-react';

export const MUG_URL = '/3d/studio-mug.glb';
const MAX_FILE = 30 * 1024 * 1024;

const GLAZES = [
  { name: 'Harbour blue', hex: '#2457a6' },
  { name: 'Celadon', hex: '#8fb9a8' },
  { name: 'Terracotta', hex: '#c0603e' },
  { name: 'Charcoal', hex: '#2a2c31' },
  { name: 'Oat', hex: '#e7dcc8' },
];
const FINISHES = { gloss: 0.12, satin: 0.42, matte: 0.85 } as const;
type Finish = keyof typeof FINISHES;
type Light = 'studio' | 'sunset' | 'night';
type Handle = 'loop' | 'strap';

type Custom = { name: string; bytes: number; scene: THREE.Group };

// ---------- scene pieces ----------

/** Scales any object to fit a 1.4-unit box, centres it on x/z and stands it on the floor (y = 0). */
function Fit({ object, turn }: { object: THREE.Object3D; turn: number }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => {
    const g = inner.current;
    g.position.set(0, 0, 0);
    g.scale.setScalar(1);
    g.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(object); // includes hidden parts, so toggling a part never rescales
    const size = box.getSize(new THREE.Vector3());
    const s = 1.4 / Math.max(size.x, size.y, size.z, 1e-6);
    const c = box.getCenter(new THREE.Vector3());
    g.scale.setScalar(s);
    g.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    invalidate();
  }, [object, invalidate]);
  useEffect(() => { outer.current.rotation.y = turn; invalidate(); }, [turn, invalidate]);
  return <group ref={outer}><group ref={inner}><primitive object={object} /></group></group>;
}

type MugLook = { glaze: string; finish: Finish; lustre: number; interior: 'cream' | 'match'; handle: Handle; saucer: boolean; wireframe: boolean };

function Mug({ look, turn, onReady }: { look: MugLook; turn: number; onReady: () => void }) {
  const { scene } = useGLTF(MUG_URL, false, true);
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => {
    scene.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.name === 'Handle_Loop') m.visible = look.handle === 'loop';
      if (m.name === 'Handle_Strap') m.visible = look.handle === 'strap';
      if (m.name === 'Saucer') m.visible = look.saucer;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.wireframe = look.wireframe;
      if (mat.name === 'Glaze') {
        mat.color.set(look.glaze);
        mat.roughness = FINISHES[look.finish];
        mat.metalness = look.lustre;
      }
      if (mat.name === 'Interior') {
        mat.color.set(look.interior === 'match' ? look.glaze : '#f4efe6');
        mat.roughness = FINISHES[look.finish];
      }
    });
    invalidate();
  }, [scene, look, invalidate]);
  useEffect(onReady, [onReady]);
  return <Fit object={scene} turn={turn} />;
}

type Panel = { color: string; power: number; pos: [number, number, number]; size: [number, number]; round?: boolean };

// Each lighting preset is a few glowing panels around the model, baked once into an environment map.
// Hand-rolled instead of drei's <Environment>, which would add HDR/EXR loaders (~45 KB) this page never uses.
const LIGHTS: Record<Light, { fill: string; panels: Panel[] }> = {
  studio: { fill: '#565c66', panels: [
    { color: '#ffffff', power: 1.6, pos: [-3, 2.5, 4], size: [4, 3] },
    { color: '#ffffff', power: 2.2, pos: [0, 5, -1], size: [8, 4] },
    { color: '#ffffff', power: 1.4, pos: [-5, 1.5, 1], size: [3, 6] },
    { color: '#ffffff', power: 1.1, pos: [5, 1.5, 1], size: [3, 6] },
    { color: '#ffffff', power: 0.6, pos: [0, 1, 6], size: [3, 3], round: true },
  ] },
  sunset: { fill: '#2a1d22', panels: [
    { color: '#ffb26b', power: 3, pos: [-5, 1, 2], size: [6, 3] },
    { color: '#a46bff', power: 0.9, pos: [5, 2, -2], size: [4, 4] },
    { color: '#ffe2c4', power: 0.8, pos: [0, 5, 0], size: [6, 6] },
  ] },
  night: { fill: '#05080f', panels: [
    { color: '#7fa8ff', power: 2.4, pos: [4, 2, -4], size: [2, 6] },
    { color: '#c9d6ff', power: 0.35, pos: [0, 5, 0], size: [6, 6] },
    { color: '#ffd9a0', power: 1.2, pos: [-3, 1.2, 3], size: [0.8, 0.8], round: true },
  ] },
};

function Lights({ preset }: { preset: Light }) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    const { fill, panels } = LIGHTS[preset];
    const room = new THREE.Scene();
    room.background = new THREE.Color(fill);
    for (const p of panels) {
      const geo = p.round ? new THREE.CircleGeometry(0.5, 32) : new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.power), side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...p.pos);
      mesh.scale.set(p.size[0], p.size[1], 1);
      mesh.lookAt(0, 0.5, 0); // every panel faces the model
      room.add(mesh);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      room.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
    };
  }, [preset, gl, scene, invalidate]);
  return null;
}

// ---------- loading a dropped file ----------

let loader: GLTFLoader | null = null;
function gltfLoader() {
  if (!loader) {
    loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/'); // fetched only if a file uses Draco
    loader.setDRACOLoader(draco);
    const meshopt = MeshoptDecoder as unknown as (() => unknown) | object;
    loader.setMeshoptDecoder((typeof meshopt === 'function' ? meshopt() : meshopt) as never);
  }
  return loader;
}

async function readGlb(file: File): Promise<THREE.Group> {
  if (!/\.glb$/i.test(file.name)) throw new Error('That isn’t a .glb file. Export your model as binary glTF (.glb) and drop it again.');
  if (file.size > MAX_FILE) throw new Error(`That file is ${(file.size / 1048576).toFixed(0)} MB. Keep it under 30 MB so your phone doesn’t have to hold it all in memory.`);
  const buf = await file.arrayBuffer();
  const unreadable = new Error('I couldn’t read that model. It may be damaged, or need files that weren’t packed into the .glb.');
  // Every .glb starts with the bytes "glTF".
  if (buf.byteLength < 12 || new TextDecoder().decode(new Uint8Array(buf, 0, 4)) !== 'glTF') throw unreadable;
  const parsed = new Promise<THREE.Group>((resolve, reject) => {
    try {
      gltfLoader().parse(buf, '', g => resolve(g.scene), () => reject(unreadable));
    } catch {
      reject(unreadable);
    }
  });
  // A Draco file needs a decoder from Google's CDN; if that can't be reached, don't spin forever.
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(
    'That model took too long to open. If it uses Draco compression, the decoder could not be downloaded; check your connection and try again.')), 20000));
  return Promise.race([parsed, timeout]);
}

function dispose(root: THREE.Object3D) {
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const mat of ([] as THREE.Material[]).concat(m.material)) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}

function materialsOf(root: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const seen = new Set<THREE.Material>();
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (m.isMesh) for (const mat of ([] as THREE.Material[]).concat(m.material)) seen.add(mat);
  });
  return [...seen].filter((m): m is THREE.MeshStandardMaterial => 'color' in m);
}

// ---------- the viewer ----------

export default function Viewer({ reducedMotion, onReady, cover }: { reducedMotion: boolean; onReady: () => void; cover?: ReactNode }) {
  const [look, setLook] = useState<MugLook>({ glaze: GLAZES[0].hex, finish: 'gloss', lustre: 0, interior: 'cream', handle: 'loop', saucer: true, wireframe: false });
  const [light, setLight] = useState<Light>('studio');
  const [spin, setSpin] = useState(reducedMotion ? 0 : 1.2);
  const [turn, setTurn] = useState(0);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.75));
  const [inView, setInView] = useState(true);
  const [custom, setCustom] = useState<Custom | null>(null);
  const [pick, setPick] = useState(0);
  const [version, bump] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showFps, setShowFps] = useState(() => new URLSearchParams(location.search).has('fps'));
  const [fps, setFps] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  // Stop rendering entirely while the viewer is scrolled out of sight.
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => { if (custom) dispose(custom.scene); }, [custom]);

  const set = <K extends keyof MugLook>(k: K, v: MugLook[K]) => setLook(l => ({ ...l, [k]: v }));

  const load = useCallback(async (f: File | undefined) => {
    if (!f) return;
    setError(''); setBusy(true);
    try {
      const scene = await readGlb(f);
      setCustom({ name: f.name, bytes: f.size, scene });
      setPick(0); setTurn(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const mats = useMemo(() => (custom ? materialsOf(custom.scene) : []), [custom]);
  const mat = mats[pick];
  const editMat = (fn: (m: THREE.MeshStandardMaterial) => void) => { if (mat) { fn(mat); mat.needsUpdate = true; bump(n => n + 1); } };
  const [customWire, setCustomWire] = useState(false);
  useEffect(() => {
    if (!custom) return;
    for (const m of materialsOf(custom.scene)) { (m as THREE.MeshStandardMaterial).wireframe = customWire; }
    bump(n => n + 1);
  }, [custom, customWire]);

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); load(e.dataTransfer.files[0]); };
  const glazeName = GLAZES.find(g => g.hex === look.glaze)?.name ?? 'custom';
  const label = custom
    ? `3D view of ${custom.name}. Drag to turn it, pinch or scroll to zoom.`
    : `3D view of a ceramic mug in ${glazeName} glaze, ${look.finish} finish, ${look.handle} handle${look.saucer ? ', on a saucer' : ''}. Drag to turn it, pinch or scroll to zoom.`;
  const shadowKey = custom ? custom.name + custom.bytes : `${look.handle}-${look.saucer}`;

  return (
    <div className="viewer">
      <div
        ref={stage}
        className={'stage stage--' + light + (dragging ? ' is-drop' : '')}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Canvas
          role="img"
          aria-label={label}
          frameloop={inView ? 'demand' : 'never'}
          dpr={dpr}
          camera={{ position: [1.9, 1.35, 2.5], fov: 35, near: 0.1, far: 50 }}
          gl={{ antialias: true, powerPreference: 'low-power' }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} />
          <Kick deps={[version, light, spin]} />
          {showFps && <FpsProbe onSample={setFps} />}
          <ambientLight intensity={0.15} />
          <Lights preset={light} />
          <Suspense fallback={null}>
            {custom ? <Fit object={custom.scene} turn={turn} /> : <Mug look={look} turn={turn} onReady={onReady} />}
            <ContactShadows key={shadowKey + light} position={[0, 0.001, 0]} scale={4} blur={2.4} far={1.4} resolution={512} frames={1}
              opacity={light === 'night' ? 0.7 : 0.45} color={light === 'sunset' ? '#5a2e1a' : '#0b1424'} />
          </Suspense>
          <OrbitControls makeDefault target={[0, 0.5, 0]} enablePan={false} enableDamping={!reducedMotion}
            minDistance={1.6} maxDistance={6} maxPolarAngle={Math.PI / 2.05} autoRotate={spin > 0} autoRotateSpeed={spin} />
        </Canvas>
        {cover}
        {showFps && <div className="fps" aria-live="off">{fps === null ? '…' : `${fps} fps`}{fps === 0 ? ' (idle, not rendering)' : ''}</div>}
        <button type="button" className="btn-small stage-upload" onClick={() => file.current?.click()}><Upload size={15} /> {custom ? 'Load another .glb' : 'Load your own .glb'}</button>
        <div className="stage-tools">
          <button type="button" className="icon-btn" onClick={() => setTurn(t => t - Math.PI / 6)} aria-label="Turn left"><RotateCcw size={16} /></button>
          <button type="button" className="icon-btn" onClick={() => setTurn(t => t + Math.PI / 6)} aria-label="Turn right"><RotateCw size={16} /></button>
        </div>
        {dragging && <div className="drop-hint" aria-hidden="true">Drop your .glb to load it here</div>}
        {busy && <div className="drop-hint" role="status">Loading your model…</div>}
      </div>

      <form className="panel" onSubmit={e => e.preventDefault()} aria-label="Configure the model">
        {!custom ? (
          <>
            <fieldset>
              <legend>Glaze</legend>
              <div className="swatches">
                {GLAZES.map(g => (
                  <label key={g.hex} className="swatch" title={g.name}>
                    <input type="radio" name="glaze" value={g.hex} checked={look.glaze === g.hex} onChange={() => set('glaze', g.hex)} />
                    <span style={{ background: g.hex }} /><span className="sr-only">{g.name}</span>
                  </label>
                ))}
                <label className="swatch swatch--custom" title="Any colour">
                  <input type="color" value={look.glaze} onChange={e => set('glaze', e.target.value)} aria-label="Pick any glaze colour" />
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Finish</legend>
              <Seg name="finish" value={look.finish} options={[['gloss', 'Gloss'], ['satin', 'Satin'], ['matte', 'Matte']]} onChange={v => set('finish', v as Finish)} />
            </fieldset>
            <Range label="Metallic lustre" min={0} max={1} step={0.05} value={look.lustre} onChange={v => set('lustre', v)} format={v => Math.round(v * 100) + '%'} />
            <fieldset>
              <legend>Handle</legend>
              <Seg name="handle" value={look.handle} options={[['loop', 'Loop'], ['strap', 'Strap']]} onChange={v => set('handle', v as Handle)} />
            </fieldset>
            <fieldset>
              <legend>Inside</legend>
              <Seg name="interior" value={look.interior} options={[['cream', 'Cream'], ['match', 'Same glaze']]} onChange={v => set('interior', v as MugLook['interior'])} />
            </fieldset>
            <div className="checks">
              <label><input type="checkbox" checked={look.saucer} onChange={e => set('saucer', e.target.checked)} /> Saucer</label>
              <label><input type="checkbox" checked={look.wireframe} onChange={e => set('wireframe', e.target.checked)} /> Wireframe</label>
            </div>
          </>
        ) : (
          <>
            <p className="panel-file"><strong>{custom.name}</strong> · {(custom.bytes / 1024).toFixed(0)} KB · {mats.length} material{mats.length === 1 ? '' : 's'}</p>
            {mat ? (
              <>
                <label className="field">
                  <span>Material</span>
                  <select value={pick} onChange={e => setPick(Number(e.target.value))}>
                    {mats.map((m, i) => <option key={m.uuid} value={i}>{m.name || `Material ${i + 1}`}</option>)}
                  </select>
                </label>
                <label className="field field--row">
                  <span>Colour</span>
                  <input type="color" value={'#' + mat.color.getHexString()} onChange={(e: ChangeEvent<HTMLInputElement>) => editMat(m => m.color.set(e.target.value))} />
                </label>
                {'metalness' in mat && <Range label="Metalness" min={0} max={1} step={0.05} value={mat.metalness} onChange={v => editMat(m => { m.metalness = v; })} format={v => v.toFixed(2)} />}
                {'roughness' in mat && <Range label="Roughness" min={0} max={1} step={0.05} value={mat.roughness} onChange={v => editMat(m => { m.roughness = v; })} format={v => v.toFixed(2)} />}
              </>
            ) : <p className="panel-file">This model has no materials I can edit.</p>}
            <div className="checks"><label><input type="checkbox" checked={customWire} onChange={e => setCustomWire(e.target.checked)} /> Wireframe</label></div>
          </>
        )}

        <fieldset>
          <legend>Lighting</legend>
          <Seg name="light" value={light} options={[['studio', 'Studio'], ['sunset', 'Sunset'], ['night', 'Night']]} onChange={v => setLight(v as Light)} />
        </fieldset>
        <Range label="Auto-rotate" min={0} max={4} step={0.2} value={spin} onChange={setSpin} format={v => (v === 0 ? 'Off' : v.toFixed(1) + '×')} />
        <div className="checks"><label><input type="checkbox" checked={showFps} onChange={e => { setShowFps(e.target.checked); setFps(null); }} /> Show frame rate</label></div>

        <div className="panel-file-actions">
          <input ref={file} type="file" accept=".glb,model/gltf-binary" hidden onChange={e => { load(e.target.files?.[0]); e.target.value = ''; }} />
          {custom && <button type="button" className="btn-small btn-small--ghost" onClick={() => { setCustom(null); setError(''); }}><Undo2 size={15} /> Back to the mug</button>}
          <p className="hint">Load a .glb with the button on the stage, or drag one onto it. It stays on your device; nothing is uploaded.</p>
          {error && <p className="panel-error" role="alert">{error}</p>}
        </div>
      </form>
    </div>
  );
}

/** Counts frames actually rendered each second. Idle shows 0 because the canvas renders on demand. */
function FpsProbe({ onSample }: { onSample: (n: number) => void }) {
  const frames = useRef(0);
  useFrame(() => { frames.current++; });
  useEffect(() => {
    const t = setInterval(() => { onSample(frames.current); frames.current = 0; }, 1000);
    return () => clearInterval(t);
  }, [onSample]);
  return null;
}

/** Asks for one new frame when something outside the scene graph changed (the canvas renders on demand). */
function Kick({ deps }: { deps: unknown[] }) {
  const invalidate = useThree(s => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { invalidate(); }, deps);
  return null;
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
  const id = useId();
  return (
    <div className="field">
      <span><label htmlFor={id}>{label}</label><output htmlFor={id} aria-hidden="true">{format(value)}</output></span>
      <input id={id} type="range" value={value} aria-valuetext={format(value)} onChange={e => onChange(Number(e.target.value))} {...rest} />
    </div>
  );
}

useGLTF.preload(MUG_URL, false, true);
