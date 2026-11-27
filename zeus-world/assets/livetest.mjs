// Checks Zeus Live (ZW-056, ZW-057) against a stand-in for OBS: node livetest.mjs   (needs `npm run build` first)
// The stand-in speaks OBS's remote control and hands emit_event to a page that believes it is a browser source (window.obsstudio).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { WebSocketServer } from 'ws';
import { preview } from 'vite';
const server = await preview({ root: 'review', build: { outDir: '../dist' }, preview: { port: 4188 } }), base = 'http://localhost:4188/';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const obsCtx = await browser.newContext({ viewport: { width: 960, height: 540 } }); await obsCtx.addInitScript(() => { window.obsstudio = { pluginVersion: 'stand-in' }; });
const ctl = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(), src = await obsCtx.newPage();
let fails = 0; const ok = (what, pass, extra = '') => { console.log(`${pass ? 'ok  ' : 'FAIL'} ${what}${extra ? '  · ' + extra : ''}`); if (!pass) fails++; };
const wss = new WebSocketServer({ port: 4466 }); wss.on('connection', (ws) => { ws.send(JSON.stringify({ op: 0, d: { rpcVersion: 1 } }));
  ws.on('message', async (raw) => { const { op, d } = JSON.parse(raw); if (op === 1) ws.send(JSON.stringify({ op: 2, d: {} }));
    if (op === 6) { let responseData = {}; if (d.requestType === 'CallVendorRequest') { const { event_name, event_data } = d.requestData.requestData; await src.evaluate(([n, x]) => dispatchEvent(new CustomEvent(n, { detail: x })), [event_name, event_data]); }   // main frame only, as OBS does
      else if (d.requestType === 'GetInputList') responseData = { inputs: [{ inputName: 'Zeus' }] }; else if (d.requestType === 'GetInputSettings') responseData = { inputSettings: { url: base + 'live.html' } };
      ws.send(JSON.stringify({ op: 7, d: { requestId: d.requestId, requestStatus: { result: true, code: 100 }, responseData } })); } }); });

// 1. every page, opened in OBS with its ordinary address, shows no controls
for (const [page, sel] of [['world.html', '#ui'], ['city.html', '#panel'], ['laser.html', '#ui'], ['hero.html', '#ui'], ['andie.html', '#ui'], ['stage.html', '#ui'], ['liquid.html', '#panel']]) {
  await src.goto(base + page, { waitUntil: 'domcontentloaded' }); await src.waitForTimeout(2500);
  const seen = await src.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && Number(c.opacity) > 0.01 && r.width > 0 && r.height > 0 && r.top < innerHeight; }, sel);
  ok(`${page} in OBS: controls hidden`, !seen); }
await src.goto(base + 'city.html?ui=1', { waitUntil: 'domcontentloaded' }); await src.waitForTimeout(1500); ok('city.html?ui=1 in OBS: controls back', await src.evaluate(() => getComputedStyle(document.querySelector('#panel')).display !== 'none'));
await ctl.goto(base + 'world.html', { waitUntil: 'domcontentloaded' }); await ctl.waitForTimeout(1500); ok('world.html in a browser: controls shown', await ctl.evaluate(() => getComputedStyle(document.querySelector('#ui')).display !== 'none'));

// 2. the one page: picture in OBS, control room in the browser
const frameAt = () => src.evaluate(() => document.querySelector('#view').contentWindow.location.pathname.split('/').pop() + document.querySelector('#view').contentWindow.location.search);
const atScene = (p) => src.waitForFunction((p) => { try { const d = document.querySelector('#view').contentDocument; return d.location.pathname.endsWith(p) && d.body && d.readyState !== 'loading'; } catch { return false; } }, p, { timeout: 180000 }).then(() => src.waitForTimeout(800));
await src.goto(base + 'live.html', { waitUntil: 'domcontentloaded' }); await src.waitForTimeout(1500);
ok('live.html in OBS: no bar', await src.evaluate(() => getComputedStyle(document.querySelector('#bar')).display === 'none')); ok('live.html in OBS: starts on the world', (await frameAt()) === 'world.html?ui=0', await frameAt());
await ctl.goto(base + 'live.html?obsport=4466', { waitUntil: 'domcontentloaded' }); await ctl.click('#obsConnect'); await ctl.waitForFunction(() => /connected · source/.test(document.querySelector('#obsStatus').textContent), null, { timeout: 15000 });
ok('control room: connected', true, await ctl.textContent('#obsStatus'));
const inner = () => ctl.frames().find((f) => f !== ctl.mainFrame());
await ctl.click('#tabs button[data-k=laser]'); await ctl.waitForTimeout(1500); ok('looking at a tab changes nothing in OBS', (await frameAt()) === 'world.html?ui=0');
ok('control room: the laser tab has its controls', await inner().evaluate(() => !document.body.classList.contains('plain') && location.pathname.endsWith('laser.html')));
await ctl.fill('#opts', 'bpm=128'); await ctl.dispatchEvent('#opts', 'change'); await ctl.click('#show'); await atScene('laser.html'); ok('Show in OBS: lasers, with the settings', (await frameAt()) === 'laser.html?bpm=128&ui=0', await frameAt());
ok('the scene in OBS has no controls', await src.evaluate(() => document.querySelector('#view').contentDocument.body.classList.contains('plain')));
// 3. the world's buttons reach the world in OBS through the one connection
await ctl.click('#tabs button[data-k=world]'); await ctl.click('#show'); await src.waitForFunction(() => document.querySelector('#view').contentWindow.worldGo, null, { timeout: 120000 });
await src.evaluate(() => { const w = document.querySelector('#view').contentWindow; w.__got = []; w.addEventListener('zeusWorld', (e) => w.__got.push(e.detail)); });
await inner().waitForFunction(() => document.querySelectorAll('#places button').length > 0, null, { timeout: 120000 });
ok('world tab: no second password box', await inner().evaluate(() => document.querySelector('#obsConnect').style.display === 'none'));
await inner().evaluate(() => document.querySelector('#places button').click()); await src.waitForTimeout(1200);
const got = await src.evaluate(() => document.querySelector('#view').contentWindow.__got); ok('a place button steers the world in OBS, once', got.length === 1 && got[0].cmd === 'go', JSON.stringify(got));
// 3b. the liquid sky: shown in OBS it takes the control room's settings, and a slider moved afterwards arrives too
await ctl.evaluate(() => document.querySelector('#tabs button[data-k=liquid]').click()); await ctl.waitForTimeout(2500); await inner().waitForSelector('.pal', { state: 'attached', timeout: 60000 });
await inner().evaluate(() => { const r = document.querySelector('#brt'); r.value = '0.5'; r.dispatchEvent(new Event('input')); document.querySelector('.pal[data-i="2"]').click(); });
await ctl.evaluate(() => document.querySelector('#show').click()); await atScene('liquid.html'); await src.waitForTimeout(1500);
const liq = () => src.evaluate(() => { const d = document.querySelector('#view').contentDocument; return { glow: d.querySelector('#brt').value, pal: d.querySelector('.pal[aria-pressed=true]').textContent, on: d.querySelector('#go').textContent, plain: d.body.classList.contains('plain') }; });
let L = await liq(); ok('liquid sky in OBS: running, no controls, with the control room\'s settings', L.plain && L.on === 'Stop show' && L.glow === '0.5' && L.pal === 'Royal', JSON.stringify(L));
await inner().evaluate(() => { const r = document.querySelector('#shn'); r.value = '0.2'; r.dispatchEvent(new Event('input')); }); await src.waitForTimeout(1000);
ok('a slider moved in the control room moves it in OBS', (await src.evaluate(() => document.querySelector('#view').contentDocument.querySelector('#shn').value)) === '0.2');
// 3c. only with CITY=1: two copies of the city take many minutes on a machine without a graphics card. citytest.mjs checks one copy.
if (process.env.CITY) {
// 3c. the city: the Battle button in the control room starts the battle in OBS (the camera there flies to the south gate)
await ctl.evaluate(() => document.querySelector('#tabs button[data-k=city]').click()); await ctl.waitForTimeout(2000);
await ctl.fill('#opts', 'tour=0&spin=0'); await ctl.dispatchEvent('#opts', 'change'); await ctl.evaluate(() => document.querySelector('#show').click()); await atScene('city.html');
await src.waitForFunction(() => document.querySelector('#view').contentWindow.cityObey, null, { timeout: 420000, polling: 2000 }); await inner().waitForFunction(() => window.cityObey, null, { timeout: 420000, polling: 2000 });
const camAt = () => src.evaluate(() => document.querySelector('#view').contentWindow.__cam().map((v) => Math.round(v))); const before = await camAt();
await inner().evaluate(() => document.querySelector('#battle').click()); await src.waitForTimeout(25000); const afterCam = await camAt();
ok('Battle in the control room starts the battle in OBS', JSON.stringify(before) !== JSON.stringify(afterCam), `${before} -> ${afterCam}`);
}
// 4. a hero film told to play comes on screen by itself, with the name
await ctl.evaluate(() => document.querySelector('#tabs button[data-k=hero]').click()); await ctl.waitForTimeout(3000); await inner().waitForSelector('#sendPlay', { timeout: 120000 }); await inner().fill('#name', 'Andie Howard'); await inner().dispatchEvent('#name', 'input'); await inner().dispatchEvent('#name', 'change');
await inner().click('#sendPlay'); await atScene('hero.html'); await src.waitForTimeout(1500);
ok('Play in OBS: the film is on screen', (await frameAt()).startsWith('hero.html'), await frameAt());
ok('…with the name', /andie\s*howard/i.test(await src.evaluate(() => document.querySelector('#view').contentDocument.querySelector('#forgeName').textContent)), await src.evaluate(() => document.querySelector('#view').contentDocument.querySelector('#forgeName').textContent));
ok('control room knows OBS moved to the film', /Hero film/.test(await ctl.textContent('#onAir')), await ctl.textContent('#onAir'));
// 4b. an old hero.html source left in OBS beside live.html does not obey the control room's orders (it would play a second time, with a second sound)
const oldSrc = await obsCtx.newPage(); await oldSrc.goto(base + 'hero.html', { waitUntil: 'load' }); await oldSrc.waitForTimeout(1500);
await oldSrc.evaluate(() => dispatchEvent(new CustomEvent('zeusHero', { detail: { cmd: 'play', name: 'Echo', _n: 77 } }))); await oldSrc.waitForTimeout(1500); ok('old hero source ignores a control-room order', await oldSrc.evaluate(() => document.querySelector('#film').paused));
await oldSrc.evaluate(() => dispatchEvent(new CustomEvent('zeusHero', { detail: { cmd: 'play', name: 'Echo' } }))); await oldSrc.waitForTimeout(1500); ok('…but still obeys its own remote', await oldSrc.evaluate(() => !document.querySelector('#film').paused)); await oldSrc.close();
// 5. OBS restarted: the source comes back on the scene it had
await src.reload({ waitUntil: 'domcontentloaded' }); await src.waitForTimeout(1500); ok('after a reload the source returns to its scene', (await frameAt()).startsWith('hero.html'), await frameAt());
await ctl.screenshot({ path: process.argv[2] || 'live-control.png' });
console.log(fails ? `${fails} FAILED` : 'all passed'); await browser.close(); wss.close(); server.httpServer.close(); process.exit(fails ? 1 : 0);
