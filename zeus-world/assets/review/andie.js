// Andie's Place (ZW-042): her studio rebuilt in code as a stream backdrop whose own lights follow the music.
// The room is ordinary page elements (sharp at any size, every word editable); roomcues.js says which lights are on;
// beat.js supplies the beat; roomlasers.js adds laser light when asked for. With no music the room sits calm and fully lit.
//
// Everything can also be set in the address, for a browser source that cannot be clicked:
//   ?mode=room | lasers      which lights            ?bright=20..100   brightness, percent
//   ?bpm=124                 run at a fixed tempo without listening     ?demo           the same at 124
//   ?top=WELCOME&big=AI MOGULS    the sign            ?name= ?place= ?tag=A|B|C     the name sign and its line of words
//   ?ui=0                    never show the panel     ?shot&cue=chase&beats=3.2      one still, for checking
import '@fontsource/great-vibes/400.css';
import '@fontsource/dancing-script/700.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import { createBeat } from './beat.js';
import { roomCue, createRoomShow, PIECES } from './roomcues.js';

const q = new URLSearchParams(location.search), SHOT = q.has('shot'), $ = (id) => document.getElementById(id), stage = $('stage');
const store = { get: (k) => { try { return localStorage.getItem('andie-' + k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('andie-' + k, v); } catch { /* private window */ } } };

// ---------- the picture is always 16:9: the largest 16:9 frame that fits above the controls (or in the whole window when they are hidden)
const frame = $('frame'), fit = () => { const below = $('ui').offsetHeight, k = Math.max(0.05, Math.min(innerWidth / 1920, (innerHeight - below) / 1080)); frame.style.width = `${Math.floor(1920 * k)}px`; frame.style.height = `${Math.floor(1080 * k)}px`; frame.style.margin = below ? '0' : 'auto 0'; stage.style.transform = `scale(${k})`; }; addEventListener('resize', fit);

// ---------- drawn parts: plants, chairs, roses
const NS = 'http://www.w3.org/2000/svg', el = (parent, tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent.append(e); return e; };
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
// a palm: fronds arching out from one point, each a curved spine with leaflets; the side towards the neon is lit purple
function palm(svg, w, h, n, lit) { const bx = w / 2, by = h - 40;
  for (let k = 0; k < n; k++) { const a = (-1.25 + 2.5 * k / (n - 1)) + (rnd() - 0.5) * 0.12, len = h * (0.62 + 0.3 * Math.cos(a) + rnd() * 0.08), tx = bx + Math.sin(a) * len * 0.75, ty = by - Math.cos(a) * len, cx = bx + Math.sin(a) * len * 0.25, cy = by - len * 0.85;
    const towards = Math.sin(a) * lit > 0, col = towards ? '#7d4fd0' : '#1f5a3a', dark = towards ? '#2e1c58' : '#0f2a1c';
    el(svg, 'path', { d: `M${bx} ${by} Q${cx} ${cy} ${tx} ${ty}`, fill: 'none', stroke: dark, 'stroke-width': 3 });
    for (let i = 3; i <= 22; i++) { const u = i / 22, px = (1 - u) * (1 - u) * bx + 2 * u * (1 - u) * cx + u * u * tx, py = (1 - u) * (1 - u) * by + 2 * u * (1 - u) * cy + u * u * ty, dx = 2 * (1 - u) * (cx - bx) + 2 * u * (tx - cx), dy = 2 * (1 - u) * (cy - by) + 2 * u * (ty - cy), m = Math.hypot(dx, dy), L = (34 * Math.sin(u * Math.PI) + 6) * (w / 300);
      for (const s of [-1, 1]) { const nx = -dy / m * s, ny = dx / m * s, ex = px + nx * L + dx / m * L * 0.7, ey = py + ny * L + dy / m * L * 0.7 + L * 0.25; el(svg, 'path', { d: `M${px.toFixed(1)} ${py.toFixed(1)} Q${(px + nx * L * 0.5).toFixed(1)} ${(py + ny * L * 0.5).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, fill: 'none', stroke: s * lit > 0 ? col : dark, 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: 0.55 + 0.45 * rnd() }); } } }
  el(svg, 'path', { d: `M${bx - 44} ${by - 6} L${bx + 44} ${by - 6} L${bx + 34} ${h} L${bx - 34} ${h} Z`, fill: '#0c0b10', stroke: '#2a2233', 'stroke-width': 2 }); }
palm($('palmL'), 300, 430, 11, 1); palm($('palmR'), 300, 430, 11, -1); palm($('fern'), 120, 100, 7, 1);
{ const svg = $('chairs'), defs = el(svg, 'defs', {});
  const grad = (id, stops, radial) => { const g = el(defs, radial ? 'radialGradient' : 'linearGradient', radial ? { id, cx: '40%', cy: '35%', r: '75%' } : { id, x1: 0, y1: 0, x2: 0, y2: 1 }); stops.forEach(([o, c]) => el(g, 'stop', { offset: o, 'stop-color': c })); };
  grad('cg', [[0, '#1d1826'], [1, '#08070b']]); grad('plum', [[0, '#a02a63'], [0.6, '#5a1238'], [1, '#2a0719']], true); grad('rose', [[0, '#b0306c'], [0.55, '#6a1440'], [1, '#2c081b']], true);
  const pat = el(defs, 'pattern', { id: 'seq', width: 9, height: 9, patternUnits: 'userSpaceOnUse' }); el(pat, 'rect', { width: 9, height: 9, fill: '#8a6217' }); el(pat, 'circle', { cx: 3, cy: 3, r: 2.6, fill: '#f8e09c' }); el(pat, 'circle', { cx: 7.5, cy: 7.5, r: 2.2, fill: '#d9a93f' });
  const chair = (cx, s) => { const g = el(svg, 'g', { transform: `translate(${cx} 0) scale(${s} 1)` });
    el(g, 'path', { d: 'M-225 300 L-225 110 C-225 40 -170 28 -110 28 L110 28 C170 28 225 40 225 110 L225 300 Z', fill: 'url(#cg)', stroke: 'rgba(150,90,255,.28)', 'stroke-width': 2 });
    el(g, 'path', { d: 'M-250 300 L-250 170 C-250 138 -196 138 -196 170 L-196 300 Z M196 300 L196 170 C196 138 250 138 250 170 L250 300 Z', fill: '#110e17', stroke: 'rgba(170,110,255,.38)', 'stroke-width': 2 });
    el(g, 'path', { d: 'M-196 300 L-196 214 C-120 200 120 200 196 214 L196 300 Z', fill: '#0d0b12' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7 - (r % 2); c++) el(g, 'circle', { cx: -150 + c * 50 + (r % 2) * 25, cy: 70 + r * 44, r: 3, fill: '#2a2236' });
    el(g, 'rect', { x: 40, y: 96, width: 118, height: 118, rx: 14, fill: 'url(#seq)', transform: 'rotate(-12 100 155)', stroke: '#5d400e', 'stroke-width': 2 });
    el(g, 'ellipse', { cx: -44, cy: 176, rx: 62, ry: 50, fill: 'url(#plum)' }); el(g, 'circle', { cx: -44, cy: 176, r: 6, fill: '#3d0c25' }); };
  chair(520, 1); chair(1400, -1);
  for (const [x, y, r] of [[1806, 236, 62], [1880, 262, 52], [1742, 276, 44]]) { el(svg, 'circle', { cx: x, cy: y, r, fill: 'url(#rose)' }); for (let i = 0; i < 4; i++) el(svg, 'path', { d: `M${x - r * (0.75 - i * 0.17)} ${y} A${r * (0.75 - i * 0.17)} ${r * (0.6 - i * 0.13)} ${i * 50} 1 1 ${x + r * (0.3 - i * 0.05)} ${y + r * (0.45 - i * 0.1)}`, fill: 'none', stroke: 'rgba(40,6,24,.75)', 'stroke-width': 3 }); } }

// ---------- the words. From the address first, then what was last typed, then her defaults.
const text = (key, fallback) => q.get(key) ?? store.get(key) ?? fallback;
const setTag = (s) => { const t = $('ttag'); t.textContent = ''; s.split(/\s*[|•·]\s*/).filter(Boolean).forEach((w, i) => { if (i) { const d = document.createElement('i'); d.textContent = '•'; t.append(d); } t.append(w.toUpperCase()); }); };
$('tname').textContent = text('name', "Andie's"); $('tplace').textContent = text('place', 'PLACE').toUpperCase(); setTag(text('tag', 'GROW | LEARN | CONNECT | WIN'));
const fields = [['ftop', 'ttop', 'top', 'WELCOME'], ['fbig', 'tbig', 'big', 'AI MOGULS']];
for (const [f, t, key, fallback] of fields) { $(f).value = text(key, fallback); const apply = () => { $(t).textContent = $(f).value.toUpperCase(); const n = $(f).value.length; if (key === 'big') $(t).style.fontSize = `${Math.min(92, Math.round(92 * 9.5 / Math.max(9.5, n)))}px`; }; apply(); $(f).addEventListener('input', () => { apply(); store.set(key, $(f).value); }); }

// ---------- the lights
const pieces = ['p0', 'p1', 'logo', 'welcome', 'p4', 'p5'].map((id) => ({ el: $(id), v: 1 })), dark = $('dark'), out = [], amb = { v: 1 };
const st = { mode: ['room', 'lasers'].includes(q.get('mode')) ? q.get('mode') : store.get('mode') === 'lasers' ? 'lasers' : 'room', bright: Math.max(20, Math.min(100, Number(q.get('bright') ?? store.get('bright') ?? 100))) / 100, laser: 0, drops: 0 };
const beat = createBeat({ bpm: Number(q.get('bpm') || 124) }), show = createRoomShow({ seed: 5 }); let lasers = null, loading = false, failed = '';
// the laser layer is only fetched and started the first time it is wanted
const wantLasers = () => { if (lasers || loading) return; loading = true; import('./roomlasers.js').then((m) => { lasers = m.createRoomLasers(stage, { shot: SHOT }); }).catch((e) => { failed = 'lasers could not start: ' + e.message; }); };
if (st.mode === 'lasers') wantLasers();

function update(dt) { beat.update(dt); const b = beat.state, playing = b.act > 0.3, allowed = st.mode === 'lasers';
  // the music's shape: the plain lit room while the bass is out, four beats of everything the moment it comes back
  if (b.mode === 'listen') { show.setCalm(b.section === 'breakdown'); if (b.drops !== st.drops) { st.drops = b.drops; show.hit(b.beats); lasers?.hit(); } } else show.setCalm(false);
  const s = show.update(b.beats, { lasersAllowed: allowed }), burst = b.beats - s.burst < 4, laserOn = playing && allowed && (s.lasers || burst || (SHOT && q.has('lasers')));
  const cue = SHOT && q.get('cue') ? q.get('cue') : !playing || burst || s.lasers ? 'glow' : s.pattern; roomCue(cue, b.beats, out);
  // The plain room breathes a little with the beat. In a flashing cue a light comes on at once and dies away quickly.
  const flashing = cue !== 'glow', fall = Math.exp(-dt * 14), dim = laserOn ? 0.5 : 1, breathe = playing ? 0.8 + 0.2 * b.pulse : 1;
  pieces.forEach((p, i) => { const t = out[i] * (flashing ? 1 : breathe * dim); p.v = flashing ? Math.max(t, p.v * fall) : p.v + (t - p.v) * Math.min(1, dt * 7); p.el.style.setProperty('--l', p.v.toFixed(3)); });
  const a = Math.max(0.05, out[PIECES]) * (laserOn ? 0.4 : 1); amb.v = flashing ? Math.max(a, amb.v * fall) : amb.v + (a - amb.v) * Math.min(1, dt * 5); dark.style.opacity = (1 - amb.v).toFixed(3);
  st.laser += ((laserOn ? 1 : 0) - st.laser) * Math.min(1, dt * 4); if (lasers) lasers.update(dt, b, st.laser, SHOT ? q.get('pattern') : null); st.cue = cue; st.playing = playing; }

// ---------- controls
const setMode = (m) => { st.mode = m; store.set('mode', m); $('mode').textContent = `Lights: ${m === 'lasers' ? 'room + lasers' : 'room only'}`; $('mode').classList.toggle('on', m === 'lasers'); if (m === 'lasers') wantLasers(); }; setMode(st.mode);
const setBright = (v) => { st.bright = v; stage.style.filter = v < 0.995 ? `brightness(${v})` : ''; $('bright').value = String(Math.round(v * 100)); $('brightv').textContent = `${Math.round(v * 100)}%`; }; setBright(st.bright);
$('mode').addEventListener('click', () => setMode(st.mode === 'lasers' ? 'room' : 'lasers')); $('bright').addEventListener('input', () => { setBright(Number($('bright').value) / 100); store.set('bright', $('bright').value); });
$('listen').addEventListener('click', () => { failed = ''; if (beat.state.mode === 'listen') beat.unlisten(); else beat.listen().catch((e) => { failed = 'could not listen: ' + e.message; }); });
$('tap').addEventListener('pointerdown', () => beat.tap()); $('stop').addEventListener('click', () => beat.stop()); $('demo').addEventListener('click', () => { beat.state.bpm = beat.state.tempo = 124; beat.tap(); });
let hidden = q.get('ui') === '0' || SHOT; const ui = $('ui'), showUi = () => { ui.classList.toggle('gone', hidden); fit(); }; showUi(); new ResizeObserver(fit).observe(ui);
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (e.code === 'Space') { e.preventDefault(); beat.tap(); } else if (k === 'l') $('mode').click(); else if (k === 'h' && q.get('ui') !== '0') { hidden = !hidden; showUi(); } });

window.__andie = { st, beat, show, update, pieces, get lasers() { return lasers; } };
const fonts = document.fonts ? Promise.all([document.fonts.load('700 236px "Dancing Script"'), document.fonts.load('96px "Great Vibes"'), document.fonts.load('500 40px Montserrat'), document.fonts.load('700 104px Montserrat'), document.fonts.load('600 112px Montserrat')]).catch(() => {}) : Promise.resolve();
if (SHOT) { document.body.classList.add('still'); const wait = st.mode === 'lasers' ? new Promise((r) => { const t = setInterval(() => { if (lasers || failed) { clearInterval(t); r(); } }, 50); }) : Promise.resolve();
  Promise.all([fonts, wait]).then(() => { if (q.get('beats') !== 'calm') { beat.tap(); const n = Number(q.get('beats') || 8) * 60 / 124; for (let t = 0; t < n; t += 1 / 60) update(1 / 60); } else update(1 / 60); requestAnimationFrame(() => requestAnimationFrame(() => { window.ready = true; })); }); }
else { if (q.has('bpm') || q.has('demo')) beat.tap(); let last = performance.now();
  const frame = () => { const now = performance.now(), ms = now - last; last = now; update(Math.min(0.1, ms / 1000)); const b = beat.state;
    $('lamp').style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a2040'; $('listen').classList.toggle('on', b.mode === 'listen'); $('listen').textContent = b.mode === 'listen' ? 'Stop listening' : 'Listen to the music';
    $('status').textContent = failed || (b.mode === 'off' ? 'calm room' : b.mode === 'tap' ? `running at ${b.bpm}` : b.act < 0.3 ? 'listening: no music' : !b.locked ? 'listening: finding the beat' : `on the beat at ${b.tempo.toFixed(1)}${b.section === 'breakdown' ? ' · breakdown' : ''}`);
    requestAnimationFrame(frame); }; fonts.then(() => { window.ready = true; }); requestAnimationFrame(frame); }
