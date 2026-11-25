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
import { createGifts, LEGEND, giftBeats, legendWake, filmStart } from './gifts.js';
import { createGiftFx, makeNameMaterial } from './giftfx.js';
import { stageGift, FILMS } from './giftcatalog.js';
import { createDirector, BUILDING, building, THEMES } from './director.js';

const q = new URLSearchParams(location.search), SHOT = q.has('shot'), $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: SHOT, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; $('frame').append(renderer.domElement);
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
const fest = { v: 0, set: q.get('set') !== '0' }, temple = new THREE.Group(), templeMat = new THREE.MeshBasicMaterial({ color: 0x000000 }), signMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }), pillars = [], lit = [], hall = { v: 0 };
// the words on the booth, and the big name: white letters on a see-through canvas, fitted to its width
const BOOTH_NAME = (q.get('name') || 'ZEUS').toUpperCase(), signCanvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 192 }), nameCanvas = Object.assign(document.createElement('canvas'), { width: 2048, height: 384 });
const NAME_W = 9.6, nameMat = makeNameMaterial(new THREE.CanvasTexture(nameCanvas));
function drawSign(c, tex, text) { const g = c.getContext('2d'), spaced = text.toUpperCase().split('').join('\u2009'); g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let px = Math.round(c.height * 0.78); do { g.font = `600 ${px}px Georgia, "Times New Roman", serif`; px -= 6; } while (g.measureText(spaced).width > c.width * 0.94 && px > 20); g.fillText(spaced, c.width / 2, c.height * 0.54); tex.needsUpdate = true; }
// The layout follows the Transmission stage: a temple of six pillars in the middle, and three free-standing pillars either side.
const bulbs = [], bulbGlow = { v: 0 }, WARM = [new THREE.Color(0xffa84a), new THREE.Color(0xff2f52), new THREE.Color(0xffe23c), new THREE.Color(0xffb436), new THREE.Color(0xdfe8ff)], lampCol = new THREE.Color(0xffa84a);
{ const add = (g, x, y, z, m = templeMat) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); temple.add(o); return o; };
  // each pillar has its own light, so the building cues can pick them out one at a time. The picture on it gives the fluting and
  // the fall-off of a lamp at its foot: bright low down, fading towards the top, brightest on the side that faces the audience.
  const flute = document.createElement('canvas'); flute.width = 256; flute.height = 256; { const g = flute.getContext('2d'), im = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const u = x / 256, h = 1 - y / 255, face = Math.pow(Math.max(0, Math.cos(u * Math.PI * 2)), 0.55), fl = 0.62 + 0.38 * Math.abs(Math.sin(u * Math.PI * 20)), up = 0.3 + 0.7 * Math.pow(1 - h, 1.3), v = Math.min(255, 255 * (0.08 + 0.92 * face) * fl * up), k = (y * 256 + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; } g.putImageData(im, 0, 0); }
  const fluteTex = new THREE.CanvasTexture(flute); fluteTex.colorSpace = THREE.SRGBColorSpace;
  const pillar = (x, z, h) => { const m = new THREE.MeshBasicMaterial({ color: 0x000000, map: fluteTex, toneMapped: false }), flat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
    const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: 0x000000 })); lamp.position.set(x, 0.85, z + 0.4); lamp.scale.set(1.5, 0.9, 1); temple.add(lamp);
    add(new THREE.CylinderGeometry(0.25, 0.3, h, 24), x, 0.7 + h / 2, z, m); add(new THREE.BoxGeometry(0.8, 0.16, 0.8), x, 0.78 + h, z, flat); add(new THREE.BoxGeometry(0.8, 0.2, 0.8), x, 0.6, z, flat); pillars.push({ m, flat, lamp, v: 0, x, z, top: 0.86 + h }); };
  for (const x of [-6.6, -5.5, -4.4]) pillar(x, -5.9, 3.9); for (let i = 0; i < 6; i++) pillar(-2.25 + i * 0.9, -6.2, 4.6); for (const x of [4.4, 5.5, 6.6]) pillar(x, -5.9, 3.9);
  add(new THREE.BoxGeometry(5.9, 0.55, 1.0), 0, 5.73, -6.2); add(new THREE.BoxGeometry(6.6, 0.5, 2.0), 0, 0.25, -5.9);
  const ped = new THREE.Shape(); ped.moveTo(-3.15, 0); ped.lineTo(3.15, 0); ped.lineTo(0, 1.25); ped.closePath(); add(new THREE.ShapeGeometry(ped), 0, 6.0, -6.2);
  add(new THREE.BoxGeometry(4.6, 1.05, 1.2), 0, 0.55, -3.4);   // the booth
  // the rows of warm bulbs round the temple: an arch over it and a row by each side group
  const bulb = (x, y) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: 0x000000 })); sp.position.set(x, y, -5.5); sp.scale.setScalar(0.25); temple.add(sp); bulbs.push(sp); };
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.12 + 0.76 * i / 12); bulb(Math.cos(a) * 4.3, 5.6 + Math.sin(a) * 2.9); } for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) bulb(s * (4.0 + i * 1.0), 5.2 + r * 0.7);
  signMat.map = new THREE.CanvasTexture(signCanvas); add(new THREE.PlaneGeometry(3.4, 0.64), 0, 0.58, -2.79, signMat); drawSign(signCanvas, signMat.map, BOOTH_NAME);
  // a sender's name in lights across the temple front, for a big gift
  add(new THREE.PlaneGeometry(NAME_W, 1.8), 0, 3.7, -4.9, nameMat).renderOrder = 30; temple.visible = false; scene.add(temple); }

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
CAMS.push({ p: [-6.2, 1.1, -0.6], t: [-4.6, 2.9, -6], f: 46 }, { p: [6.2, 1.1, -0.6], t: [4.6, 2.9, -6], f: 46 }, { p: [-2.4, 1.3, 1.6], t: [1.5, 3.2, -6.2], f: 50 }, { p: [0, 1.6, 4.4], t: [0, 3.3, -6], f: 56 });   // close on a side group from each side, across the temple front, and square on
CAMS.push({ p: [0, 0.7, 6.2], t: [0, 9.2, -7.5], f: 80 },
  // 15 to 18, for the largest gifts: from the foot of the temple looking straight up it; far back with the temple and the whole sky; and low from either side
  { p: [0, 0.4, 0.6], t: [0, 6.4, -6.2], f: 82 }, { p: [0, 1.5, 11.5], t: [0, 8.6, -7.5], f: 74 }, { p: [-7.5, 0.7, 7.5], t: [1.0, 9.0, -7.5], f: 78 }, { p: [7.5, 0.7, 7.5], t: [-1.0, 9.0, -7.5], f: 78 },
  { p: [0, 1.2, 15.5], t: [0, 11.5, -8], f: 66 }, { p: [0, 1.0, 12.0], t: [0, 12.5, -8], f: 60 });   // 19 and 20, for a film sky: the temple small at the foot of the picture, then closer   // 14: looking up over the temple at the sky, for a figure drawn there
const CLUB_CAMS = [0, 1, 2, 3, 4, 5], FEST_CAMS = [6, 7, 8, 9], CUT_CAMS = [13, 6, 10, 13, 11, 9, 12, 6];
const cam = { i: Number(q.get('cam') || 0), x: eased(0), y: eased(1.45), z: eased(5.2), tx: eased(0), ty: eased(1.9), tz: eased(-1), f: eased(52), moving: q.get('camera') !== '0', lastCue: -1, cut: -1 };
const setCam = (i, snap = false) => { cam.i = i % CAMS.length; const c = CAMS[cam.i]; if (!c) return; for (const [k, v] of [['x', c.p[0]], ['y', c.p[1]], ['z', c.p[2]], ['tx', c.t[0]], ['ty', c.t[1]], ['tz', c.t[2]], ['f', c.f]]) { cam[k].to = v; if (snap) { cam[k].v = v; cam[k].vel = 0; } } }; setCam(cam.i, true);

// ---------- the show
const st = { t: 0, gain: Number(q.get('gain') ?? 1) }, BPM = Math.min(200, Math.max(60, Number(q.get('bpm')) || 124)), beat = createBeat({ bpm: BPM }), dir = createDirector({ seed: 11 });
if (q.get('theme') !== null) { dir.setTheme(Number(q.get('theme'))); dir.state.auto = false; }
const main = new THREE.Color(THEMES[dir.state.theme].main), accent = new THREE.Color(THEMES[dir.state.theme].accent), C = new THREE.Color(), E2 = new THREE.Color(), D = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Euler();
// a direction in the projector's own frame, turned to where the projector is pointing. ax is the angle across the fan; roll tips the fan's plane.
const aim = (out, p, ax, coneA, phi) => { const e = p.e, cx = Math.sin(ax) * Math.cos(e.roll.v), cy = Math.sin(ax) * Math.sin(e.roll.v), k = e.cone.v;
  out.set(cx * (1 - k) + Math.sin(coneA) * Math.cos(phi) * k, cy * (1 - k) + Math.sin(coneA) * Math.sin(phi) * k, Math.cos(ax) * (1 - k) + Math.cos(coneA) * k).normalize().applyEuler(E.set(-(p.pitch + e.tilt.v), p.yaw + e.pan.v, 0, 'YXZ')); return out; };
// ---------- gift moments (ZW-045). Fired by the test buttons today; window.zeusGift(size, name) is the door for TikFinity later.
const gifts = createGifts(pillars.length), gift = { wings: 0, tint: null, dim: 1, last: 0, sign: BOOTH_NAME, booth: '', hit: null, who: null, gold: 0, edge: new THREE.Vector3() };
const fx = createGiftFx({ scene, pillars, peak: new THREE.Vector3(0, 7.2, -6.1), soft }), GOLD = new THREE.Color(0xffb436), PALE = new THREE.Color(0xfff0c8), SILVER = new THREE.Color(0xdfe8ff);
window.zeusGift = (size, name, figure) => gifts.add({ size, name, figure });
// for TikFinity later: a real gift by its name and coins. The catalogue decides its size and, for the largest, its figure.
window.zeusGiftFromTikTok = (giftName, coins, sender) => gifts.add({ ...stageGift(giftName, coins), name: sender });
let drops = 0, gA = null;
function update(dt) { const b = beat.state; beat.update(dt); st.t += dt;
  // the music's shape: quiet patterns while the bass is out, the biggest one the moment it comes back
  if (b.mode === 'listen') { dir.setCalm(b.section === 'breakdown'); if (b.drops !== drops) { drops = b.drops; dir.hit(); } } else dir.setCalm(false);
  const d = dir.update(b.beats), theme = THEMES[d.theme], kick = 0.74 + 0.26 * b.pulse;
  // gifts keep their own time, so one can be played with no music: the beat when there is one, otherwise two beats a second
  { const playing = b.act > 0.3, onClock = !playing || !!(gifts.state.active && gifts.state.active.film), dB = onClock ? dt * 2 : Math.max(0, Math.min(1, b.beats - gift.last)), onBeat = playing ? Math.floor(b.beats) !== Math.floor(gift.last) : true; gift.last = b.beats;
    gA = gifts.update(dB, dt, onBeat, playing ? onBeat && Math.floor(b.beats) % 4 === 0 : onBeat);
    if (gA !== gift.who) { gift.who = gA; gift.booth = ''; gift.wings = 0; gift.tint = gA && gA.film && gA.film.staging === 'pegasus' ? SILVER : GOLD; if (gA && (gA.size === 'big' || gA.size === 'legend') && gA.name) drawSign(nameCanvas, nameMat.uniforms.map.value, gA.name); }
    // the script's requests, each acted on once: lightning, the leap between pillars, the name arriving on the booth
    for (const e of gifts.state.fx.splice(0)) { if (e.type === 'bolt') fx.bolt(e.pillar, e.power); else if (e.type === 'arc') fx.arc(e.from, e.to); else if (e.type === 'draw') fx.figure(e.figure, e.tier); else if (e.type === 'film') fx.playFilm(e.figure, FILMS[e.figure].src, !!FILMS[e.figure].staging); else if (e.type === 'wake') { if (gA && gA.film) fx.roar(); else { fx.wake(); if (playing) dir.hit(); } } else if (e.type === 'ring') fx.ring(0.8); else if (e.type === 'web') fx.web(); else if (e.type === 'meteors') fx.shower(e.beats * (playing ? 60 / b.tempo : 0.5)); else if (e.type === 'ascend') fx.ascend(); else if (e.type === 'wings') gift.wings = 1; else if (gA && gA.name) gift.booth = gA.name; }
    const legend = gA && gA.size === 'legend', grand = gA && (gA.size === 'big' || legend), W = legend ? legendWake(gA) : 0, gEnd = gA ? giftBeats(gA) : 0;
    if (gA && gA.size === 'big' && gA.t >= 2.25 && gift.hit !== gA) { gift.hit = gA; if (playing) dir.hit(); }
    // while a small or medium gift plays the lasers step back; a big one is black while the storm gathers, then lets everything loose in gold
    // for the largest gifts the lasers also wait while the figure is drawn, and stay off while a film plays
    const want = !gA ? 1 : legend ? (gA.t < 2.25 ? 0 : gA.film ? (gift.wings ? 0.36 : gA.t < 2.25 || gA.t < gEnd - 5 ? 0 : 0.6) : gA.t < W ? 0.08 : 0.34 + 0.1 * gA.tier) : grand ? (gA.t < 2.25 ? 0 : 1) : 0.18;
    gift.dim += (want - gift.dim) * Math.min(1, dt * (want < gift.dim ? 12 : 4));
    gift.gold += ((grand && gA.t >= 1 && gA.t < gEnd - 1 ? 1 : 0) - gift.gold) * Math.min(1, dt * 5);
    const text = gift.booth || BOOTH_NAME; if (text !== gift.sign) { gift.sign = text; drawSign(signCanvas, signMat.map, text); } }
  look.beams += ((look.mode === 'flow' ? 0 : 1) - look.beams) * Math.min(1, dt * 2.5); look.flow += ((look.mode === 'lasers' ? 0 : 1) - look.flow) * Math.min(1, dt * 1.2); const act = b.act * look.beams * gift.dim;
  // the flow keeps the theme's two colours and adds a third from across the colour wheel. It drifts faster with the energy of the music, calms in a breakdown, and stops with the music.
  { const hsl = {}; main.getHSL(hsl); look.third.setHSL((hsl.h + 0.42) % 1, 1, 0.55);
    flow.update(dt * b.act, { level: look.flow * b.act * (d.blackout ? 0 : 1) * st.gain * (look.mode === 'both' ? 0.55 : 1), speed: (b.section === 'breakdown' ? 0.6 : 0.8 + 1.4 * b.energy), pulse: b.pulse, a: main, b: accent, c: look.third, aspect: camera.aspect }); }
  main.lerp(C.set(theme.main).lerp(gift.tint || GOLD, gift.gold), Math.min(1, dt * (gift.gold > 0.5 ? 8 : 1.2))); accent.lerp(C.set(theme.accent).lerp(PALE, gift.gold), Math.min(1, dt * (gift.gold > 0.5 ? 8 : 1.2)));
  if (SHOT && q.get('pattern')) d.pattern = q.get('pattern');
  // Pegasus: while his wings are open the lasers hold the shape of wings, whatever the director had planned
  if (gift.wings && gA) { d.pattern = 'wings'; d.dark = false; }
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
  fest.v += ((theme.festival || gA ? 1 : 0) - fest.v) * Math.min(1, dt * (gA ? 8 : 1.5)); const fv = fest.v * (fest.set || gA ? 1 : 0);   // a gift brings the temple on, whatever the theme
  if (fv > 0.01 && act > 0.01 && !d.dark && !BUILDING.has(d.pattern)) { const I = act * st.gain * fv * (0.28 + 0.12 * b.pulse);
    for (let i = 0; i <= 8; i++) rig.beam(A.set(-2.8 + i * 0.7, 0.9, -5.6), D.set(0, 1, 0), 4.6, main, I, 0.006, 0);
    for (let i = 0; i <= 6; i++) rig.beam(A.set(-2.9, 1.3 + i * 0.65, -5.6), D.set(1, 0, 0), 5.8, main, I, 0.006, 0); }
  // The building cues (ZW-041): the lasers are dark and the building is lit, in warm light as in the video, pillar by pillar.
  // A lamp comes on at once and dies away quickly, as a real one does.
  const cueShow = BUILDING.has(d.pattern) && theme.festival, N = pillars.length; if (cueShow && !fest.set && !gA && !SHOT) dir.nextLook();
  const gDark = !!gA && (gA.size === 'legend' ? gA.t < legendWake(gA) : gA.size !== 'big' || gA.t < 2.25), show = cueShow || gDark;
  building(cueShow && !gA && !d.dark && b.act > 0.3 ? d.pattern : '', b.beats, N, lit); if (gA) { gifts.lights(lit); lit[N + 2] = gA.film && gA.film.staging === 'pegasus' ? 4 : 3; }
  const fall = Math.exp(-dt * 16); if (show || gA) lampCol.lerp(WARM[lit[N + 2]], Math.min(1, dt * 14));
  temple.visible = fv > 0.01; if (temple.visible) { const amb = 0.02 * fv * (0.25 + 0.75 * b.act) * (d.dark ? 0.3 : 1) * (show ? 0.1 : 1);
    hall.v = Math.max(lit[N], hall.v * fall); templeMat.color.copy(main).multiplyScalar(amb).add(C.copy(lampCol).multiplyScalar(0.10 * hall.v * fv * st.gain));
    pillars.forEach((p, i) => { p.v = Math.max(lit[i], p.v * fall); const k = fv * st.gain * p.v; p.m.color.copy(main).multiplyScalar(amb * 6).add(C.copy(lampCol).lerp(E2.set(0xffffff), 0.25).multiplyScalar(2.6 * k)); p.flat.color.copy(main).multiplyScalar(amb).add(C.copy(lampCol).multiplyScalar(0.3 * k)); p.lamp.material.color.copy(lampCol).lerp(E2.set(0xffffff), 0.4).multiplyScalar(1.2 * k); });
    bulbGlow.v = Math.max(lit[N + 1], bulbGlow.v * Math.exp(-dt * 7)); for (const sp of bulbs) { sp.material.color.copy(WARM[0]).lerp(E2.set(0xffffff), 0.3).multiplyScalar(2.2 * bulbGlow.v * fv * st.gain); sp.scale.setScalar(0.2 + 0.3 * bulbGlow.v); }
    signMat.color.setScalar(fv * (gift.booth ? 2.2 : (0.5 + 1.3 * b.act) * (d.blackout ? 0 : 1) * (show ? 0.06 : 1)));
    }
  // the storm, the lightning, the sparks and rain, the flames, and the name being forged and burned away
  { const legend = gA && gA.size === 'legend', big = gA && (gA.size === 'big' || legend), t = gA ? gA.t : 0, W = legend ? legendWake(gA) : 0, t0 = legend ? W + 1.5 : 3, end = gA ? giftBeats(gA) : 16;
    const reveal = big && gA.name ? Math.min(1, Math.max(0, (t - t0) / 1.6)) : 0, writing = reveal > 0.001 && reveal < 0.999;
    const u = nameMat.uniforms; u.uReveal.value = reveal; u.uBurn.value = big ? Math.min(1, Math.max(0, (t - (end - 1.7)) / 1.6)) : 0; u.uTime.value = st.t; u.uLevel.value = big ? fv * st.gain : 0;
    if (writing) gift.edge.set(-NAME_W / 2 + (reveal * 1.08 - 0.04) * NAME_W, 3.7, -4.85);
    // the figure: drawn from beat 2.5 to 7, held, and let go over the last two beats, its stars falling
    const sky = legend && !gA.film && t >= 2.5 ? { progress: Math.min(1, (t - 2.5) / (W - 2.6)), glow: t > end - 3 ? Math.max(0, (end - t) / 3) : 1, falling: t > end - 4 ? 1 : 0 } : null;
    // the cinema bars and the title: who gave, and what
    if (frameEl.classList.contains('cine') !== !!legend) { frameEl.classList.toggle('cine', !!legend); if (legend) $('title').textContent = [gA.name, gA.label].filter(Boolean).join('  ·  ').toUpperCase(); } frameEl.classList.toggle('titled', !!legend && t >= W + 1 && t < end - 3);
    fx.update(dt, { cloud: !gA ? 0 : legend && gA.film && t > filmStart(gA) + 0.5 ? 0.15 : big ? 1 : gA.size === 'medium' ? 0.6 : 0.35, rain: big && t >= t0 + 0.2 && t < end - 1.5 ? 1 : 0, flames: gifts.state.flames, level: fv * st.gain, camera, anticipation: big && t < 2 ? 0.3 + 0.35 * t : 0, edge: writing ? gift.edge : null, sky, aurora: legend && !gA.film && gA.tier >= 2 && t >= W && t < end - 4 ? 1 : 0, feathers: gift.wings && gA && t < end - 3 ? 1 : 0 });
    if (!gA) fx.stopFilm();
    fx.draw(rig, st.gain); }
  rig.end(st.t, camera, renderer.domElement.height);
  // the camera moves on every second cue, or every cue in a lively theme; never in a still one
  const views = theme.festival ? FEST_CAMS : CLUB_CAMS; if (!SHOT && !views.includes(cam.i) && cam.cut === -1) setCam(views[0]);   // each rig has its own views
  if (cam.moving && d.cue !== cam.lastCue) { if (!gA && cam.lastCue !== -1 && theme.camera !== 'still' && (theme.camera === 'lively' || d.cue % 2 === 0)) setCam(views[(views.indexOf(cam.i) + 1 + (d.cue % 3 === 0 ? 1 : 0)) % views.length]); cam.lastCue = d.cue; }
  // in a building cue the view cuts, as the video does: a new angle every four beats, close on the pillars as often as wide
  // a gift is seen square on. For a big one the view starts far back, pushes in while the storm gathers, and draws back at the end.
  if (cam.moving && gA && !SHOT) { const L = gA.size === 'legend', t = gA.t; let view, snap = false, key;
    if (L) { const Wk = legendWake(gA), end = giftBeats(gA), turn = Math.floor((t - Wk - 3) / 8);
      // the omen from far back, pushing in; the strike from the foot of the temple; up into the sky as the figure is drawn; a cut to the
      // whole picture as it wakes; then slow passes from side to side for as long as the show runs; and back, far, for the farewell
      // Zeus: from far back; then a cut to the foot of the temple, looking straight up it into the dark as the eyes open; a cut to the
      // whole picture in time to see the thunderbolt thrown and land; then closer, and back out for the end
      // Pegasus: from far back; the whole picture to watch him come; closer as the wings open; then the view lifts to follow him up
      if (gA.film && gA.film.staging === 'pegasus') { if (t < 0.6) { view = 9; snap = true; } else if (t < Wk - 2) { view = 19; snap = t < 1.1; } else if (t < Wk + 5) view = 20; else if (t < end - 4) view = 14; else view = 19; }
      else if (gA.film && gA.film.staging === 'zeus') { if (t < 0.6) { view = 9; snap = true; } else if (t < Wk - 3) { view = 15; snap = true; } else if (t < Wk + 3.5) { view = 19; snap = t < Wk - 2.5; } else if (t < end - 5) view = 20; else view = 19; }
      else if (t < 0.15) { view = 9; snap = true; } else if (t < 1.9) view = 6; else if (t < 2.7) { view = 15; snap = true; }
      // with a film for a sky: a cut to the whole picture as the clip begins, a slow push up towards it for its big moment, and back
      else if (gA.film) { if (t < Wk - 3) { view = 19; snap = t < 3.2; } else if (t < Wk + 6) view = 20; else view = 19; }
      else if (t < Wk) view = 14; else if (t < Wk + 3) { view = 16; snap = true; } else if (t > end - 4) view = 16; else view = gA.tier === 1 ? 14 : [17, 14, 18, 16][turn % 4]; key = 'L' + view; }
    else if (gA.size === 'big') { view = t < 0.15 ? 9 : t < 12.5 ? 6 : 9; snap = t < 0.15; key = 'B' + view; } else { view = gA.size === 'small' ? 13 : 6; snap = true; key = 'S' + view; }
    if (cam.cut !== key) { cam.cut = key; setCam(view, snap); } }
  else if (cam.moving && cueShow && !SHOT) { const n = Math.floor(b.beats / 4); if (n !== cam.cut) { cam.cut = n; setCam(CUT_CAMS[n % CUT_CAMS.length], true); } } else if (cam.cut !== -1 && !cueShow && !gA) { cam.cut = -1; if (!SHOT) setCam(views[0], true); }
  for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz', 'f']) step(cam[k], dt, 2.4, 3); const sway = cam.moving ? 1 : 0;
  camera.position.set(cam.x.v + Math.sin(st.t * 0.21) * 0.14 * sway, cam.y.v + Math.sin(st.t * 0.17 + 1) * 0.06 * sway, cam.z.v + Math.sin(st.t * 0.13 + 2) * 0.12 * sway); if (fx.shake > 0.001) { camera.position.x += (Math.random() - 0.5) * fx.shake; camera.position.y += (Math.random() - 0.5) * fx.shake; }   // the ground jumps when lightning lands
  camera.lookAt(cam.tx.v, cam.ty.v, cam.tz.v);
  if (Math.abs(camera.fov - cam.f.v) > 0.01) { camera.fov = cam.f.v; camera.updateProjectionMatrix(); } }
const draw = () => composer.render();

// ---------- controls
let bgMode = q.get('bg') || 'black', failed = ''; const setBg = () => { document.body.classList.toggle('clear', bgMode === 'clear'); document.body.classList.toggle('mock', bgMode === 'mock'); $('bg').textContent = `Background: ${bgMode === 'mock' ? 'stand-in camera' : bgMode}`; }; setBg();
$('bg').addEventListener('click', () => { bgMode = { black: 'clear', clear: 'mock', mock: 'black' }[bgMode]; setBg(); });
$('listen').addEventListener('click', () => { if (beat.state.mode === 'listen') beat.unlisten(); else beat.listen().catch((e) => { failed = 'could not listen: ' + e.message; }); });
let dbg = null; if (q.get('debug') === '1') { dbg = document.createElement('div'); dbg.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:50;padding:8px 14px;font:600 20px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.72);pointer-events:none'; const lamp = document.createElement('span'); lamp.style.cssText = 'display:inline-block;width:16px;height:16px;border-radius:50%;vertical-align:-1px;background:#2a3040'; dbg.append(lamp, document.createTextNode('')); document.body.append(dbg); }
// Listening to a sound input (ZW-048): a sound card or mixer, or the microphone. Nothing has to be shared, so it also works where
// sharing a tab is not possible. ?listen=input starts it with the page; ?input=rode picks the input whose name contains that.
const fillInputs = async () => { const sel = $('inputs'), list = await beat.inputs(); sel.textContent = ''; for (const d of list) { const o = document.createElement('option'); o.value = d.deviceId; o.textContent = d.label || 'sound input'; o.selected = d.label === beat.state.input; sel.append(o); } sel.style.display = list.length > 1 ? '' : 'none'; };
const listenInput = (which) => { failed = ''; return beat.listen('input', which).then(() => { store.set('input', beat.state.input); return fillInputs(); }).catch((e) => { failed = 'could not listen to a sound input: ' + e.message; throw e; }); };
$('listenIn').addEventListener('click', () => { if (beat.state.mode === 'listen') beat.unlisten(); else listenInput(q.get('input') || store.get('input') || '').catch(() => {}); });
$('inputs').addEventListener('change', () => { beat.unlisten(); listenInput($('inputs').value).catch(() => {}); });
$('tap').addEventListener('pointerdown', () => beat.tap()); $('stop').addEventListener('click', () => beat.stop()); $('demo').addEventListener('click', () => { beat.state.bpm = BPM; beat.tap(); });
$('sync').value = String(Math.round(beat.state.offset * 1000)); const showSync = () => { const v = Number($('sync').value); $('syncv').textContent = v === 0 ? 'as heard' : `${Math.abs(v)} ms ${v > 0 ? 'later' : 'earlier'}`; }; showSync();
$('sync').addEventListener('input', () => { beat.setOffset(Number($('sync').value) / 1000); showSync(); });
const setLook = (m) => { look.mode = m; $('look').textContent = `Show: ${m}`; }; setLook(look.mode); $('look').addEventListener('click', () => setLook({ lasers: 'flow', flow: 'both', both: 'lasers' }[look.mode]));
$('set').addEventListener('click', () => { fest.set = !fest.set; $('set').classList.toggle('on', fest.set); $('set').textContent = `Stage set: ${fest.set ? 'on' : 'off'}`; }); $('set').classList.toggle('on', fest.set); $('set').textContent = `Stage set: ${fest.set ? 'on' : 'off'}`;
$('theme').innerHTML = '<option value="auto">Automatic</option>' + THEMES.map((t, i) => `<option value="${i}">${t.name}</option>`).join(''); if (!dir.state.auto) $('theme').value = String(dir.state.theme);
$('theme').addEventListener('change', (e) => { if (e.target.value === 'auto') dir.state.auto = true; else { dir.state.auto = false; dir.setTheme(Number(e.target.value)); } });
const blackout = () => { dir.state.blackout = !dir.state.blackout; $('blackout').classList.toggle('on', dir.state.blackout); }, camToggle = () => { cam.moving = !cam.moving; $('cam').classList.toggle('on', cam.moving); $('cam').textContent = `Camera: ${cam.moving ? 'moving' : 'still'}`; if (!cam.moving) setCam(THEMES[dir.state.theme].festival ? FEST_CAMS[0] : 0); };
$('next').addEventListener('click', () => dir.nextLook()); $('blackout').addEventListener('click', blackout); $('cam').addEventListener('click', camToggle); if (!cam.moving) { cam.moving = true; camToggle(); }
for (const [id, f] of [['gain', (v) => { st.gain = v; }], ['haze', (v) => { rig.uniforms.uHaze.value = v; }], ['glow', (v) => { bloom.strength = v; }]]) { if (q.get(id)) $(id).value = q.get(id); $(id).addEventListener('input', (e) => f(Number(e.target.value))); f(Number($(id).value)); }
// ---------- layout (ZW-044): the picture is a 16:9 box in the middle of the space above the controls. size is its share of the largest box that fits.
// With ?ui=0 (a browser source) or in a still there are no controls and the picture fills the window, whatever its shape.
const frameEl = $('frame'), area = $('area'), grip = $('grip'), PLAIN = q.get('ui') === '0' || SHOT, store = { get: (k) => { try { return localStorage.getItem('laser-' + k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('laser-' + k, v); } catch { /* private window */ } } };
const view = { size: Math.max(0.25, Math.min(1, Number(q.get('size') ?? store.get('size') ?? 60) / 100)), max: 1 }; if (PLAIN) document.body.classList.add('plain');
const fit = () => { const W = area.clientWidth, H = area.clientHeight; let w = W, h = H, x = 0, y = 0;
  if (!PLAIN) { view.max = Math.max(0.02, Math.min(W / 1920, H / 1080)); const k = view.max * view.size; w = Math.floor(1920 * k); h = Math.floor(1080 * k); x = Math.round((W - w) / 2); y = Math.round((H - h) / 2); }
  if (w < 2 || h < 2) return; frameEl.style.width = `${w}px`; frameEl.style.height = `${h}px`; frameEl.style.left = `${x}px`; frameEl.style.top = `${y}px`; grip.style.left = `${x + w - 14}px`; grip.style.top = `${y + h - 14}px`;
  renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
const setSize = (v, save = true) => { view.size = Math.max(0.25, Math.min(1, v)); $('size').value = String(Math.round(view.size * 100)); $('sizev').textContent = `${Math.round(view.size * 100)}%`; if (save) store.set('size', String(Math.round(view.size * 100))); fit(); };
$('size').addEventListener('input', () => setSize(Number($('size').value) / 100));
// dragging the corner: the box stays centred and 16:9, so its width is twice the pointer's distance from the middle
grip.addEventListener('pointerdown', (e) => { grip.setPointerCapture(e.pointerId); const move = (m) => { const r = area.getBoundingClientRect(), half = Math.max(m.clientX - (r.left + r.width / 2), (m.clientY - (r.top + r.height / 2)) * 16 / 9); setSize(2 * half / (1920 * view.max)); };
  const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); }; grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); });
grip.addEventListener('dblclick', () => setSize(view.size > 0.99 ? 0.6 : 1));
let hidden = PLAIN; const showUi = () => { $('ui').classList.toggle('gone', hidden); fit(); }; showUi(); setSize(view.size, false); new ResizeObserver(fit).observe(area); addEventListener('resize', fit);
const sendGift = (size) => gifts.add({ size, name: $('gname').value }); $('g4').addEventListener('click', () => gifts.state.flames.fill(150)); for (const [id, g, coins] of [['g5', 'Wolf', 5500], ['g6', 'Black Tiger', 22000], ['g7', 'Leon and Lion', 34000], ['g8', 'Zeus', 34000], ['g9', 'Pegasus', 42999]]) $(id).addEventListener('click', () => gifts.add({ ...stageGift(g, coins), name: $('gname').value })); for (const [id, size] of [['g1', 'small'], ['g2', 'medium'], ['g3', 'big']]) $(id).addEventListener('click', () => sendGift(size));
addEventListener('keydown', (e) => { if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' && e.target.type === 'text') return; if (['1', '2', '3'].includes(e.key)) { sendGift(['small', 'medium', 'big'][Number(e.key) - 1]); return; } const k = e.key.toLowerCase(); if (e.code === 'Space') { e.preventDefault(); beat.tap(); } else if (k === 'n') dir.nextLook(); else if (k === 'l') $('look').click(); else if (k === 'b') blackout(); else if (k === 'h' && !PLAIN) { hidden = !hidden; showUi(); } });
window.__laser = { gifts, gift, fx, view, st, beat, dir, update, draw, RIG, rig, cam, camera, look, flow };
if (SHOT) { cam.moving = false; setCam(Number(q.get('cam') || 0), true); beat.tap(); if (q.get('gift')) gifts.add({ size: q.get('gift'), name: q.get('gname') || '', figure: q.get('figure'), tier: Number(q.get('tier') || 1), label: q.get('label') || '', film: q.has('film') ? FILMS[q.get('figure')] : null }); const n = Number(q.get('beats') || 12) * 60 / 124; for (let t = 0; t < n; t += 1 / 60) update(1 / 60);
  // a film clip is put at the second the show has reached, and the still waits for that frame
  const act = gifts.state.active; (act && act.film && act.t > filmStart(act) ? fx.seekFilm((act.t - filmStart(act)) / 2) : Promise.resolve()).then(() => { update(0.0001); draw(); requestAnimationFrame(() => { draw(); window.ready = true; }); }); }
else {
  // a page with its controls off (a browser source) has nobody to press Demo, so it starts by itself, unless the address says calm=1
  if (q.get('listen') === 'input') listenInput(q.get('input') || '').catch(() => { if (q.get('ui') === '0') beat.tap(); }); else if (q.has('demo') || (q.get('ui') === '0' && q.get('calm') !== '1')) beat.tap(); let last = performance.now(), frames = 0, acc = 0, worst = 0;
  const frame = (viaTimer) => { const now = performance.now(), ms = now - last; if (viaTimer === true && ms < 90) return; last = now; update(Math.min(0.1, ms / 1000)); draw(); frames++; acc += ms; worst = Math.max(worst, ms);
    const b = beat.state, d = dir.state; $('lamp').style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a3040'; $('listen').classList.toggle('on', b.mode === 'listen'); $('listen').textContent = b.mode === 'listen' ? 'Stop listening' : 'Listen to the music'; $('listenIn').style.display = b.mode === 'listen' ? 'none' : '';
    const lit12 = gifts.state.flames.filter((f) => f > 0).length; $('flames').textContent = `Flames ${lit12} of 12`;
    $('status').textContent = failed || `${THEMES[d.theme].name} · ${d.pattern} · ` + (b.mode === 'off' ? 'still' : b.mode === 'tap' ? `running at ${b.bpm}` : b.act < 0.3 ? `listening${b.input ? ' to ' + b.input : ''}: no music` : !b.locked ? 'listening: finding the beat' : `on the beat at ${b.tempo.toFixed(1)}${b.section === 'breakdown' ? ' · breakdown' : ''}`);
    // ?debug=1 puts the same line, and a lamp that blinks on the beat, on the picture: for checking a controls-off page (an OBS browser source)
    if (dbg) { dbg.lastChild.textContent = ' ' + $('status').textContent + (b.mode === 'listen' && b.input ? ` · hearing: ${b.input} · level ${Math.round(b.level * 100)}` : '') + (b.mode === 'tap' && q.get('listen') === 'input' ? ' · NOT listening (the sound input was refused)' : ''); dbg.firstChild.style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a3040'; }
    if (acc > 1000) { const mem = performance.memory ? ` · ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : ''; $('stats').textContent = `${Math.round(frames * 1000 / acc)} frames a second · slowest frame ${Math.round(worst)} ms${mem}`; frames = 0; acc = 0; worst = 0; } };
  renderer.setAnimationLoop(() => frame());
  // a browser stops its drawing loop for a window it thinks nobody can see, and a window capture freezes; a worker's timer keeps the show stepping then (ZW-043)
  try { const w = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 33)'], { type: 'application/javascript' }))); w.onmessage = () => frame(true); } catch { /* no workers: the normal loop alone */ }
  window.ready = true; }
