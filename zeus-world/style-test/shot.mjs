// node shot.mjs out.png "query" [width height]
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process';
let chromium; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/')('playwright')); }
const [out, q = '', w = '430', h = '932'] = process.argv.slice(2);
const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: import.meta.dirname, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:4174/'); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try { const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 }); p.setDefaultTimeout(0);
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); }); p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('http://localhost:4174/?shot=1&' + q); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(800); await p.screenshot({ path: out });
} finally { await b.close(); server.kill(); }
