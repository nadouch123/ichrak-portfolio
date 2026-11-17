import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  try { localStorage.clear(); } catch { /* node environment */ }
});

// jsdom has no layout engine: give elements the scroll API the chat uses.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}
