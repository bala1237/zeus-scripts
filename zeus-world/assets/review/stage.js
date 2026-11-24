// The Zeus Stage: a show for the owner's music, separate from the city. A dark arena with a great screen of moving backgrounds
// that change every 32 beats, fans of laser light, sweeping beams, haze, a crowd in silhouette, and a camera that cuts between
// angles, all on the beat. "Backdrop only" shows just the moving background full screen, to sit behind a camera in OBS.
//   ?bpm=128  ?scene=0..5  ?mode=backdrop  ?auto=0  ?cuts=0  ?shot (one still; with ?beats=N how far in, ?cam=N which angle)
// The beat comes from beat.js: tapped in, or heard from the music.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createBeat } from './beat.js';

const q = new URLSearchParams(location.search), SHOT = q.has('shot');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020308);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 400);

// ---------- palettes: three colours each, used by the screen, the lasers and the beams together
const PALETTES = [[0x18ff9a, 0x1fa8ff, 0xb44dff], [0xff2d95, 0x7a3cff, 0x20d9ff], [0xff5a2a, 0xff2d95, 0xffd23f], [0x2fe6ff, 0xff3df2, 0xfff06a], [0x3d7bff, 0xffffff, 0x9bf6ff], [0xffc93c, 0xff4b3e, 0x9d4bff]];
const NAMES = ['Aurora', 'Tunnel', 'Sunset drive', 'Kaleidoscope', 'Warp', 'Skyline'];

// ---------- the screen: six moving pictures drawn by the graphics card, with a wipe between them
const frag = /* glsl */`
  precision highp float;
  varying vec2 vUv; uniform float uTime, uBeat, uEnergy, uMix, uAspect, uFlash, uAct; uniform int uA, uB; uniform vec3 a1, a2, a3, b1, b2, b3;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
  vec3 aurora(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float n = fbm(vec2(uv.x * 1.3, uv.y * 0.5 - t * 0.07)), y = uv.y + 0.25 * sin(uv.x * 1.7 + t * 0.25) - n * 0.7 + 0.15;
    float curtain = exp(-y * y * 5.0) + 0.6 * exp(-(y - 0.5) * (y - 0.5) * 9.0), rays = 0.6 + 0.4 * sin(uv.x * 26.0 + n * 9.0 + t * 0.6);
    vec3 col = mix(c1, c2, 0.5 + 0.5 * sin(uv.x * 2.0 + n * 5.0 + t * 0.2)) * curtain * rays * (0.75 + 0.6 * uBeat) + c3 * 0.25 * exp(-(y + 0.5) * (y + 0.5) * 6.0);
    float s = step(0.9975, hash(floor(uv * 190.0))); return col + vec3(s) * (0.4 + 0.6 * sin(t * 2.0 + uv.x * 40.0)) * (1.0 - curtain); }
  vec3 tunnel(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float r = length(uv) + 0.02, a = atan(uv.y, uv.x), z = 0.45 / r + t * 1.1;
    float rings = smoothstep(0.38, 0.5, abs(fract(z * 1.2) - 0.5)), spokes = smoothstep(0.42, 0.5, abs(fract(a / 6.2832 * 16.0 + sin(z * 0.6) * 0.3) - 0.5));
    vec3 col = (c1 * rings + c2 * spokes * 0.9) * smoothstep(0.0, 0.9, r) * 1.5; return col + c3 * (0.25 + uBeat) * 0.16 / (r * r * 3.0 + 0.06); }
  vec3 sunset(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float h = uv.y + 0.18; vec3 col = mix(c2 * 0.55, vec3(0.02, 0.01, 0.06), smoothstep(-0.1, 1.1, h));
    vec2 sp = uv - vec2(0.0, 0.2); float d = length(sp), sun = smoothstep(0.5, 0.485, d) * step(0.0, h) * step(0.5, fract(sp.y * 9.0 - t * 0.25) + smoothstep(-0.1, 0.35, sp.y));
    col += mix(c1, c3, smoothstep(-0.45, 0.5, sp.y)) * sun * (1.0 + 0.4 * uBeat) + c1 * 0.5 * exp(-d * 2.6) * step(0.0, h);
    float m = 0.1 + 0.16 * noise(vec2(uv.x * 2.4, 3.0)) + 0.05 * noise(vec2(uv.x * 9.0, 8.0)); col = mix(col, vec3(0.03, 0.0, 0.06), step(0.0, h) * step(h, m) * 0.92);
    if (h < 0.0) { vec2 p = vec2(uv.x / (-h + 0.05), 1.0 / (-h + 0.05) + t * 2.2); float lines = max(smoothstep(0.46, 0.5, abs(fract(p.x * 0.55) - 0.5)), smoothstep(0.44, 0.5, abs(fract(p.y * 0.35) - 0.5)));
      col = c2 * 0.14 + c3 * lines * smoothstep(0.0, 0.5, -h) * (0.75 + 0.6 * uBeat); }
    return col; }
  vec3 kalei(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float r = length(uv), a = atan(uv.y, uv.x) + t * 0.12; a = abs(mod(a, 0.7854) - 0.3927); vec2 p = r * vec2(cos(a), sin(a));
    float v = sin(p.x * 9.0 + t) + sin(p.y * 12.0 - t * 1.3) + sin((p.x + p.y) * 7.0 + t * 0.7) + sin(r * 14.0 - t * 2.2 - uBeat * 2.0);
    vec3 col = mix(c1, c2, 0.5 + 0.5 * sin(v * 1.6)); col = mix(col, c3, smoothstep(0.55, 1.0, sin(v * 2.3 + 1.0))); return col * (0.35 + 0.65 * smoothstep(-2.0, 2.5, v)) * (0.8 + 0.4 * uBeat); }
  vec3 warp(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float r = length(uv), a = atan(uv.y, uv.x); vec3 col = vec3(0.0);
    for (int i = 0; i < 3; i++) { float fi = float(i), n = 90.0 + fi * 70.0, id = floor(a / 6.2832 * n), h = hash(vec2(id, fi * 7.0)), sp = 0.35 + h * 0.9, s = fract(h * 13.0 + t * sp * (0.8 + uEnergy * 0.6)), head = s * 1.9, len = 0.05 + s * 0.4;
      float streak = smoothstep(head - len, head, r) * step(r, head) * step(0.45, hash(vec2(id, fi + 3.0))); col += mix(c1, c2, h) * streak * (0.5 + s); }
    return col + c3 * (0.2 + 0.8 * uBeat) * 0.06 / (r * r + 0.03) + c1 * 0.05; }
  vec3 skyline(vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { float n = 22.0, x = (uv.x / uAspect * 0.5 + 0.5) * n, id = floor(x), fx = fract(x), y = uv.y + 0.95;
    float hgt = (0.25 + 1.25 * noise(vec2(id * 1.7, floor(t * 7.0) * 0.31 + id)) * (0.45 + 0.75 * uEnergy)) * (0.75 + 0.35 * uBeat), bar = step(0.12, fx) * step(fx, 0.88) * step(y, hgt) * step(0.0, y);
    float seg = step(0.22, fract(y * 13.0)); vec3 col = mix(c1, c3, clamp(y / 1.5, 0.0, 1.0)) * bar * seg; col += c2 * 0.5 * exp(-abs(y - hgt) * 28.0) * step(0.12, fx) * step(fx, 0.88);
    return col + c2 * 0.1 * (1.0 - uv.y * 0.5 - 0.5) + c1 * 0.25 * exp(-y * 5.0); }
  vec3 pic(int id, vec2 uv, float t, vec3 c1, vec3 c2, vec3 c3) { if (id == 0) return aurora(uv, t, c1, c2, c3); if (id == 1) return tunnel(uv, t, c1, c2, c3); if (id == 2) return sunset(uv, t, c1, c2, c3);
    if (id == 3) return kalei(uv, t, c1, c2, c3); if (id == 4) return warp(uv, t, c1, c2, c3); return skyline(uv, t, c1, c2, c3); }
  void main() { vec2 uv = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0); vec3 A = pic(uA, uv, uTime, a1, a2, a3);
    if (uMix > 0.001) { vec3 B = pic(uB, uv, uTime, b1, b2, b3); float edge = uMix * 1.5 - 0.25 + (fbm(uv * 2.5 + 3.0) - 0.5) * 0.5 - length(uv) * 0.12, k = smoothstep(0.42, 0.58, edge); A = mix(A, B, k) + (b1 + a2) * 0.9 * smoothstep(0.1, 0.0, abs(edge - 0.5)) * step(0.01, uMix) * step(uMix, 0.99); }
    A = A * (0.22 + 0.78 * uAct) * (0.8 + 0.3 * uBeat) + uFlash * 0.15; float led = 0.86 + 0.14 * step(0.18, fract(vUv.x * 240.0)) * step(0.18, fract(vUv.y * 105.0)); gl_FragColor = vec4(pow(max(A * led, 0.0), vec3(2.2)), 1.0); }`;   // the glow pass works in linear light and converts at the end, so the picture is handed over in linear light
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const col3 = (h) => new THREE.Color(h), U = { uTime: { value: 0 }, uBeat: { value: 0 }, uEnergy: { value: 0.8 }, uMix: { value: 0 }, uAspect: { value: 34 / 15 }, uFlash: { value: 0 }, uAct: { value: 0 }, uA: { value: 0 }, uB: { value: 1 },
  a1: { value: col3(0) }, a2: { value: col3(0) }, a3: { value: col3(0) }, b1: { value: col3(0) }, b2: { value: col3(0) }, b3: { value: col3(0) } };
const screenMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag });
const W = 34, H = 15, FLOOR = 1.0, wall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), screenMat); wall.position.set(0, FLOOR + H / 2 + 0.6, -8);
// the same picture upside down under a dark, see-through floor reads as a reflection
const mirror = new THREE.Mesh(wall.geometry, screenMat); mirror.position.set(0, FLOOR - H / 2 - 0.6, -8); mirror.scale.y = -1;
const stage = new THREE.Group(); scene.add(stage); stage.add(wall, mirror);
const dark = (c = 0x05060c) => new THREE.MeshBasicMaterial({ color: c }), box = (w, h, d, x, y, z, m = dark()) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); stage.add(b); return b; };
{ const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 22), new THREE.MeshBasicMaterial({ color: 0x03040a, transparent: true, opacity: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, 1); stage.add(floor);
  box(60, 1, 0.3, 0, 0.5, 12, dark(0x06070e)); const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), dark(0x010206)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 50); stage.add(ground);
  for (const x of [-19, 19]) { box(1.2, 19, 1.2, x, 9.5, -6.5); box(1.2, 19, 1.2, x, 9.5, 4); } box(40, 0.9, 0.9, 0, 18.4, -6.5); box(40, 0.9, 0.9, 0, 18.4, 4); for (let i = -4; i <= 4; i++) box(0.5, 0.5, 10.5, i * 4.5, 18.4, -1.25); }
// glowing edges that take the palette's colour
const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); box(60, 0.12, 0.12, 0, FLOOR + 0.02, 12.05, edgeMat); for (const x of [-17.6, 17.6]) box(0.14, H + 0.6, 0.14, x, FLOOR + H / 2 + 0.6, -7.9, edgeMat); box(35.3, 0.14, 0.14, 0, FLOOR + H + 1.25, -7.9, edgeMat);
// Zeus's bolt, hung above the screen
const boltMat = new THREE.MeshBasicMaterial({ color: 0xffd45a, side: THREE.DoubleSide }); { const s = new THREE.Shape(); [[0.35, 1.6], [-0.75, -0.15], [-0.1, -0.15], [-0.45, -1.6], [0.8, 0.3], [0.1, 0.3], [0.6, 1.6]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); const b = new THREE.Mesh(new THREE.ShapeGeometry(s), boltMat); b.position.set(0, 19.6, -6.0); b.scale.setScalar(1.15); stage.add(b); }

// ---------- lasers: thin bright cores inside a soft glow, in fans from the rig above and the floor behind
const EMIT = [[-13, 17.8, -2, 0], [-6.5, 17.8, -2, 0], [0, 17.8, -2, 0], [6.5, 17.8, -2, 0], [13, 17.8, -2, 0], [-15, FLOOR + 0.3, -6, 1], [-5, FLOOR + 0.3, -6, 1], [5, FLOOR + 0.3, -6, 1], [15, FLOOR + 0.3, -6, 1]], PER = 7, NB = EMIT.length * PER;
const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0), add = (opacity) => new THREE.MeshBasicMaterial({ transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
const cores = new THREE.InstancedMesh(beamGeo, add(0.85), NB), glows = new THREE.InstancedMesh(beamGeo, add(0.022), NB); for (const m of [cores, glows]) { m.frustumCulled = false; stage.add(m); for (let i = 0; i < NB; i++) m.setColorAt(i, new THREE.Color(1, 1, 1)); }
// ---------- wide beams from moving heads on the rig, and haze for everything to shine through
const headGeo = new THREE.CylinderGeometry(0.2, 2.6, 34, 16, 1, true).translate(0, -17, 0), heads = [-15.5, -9, -3, 3, 9, 15.5].map((x, i) => { const m = new THREE.Mesh(headGeo, add(0.07)); m.position.set(x, 18, 3.6); m.userData = { ph: i * 1.1 }; stage.add(m); return m; });
const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const haze = Array.from({ length: 14 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })); s.userData = { x: (i / 13 - 0.5) * 44, y: 3 + (i * 37 % 9), z: -4 + (i * 53 % 13), k: 0.4 + (i % 5) * 0.15 }; s.scale.setScalar(18 + (i % 4) * 5); stage.add(s); return s; });
// ---------- the crowd, in silhouette, bouncing on the beat with some hands in the air
const PEOPLE = 150, blk = new THREE.MeshBasicMaterial({ color: 0x010207 }), headsI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 10, 8), blk, PEOPLE), bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.34, 1.0, 3, 8), blk, PEOPLE), arms = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.09, 0.75, 2, 6).translate(0, 0.45, 0), blk, PEOPLE * 2);
const crowd = Array.from({ length: PEOPLE }, (_, i) => { const row = i % 5, h = (i * 2654435761 % 1000) / 1000; return { x: ((Math.floor(i / 5) + (row % 2) * 0.5) / 30 - 0.5) * 46 + (h - 0.5) * 0.7, z: 14.2 + row * 1.5, tall: 1.5 + h * 0.4 + row * 0.02, ph: h, up: h > 0.45 }; });
for (const m of [headsI, bodies, arms]) { m.frustumCulled = false; stage.add(m); }

// ---------- backdrop only: just the picture, filling the window, to sit behind a camera
const flat = new THREE.Scene(), flatCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); flat.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMat));

// ---------- the show
const st = { scene: Number(q.get('scene') || 0) % 6, next: 1, mixAt: null, auto: q.get('auto') !== '0', backdrop: q.get('mode') === 'backdrop', cuts: q.get('cuts') !== '0', cam: Number(q.get('cam') || 0), camAt: 0, flash: 0, t: 0 };
const $ = (id) => document.getElementById(id), beat = createBeat({ bpm: Number(q.get('bpm') || 120), onChange: (s) => { $('bpm').textContent = s.bpm; $('listen').textContent = s.mode === 'listen' ? 'Stop listening' : 'Listen to the music'; $('listen').classList.toggle('on', s.mode === 'listen'); } });
const pal = (i) => PALETTES[i % PALETTES.length], setPal = () => { const a = pal(st.scene), b = pal(st.next); U.a1.value.set(a[0]); U.a2.value.set(a[1]); U.a3.value.set(a[2]); U.b1.value.set(b[0]); U.b2.value.set(b[1]); U.b3.value.set(b[2]); U.uA.value = st.scene; U.uB.value = st.next; $('scene').textContent = NAMES[st.scene]; };
function change(to = (st.scene + 1) % 6) { if (st.mixAt !== null) return; st.next = to; st.mixAt = beat.state.beats; setPal(); }
const CAMS = [(u) => [[0, 5.6, 27 - 2 * u], [0, 8.6, -8]], (u) => [[-21 + 3 * u, 3.2, 23], [2, 8.5, -8]], (u) => [[0, 15 - 3 * u, 27], [0, 7, -8]], (u) => [[21 - 3 * u, 3.2, 23], [-2, 8.5, -8]], (u) => [[-7 + 14 * u, 4.2, 20], [0, 9.5, -8]], (u) => [[0, 2.4, 25], [0, 10.5 + 1.5 * u, -8]]];
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), D = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3(), C = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color(), c3 = new THREE.Color(), E0 = new THREE.Euler();
function update(dt) { const b = beat.state, isBeat = beat.update(dt); st.t += dt * b.act; const beats = b.beats, whole = Math.floor(beats), e = (0.45 + 0.55 * b.energy) * b.act;   // b.act is 0 with no music: time stops and the lights go out
  if (isBeat && st.auto && whole > 0 && whole % 32 === 0) change();
  if (st.mixAt !== null) { const k = (beats - st.mixAt) / 4; U.uMix.value = Math.min(1, k); if (k >= 1) { st.scene = st.next; st.next = (st.scene + 1) % 6; st.mixAt = null; U.uMix.value = 0; st.flash = 1; setPal(); } }
  st.flash *= Math.exp(-dt * 4); U.uAct.value = b.act; U.uTime.value = st.t; U.uBeat.value = b.pulse * b.act; U.uEnergy.value = b.energy; U.uFlash.value = st.flash;
  const k = U.uMix.value, pa = pal(st.scene), pb = pal(st.next); c1.set(pa[0]).lerp(C.set(pb[0]), k); c2.set(pa[1]).lerp(C.set(pb[1]), k); c3.set(pa[2]).lerp(C.set(pb[2]), k);
  edgeMat.color.copy(c1).multiplyScalar((0.25 + 0.95 * b.pulse) * (0.3 + 0.7 * b.act)); boltMat.color.set(0xffd45a).multiplyScalar(0.3 + 0.9 * b.pulse * b.act);
  // lasers: the pattern changes every eight beats
  const pat = Math.floor(beats / 8) % 5, sw = Math.sin(beats * Math.PI / 4), sw2 = Math.sin(beats * Math.PI / 8), bright = (0.3 + 0.9 * b.pulse) * e;   // lasers flare on every beat
  for (let n = 0; n < EMIT.length; n++) { const [ex, ey, ez, low] = EMIT[n], side = n % 2 ? 1 : -1;
    for (let i = 0; i < PER; i++) { const f = i / (PER - 1) - 0.5, id = n * PER + i; let yaw = 0, pitch = low ? 0.95 : -0.5, on = 1;
      if (pat === 0) { yaw = f * (0.5 + 0.9 * (0.5 + 0.5 * sw)); pitch += 0.28 * sw2; }                                     // a fan that opens and closes
      else if (pat === 1) { yaw = side * 0.75 * sw + f * 0.12; pitch += 0.12 * Math.sin(beats * Math.PI / 2 + n); }          // scissors
      else if (pat === 2) { const a = f * 6.2832 + beats * 0.8 * side; yaw = 0.42 * Math.cos(a); pitch += 0.36 * Math.sin(a); }  // a turning cone
      else if (pat === 3) { yaw = f * 1.3; pitch += 0.4 * Math.sin(beats * Math.PI / 2 + f * 6.0 + n * 0.7); }               // a wave
      else { const h = Math.sin((whole * 12.9898 + id * 78.233)) * 43758.5453, r = h - Math.floor(h); yaw = (r - 0.5) * 1.9; pitch += (Math.sin(h * 3.1) * 0.5) * 0.7; on = 0.35 + 0.65 * b.pulse; }   // a new burst each beat
      D.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); Q.setFromUnitVectors(UP, D); P.set(ex, ey, ez);
      cores.setMatrixAt(id, M.compose(P, Q, S.set(0.022, 70, 0.022))); glows.setMatrixAt(id, M.compose(P, Q, S.set(0.085, 70, 0.085)));
      C.copy((i + n) % 3 === 0 ? c2 : low ? c3 : c1).multiplyScalar(bright * on); cores.setColorAt(id, C); glows.setColorAt(id, C); } }
  for (const m of [cores, glows]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
  for (const [i, m] of heads.entries()) { const u = m.userData; m.rotation.copy(E0.set(0.5 + 0.35 * Math.sin(beats * Math.PI / 8 + u.ph), 0, 0.5 * Math.sin(beats * Math.PI / 4 + u.ph * 1.7))); m.material.color.copy(i % 2 ? c2 : c3); m.material.opacity = (0.0015 + 0.004 * b.pulse) * e; }
  for (const s of haze) { const u = s.userData; s.position.set(u.x + Math.sin(st.t * 0.12 * u.k + u.y) * 5, u.y + Math.sin(st.t * 0.2 * u.k) * 1.2, u.z); s.material.color.copy(c1).lerp(c2, 0.5 + 0.5 * Math.sin(st.t * 0.3 + u.x)); s.material.opacity = (0.002 + 0.003 * b.pulse) * e; }
  crowd.forEach((p, i) => { const hop = b.pulse * (0.16 + 0.12 * p.ph) * e, y = p.tall + hop;   // the crowd jumps on the beat itself headsI.setMatrixAt(i, M.makeTranslation(p.x, y, p.z)); bodies.setMatrixAt(i, M.makeTranslation(p.x, y - 1.05, p.z));
    for (const s of [-1, 1]) { const a = p.up ? s * 0.25 + 0.3 * Math.sin(beats * Math.PI / 2 + p.ph * 6) : s * 2.7; Q.setFromEuler(E0.set(0, 0, a)); arms.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), M.compose(P.set(p.x + s * 0.36, y - 0.45, p.z), Q, S.set(1, 1, 1))); } });
  for (const m of [headsI, bodies, arms]) m.instanceMatrix.needsUpdate = true;
  // the camera: a slow move within each angle, and a cut every sixteen beats
  if (st.cuts && beats - st.camAt >= 16) { st.cam = (st.cam + 1) % CAMS.length; st.camAt = Math.floor(beats / 16) * 16; }
  const [cp, ct] = CAMS[st.cam](Math.min(1, (beats - st.camAt) / 16)); camera.position.set(cp[0] + Math.sin(st.t * 0.5) * 0.15, cp[1] + Math.sin(st.t * 0.7) * 0.08 + 0.1 * b.pulse * b.act, cp[2]); camera.lookAt(ct[0], ct[1], ct[2]); }
// the neon glow: everything bright bleeds light into what is around it. The glow pass blends light the way real light adds up, which makes
// faint see-through layers (haze, wide beams) far brighter than they were, so those are kept very faint to leave the arena black.
const composer = new EffectComposer(renderer), pass = new RenderPass(scene, camera), bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), Number(q.get('glow') ?? 0.55), 0.14, 0.7); composer.addPass(pass); composer.addPass(bloom);
// neon needs black beside it: the glow lifts the whole picture a little, so the darkest part is pulled back down to black
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(max(c.rgb - 0.03, 0.0) * 1.06, 1.0); }' }));
composer.addPass(new OutputPass());
function draw() { if (st.backdrop) { U.uAspect.value = innerWidth / innerHeight; pass.scene = flat; pass.camera = flatCam; } else { U.uAspect.value = W / H; pass.scene = scene; pass.camera = camera; } composer.render();
  // the panel shows what the stage is hearing and acting on
  const b = beat.state, lamp = $('lamp'); lamp.style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a3040'; lamp.style.boxShadow = b.pulse > 0.5 && b.act > 0.2 ? '0 0 12px #ffd23f' : 'none'; $('meter').style.width = `${Math.round((b.mode === 'listen' ? b.level : b.mode === 'tap' ? b.pulse : 0) * 100)}%`;
  $('status').textContent = failed || (b.mode === 'off' ? 'still. Press Listen to the music, or tap the beat' : b.mode === 'tap' ? 'running on the tapped beat' : b.act < 0.3 ? 'listening: no music, so standing still' : b.heard < 2.5 ? 'listening: on the beat' : 'listening: music heard, finding the beat'); }
setPal();

// ---------- controls
const mark = (id, on, text) => { $(id).classList.toggle('on', on); $(id).textContent = text; };
$('tap').addEventListener('pointerdown', () => beat.tap()); $('slower').addEventListener('click', () => beat.nudge(-1)); $('faster').addEventListener('click', () => beat.nudge(1));
$('listen').addEventListener('click', () => { if (beat.state.mode === 'listen') beat.unlisten(); else beat.listen().catch((e) => { failed = 'could not listen: ' + e.message; }); });
$('stop').addEventListener('click', () => beat.stop()); let failed = '';
$('next').addEventListener('click', () => change()); $('auto').addEventListener('click', () => { st.auto = !st.auto; mark('auto', st.auto, `Auto: ${st.auto ? 'on' : 'off'}`); });
$('mode').addEventListener('click', () => { st.backdrop = !st.backdrop; mark('mode', st.backdrop, st.backdrop ? 'Show the stage' : 'Backdrop only'); });
$('cam').addEventListener('click', () => { st.cuts = !st.cuts; mark('cam', st.cuts, `Camera cuts: ${st.cuts ? 'on' : 'off'}`); });
mark('auto', st.auto, `Auto: ${st.auto ? 'on' : 'off'}`); mark('mode', st.backdrop, st.backdrop ? 'Show the stage' : 'Backdrop only'); mark('cam', st.cuts, `Camera cuts: ${st.cuts ? 'on' : 'off'}`);
let idle = null, hidden = false; const wake = () => { $('ui').classList.remove('idle'); document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => { $('ui').classList.add('idle'); document.body.classList.add('idle'); }, 3500); };
addEventListener('pointermove', () => { if (!hidden) wake(); }); wake();
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); beat.tap(); } else if (e.key === 'n' || e.key === 'N') change(); else if (e.key === 'h' || e.key === 'H') { hidden = !hidden; if (hidden) { clearTimeout(idle); $('ui').classList.add('idle'); document.body.classList.add('idle'); } else wake(); } });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
window.__stage = { st, beat, change, update, draw };
if (SHOT) { $('ui').style.display = 'none'; st.cuts = false; if (!q.has('still')) beat.tap(); const n = Number(q.get('beats') || 6) * 60 / beat.state.bpm; if (q.has('mix')) { change(); } for (let t = 0; t < n; t += 1 / 60) update(1 / 60); if (q.has('mix')) { st.mixAt = beat.state.beats - 4 * Number(q.get('mix')); update(0.001); } draw(); window.ready = true; }
else { const clock = new THREE.Clock(); renderer.setAnimationLoop(() => { update(Math.min(0.1, clock.getDelta())); draw(); }); window.ready = true; }
