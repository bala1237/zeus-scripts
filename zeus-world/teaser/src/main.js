// Zeus World teaser. Every frame is a pure function of time, so the same
// time always renders the same picture (needed for frame-accurate capture).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import { buildWorld, makeCitizen, makeLightning, boltGeometry, glowGold, rng, OLYMPUS_PEAK } from './world.js';
import { CUTS, DURATION, CAPTIONS, NAMES, HERO } from './timeline.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
const stage = document.getElementById('stage');
const { clamp, lerp } = THREE.MathUtils;
const sat = (x) => clamp(x, 0, 1);
const ramp = (t, a, b) => sat((t - a) / (b - a));
const ease = (x) => x * x * (3 - 2 * x);
const er = (t, a, b) => ease(ramp(t, a, b));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.004);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.5, 2500);

const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, fog: false, depthWrite: false,
  uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() }, flash: { value: 0 } },
  vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform float flash; varying vec3 p; void main(){ float h = clamp(normalize(p).y * 2.2, 0.0, 1.0); vec3 c = mix(bottom, top, pow(h, 0.6)); c += vec3(0.5,0.55,0.8) * flash; gl_FragColor = vec4(c, 1.0); }',
}));
scene.add(sky);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0xb89a6a, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b0, 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const SUN_DIR = V(-0.62, 0.5, 0.45).normalize();

// clouds
const clouds = new THREE.Group(); const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 1, flatShading: true, fog: false });
{ const r = rng(3); for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let j = 0; j < 5; j++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(10 + r() * 12, 0), cloudMat); m.position.set((j - 2) * 14 + r() * 6, r() * 5, r() * 10); m.scale.y = 0.5; c.add(m); } c.position.set((r() - 0.5) * 900, 170 + r() * 110, -280 - r() * 380); c.userData.x = c.position.x; clouds.add(c); } }
scene.add(clouds);

// ---------- names wall texture ----------
const steleCanvas = document.createElement('canvas'); steleCanvas.width = 1200; steleCanvas.height = 1000;
const steleTex = new THREE.CanvasTexture(steleCanvas); steleTex.colorSpace = THREE.SRGBColorSpace; steleTex.anisotropy = 8;
let steleDrawn = -1;
function drawStele(count, yourName) {
  const key = count * 1000 + Math.round(yourName * 200); if (key === steleDrawn) return; steleDrawn = key;
  const c = steleCanvas.getContext('2d'); c.clearRect(0, 0, 1200, 1000); c.textAlign = 'center'; c.textBaseline = 'middle';
  const cols = 3;
  for (let i = 0; i < Math.min(count, 24); i++) {
    const x = 200 + (i % cols) * 400, y = 70 + Math.floor(i / cols) * 88; const fresh = count - i <= 2;
    c.font = "700 58px Cinzel"; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(NAMES[i], x + 2, y + 3);
    c.fillStyle = fresh ? '#ffcf55' : '#6e4a1e'; c.fillText(NAMES[i], x, y);
  }
  if (yourName > 0) {
    c.globalAlpha = yourName; c.font = "900 128px Cinzel"; c.shadowColor = '#ff9d00'; c.shadowBlur = 22; c.fillStyle = '#ffc93a'; c.fillText('YOUR NAME', 600, 880); c.shadowBlur = 0;
    c.lineWidth = 3; c.strokeStyle = '#8a5a12'; c.strokeText('YOUR NAME', 600, 880); c.globalAlpha = 1;
  }
  steleTex.needsUpdate = true;
}

const world = buildWorld(scene, steleTex);
const STAD = world.stadium.position.clone(), PLOT = world.house.position.clone(), CAFE = world.cafe.position.clone();
const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 9.6), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1.0, 0.82, 0.55), transparent: true, opacity: 0, fog: false, depthWrite: false }));
doorGlow.position.set(0, 4.8, 61); scene.add(doorGlow);

// ---------- citizens ----------
const hero = makeCitizen(0, true); scene.add(hero);
const crowd = []; { const r = rng(42); const N = 72;
  for (let i = 0; i < N; i++) {
    let a; do { a = r() * Math.PI * 2; } while (Math.abs(a - Math.PI / 2) < 0.32); // keep the names wall clear
    const d0 = 34 + r() * 16, d1 = 1.16 + r() * 0.42;
    const c = makeCitizen(i + 1); scene.add(c);
    crowd.push({ c, from: V(STAD.x + Math.cos(a) * d0 * 1.15, 0, STAD.z + Math.sin(a) * d0), to: V(STAD.x + Math.cos(a) * 20 * d1, 0, STAD.z + Math.sin(a) * 15 * d1), t0: CUTS.stadium - 1.5 + r() * 1.6, dur: 3.2 + r() * 1.4, ph: r() * 6.28 });
  } }
const watchers = [[-7.6, 3.5], [-6.2, 5.6], [-9, 6.5], [7.4, 3.2], [6.2, 5.8], [9, 6.2], [-5.4, 9.5], [5.6, 9.8]].map(([x, z], i) => { const c = makeCitizen(i + 20); c.position.set(world.stele.position.x + x, 0, world.stele.position.z + z); c.rotation.y = Math.atan2(-x, -z); scene.add(c); return c; });
const walkers = []; { const r = rng(77); for (let i = 0; i < 16; i++) { const c = makeCitizen(i + 40); scene.add(c); walkers.push({ c, x: (r() - 0.5) * 4, z0: -40 + r() * 95, dir: r() > 0.5 ? 1 : -1, sp: 1.1 + r() * 0.6, ph: r() * 6 }); } }

function pose(c, t, walking, cheer = 0, ph = 0) {
  const w = walking ? 1 : 0; const s = Math.sin(t * 9 + ph);
  c.position.y = w * Math.abs(s) * 0.07 + cheer * Math.abs(Math.sin(t * 7 + ph)) * 0.35;
  c.rotation.z = w * s * 0.05;
  const [l, r] = c.userData.arms; l.rotation.x = w * s * 0.6; r.rotation.x = -w * s * 0.6;
  l.rotation.z = -0.18 - cheer * 2.5; r.rotation.z = 0.18 + cheer * 2.5;
}
const face = (c, dx, dz) => { c.rotation.y = Math.atan2(dx, dz); };

// ---------- flying bolts ----------
const boltGeo = boltGeometry(0.42); const dummy = new THREE.Object3D();
function boltSwarm(n) { const m = new THREE.InstancedMesh(boltGeo, glowGold, n); m.frustumCulled = false; scene.add(m); return m; }
const rain = boltSwarm(120); const rainData = []; { const r = rng(9);
  for (let i = 0; i < 120; i++) { const cafe = i >= 70; const base = cafe ? CAFE : PLOT; rainData.push({ t0: cafe ? CUTS.plot + 2.8 + r() * 1.6 : CUTS.plot + 0.3 + r() * 2.0, x: base.x + (r() - 0.5) * 7, z: base.z + (r() - 0.5) * 6, dx: (r() - 0.5) * 10, sp: r() * 6, dur: 1.0 + r() * 0.4 }); } }
const stream = boltSwarm(340); const streamData = []; { const r = rng(10);
  for (let i = 0; i < 340; i++) streamData.push({ who: Math.floor(r() * crowd.length), t0: CUTS.stadium + 0.4 + r() * 4.8, dur: 0.8 + r() * 0.5, ox: (r() - 0.5) * 16, oz: (r() - 0.5) * 12, sp: r() * 6 }); }
function hide(m, i) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }

// ---------- lightning ----------
const strikes = [
  { t: 2.0, mesh: makeLightning(V(-14, 150, -40), V(0, 0, 0), 1, 0.22), power: 1 },
  { t: CUTS.gate - 0.14, mesh: makeLightning(V(30, 170, -120), V(18, 0, -60), 2, 0.4), power: 1.6 },
  { t: CUTS.wide + 0.02, mesh: makeLightning(V(40, 300, -310), OLYMPUS_PEAK, 3, 1.3), power: 0.5 },
  { t: CUTS.title, mesh: makeLightning(V(-60, 310, -300), OLYMPUS_PEAK, 4, 1.5), power: 0.9 },
];
strikes.forEach((s) => scene.add(s.mesh));

// ---------- post ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 1.0); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- overlay ----------
const el = (id) => document.getElementById(id);
const capEls = CAPTIONS.map((c) => { const d = document.createElement('div'); d.className = 'cap' + (c.gold ? ' gold' : ''); d.style.top = c.top + 'px'; d.style.fontSize = c.size + 'px'; d.innerHTML = c.text; el('caps').appendChild(d); return d; });
const BOLT_SVG = '<svg viewBox="-50 -105 100 210"><polygon fill="#ffd676" points="15,-100 -45,10 -5,10 -20,100 45,-20 5,-20 35,-100"/></svg>';
function makeTag(name) { const d = document.createElement('div'); d.className = 'tag'; d.innerHTML = BOLT_SVG + '<span>' + name + '</span>'; el('tags').appendChild(d); return d; }
const heroTag = makeTag(HERO); const camSide = crowd.map((p, i) => ({ i, d: (p.to.x - STAD.x) * -0.62 + (p.to.z - STAD.z) * 0.78, l: Math.abs((p.to.x - STAD.x) * 0.78 + (p.to.z - STAD.z) * 0.62) })).filter((o) => o.l < 12 && o.d > 0).sort((a, b) => b.d - a.d).reduce((acc, o) => (acc.length < 5 && acc.every((q) => crowd[q].to.distanceTo(crowd[o.i].to) > 6) ? [...acc, o.i] : acc), []);
const crowdTags = camSide.map((i, k) => ({ i, tag: makeTag(NAMES[k * 3 + 1]), at: CUTS.stadium + 1.6 + k * 0.4 }));
const tmp = new THREE.Vector3();
function placeTag(tag, obj, opacity, lift = 2.35) {
  tmp.set(obj.position.x, obj.position.y + lift, obj.position.z).project(camera);
  if (opacity <= 0.001 || tmp.z > 1 || Math.abs(tmp.x) > 1.1) { tag.style.opacity = 0; return; }
  tag.style.opacity = opacity; tag.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * W}px, ${(-tmp.y * 0.5 + 0.5) * H}px) translate(-50%, -100%) scale(${0.85 + 0.15 * opacity})`;
}

// ---------- moods ----------
const MOODS = {
  storm: { top: 0x060a1c, bottom: 0x2a3566, fog: 0x1c2550, dens: 0.0032, sun: 0.75, sunCol: 0x8fa6ff, hemi: 0.3, hemiSky: 0x6f7fd0, hemiGround: 0x141a2c, exp: 1.0, cloud: 0x1a2244 },
  dawn: { top: 0x2f55a8, bottom: 0xffb877, fog: 0xf5c193, dens: 0.0032, sun: 2.6, sunCol: 0xffcf99, hemi: 0.8, hemiSky: 0xcfdcff, hemiGround: 0xb48a5e, exp: 0.95, cloud: 0xffd9b8 },
  gold: { top: 0x2f6fd0, bottom: 0xffdca6, fog: 0xf3d6ae, dens: 0.0021, sun: 3.2, sunCol: 0xffe2b4, hemi: 0.95, hemiSky: 0xcfe3ff, hemiGround: 0xb89a6a, exp: 0.92, cloud: 0xfff4e4 },
};
const col = new THREE.Color();

// ---------- the frame ----------
function frame(t) {
  t = clamp(t, 0, DURATION);
  const shot = t < CUTS.gate ? 'valley' : t < CUTS.plot ? 'gate' : t < CUTS.stadium ? 'plot' : t < CUTS.names ? 'stadium' : t < CUTS.wide ? 'names' : 'wide';
  const m = MOODS[shot === 'valley' ? 'storm' : shot === 'gate' ? 'dawn' : 'gold'];

  // lightning
  let flash = 0;
  for (const s of strikes) { const d = t - s.t; s.mesh.visible = (d >= 0 && d < 0.1) || (d > 0.16 && d < 0.3); if (d >= 0) flash = Math.max(flash, s.power * Math.exp(-d * 6) * (d < 0.1 || d > 0.16 ? 1 : 0.45)); }
  if (shot === 'valley') flash = Math.max(flash, 0.25 * Math.exp(-Math.abs(t - 0.75) * 14), 0.2 * Math.exp(-Math.abs(t - 1.25) * 16));
  sky.material.uniforms.top.value.set(m.top); sky.material.uniforms.bottom.value.set(m.bottom); sky.material.uniforms.flash.value = flash * (shot === 'valley' ? 0.3 : 0.25);
  scene.fog.color.set(m.fog).lerp(col.set(0xaab4e8), sat(flash * (shot === 'valley' ? 0.5 : 0.1))); scene.fog.density = m.dens;
  sun.color.set(m.sunCol); sun.intensity = m.sun; hemi.color.set(m.hemiSky); hemi.groundColor.set(m.hemiGround); hemi.intensity = m.hemi + flash * (shot === 'valley' ? 1.0 : 0.4);
  renderer.toneMappingExposure = m.exp; cloudMat.color.set(m.cloud); cloudMat.emissive.set(m.cloud);
  clouds.children.forEach((c, i) => { c.position.x = c.userData.x + t * (2 + (i % 3)); });

  // what exists yet
  const built = (a, b) => outCubic(ramp(t, a, b));
  const houseP = built(CUTS.plot + 1.1, CUTS.plot + 3.1), cafeP = built(CUTS.plot + 3.5, CUTS.plot + 5.3), stadP = ramp(t, CUTS.stadium + 2.0, CUTS.stadium + 5.5);
  world.houseRise.set(houseP, shot === 'plot' ? t : 0); world.cafeRise.set(cafeP, shot === 'plot' && t > CUTS.plot + 2.6 ? t : 0); world.stadiumRise.set(stadP, shot === 'stadium' ? t : 0);
  world.stele.visible = t >= CUTS.names; world.fountain.visible = world.extras.visible = t >= CUTS.wide;
  world.stele.traverse((o) => { if (o.userData.flame) o.scale.setScalar(1 + 0.18 * Math.sin(t * 17 + o.position.x)); });
  const doorOpen = outCubic(ramp(t, CUTS.gate + 1.7, CUTS.gate + 3.0));
  world.gate.userData.doors.forEach(({ pivot, s }) => { pivot.rotation.y = s * doorOpen * 1.9; });
  doorGlow.material.opacity = shot === 'gate' ? doorOpen * 0.5 * (1 - er(t, CUTS.gate + 2.4, CUTS.gate + 4.4)) : 0;

  // hero citizen
  if (shot === 'gate') { hero.visible = true; hero.position.set(0.5, 0, lerp(87, 70.5, ramp(t, CUTS.gate, CUTS.plot))); face(hero, 0, -1); pose(hero, t, true); }
  else if (shot === 'plot') { hero.visible = true; hero.position.set(PLOT.x + 5.2, 0, PLOT.z + 8.2); face(hero, -5, -8); pose(hero, t, false, er(t, CUTS.plot + 2.9, CUTS.plot + 3.3) * (1 - er(t, CUTS.plot + 4.6, CUTS.plot + 5.2))); hero.position.y = hero.position.y; }
  else { hero.visible = shot !== 'valley'; hero.position.set(PLOT.x + 5.2, 0, PLOT.z + 8.2); face(hero, 1, 1); pose(hero, t, false); }

  // crowd
  const showCrowd = t >= CUTS.stadium;
  for (const p of crowd) { p.c.visible = showCrowd; if (!showCrowd) continue; const k = ease(ramp(t, p.t0, p.t0 + p.dur)); p.c.position.lerpVectors(p.from, p.to, k); face(p.c, STAD.x - p.c.position.x, STAD.z - p.c.position.z); pose(p.c, t, k < 1, k >= 1 ? 0.5 + 0.5 * Math.sin(t * 2 + p.ph) : 0, p.ph); }
  watchers.forEach((c, i) => { c.visible = t >= CUTS.names; pose(c, t, false, t > CUTS.names + 2.0 ? 0.6 : 0, i); });
  walkers.forEach((w) => { w.c.visible = t >= CUTS.wide; const z = ((w.z0 + w.dir * w.sp * t + 40) % 95 + 95) % 95 - 40; w.c.position.set(w.x, 0, z); face(w.c, 0, w.dir); pose(w.c, t, true, 0, w.ph); });

  // bolts raining onto the plot
  rainData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'plot') return hide(rain, i); const e = Math.pow(k, 1.4); dummy.position.set(b.x + b.dx * (1 - k), lerp(30, 0.8, e), b.z); dummy.rotation.set(0, b.sp + t * 7, 0.2); dummy.scale.setScalar(2.3 * Math.min(1, (1 - k) * 8)); dummy.updateMatrix(); rain.setMatrixAt(i, dummy.matrix); });
  rain.instanceMatrix.needsUpdate = true;
  // bolts streaming from the crowd into the stadium
  const stadTop = stadP * world.stadium.userData.height;
  streamData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'stadium') return hide(stream, i); const p = crowd[b.who].c.position; dummy.position.set(lerp(p.x, STAD.x + b.ox, k), lerp(2, stadTop * 0.8 + 1, k) + Math.sin(k * Math.PI) * 13, lerp(p.z, STAD.z + b.oz, k)); dummy.rotation.set(0, b.sp + t * 8, 0.3); dummy.scale.setScalar(1.3 * Math.min(1, (1 - k) * 6, k * 10)); dummy.updateMatrix(); stream.setMatrixAt(i, dummy.matrix); });
  stream.instanceMatrix.needsUpdate = true;

  // names wall
  if (t >= CUTS.names) drawStele(Math.floor((t - CUTS.names - 0.2) / 0.07), er(t, CUTS.names + 1.95, CUTS.names + 2.3) * (0.86 + 0.14 * Math.sin(t * 6)));

  // camera
  let pos, look, shadowR = 48, focus;
  if (shot === 'valley') { const k = ramp(t, 0, CUTS.gate); pos = V(0, lerp(10, 7.5, k), lerp(54, 40, k)); look = V(0, lerp(26, 20, k), -120); focus = V(0, 0, 0); }
  else if (shot === 'gate') { const k = ease(ramp(t, CUTS.gate, CUTS.plot)); pos = V(lerp(-2.2, 0.6, k), lerp(2.3, 3.0, k), lerp(95, 89, k)); look = V(0, lerp(7.4, 6.0, k), 62); focus = V(0, 0, 72); }
  else if (shot === 'plot') { const k = ease(ramp(t, CUTS.plot, CUTS.stadium)); pos = V(lerp(-3.5, -7.5, k), lerp(6.6, 4.4, k), lerp(35, 33.5, k)); look = V(lerp(-13.5, -11.5, k), lerp(3.6, 3.0, k), 13); focus = V(-11, 0, 15); }
  else if (shot === 'stadium') { const k = ease(ramp(t, CUTS.stadium, CUTS.names)); pos = V(lerp(-22, -10, k), lerp(13, 25, k), lerp(26, 30, k)); look = V(STAD.x - 2, lerp(3, 6, k), STAD.z + 2); focus = STAD; shadowR = 75; }
  else if (shot === 'names') { const k = ease(ramp(t, CUTS.names, CUTS.wide)); pos = V(lerp(19.6, 22.5, k), lerp(5.2, 3.2, k), lerp(8.5, 14.2, k)); look = V(lerp(21, 22, k), lerp(6.0, 5.3, k), -3.5); focus = V(22, 0, -6); shadowR = 55; }
  else { const k = outCubic(ramp(t, CUTS.wide, DURATION)); pos = V(lerp(8, -4, k), lerp(12, 46, k), lerp(34, 108, k)); look = V(lerp(6, 3, k), lerp(5, 16, k), lerp(-14, -60, k)); focus = V(2, 0, 4); shadowR = 105; }
  pos.x += Math.sin(t * 61) * flash * 0.25; pos.y += Math.sin(t * 47) * flash * 0.18;
  camera.position.copy(pos); camera.lookAt(look);
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 220);
  const sc = sun.shadow.camera; if (sc.right !== shadowR) { sc.left = sc.bottom = -shadowR; sc.right = sc.top = shadowR; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix(); }
  camera.updateMatrixWorld();

  // overlay
  CAPTIONS.forEach((c, i) => { const a = er(t, c.in, c.in + (c.snap ? 0.12 : 0.4)) * (1 - er(t, c.out - 0.28, c.out)); capEls[i].style.opacity = a; capEls[i].style.transform = `translateY(${(1 - er(t, c.in, c.in + 0.5)) * 26}px) scale(${c.snap ? 1 + 0.12 * (1 - er(t, c.in, c.in + 0.35)) : 1})`; });
  placeTag(heroTag, hero, shot === 'gate' ? er(t, CUTS.gate + 2.1, CUTS.gate + 2.5) : shot === 'plot' ? er(t, CUTS.plot + 0.3, CUTS.plot + 0.7) : 0);
  crowdTags.forEach(({ i, tag, at }) => placeTag(tag, crowd[i].c, shot === 'stadium' ? er(t, at, at + 0.3) : 0));
  const T = CUTS.title;
  el('flash').style.opacity = sat(flash * (shot === 'valley' ? 0.2 : 0.22) + (shot === 'valley' ? 1.0 * er(t, CUTS.gate - 0.1, CUTS.gate) : 0) + (shot === 'gate' ? 0.9 * (1 - ramp(t, CUTS.gate, CUTS.gate + 0.45)) : 0));
  el('dim').style.opacity = er(t, T - 0.1, T + 0.6) * 0.9;
  el('title').style.opacity = er(t, T + 0.05, T + 0.5); el('title').style.transform = `scale(${1.14 - 0.14 * outCubic(ramp(t, T + 0.2, T + 1.2)) + 0.02 * ramp(t, T + 1.2, DURATION)})`;
  el('tagline').style.opacity = er(t, T + 1.1, T + 1.6); el('soon').style.opacity = er(t, T + 1.8, T + 2.3);

  composer.render();
}

// ---------- run ----------
function fit() { const s = CAPTURE ? 1 : Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; stage.style.left = CAPTURE ? '0' : (innerWidth - W * s) / 2 + 'px'; }
addEventListener('resize', fit); fit();
await Promise.all([document.fonts.load("700 50px Cinzel"), document.fonts.load("900 132px Cinzel")]); await document.fonts.ready;
window.__duration = DURATION; window.__frame = frame; window.__ready = true;
if (!CAPTURE) {
  let start = performance.now() - (parseFloat(params.get('t')) || 0) * 1000; let paused = params.has('pause');
  let held = parseFloat(params.get('t')) || 0;
  addEventListener('keydown', (e) => { if (e.key === ' ') { paused = !paused; start = performance.now() - held * 1000; } if (e.key === 'ArrowRight') { held += 0.5; start -= 500; } if (e.key === 'ArrowLeft') { held -= 0.5; start += 500; } });
  const loop = () => { if (!paused) held = ((performance.now() - start) / 1000) % (DURATION + 1); frame(held); el('hud').textContent = held.toFixed(2) + 's · space pauses · arrows scrub'; requestAnimationFrame(loop); };
  loop();
} else frame(0);
