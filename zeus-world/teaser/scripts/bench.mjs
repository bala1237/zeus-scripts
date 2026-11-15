// Times a few frames with different quality switches: node scripts/bench.mjs "" "nogtao" ...
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process'; import path from 'node:path';
let chromium; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/')('playwright')); }
const root = path.resolve(import.meta.dirname, '..'); const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: root, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:4173/'); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try { for (const q of process.argv.slice(2)) { const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await p.goto('http://localhost:4173/?capture=1&' + q); await p.waitForFunction('window.__ready === true', null, { timeout: 300000 });
  const ms = await p.evaluate(async () => { const out = []; for (const t of [12.5, 12.6, 18.5, 18.6, 27, 27.1]) { const a = performance.now(); window.__frame(t); const c = document.querySelector('canvas'); c.getContext('webgl2').finish(); out.push(Math.round(performance.now() - a)); } return out; });
  console.log((q || 'full').padEnd(40), ms.join(' ')); await p.close(); } } finally { await browser.close(); server.kill(); }
