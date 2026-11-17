import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/support/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // Belt and braces: even if a key is set on the machine, tests never pick the live model or fetch the live site.
    env: { ANTHROPIC_API_KEY: '', COACH_USE_GATEWAY: '', COACH_PORTFOLIO_URL: 'http://127.0.0.1:9' },
    unstubGlobals: true,
  },
});
