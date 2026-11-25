// Listens to a made-up kick drum in a real browser and reports what the page hears. node beattest.mjs [bpm]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 320, height: 180 } }); const msgs = []; p.on('pageerror', (e) => msgs.push('page error: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') msgs.push('console: ' + m.text().slice(0, 200)); });
await p.goto('http://localhost:4180/laser.html', { timeout: 60000 }); await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
const bpm = Number(process.argv[2] || 128);
await p.evaluate(async (bpm) => { const { beat } = window.__laser; beat.state.testBpm = bpm; await beat.listen('test'); window.__hits = []; let last = Math.floor(beat.state.beats); setInterval(() => { const n = Math.floor(beat.state.beats); if (n !== last) { last = n; window.__hits.push(performance.now()); } }, 4); }, bpm);
await p.waitForTimeout(14000);
console.log(JSON.stringify(await p.evaluate(() => { const s = window.__laser.beat.state, h = window.__hits.slice(-12), gaps = h.slice(1).map((t, i) => t - h[i]); return { locked: s.locked, tempo: +s.tempo.toFixed(2), act: +s.act.toFixed(2), status: document.getElementById('status').textContent, 'gaps between the last beats, ms': gaps.map((g) => Math.round(g)) }; })));
console.log(msgs.join('\n') || 'no errors'); await b.close();
