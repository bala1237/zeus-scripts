// Zeus Lasers (ZW-036): a rig of seven laser projectors placed in depth, run by the Lighting Director, shown as an overlay.
// The page shows only light, to be laid over a camera picture in the streaming software.
//   ?bg=black (default; set the source to Add or Screen blending)   ?bg=clear (transparent page)   ?bg=mock (a stand-in camera picture)
//   ?demo (run without music at 124 beats a minute)   ?theme=0..5 (hold one theme)   ?camera=0 (keep the camera still)
//   ?shot (one still; ?beats=N how far in, ?pattern=name, ?cam=N which angle)   ?gain= ?haze= ?glow=
// director.js decides what the rig does; beams.js draws the light; beat.js supplies the beat. Movement goes through speed limits.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createBeamRenderer } from './beams.js';
import { createBeat } from './beat.js';
import { createFlow } from './flow.js';
import { createDirector, THEMES } from './director.js';

const q = new URLSearchParams(location.search), SHOT = q.has('shot'), $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: SHOT, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.append(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 200);
const rig = createBeamRenderer({ maxBeams: 340, maxSheets: 14 }); scene.add(rig.group);
// what is shown: the lasers, the flow (ribbons of colour that never stop), or both
const flow = createFlow(), look = { mode: ['lasers', 'flow', 'both'].includes(q.get('look')) ? q.get('look') : 'lasers', beams: 1, flow: 0, third: new THREE.Color(), t: Number(q.get('flowt') || 0) }; scene.add(flow.mesh); flow.uniforms.uT.value = look.t;

// ---------- the rig. Three across the back and high, one each side at shoulder height firing inward, two on the floor firing up.
// yaw and pitch are which way a projector faces; n is how many beams it can throw.
const RIG = [
  { group: 'back', side: 0, pos: [0, 3.6, -3.6], yaw: 0, pitch: 0, n: 9 }, { group: 'back', side: -1, pos: [-3.3, 3.35, -3.2], yaw: 0.16, pitch: 0, n: 9 }, { group: 'back', side: 1, pos: [3.3, 3.35, -3.2], yaw: -0.16, pitch: 0, n: 9 },
  { group: 'side', side: -1, pos: [-5.4, 2.1, -0.6], yaw: 1.25, pitch: 0, n: 7 }, { group: 'side', side: 1, pos: [5.4, 2.1, -0.6], yaw: -1.25, pitch: 0, n: 7 },
  { group: 'floor', side: -1, pos: [-2.5, 0.2, -2.6], yaw: 0.1, pitch: 1.0, n: 5 }, { group: 'floor', side: 1, pos: [2.5, 0.2, -2.6], yaw: -0.1, pitch: 1.0, n: 5 },
];
// The festival rig (ZW-039): a wall of ten projectors at five heights, twenty beams each, and six projectors that throw wide soft shafts.
// k counts from the middle outwards. All face the audience.
const WALL = [[1.5, 0.95], [3.4, 2.2], [2.3, 3.7], [5.2, 3.1], [4.2, 4.9]], WASH = [[0.28, 0.55, -4.3], [6.6, 1.2, -3.4], [6.3, 3.5, -3.6]];
for (const s of [-1, 1]) { WALL.forEach(([x, y], k) => RIG.push({ group: 'wall', side: s, k, pos: [s * x, y, -4.5], yaw: 0, pitch: 0, n: 20 })); WASH.forEach(([x, y, z], k) => RIG.push({ group: 'wash', side: s, k, pos: [s * x, y, z], yaw: 0, pitch: 0, n: 1 })); }
const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
// every value a projector has eases to its target under a speed limit, as a mirror with mass would
const eased = (v) => ({ v, vel: 0, to: v }), step = (e, dt, time, max = 2.6) => { const w = 2 / time, x = w * dt, k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), ch = Math.max(-max * time, Math.min(max * time, e.v - e.to)), tgt = e.v - ch, tmp = (e.vel + w * ch) * dt; e.vel = (e.vel - w * tmp) * k; e.v = tgt + (ch + tmp) * k; };
const KEYS = ['pan', 'tilt', 'spread', 'roll', 'level', 'sheet', 'sheetSpread', 'cone', 'lean'];
for (const p of RIG) { p.P = new THREE.Vector3(...p.pos); p.e = Object.fromEntries(KEYS.map((k) => [k, eased(k === 'tilt' ? -0.25 : k === 'sheetSpread' ? 0.9 : k === 'spread' ? 0.1 : 0)])); p.spin = 0; p.mix = eased(0); p.t = {};
  p.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); p.glow.position.copy(p.P); scene.add(p.glow); }

// ---------- the festival stage set: a temple front (it is Zeus's stage) and the booth with the name on it. Dark shapes; the lasers do the lighting.
const fest = { v: 0, set: q.get('set') !== '0' }, temple = new THREE.Group(), templeMat = new THREE.MeshBasicMaterial({ color: 0x000000 }), signMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false });
{ const add = (g, x, y, z, m = templeMat) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); temple.add(o); return o; };
  for (let i = 0; i < 8; i++) { const x = -5.6 + i * 1.6; add(new THREE.CylinderGeometry(0.26, 0.3, 4.6, 14), x, 2.9, -6.2); add(new THREE.BoxGeometry(0.8, 0.16, 0.8), x, 5.28, -6.2); add(new THREE.BoxGeometry(0.8, 0.2, 0.8), x, 0.6, -6.2); }
  add(new THREE.BoxGeometry(12.6, 0.55, 1.0), 0, 5.63, -6.2); add(new THREE.BoxGeometry(13.4, 0.5, 2.4), 0, 0.25, -5.6);
  const ped = new THREE.Shape(); ped.moveTo(-6.5, 0); ped.lineTo(6.5, 0); ped.lineTo(0, 1.7); ped.closePath(); add(new THREE.ShapeGeometry(ped), 0, 5.9, -6.2);
  add(new THREE.BoxGeometry(4.6, 1.05, 1.2), 0, 0.55, -3.4);   // the booth
  const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = '600 150px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((q.get('name') || 'ZEUS').toUpperCase().split('').join('\u2009'), 512, 104);
  signMat.map = new THREE.CanvasTexture(c); add(new THREE.PlaneGeometry(3.4, 0.64), 0, 0.58, -2.79, signMat); temple.visible = false; scene.add(temple); }

// ---------- output: glow only from what is brighter than white (the beams), tone mapping, then an alpha so the page can be laid over a camera
const composer = new EffectComposer(renderer), bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), Number(q.get('glow') ?? 0.45), 0.32, 1.2);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
// light has no edge: how see-through a pixel is follows how bright it is
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)) * 1.15, 0.0, 1.0)); }' }));

// ---------- the camera: a few composed angles. It glides from one to the next at the start of some cues and drifts a little while it holds.
const CAMS = [{ p: [0, 1.45, 5.2], t: [0, 1.9, -1], f: 52 }, { p: [-2.6, 1.0, 4.6], t: [0.5, 2.1, -1.5], f: 50 }, { p: [2.6, 1.0, 4.6], t: [-0.5, 2.1, -1.5], f: 50 }, { p: [0, 0.75, 4.2], t: [0, 2.5, -2], f: 58 }, { p: [0, 2.9, 6.4], t: [0, 1.6, -1.5], f: 44 }, { p: [-1.6, 1.6, 3.4], t: [1.2, 2.0, -3], f: 56 },
  // the festival views: low in the crowd looking up at the wall, to either side, and far back
  { p: [0, 0.9, 3.0], t: [0, 3.3, -4.5], f: 72 }, { p: [-2.8, 0.8, 2.4], t: [0.8, 3.2, -4.5], f: 70 }, { p: [2.8, 0.8, 2.4], t: [-0.8, 3.2, -4.5], f: 70 }, { p: [0, 2.2, 6.6], t: [0, 2.9, -4.5], f: 58 }];
const CLUB_CAMS = [0, 1, 2, 3, 4, 5], FEST_CAMS = [6, 7, 8, 9];
const cam = { i: Number(q.get('cam') || 0), x: eased(0), y: eased(1.45), z: eased(5.2), tx: eased(0), ty: eased(1.9), tz: eased(-1), f: eased(52), moving: q.get('camera') !== '0', lastCue: -1 };
const setCam = (i, snap = false) => { cam.i = i % CAMS.length; const c = CAMS[cam.i]; for (const [k, v] of [['x', c.p[0]], ['y', c.p[1]], ['z', c.p[2]], ['tx', c.t[0]], ['ty', c.t[1]], ['tz', c.t[2]], ['f', c.f]]) { cam[k].to = v; if (snap) { cam[k].v = v; cam[k].vel = 0; } } }; setCam(cam.i, true);

// ---------- the show
const st = { t: 0, gain: Number(q.get('gain') ?? 1) }, beat = createBeat({ bpm: 124 }), dir = createDirector({ seed: 11 });
if (q.get('theme') !== null) { dir.setTheme(Number(q.get('theme'))); dir.state.auto = false; }
const main = new THREE.Color(THEMES[dir.state.theme].main), accent = new THREE.Color(THEMES[dir.state.theme].accent), C = new THREE.Color(), D = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Euler();
// a direction in the projector's own frame, turned to where the projector is pointing. ax is the angle across the fan; roll tips the fan's plane.
const aim = (out, p, ax, coneA, phi) => { const e = p.e, cx = Math.sin(ax) * Math.cos(e.roll.v), cy = Math.sin(ax) * Math.sin(e.roll.v), k = e.cone.v;
  out.set(cx * (1 - k) + Math.sin(coneA) * Math.cos(phi) * k, cy * (1 - k) + Math.sin(coneA) * Math.sin(phi) * k, Math.cos(ax) * (1 - k) + Math.cos(coneA) * k).normalize().applyEuler(E.set(-(p.pitch + e.tilt.v), p.yaw + e.pan.v, 0, 'YXZ')); return out; };
let drops = 0;
function update(dt) { const b = beat.state; beat.update(dt); st.t += dt;
  // the music's shape: quiet patterns while the bass is out, the biggest one the moment it comes back
  if (b.mode === 'listen') { dir.setCalm(b.section === 'breakdown'); if (b.drops !== drops) { drops = b.drops; dir.hit(); } } else dir.setCalm(false);
  const d = dir.update(b.beats), theme = THEMES[d.theme], kick = 0.74 + 0.26 * b.pulse;
  look.beams += ((look.mode === 'flow' ? 0 : 1) - look.beams) * Math.min(1, dt * 2.5); look.flow += ((look.mode === 'lasers' ? 0 : 1) - look.flow) * Math.min(1, dt * 1.2); const act = b.act * look.beams;
  // the flow keeps the theme's two colours and adds a third from across the colour wheel. It drifts faster with the energy of the music, calms in a breakdown, and stops with the music.
  { const hsl = {}; main.getHSL(hsl); look.third.setHSL((hsl.h + 0.42) % 1, 1, 0.55);
    flow.update(dt * b.act, { level: look.flow * b.act * (d.blackout ? 0 : 1) * st.gain * (look.mode === 'both' ? 0.55 : 1), speed: (b.section === 'breakdown' ? 0.6 : 0.8 + 1.4 * b.energy), pulse: b.pulse, a: main, b: accent, c: look.third, aspect: camera.aspect }); }
  main.lerp(C.set(theme.main), Math.min(1, dt * 1.2)); accent.lerp(C.set(theme.accent), Math.min(1, dt * 1.2));
  if (SHOT && q.get('pattern')) d.pattern = q.get('pattern');
  // an intensity budget: the more beams are lit, the less each gets, so a full rig does not flood the picture and a single beam is strong
  let load = 0; for (const p of RIG) load += Math.max(0, p.e.level.v) * (p.e.spread.v < 0.1 && p.e.cone.v < 0.5 ? 3 : p.n) + 5 * Math.max(0, p.e.sheet.v); const budget = Math.min(1.25, Math.pow((theme.budget || 13) / Math.max(load, 1), 0.55));
  rig.begin();
  for (const p of RIG) { const t = dir.target(p, p.t), e = p.e; for (const k of KEYS) { e[k].to = t[k]; step(e[k], dt, k === 'level' || k === 'sheet' ? Math.min(t.time, 0.3) : t.time); } p.mix.to = t.accent ? 1 : 0; step(p.mix, dt, 0.5); p.spin += t.spin * dt * act * 1.4;
    const col = C.copy(main).lerp(accent, p.mix.v), lvl = Math.max(0, e.level.v), sh = Math.max(0, e.sheet.v), I = act * st.gain * kick * budget;
    // beams lying on top of each other add up, so a closed fan is dimmed to match an open one
    const narrow = e.spread.v < 0.1 && e.cone.v < 0.5, together = e.cone.v > 0.5 ? 1 : narrow ? 0.75 : 0.3 + 0.7 * Math.min(1, e.spread.v / 0.45), n = narrow ? (e.spread.v < 0.004 ? 1 : 3) : p.n;   // a tight bundle is three beams, and a closed one is one
    if (lvl > 0.01) for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) - 0.5 : 0; aim(D, p, f * 2 * e.spread.v + e.lean.v, e.spread.v, i / n * Math.PI * 2 + p.spin); rig.beam(p.P, D, 26, col, I * lvl * 1.7 * together); }
    // a shaft from the festival rig is seen face-on, where it is thin, so it needs far more than a sheet seen along its length
    if (sh > 0.01) { const keep = e.cone.v; e.cone.v = 0; aim(A, p, e.lean.v - e.sheetSpread.v, 0, 0); aim(B, p, e.lean.v + e.sheetSpread.v, 0, 0); e.cone.v = keep; rig.sheet(p.P, A, B, 26, col, I * sh * (p.group === 'wash' ? 26 : 5.5)); }
    const on = act * Math.max(lvl, sh); p.glow.material.color.copy(col).multiplyScalar(1.5 * Math.min(1.2, on) * kick); p.glow.scale.setScalar(0.26 + 0.1 * on); p.glow.visible = on > 0.01; }
  // the festival stage: a lattice of laser lines drawn on the structure behind, and the temple itself, barely lit by the colour in the air
  fest.v += ((theme.festival ? 1 : 0) - fest.v) * Math.min(1, dt * 1.5); const fv = fest.v * (fest.set ? 1 : 0);
  if (fv > 0.01 && act > 0.01 && !d.dark) { const I = act * st.gain * fv * (0.28 + 0.12 * b.pulse);
    for (let i = 0; i <= 10; i++) rig.beam(A.set(-3.5 + i * 0.7, 0.9, -5.6), D.set(0, 1, 0), 4.3, main, I, 0.006, 0);
    for (let i = 0; i <= 6; i++) rig.beam(A.set(-3.6, 1.3 + i * 0.6, -5.6), D.set(1, 0, 0), 7.2, main, I, 0.006, 0); }
  temple.visible = fv > 0.01; if (temple.visible) { templeMat.color.copy(main).multiplyScalar(0.02 * fv * (0.25 + 0.75 * b.act) * (d.dark ? 0.3 : 1)); signMat.color.setScalar(fv * (0.5 + 1.3 * b.act) * (d.blackout ? 0 : 1)); }
  rig.end(st.t, camera, renderer.domElement.height);
  // the camera moves on every second cue, or every cue in a lively theme; never in a still one
  const views = theme.festival ? FEST_CAMS : CLUB_CAMS; if (!SHOT && !views.includes(cam.i)) setCam(views[0]);   // each rig has its own views
  if (cam.moving && d.cue !== cam.lastCue) { if (cam.lastCue !== -1 && theme.camera !== 'still' && (theme.camera === 'lively' || d.cue % 2 === 0)) setCam(views[(views.indexOf(cam.i) + 1 + (d.cue % 3 === 0 ? 1 : 0)) % views.length]); cam.lastCue = d.cue; }
  for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz', 'f']) step(cam[k], dt, 2.4, 3); const sway = cam.moving ? 1 : 0;
  camera.position.set(cam.x.v + Math.sin(st.t * 0.21) * 0.14 * sway, cam.y.v + Math.sin(st.t * 0.17 + 1) * 0.06 * sway, cam.z.v + Math.sin(st.t * 0.13 + 2) * 0.12 * sway); camera.lookAt(cam.tx.v, cam.ty.v, cam.tz.v);
  if (Math.abs(camera.fov - cam.f.v) > 0.01) { camera.fov = cam.f.v; camera.updateProjectionMatrix(); } }
const draw = () => composer.render();

// ---------- controls
let bgMode = q.get('bg') || 'black', failed = ''; const setBg = () => { document.body.classList.toggle('clear', bgMode === 'clear'); document.body.classList.toggle('mock', bgMode === 'mock'); $('bg').textContent = `Background: ${bgMode === 'mock' ? 'stand-in camera' : bgMode}`; }; setBg();
$('bg').addEventListener('click', () => { bgMode = { black: 'clear', clear: 'mock', mock: 'black' }[bgMode]; setBg(); });
$('listen').addEventListener('click', () => { if (beat.state.mode === 'listen') beat.unlisten(); else beat.listen().catch((e) => { failed = 'could not listen: ' + e.message; }); });
$('tap').addEventListener('pointerdown', () => beat.tap()); $('stop').addEventListener('click', () => beat.stop()); $('demo').addEventListener('click', () => { beat.state.bpm = 124; beat.tap(); });
$('sync').value = String(Math.round(beat.state.offset * 1000)); const showSync = () => { const v = Number($('sync').value); $('syncv').textContent = v === 0 ? 'as heard' : `${Math.abs(v)} ms ${v > 0 ? 'later' : 'earlier'}`; }; showSync();
$('sync').addEventListener('input', () => { beat.setOffset(Number($('sync').value) / 1000); showSync(); });
const setLook = (m) => { look.mode = m; $('look').textContent = `Show: ${m}`; }; setLook(look.mode); $('look').addEventListener('click', () => setLook({ lasers: 'flow', flow: 'both', both: 'lasers' }[look.mode]));
$('set').addEventListener('click', () => { fest.set = !fest.set; $('set').classList.toggle('on', fest.set); $('set').textContent = `Stage set: ${fest.set ? 'on' : 'off'}`; }); $('set').classList.toggle('on', fest.set); $('set').textContent = `Stage set: ${fest.set ? 'on' : 'off'}`;
$('theme').innerHTML = '<option value="auto">Automatic</option>' + THEMES.map((t, i) => `<option value="${i}">${t.name}</option>`).join(''); if (!dir.state.auto) $('theme').value = String(dir.state.theme);
$('theme').addEventListener('change', (e) => { if (e.target.value === 'auto') dir.state.auto = true; else { dir.state.auto = false; dir.setTheme(Number(e.target.value)); } });
const blackout = () => { dir.state.blackout = !dir.state.blackout; $('blackout').classList.toggle('on', dir.state.blackout); }, camToggle = () => { cam.moving = !cam.moving; $('cam').classList.toggle('on', cam.moving); $('cam').textContent = `Camera: ${cam.moving ? 'moving' : 'still'}`; if (!cam.moving) setCam(THEMES[dir.state.theme].festival ? FEST_CAMS[0] : 0); };
$('next').addEventListener('click', () => dir.nextLook()); $('blackout').addEventListener('click', blackout); $('cam').addEventListener('click', camToggle); if (!cam.moving) { cam.moving = true; camToggle(); }
for (const [id, f] of [['gain', (v) => { st.gain = v; }], ['haze', (v) => { rig.uniforms.uHaze.value = v; }], ['glow', (v) => { bloom.strength = v; }]]) { if (q.get(id)) $(id).value = q.get(id); $(id).addEventListener('input', (e) => f(Number(e.target.value))); f(Number($(id).value)); }
let idle = null, hidden = false; const wake = () => { $('ui').classList.remove('idle'); document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => { $('ui').classList.add('idle'); document.body.classList.add('idle'); }, 3500); };
addEventListener('pointermove', () => { if (!hidden) wake(); }); wake();
addEventListener('keydown', (e) => { if (e.target.tagName === 'SELECT') return; const k = e.key.toLowerCase(); if (e.code === 'Space') { e.preventDefault(); beat.tap(); } else if (k === 'n') dir.nextLook(); else if (k === 'l') $('look').click(); else if (k === 'b') blackout(); else if (k === 'h') { hidden = !hidden; if (hidden) { clearTimeout(idle); $('ui').classList.add('idle'); document.body.classList.add('idle'); } else wake(); } });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
window.__laser = { st, beat, dir, update, draw, RIG, rig, cam, camera, look, flow };
if (SHOT) { $('ui').style.display = 'none'; cam.moving = false; setCam(Number(q.get('cam') || 0), true); beat.tap(); const n = Number(q.get('beats') || 12) * 60 / 124; for (let t = 0; t < n; t += 1 / 60) update(1 / 60); draw(); window.ready = true; }
else { if (q.has('demo')) beat.tap(); let last = performance.now(), frames = 0, acc = 0, worst = 0;
  renderer.setAnimationLoop(() => { const now = performance.now(), ms = now - last; last = now; update(Math.min(0.1, ms / 1000)); draw(); frames++; acc += ms; worst = Math.max(worst, ms);
    const b = beat.state, d = dir.state; $('lamp').style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a3040'; $('listen').classList.toggle('on', b.mode === 'listen'); $('listen').textContent = b.mode === 'listen' ? 'Stop listening' : 'Listen to the music';
    $('status').textContent = failed || `${THEMES[d.theme].name} · ${d.pattern} · ` + (b.mode === 'off' ? 'still' : b.mode === 'tap' ? `running at ${b.bpm}` : b.act < 0.3 ? 'listening: no music' : !b.locked ? 'listening: finding the beat' : `on the beat at ${b.tempo.toFixed(1)}${b.section === 'breakdown' ? ' · breakdown' : ''}`);
    if (acc > 1000) { const mem = performance.memory ? ` · ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : ''; $('stats').textContent = `${Math.round(frames * 1000 / acc)} frames a second · slowest frame ${Math.round(worst)} ms${mem}`; frames = 0; acc = 0; worst = 0; } });
  window.ready = true; }
