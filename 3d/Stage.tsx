import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, ImageOff } from 'lucide-react';
import { buttonText, decide, readEnv, reasonText } from './gate';
import type { Mode } from './gate';

// The only import of the 3D code. Nothing from three.js is downloaded until this runs.
const Viewer = lazy(() => import('./Viewer'));

export const POSTER = '/3d/network-poster.webp';

class CatchWebGL extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Poster({ children }: { children?: ReactNode }) {
  return (
    <figure className="poster">
      <img src={POSTER} width={1230} height={992} alt="A glowing 3D neural network on a dark blue background: columns of nodes for data, skills, AI and data capabilities, and projects, joined by curved lines of light." />
      {children}
    </figure>
  );
}

export default function Stage({ initial }: { initial?: Mode }) {
  const [gate] = useState<Mode>(() => initial ?? decide(readEnv()));
  const [optIn, setOptIn] = useState(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);

  // Even in "auto" mode, wait until the viewer is about to scroll into view.
  useEffect(() => {
    if (gate.mode !== 'auto') return;
    const el = shell.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    // Start once the stage is near the screen AND the browser is idle, so the page itself finishes first.
    const start = () => ('requestIdleCallback' in window ? requestIdleCallback(() => setNear(true), { timeout: 1500 }) : setTimeout(() => setNear(true), 200));
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [gate.mode]);

  const want3d = gate.mode === 'auto' ? near : gate.mode === 'ask' && optIn;

  const still = (
    <div className="viewer">
      <div className="stage stage--net"><Poster /></div>
      <div className="panel panel--still">
        {gate.mode === 'auto' ? (
          <p className="panel-wait" role="status"><Box size={18} /> Loading the 3D viewer…</p>
        ) : (
          <>
            <p className="panel-reason"><ImageOff size={18} /> {reasonText[gate.reason]}</p>
            {gate.mode === 'ask' && (
              <button type="button" className="btn-small" onClick={() => setOptIn(true)}>
                <Box size={15} /> {buttonText[gate.reason]}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div ref={shell} className={'stage-shell' + (ready ? ' is-ready' : '')}>
      {want3d ? (
        <CatchWebGL fallback={<div className="viewer"><div className="stage stage--net"><Poster /></div><div className="panel panel--still"><p className="panel-reason" role="alert"><ImageOff size={18} /> The 3D viewer couldn’t start on this device (WebGL failed), so here is the still picture.</p></div></div>}>
          <Suspense fallback={still}>
            <Viewer reducedMotion={gate.mode === 'ask' && gate.reason === 'reduced-motion'} onReady={onReady}
              cover={ready ? null : <div className="poster-cover" aria-hidden="true"><img src={POSTER} alt="" /></div>} />
          </Suspense>
        </CatchWebGL>
      ) : still}
    </div>
  );
}
