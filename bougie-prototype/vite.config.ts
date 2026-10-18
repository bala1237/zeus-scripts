import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build can be hosted from any folder.
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
});
