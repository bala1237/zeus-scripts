// Renders the teaser frame by frame in headless Chromium and encodes an mp4.
// Usage: node scripts/capture.mjs [--fps 30] [--from 0] [--to 30] [--stills 1,5,10] [--audio track.mp3] [--resume]
// A full recording takes hours on a machine without a graphics card; --resume continues one that was interrupted.
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/')('playwright')); }

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 30), stills = arg('stills'), audio = arg('audio'), workers = +arg('workers', 4);
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'out'), frames = path.join(out, 'frames');
mkdirSync(out, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: root, stdio: 'ignore' });
const url = 'http://localhost:4173/?capture=1' + (process.env.TEASER_Q ? '&' + process.env.TEASER_Q : '');
for (let i = 0; i < 60; i++) { try { await fetch(url); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open() { const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 }); p.setDefaultTimeout(0); p.on('pageerror', (e) => console.error('page error:', e.message)); p.on('console', (m) => { if (m.type() === "error") console.error('console:', m.text().slice(0, 1500)); }); await p.goto(url, { waitUntil: 'commit', timeout: 0 }); await p.waitForFunction('window.__ready === true', null, { timeout: 600000 }); return p; }
const shoot = async (p, t, file) => { await p.evaluate((t) => window.__frame(t), t); await p.screenshot({ path: file, type: 'jpeg', quality: 93 }); };

try {
  if (stills) {
    const p = await open();
    for (const t of stills.split(',').map(Number)) { await shoot(p, t, path.join(out, `still-${t.toFixed(2)}.jpg`)); console.log('still', t); }
  } else {
    const pages = []; for (let i = 0; i < workers; i++) pages.push(await open());
    const duration = await pages[0].evaluate('window.__duration');
    const from = Math.round(+arg('from', 0) * fps), to = Math.round(+arg('to', duration) * fps);
    const resume = process.argv.includes('--resume'); if (!resume) rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
    const done0 = (f) => { const file = path.join(frames, `f${String(f - from).padStart(5, '0')}.jpg`); if (!existsSync(file)) return false; const b = readFileSync(file); return b.length > 50000 && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9; };
    let next = from, done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (p) => { while (next < to) { const f = next++; if (resume && done0(f)) { done++; continue; } await shoot(p, f / fps, path.join(frames, `f${String(f - from).padStart(5, '0')}.jpg`)); if (++done % 60 === 0) console.log(`${done}/${to - from} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`); } }));
    const file = path.join(out, 'zeus-world-teaser.mp4');
    const a = audio && existsSync(audio) ? ['-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : [];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg'), ...a, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', file]);
    console.log('wrote', file);
  }
} finally { await browser.close(); server.kill(); }
