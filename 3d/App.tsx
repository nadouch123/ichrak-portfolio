import { ArrowLeft, ArrowUpRight, Box, Check, Gauge, ListChecks, Rocket, Layers } from 'lucide-react';
import Stage from './Stage';
import { PERF } from './perf';

const REPO = 'https://github.com/nadouch123/ichrak-portfolio';
const README = REPO + '/blob/main/3d/README.md';

const sections = [
  { id: 'viewer', label: 'Try it' },
  { id: 'brief', label: 'What was asked' },
  { id: 'loading', label: 'How it loads' },
  { id: 'perf', label: 'Load and frame rate' },
  { id: 'next', label: 'With more time' },
];

const brief: [string, string][] = [
  ['A real 3D scene', 'React Three Fiber and drei on three.js. The mug is a real glTF model I built from code (lathe profiles and tube handles), lit with environment lighting and a soft contact shadow.'],
  ['Interaction beyond orbiting', 'Change the glaze colour, finish and metallic lustre, swap the handle, take the saucer away, colour the inside, switch the lighting, toggle wireframe. Or drop your own .glb and edit its materials.'],
  ['Model kept small', `The mug is ${PERF.modelKb} KB with meshopt compression (${PERF.modelRawKb} KB before), ${PERF.modelGzKb} KB over the wire. No textures: colour comes from materials.`],
  ['Canvas lazy-loaded', 'The 3D code is its own chunk. On a laptop it downloads when the viewer is about to scroll into view and the browser is idle. On a phone it waits for a tap. Never on the home page.'],
  ['Static fallback', 'Reduced motion, Data Saver, a low-power device, a phone, or no WebGL: you get a still picture of the mug first, and a button to load 3D (except without WebGL). If WebGL crashes, the picture comes back.'],
  ['Usable on mobile', 'One finger turns, two fingers zoom. Pixel ratio capped at 1.75 and dropped to 1 if frames slow down. Nothing renders while you aren’t touching it or while it is off screen.'],
];

const steps: [string, string][] = [
  ['The page loads without any 3D', 'The page, the configurator panel and a still picture of the mug come first. The picture is the same size as the canvas, so nothing jumps when 3D arrives.'],
  ['The gate decides', 'Before any 3D code is fetched, a tiny check (gate.ts, no three.js inside) reads prefers-reduced-motion, Data Saver, device memory, CPU cores, touch-only input and WebGL support.'],
  ['The viewer loads when it is about to be seen', 'On a laptop, an IntersectionObserver waits until the stage is within 300 px of the screen and the browser is idle, then React.lazy fetches the 3D chunk and the 43 KB mug. On a phone, the tap does that.'],
  ['It renders only when something changes', 'The canvas renders on demand: a frame when you drag, change a setting or while auto-rotate is on. Scrolled away, it stops completely. Lighting and the shadow are baked once, not every frame.'],
];

const next: [string, string][] = [
  ['Put it on my capstone', 'A small 3D “weekly review” object for the Weekly Review Coach: one block per day, height by hours, colour by mood.'],
  ['Real ceramic textures', 'A speckled clay normal map and glaze pooling, compressed as KTX2, loaded only after the first frame.'],
  ['Share a configuration', 'Put the chosen glaze, finish and handle in the URL so a link opens the same mug.'],
  ['An AR button', 'On phones, “View on your table” with model-viewer and a USDZ export for iOS.'],
];

export default function App() {
  return (
    <div className="site spec build three-d">
      <a className="skip" href="#viewer">Skip to the 3D viewer</a>
      <header className="nav scrolled">
        <div className="nav-inner">
          <a className="brand" href="/" aria-label="Ichrak Matrouh, portfolio home">
            <img src="/logo-mark.jpg" alt="" width="40" height="40" />
            <span>Ichrak Matrouh</span>
          </a>
          <a className="back-link" href="/#work"><ArrowLeft size={16} /> Back to portfolio</a>
        </div>
      </header>

      <main>
        <section className="hero spec-hero three-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="wrap">
            <p className="eyebrow light"><span className="dot" /> FlyRank · FE-AA2 · First 3D on the web</p>
            <h1>A mug you can <em>glaze yourself.</em></h1>
            <p className="hero-lead">A small product configurator in React Three Fiber: turn the mug, change the glaze and finish, swap the handle. Then drop in any .glb of your own. It loads only when you reach it, and phones that ask for less get a still picture.</p>
            <dl className="meta-row">
              <div><dt>Mug model</dt><dd>{PERF.modelKb} KB</dd></div>
              <div><dt>3D code, gzipped</dt><dd>{PERF.chunkGzKb} KB</dd></div>
              <div><dt>3D code on the home page</dt><dd>0 KB</dd></div>
              <div><dt>Frames when idle</dt><dd>0 / s</dd></div>
            </dl>
          </div>
        </section>

        <section id="viewer" className="block viewer-block" aria-label="3D mug configurator">
          <div className="wrap">
            <Stage />
            <nav className="spec-toc spec-toc--light" aria-label="Page sections">
              {sections.slice(1).map((s, i) => <a key={s.id} href={'#' + s.id}><span>{String(i + 1).padStart(2, '0')}</span>{s.label}</a>)}
            </nav>
          </div>
        </section>

        <section id="brief" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">01 — What was asked</p><h2>The brief, <em>point by point.</em></h2></div><span className="head-icon"><ListChecks size={24} /></span></div>
            <div className="req-list">
              {brief.map(([title, text]) => (
                <article className="spec-card" key={title}><span className="badge"><Check size={11} /> Done</span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="loading" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">02 — How it loads</p><h2>Nothing heavy <em>until you need it.</em></h2></div><span className="head-icon"><Layers size={24} /></span></div>
            <ol className="steps three-steps">
              {steps.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="perf" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">03 — Load and frame rate</p><h2>Through the <em>FE-10 lens.</em></h2></div><span className="head-icon"><Gauge size={24} /></span></div>
            <div className="table-wrap" role="region" aria-label="Performance numbers" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">What</th><th scope="col">Number</th><th scope="col">How I measured it</th></tr></thead>
                <tbody>{PERF.rows.map(([what, num, how]) => <tr key={what}><td data-label="What">{what}</td><td data-label="Number"><strong>{num}</strong></td><td data-label="How">{how}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">{PERF.note}</p>
          </div>
        </section>

        <section id="next" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — With more time</p><h2>What I’d <em>add next.</em></h2></div><span className="head-icon"><Rocket size={24} /></span></div>
            <div className="req-list">
              {next.map(([t, d]) => <article className="spec-card" key={t}><h3>{t}</h3><p>{d}</p></article>)}
            </div>
          </div>
        </section>
      </main>

      <section className="contact spec-end">
        <div className="wrap end-grid">
          <div>
            <p className="eyebrow light">The write-up</p>
            <h2>Read the <em>README.</em></h2>
          </div>
          <a className="btn btn-light" href={README} target="_blank" rel="noreferrer"><Box size={17} /> README on GitHub <ArrowUpRight size={17} /></a>
        </div>
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-AA2 · First 3D experience</span></footer>
      </section>
    </div>
  );
}
