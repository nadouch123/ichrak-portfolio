// The data behind /3d/: my work drawn as a small neural network.
// Data flows in (layer 0), through my skills (1) and the AI and data capabilities I've built (2),
// out into projects (3). Every edge is a real "this was built with that" link. Edit here, the scene follows.

export type Layer = 0 | 1 | 2 | 3;
export type Theme = 'ai' | 'data' | 'web' | 'systems';
export type GNode = { id: string; label: string; layer: Layer; theme: Theme; desc: string; href?: string; from?: string[] };

export const LAYERS = ['Data in', 'Skills', 'AI & data capabilities', 'Projects'] as const;
export const THEMES: Record<Theme, string> = { ai: 'AI', data: 'Data', web: 'Frontend', systems: 'Systems' };

export const NODES: GNode[] = [
  // 0 · data in
  { id: 'notes', label: 'Notes & files', layer: 0, theme: 'ai', desc: 'My weekly notes and markdown files, read by my agent through tools.' },
  { id: 'web', label: 'Live websites', layer: 0, theme: 'web', desc: 'Pages fetched and checked live, like my portfolio checked by the coach.' },
  { id: 'people', label: 'User input', layer: 0, theme: 'web', desc: 'What people type, click and send: chats, forms, approvals.' },
  { id: 'sensors', label: 'Sensor data', layer: 0, theme: 'systems', desc: 'Telemetry from devices, like the ESP32 in my smart bracelet concept.' },
  { id: 'datasets', label: 'Datasets', layer: 0, theme: 'data', desc: 'Structured records in SQL and document databases.' },

  // 1 · skills
  { id: 'python', label: 'Python', layer: 1, theme: 'data', desc: 'Scripting, data wrangling and ML experiments.', from: ['datasets', 'sensors', 'notes'] },
  { id: 'aiml', label: 'AI / ML', layer: 1, theme: 'ai', desc: 'Models, prompts, tool use and evaluation.', from: ['notes', 'datasets', 'people'] },
  { id: 'ts', label: 'TypeScript', layer: 1, theme: 'web', desc: 'Typed code for agents, routes and UI.', from: ['people', 'web', 'notes'] },
  { id: 'react', label: 'React', layer: 1, theme: 'web', desc: 'Interfaces for AI: streaming chat, tool results, 3D.', from: ['people', 'web'] },
  { id: 'sql', label: 'SQL & MongoDB', layer: 1, theme: 'data', desc: 'MySQL and MongoDB for storing and querying data.', from: ['datasets', 'sensors', 'people'] },
  { id: 'laravel', label: 'Laravel / PHP', layer: 1, theme: 'systems', desc: 'APIs and back ends with JWT auth.', from: ['people', 'datasets'] },
  { id: 'docker', label: 'Docker', layer: 1, theme: 'systems', desc: 'Containers to run services the same way everywhere.', from: ['sensors', 'datasets'] },

  // 2 · capabilities
  { id: 'tools', label: 'LLM tool use', layer: 2, theme: 'ai', desc: 'Agents that call typed tools (Zod) and show each call’s state.', from: ['aiml', 'ts', 'python'] },
  { id: 'evals', label: 'Evals & guardrails', layer: 2, theme: 'ai', desc: 'Eval cases and rules that keep an agent honest.', from: ['aiml', 'python'] },
  { id: 'stream', label: 'Streaming AI UI', layer: 2, theme: 'ai', desc: 'Chat that streams text and tool cards, with stop and retry.', from: ['react', 'ts', 'aiml'] },
  { id: 'failures', label: 'Failure design', layer: 2, theme: 'web', desc: 'A designed state for every error: network, 429, mid-stream cuts.', from: ['react', 'ts'] },
  { id: 'testing', label: 'Testing & CI', layer: 2, theme: 'web', desc: 'Vitest, Testing Library, Playwright, GitHub Actions.', from: ['ts', 'react', 'docker'] },
  { id: 'pipeline', label: 'Data pipelines', layer: 2, theme: 'data', desc: 'Moving data from devices and APIs into storage and analysis.', from: ['python', 'sql', 'docker', 'laravel'] },
  { id: 'analytics', label: 'Data analysis', layer: 2, theme: 'data', desc: 'Turning records into charts, summaries and decisions.', from: ['python', 'sql', 'aiml'] },
  { id: 'a11y', label: 'Accessible UI', layer: 2, theme: 'web', desc: 'WAI-ARIA patterns, keyboard and screen reader support.', from: ['react', 'ts'] },

  // 3 · projects
  { id: 'coach', label: 'Weekly Review Coach', layer: 3, theme: 'ai', href: '/agent-build/', desc: 'A Claude agent that reads my notes through tools, checks my site and reviews my week.', from: ['tools', 'evals', 'stream', 'analytics'] },
  { id: 'toolui', label: 'Tool results UI', layer: 3, theme: 'ai', href: '/tool-ui/', desc: 'Zod-typed tools, four states per call, results as real components.', from: ['tools', 'stream', 'a11y'] },
  { id: 'edge', label: 'Edge cases', layer: 3, theme: 'web', href: '/edge-cases/', desc: 'My agent sabotaged ten ways, every failure given a designed state.', from: ['failures', 'stream', 'testing'] },
  { id: 'tests', label: 'Testing pass', layer: 3, theme: 'web', href: '/testing/', desc: 'Tests by role and label, a mocked AI route, CI on every push.', from: ['testing', 'failures'] },
  { id: 'spec', label: 'Agent spec', layer: 3, theme: 'ai', href: '/agent-spec/', desc: 'Design spec for my agent: access plan, eval cases, guardrails.', from: ['evals', 'tools'] },
  { id: 'utopia', label: 'UtopiaHire', layer: 3, theme: 'ai', desc: 'A job-platform concept matching candidates and roles with AI.', from: ['analytics', 'tools', 'pipeline'] },
  { id: 'bracelet', label: 'Smart Bracelet', layer: 3, theme: 'systems', desc: 'IoT architecture: telemetry, processing, notifications, analytics.', from: ['pipeline', 'analytics'] },
  { id: 'playground', label: 'A11y playground', layer: 3, theme: 'web', href: '/playground/', desc: 'Modal, tabs and disclosure built from scratch to WAI-ARIA.', from: ['a11y', 'testing'] },
];

export type Edge = { a: number; b: number };
const index = new Map(NODES.map((n, i) => [n.id, i]));
export const EDGES: Edge[] = NODES.flatMap((n, b) => (n.from ?? []).map(id => {
  const a = index.get(id);
  if (a === undefined) throw new Error(`graph.ts: unknown node "${id}" in ${n.id}.from`);
  return { a, b };
}));

/** Every node upstream and downstream of `i`: what it is built from and what it feeds. */
export function lineage(i: number): Set<number> {
  const out = new Set([i]);
  const walk = (k: number, dir: 'up' | 'down') => {
    for (const e of EDGES) {
      const [from, to] = dir === 'up' ? [e.b, e.a] : [e.a, e.b];
      if (from === k && !out.has(to)) { out.add(to); walk(to, dir); }
    }
  };
  walk(i, 'up');
  walk(i, 'down');
  return out;
}

// ---------- layouts (plain numbers, no three.js, so they can be tested) ----------

export type Vec3 = [number, number, number];

/** Network view: one column per layer, left to right like a network diagram, each column bowed toward you for depth. */
export function networkLayout(): Vec3[] {
  return NODES.map(n => {
    const same = NODES.filter(m => m.layer === n.layer);
    const k = same.indexOf(n);
    const count = same.length;
    const f = count === 1 ? 0.5 : k / (count - 1);   // 0 at the top, 1 at the bottom
    const height = 1.3 + count * 0.5;
    return [(n.layer - 1.5) * 2.5, (0.5 - f) * height, Math.sin(f * Math.PI) * 1.1 - 0.4 + (n.layer % 2) * 0.3];
  });
}

export const THEME_CENTERS: Record<Theme, Vec3> = {
  ai: [-2.2, 1.15, 0.4], data: [2.2, 1.2, -0.5], web: [-1.5, -1.45, -0.6], systems: [2.3, -1.35, 0.8],
};

/** Embedding view: nodes gather by theme, like points in a 2D/3D embedding of my work. */
export function embeddingLayout(): Vec3[] {
  return NODES.map((n, i) => {
    const c = THEME_CENTERS[n.theme];
    const same = NODES.filter(m => m.theme === n.theme);
    const k = same.indexOf(n);
    const a = k * 2.39996; // golden angle spreads them evenly
    const r = 0.3 + 0.36 * Math.sqrt(k);
    return [c[0] + Math.cos(a) * r * 1.15, c[1] + Math.sin(a) * r * 0.75, c[2] + ((i * 7) % 5 - 2) * 0.25];
  });
}

/** Seeded random so the particle field looks the same on every load (and in the still picture). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
