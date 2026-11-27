// Checks that the city obeys the control room's orders (ZW-062): node citytest.mjs   (needs `npm run build` first; slow without a graphics card)
// One copy of the city, as the picture inside live.html in OBS; the orders are given to live.html as OBS would give them.
import { createRequire } from 'node:module';
import { preview } from 'vite';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = await preview({ root: 'review', build: { outDir: '../dist' }, preview: { port: 4187 } }), base = 'http://localhost:4187/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }); await ctx.addInitScript(() => { window.obsstudio = {}; });
const p = await ctx.newPage(); let fails = 0, n = 1; const ok = (what, pass, extra = '') => { console.log(`${pass ? 'ok  ' : 'FAIL'} ${what}${extra ? '  · ' + extra : ''}`); if (!pass) fails++; };
await p.goto(base + 'live.html?scene=city', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
await p.evaluate(() => dispatchEvent(new CustomEvent('zeusLive', { detail: { cmd: 'show', scene: 'city', opts: 'tour=0&spin=0&people=0', _n: 1 } })));
await p.waitForFunction(() => document.querySelector('#view').contentWindow.cityObey, null, { timeout: 900000, polling: 3000 }); console.log('city built');
const cam = () => p.evaluate(() => document.querySelector('#view').contentWindow.__cam().map((v) => Math.round(v))), order = (d) => p.evaluate((d) => dispatchEvent(new CustomEvent('zeusCity', { detail: d })), { ...d, _n: ++n });
const a = await cam(); await order({ cmd: 'address', view: 'harbour', light: null }); await p.waitForTimeout(20000); const b = await cam(); ok('a view order flies the camera', String(a) !== String(b), `${a} -> ${b}`);
ok('…without loading the city again', await p.evaluate(() => !!document.querySelector('#view').contentWindow.cityObey && !document.querySelector('#view').contentWindow.location.search.includes('harbour')));
await order({ cmd: 'battle', wins: true }); await p.waitForTimeout(25000); const c = await cam(); ok('a battle order moves the camera to the gate', String(b) !== String(c), `${b} -> ${c}`);
console.log(fails ? `${fails} FAILED` : 'all passed'); await browser.close(); server.httpServer.close(); process.exit(fails ? 1 : 0);
