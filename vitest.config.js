import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    // the agent app has its own suite and config
    exclude: ['weekly-review-coach/**', 'node_modules/**'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
