import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  // Serve and build the main_window frontend from src/main_window.
  root: path.join(import.meta.dirname, 'src/main_window'),
  build: {
    // outDir resolves against `root`, so pin it back to Forge's expected location.
    outDir: path.join(import.meta.dirname, '.vite/renderer/main_window'),
    emptyOutDir: true,
  },
  plugins: [react()],
});
