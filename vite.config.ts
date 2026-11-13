import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playground: resolve(__dirname, 'playground/index.html'),
        agentSpec: resolve(__dirname, 'agent-spec/index.html'),
        agentBuild: resolve(__dirname, 'agent-build/index.html'),
        toolUi: resolve(__dirname, 'tool-ui/index.html'),
        edgeCases: resolve(__dirname, 'edge-cases/index.html'),
        cv: resolve(__dirname, 'cv/index.html'),
      },
    },
  },
});
