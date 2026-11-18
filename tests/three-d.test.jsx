import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { decide } from '../3d/gate.ts';

// Stands in for the real three.js viewer. `imported` flips only if the page actually asks for the 3D chunk.
const chunk = vi.hoisted(() => ({ imported: false }));
vi.mock('../3d/Viewer.tsx', () => {
  chunk.imported = true;
  return { default: () => <div role="img" aria-label="3D viewer (mock)" /> };
});

const Stage = (await import('../3d/Stage.tsx')).default;

const base = { reducedMotion: false, saveData: false, deviceMemory: 8, cores: 8, touch: false, webgl: true };

describe('3D gate: who gets the viewer straight away', () => {
  it('loads on its own on a capable desktop', () => {
    expect(decide(base)).toEqual({ mode: 'auto' });
  });
  it.each([
    [{ reducedMotion: true }, 'reduced-motion'],
    [{ saveData: true }, 'save-data'],
    [{ deviceMemory: 2 }, 'low-power'],
    [{ cores: 2 }, 'low-power'],
    [{ touch: true }, 'touch'],
  ])('asks first when %o', (env, reason) => {
    expect(decide({ ...base, ...env })).toEqual({ mode: 'ask', reason });
  });
  it('never offers 3D without WebGL, even if other reasons apply', () => {
    expect(decide({ ...base, webgl: false, reducedMotion: true })).toEqual({ mode: 'off', reason: 'no-webgl' });
  });
});

describe('3D stage fallback', () => {
  it('shows the still picture and downloads no 3D code until the visitor asks', async () => {
    render(<Stage initial={{ mode: 'ask', reason: 'reduced-motion' }} />);
    expect(screen.getByRole('img', { name: /neural network/i })).toBeInTheDocument();
    expect(screen.getByText(/asks for reduced motion/i)).toBeInTheDocument();
    expect(chunk.imported).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Load the 3D viewer anyway' }));
    expect(await screen.findByRole('img', { name: '3D viewer (mock)' })).toBeInTheDocument();
    expect(chunk.imported).toBe(true);
  });

  it('on a phone, waits for a tap', () => {
    render(<Stage initial={{ mode: 'ask', reason: 'touch' }} />);
    expect(screen.getByRole('button', { name: 'Tap to load the 3D viewer' })).toBeInTheDocument();
  });

  it('without WebGL, explains why and offers no button', () => {
    render(<Stage initial={{ mode: 'off', reason: 'no-webgl' }} />);
    expect(screen.getByText(/WebGL turned off/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

import { EDGES, NODES, lineage } from '../3d/graph.ts';

describe('the network data', () => {
  it('links every node to things that exist, one layer at a time', () => {
    for (const e of EDGES) expect(NODES[e.b].layer).toBeGreaterThan(NODES[e.a].layer);
    for (const n of NODES.filter(n => n.layer > 0)) expect(n.from?.length).toBeGreaterThan(0);
  });
  it('lights up a project’s whole lineage, back to the data it starts from', () => {
    const coach = NODES.findIndex(n => n.id === 'coach');
    const lit = [...lineage(coach)].map(i => NODES[i].id);
    expect(lit).toEqual(expect.arrayContaining(['coach', 'tools', 'aiml', 'notes']));
    expect(lit).not.toContain('bracelet');
  });
});
