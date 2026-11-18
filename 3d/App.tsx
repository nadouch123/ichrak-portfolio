import { ArrowLeft, ArrowUpRight, Box, Check, Gauge, ListChecks, Rocket, Layers, Table2 } from 'lucide-react';
import { LAYERS, NODES, THEMES } from './graph';
import Stage from './Stage';
import { PERF } from './perf';

const REPO = 'https://github.com/nadouch123/ichrak-portfolio';
const README = REPO + '/blob/main/3d/README.md';

const sections = [
  { id: 'viewer', label: 'Try it' },
  { id: 'brief', label: 'What was asked' },
  { id: 'loading', label: 'How it loads' },
  { id: 'perf', label: 'Load and frame rate' },
  { id: 'table', label: 'The network as a table' },
  { id: 'next', label: 'With more time' },
];

const brief: [string, string][] = [
  ['A real 3D scene', 'React Three Fiber on three.js. 28 nodes, 61 curved edges and 1,600 data points, with custom GLSL shaders for the moving data, the glow and the point field. Everything is generated in code from one small data file.'],
  ['Interaction beyond orbiting', 'Tap or hover any node to light up its whole lineage: what it is built from and what it feeds. Run a forward pass and watch a wave move through the layers. Fold the network into an embedding view where the same nodes regroup by theme.'],
  ['Kept small', `No model file and no textures to download: the geometry is built in code, and labels are drawn into tiny canvas textures. The only asset is a ${PERF.posterKb} KB still picture for the fallback.`],
  ['Canvas lazy-loaded', 'The 3D code is its own chunk. On a laptop it downloads when the viewer is about to scroll into view and the browser is idle. On a phone it waits for a tap. Never on the home page.'],
  ['Static fallback', 'Reduced motion, Data Saver, a low-power device, a phone, or no WebGL: you get a still picture of the network first, and a button to load 3D (except without WebGL). The network is also written out as a table below, so nothing depends on the canvas.'],
  ['Usable on mobile', 'One finger turns, two fingers zoom, a tap selects. The camera steps back on narrow screens so the whole network fits. Pixel ratio capped at 1.5 and dropped to 1 if frames slow down. Rendering stops when it is off screen.'],
];

const steps: [string, string][] = [
  ['The page loads without any 3D', 'The page, the panel and a still picture of the network come first. The picture is the same size as the canvas, so nothing jumps when 3D arrives.'],
  ['The gate decides', 'Before any 3D code is fetched, a tiny check (gate.ts, no three.js inside) reads prefers-reduced-motion, Data Saver, device memory, CPU cores, touch-only input and WebGL support.'],
  ['The viewer loads when it is about to be seen', 'On a laptop, an IntersectionObserver waits until the stage is within 300 px of the screen and the browser is idle, then React.lazy fetches the 3D chunk. On a phone, the tap does that.'],
  ['The GPU does the animating', 'The moving data, the forward-pass wave and the drifting points are computed in shaders from one time value, so each frame the CPU only updates 28 nodes. Turn off the data flow and auto-rotate and it renders nothing at all until you touch it.'],
];

const next: [string, string][] = [
  ['Real embeddings', 'Embed my project write-ups with a text-embedding model and place each node by its actual vector (reduced with UMAP), instead of by hand-picked themes.'],
  ['Put it in my capstone', 'Show the Weekly Review Coach’s tool calls live in the network: each call lights the path from my notes to the review it produced.'],
  ['Bloom, done cheaply', 'A real bloom pass on desktops with a good GPU, keeping the sprite glow for phones.'],
  ['Share a view', 'Put the selected node and view in the URL so a link opens the same picture.'],
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
            <h1>My work, <em>as a neural network.</em></h1>
            <p className="hero-lead">Data flows in on the left, through my skills and the AI and data capabilities I’ve built, and out into my projects. Tap any project to light up what it’s made of, run a forward pass, or fold the whole network into an embedding space. Built with React Three Fiber and custom shaders.</p>
            <dl className="meta-row">
              <div><dt>Nodes · edges · points</dt><dd>28 · 61 · 1,600</dd></div>
              <div><dt>3D code, gzipped</dt><dd>{PERF.chunkGzKb} KB</dd></div>
              <div><dt>3D code on the home page</dt><dd>0 KB</dd></div>
              <div><dt>Frames when idle</dt><dd>0 / s</dd></div>
            </dl>
          </div>
        </section>

        <section id="viewer" className="block viewer-block" aria-label="3D network of my work">
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

        <section id="table" className="block">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">04 — The network as a table</p><h2>The same graph, <em>in words.</em></h2></div><span className="head-icon"><Table2 size={24} /></span></div>
            <div className="table-wrap" role="region" aria-label="Every node in the network" tabIndex={0}>
              <table className="contract">
                <thead><tr><th scope="col">Node</th><th scope="col">Layer</th><th scope="col">Built from</th><th scope="col">What it is</th></tr></thead>
                <tbody>{NODES.map(n => (
                  <tr key={n.id}>
                    <td data-label="Node">{n.href ? <a href={n.href}>{n.label}</a> : n.label}</td>
                    <td data-label="Layer">{LAYERS[n.layer]} · {THEMES[n.theme]}</td>
                    <td data-label="Built from">{(n.from ?? []).map(id => NODES.find(m => m.id === id)!.label).join(', ') || '—'}</td>
                    <td data-label="What it is">{n.desc}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="next" className="block tinted">
          <div className="wrap">
            <div className="section-head"><div><p className="eyebrow">05 — With more time</p><h2>What I’d <em>add next.</em></h2></div><span className="head-icon"><Rocket size={24} /></span></div>
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
        <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>FE-AA2 · My work as a neural network</span></footer>
      </section>
    </div>
  );
}
