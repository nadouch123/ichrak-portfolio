// Decides whether the 3D viewer should load on its own, wait for a tap, or not load at all.
// Kept free of three.js so the page can decide before downloading a single byte of 3D code.

export type Reason = 'reduced-motion' | 'save-data' | 'low-power' | 'touch' | 'no-webgl';
export type Mode = { mode: 'auto' } | { mode: 'ask'; reason: Reason } | { mode: 'off'; reason: 'no-webgl' };

export type Env = {
  reducedMotion: boolean;
  saveData: boolean;
  deviceMemory?: number; // GB, Chrome/Android only
  cores?: number;
  touch?: boolean; // a phone or tablet: no hover, coarse pointer
  webgl: boolean;
};

export function decide(env: Env): Mode {
  if (!env.webgl) return { mode: 'off', reason: 'no-webgl' };
  if (env.reducedMotion) return { mode: 'ask', reason: 'reduced-motion' };
  if (env.saveData) return { mode: 'ask', reason: 'save-data' };
  if ((env.deviceMemory !== undefined && env.deviceMemory <= 2) || (env.cores !== undefined && env.cores <= 2)) {
    return { mode: 'ask', reason: 'low-power' };
  }
  if (env.touch) return { mode: 'ask', reason: 'touch' };
  return { mode: 'auto' };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function readEnv(): Env {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return {
    reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: !!nav.connection?.saveData,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
    touch: typeof matchMedia === 'function' && matchMedia('(hover: none) and (pointer: coarse)').matches,
    webgl: hasWebGL(),
  };
}

export const reasonText: Record<Reason, string> = {
  'reduced-motion': 'Your device asks for reduced motion, so this is a still picture of the mug. The 3D viewer only moves when you drag it, and auto-rotate starts off.',
  'save-data': 'Data Saver is on, so this is a still picture. The 3D viewer is about 300 KB more (the mug model itself is 43 KB).',
  'low-power': 'This looks like a low-power device, so this is a still picture to save your battery.',
  'touch': 'On phones the 3D viewer waits for a tap, so it doesn’t spend your data or battery before you want it. Then drag with one finger to turn the mug, pinch to zoom.',
  'no-webgl': 'Your browser has WebGL turned off or doesn’t support it, so this is a still picture of the mug.',
};

export const buttonText: Record<Reason, string> = {
  'reduced-motion': 'Load the 3D viewer anyway',
  'save-data': 'Load the 3D viewer anyway',
  'low-power': 'Load the 3D viewer anyway',
  'touch': 'Tap to load the 3D viewer',
  'no-webgl': '',
};
