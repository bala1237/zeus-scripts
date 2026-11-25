// Clicks every button on the laser page with a real pointer and reports any that cannot be reached. node clicktest.mjs [url]  (review server running)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const msgs = []; p.on('pageerror', (e) => msgs.push('page error: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') msgs.push('console: ' + m.text().slice(0, 300)); });
await p.goto(process.argv[2] || 'http://localhost:4180/laser.html', { timeout: 60000 }); await p.waitForTimeout(6000);
console.log('ready', await p.evaluate(() => window.ready));
for (const id of ['demo', 'look', 'set', 'next', 'blackout', 'cam', 'bg', 'stop']) { await p.mouse.move(100, 100); await p.mouse.move(120, 130); try { await p.click('#' + id, { timeout: 4000 }); console.log(id, 'clicked:', await p.evaluate((i) => document.getElementById(i).textContent, id)); } catch (e) { console.log(id, 'NOT clickable:', e.message.split('\n').slice(0, 6).join(' | ').slice(0, 500)); } }
console.log(msgs.join('\n') || 'no errors'); await b.close();
