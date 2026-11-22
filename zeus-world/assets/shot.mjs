// Renders review-scene stills: node shot.mjs <out.png> "<query string>" [width height]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [out, query, w = 1400, h = 800] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('pageerror', (e) => console.error('page error:', e.message));
await p.goto(`http://localhost:4180/${process.env.PAGE || ""}?shot&${query}`, { timeout: 0 });
await p.waitForFunction('window.ready === true', null, { timeout: 600000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: out, timeout: 0 });
await b.close();
