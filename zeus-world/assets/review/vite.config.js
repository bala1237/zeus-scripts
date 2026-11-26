// Multi-page build of the review scenes for hosting: asset review, street test and the whole city.
import { resolve } from 'node:path';
export default {
  base: './',
  build: { target: 'es2022', outDir: '../dist', emptyOutDir: true, rollupOptions: { input: { index: resolve(__dirname, 'index.html'), street: resolve(__dirname, 'street.html'), city: resolve(__dirname, 'city.html'), stage: resolve(__dirname, 'stage.html'), laser: resolve(__dirname, 'laser.html'), andie: resolve(__dirname, 'andie.html'), hero: resolve(__dirname, 'hero.html'), world: resolve(__dirname, 'world.html'), live: resolve(__dirname, 'live.html'), liquid: resolve(__dirname, 'liquid.html') } } },
  worker: { format: 'es' },
};
