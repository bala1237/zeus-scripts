// Multi-page build of the review scenes for hosting: asset review, street test and the whole city.
import { resolve } from 'node:path';
export default {
  base: './',
  build: { target: 'esnext', outDir: '../dist', emptyOutDir: true, rollupOptions: { input: { index: resolve(__dirname, 'index.html'), street: resolve(__dirname, 'street.html'), city: resolve(__dirname, 'city.html') } } },
};
