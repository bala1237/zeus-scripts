// Zeus World teaser. Every frame is a pure function of time, so the same
// time always renders the same picture (needed for frame-accurate capture).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import { A, loadAssets } from './assets.js';
import { makeHouse, makeCafe, makeStadium, makeGate, makeFountain, makeStele, makeSacredWay, makeRiser, boltGeometry, Builder } from './kit.js';
import { makeTerrain, makeSky, makeTrees, makeHeroTrees, HERO_TREES, rng, OLYMPUS } from './terrain.js';
import { makeCitizen, pose } from './people.js';
import { makeCaptions, updateCaptions } from './text.js';
import { CUTS, DURATION, CAPTIONS, NAMES, HERO } from './timeline.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture'), FAST = params.has('fast');
const stage = document.getElementById('stage');
const { clamp, lerp } = THREE.MathUtils;
const sat = (x) => clamp(x, 0, 1);
const ramp = (t, a, b) => sat((t - a) / (b - a));
const ease = (x) => x * x * (3 - 2 * x);
const er = (t, a, b) => ease(ramp(t, a, b));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const el = (id) => document.getElementById(id);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.prepend(renderer.domElement);
function fit() { const s = CAPTURE ? 1 : Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; stage.style.left = CAPTURE ? '0' : (innerWidth - W * s) / 2 + 'px'; }
addEventListener('resize', fit); fit();

await Promise.all([loadAssets(), document.fonts.load('700 50px Cinzel'), document.fonts.load('900 132px Cinzel')]);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.001);
const camera = new THREE.PerspectiveCamera(46, W / H, 0.5, 16000);
const sky = makeSky(); scene.add(sky.mesh);
const sun = new THREE.DirectionalLight(0xffe0b0, 3); sun.castShadow = true; sun.shadow.mapSize.set(params.has('sm2k') ? 2048 : 4096, params.has('sm2k') ? 2048 : 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target);
const flashLight = new THREE.HemisphereLight(0xc8d4ff, 0x39406a, 0); scene.add(flashLight);
const SUN_DIR = V(-0.72, 0.36, 0.5).normalize();

// ---------- names wall texture ----------
const steleCanvas = document.createElement('canvas'); steleCanvas.width = 1200; steleCanvas.height = 1000;
const steleTex = new THREE.CanvasTexture(steleCanvas); steleTex.colorSpace = THREE.SRGBColorSpace; steleTex.anisotropy = 8;
let steleDrawn = -1;
function drawStele(count, yourName) {
  const key = count * 1000 + Math.round(yourName * 200); if (key === steleDrawn) return; steleDrawn = key;
  const c = steleCanvas.getContext('2d'); c.clearRect(0, 0, 1200, 1000); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < Math.min(count, 24); i++) {
    const x = 200 + (i % 3) * 400, y = 70 + Math.floor(i / 3) * 88; const fresh = count - i <= 2;
    c.font = '700 58px Cinzel'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText(NAMES[i], x + 2, y + 3);
    c.fillStyle = 'rgba(40,24,6,.55)'; c.fillText(NAMES[i], x - 1, y - 2);
    c.fillStyle = fresh ? '#ffcf55' : '#a8792a'; c.fillText(NAMES[i], x, y);
  }
  if (yourName > 0) {
    c.globalAlpha = yourName; c.font = '900 128px Cinzel'; c.shadowColor = '#ff9d00'; c.shadowBlur = 22; c.fillStyle = '#ffc93a'; c.fillText('YOUR NAME', 600, 880); c.shadowBlur = 0;
    c.lineWidth = 3; c.strokeStyle = '#8a5a12'; c.strokeText('YOUR NAME', 600, 880); c.globalAlpha = 1;
  }
  steleTex.needsUpdate = true;
}

// ---------- world ----------
const flames = [];
const EXTRA = [[-34, 8, 0.5], [-30, -8, 0.9], [-24, 32, 0.2], [-38, 26, 0.6], [-16, -22, 0.3], [-34, -26, 0.7], [14, 24, -0.5], [38, 28, -0.8], [16, 42, -0.3], [-14, 46, 0.3], [36, 46, -0.6], [-44, 46, 0.5], [-48, -10, 1.0], [54, 8, -1.0]];
const STAD = V(22, 0, -24), PLOT = V(-16, 0, 14), CAFE = V(-6.0, 0, 11.5), STELE = V(22, 0, -3.5);
function blocked(x, z, m = 0) {
  return Math.abs(x) < 7 + m || Math.hypot(x - PLOT.x - 5, z - PLOT.z) < 15 + m || Math.hypot((x - STAD.x) / 31, (z - STAD.z) / 26) < 1 || Math.abs(z - 62) < 6 + m || (x > 8 && x < 36 && z > -8 && z < 18)
    || Math.hypot(x + 6, z - 32) < 9 || EXTRA.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < 8 + m) || HERO_TREES.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 4);
}
scene.add(makeTerrain());
scene.add(makeTrees(blocked)); if (!FAST && !params.has('noherotrees')) scene.add(makeHeroTrees());
{ const b = new Builder(); b.box(7.6, 0.16, 100, A.mat.cobble, 0, 0.0, 12); b.box(0.4, 0.3, 100, A.mat.marbleWarm, -4.0, 0.05, 12); b.box(0.4, 0.3, 100, A.mat.marbleWarm, 4.0, 0.05, 12); b.add(new THREE.CylinderGeometry(11, 11, 0.16, 48), A.mat.cobble, 0, 0.01, 0); const road = b.build(); road.traverse((o) => { o.castShadow = false; }); scene.add(road); }
const gate = makeGate(flames); gate.position.set(0, 0, 62); scene.add(gate);
const house = makeHouse(); house.position.copy(PLOT); house.rotation.y = 0.35; scene.add(house);
const cafe = makeCafe(); cafe.position.copy(CAFE); cafe.rotation.y = 0.1; scene.add(cafe);
const stadium = makeStadium(); stadium.position.copy(STAD); scene.add(stadium);
const stele = makeStele(steleTex, flames); stele.position.copy(STELE); scene.add(stele);
const fountain = makeFountain(); scene.add(fountain);
const way = makeSacredWay(flames); scene.add(way);
const extras = new THREE.Group(); EXTRA.forEach(([x, z, ry], i) => { const h = i % 4 === 3 ? makeCafe() : makeHouse(A.mat.roof, i % 2 === 1); h.position.set(x, 0, z); h.rotation.y = ry; extras.add(h); }); scene.add(extras);

// buildings rise out of the earth behind a glowing outline
function riser(group, footprint) {
  const H0 = group.userData.height + 0.4; const ring = new THREE.Group();
  if (footprint.r) { const t = new THREE.Mesh(new THREE.TorusGeometry(footprint.r, 0.13, 6, 96), A.mat.glow); t.rotation.x = Math.PI / 2; t.scale.y = footprint.k; ring.add(t); }
  else { const { w, d, oz = 0 } = footprint; for (const [bw, bd, x, z] of [[w, 0.12, 0, d / 2], [w, 0.12, 0, -d / 2], [0.12, d, w / 2, 0], [0.12, d, -w / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.12, bd), A.mat.glow); m.position.set(x, 0, z + oz); ring.add(m); } }
  ring.position.copy(group.position); ring.position.y = 0.12; ring.rotation.y = group.rotation.y; scene.add(ring);
  return (p, outline) => { group.visible = p > 0; group.position.y = -(1 - p) * H0; ring.visible = !!outline && p < 1; const s = 1 + 0.012 * Math.sin(outline * 8); ring.scale.set(s, 1, s); };
}
const houseRise = riser(house, { w: 9.6, d: 9 }), cafeRise = riser(cafe, { w: 9.6, d: 9.6, oz: 0.8 }), stadiumRise = riser(stadium, { r: 24, k: 18.3 / 24 });

// ---------- citizens ----------
const hero = makeCitizen(0, true); scene.add(hero);
const crowd = []; { const r = rng(42);
  for (let i = 0; i < 72; i++) {
    let a; do { a = r() * Math.PI * 2; } while (Math.abs(a - Math.PI / 2) < 0.32);
    const d0 = 36 + r() * 16, d1 = 1.2 + r() * 0.4; const c = makeCitizen(i + 1); scene.add(c);
    crowd.push({ c, from: V(STAD.x + Math.cos(a) * d0 * 1.15, 0, STAD.z + Math.sin(a) * d0), to: V(STAD.x + Math.cos(a) * 22.5 * d1, 0, STAD.z + Math.sin(a) * 17 * d1), t0: CUTS.stadium - 1.5 + r() * 1.6, dur: 3.2 + r() * 1.4, ph: r() * 6.28 });
  } }
const watchers = [[-7.6, 3.5], [-6.2, 5.6], [-9, 6.5], [7.4, 3.2], [6.2, 5.8], [9, 6.2], [-5.4, 9.5], [5.6, 9.8]].map(([x, z], i) => { const c = makeCitizen(i + 20); c.position.set(STELE.x + x, 0, STELE.z + z); c.rotation.y = Math.atan2(-x, -z); scene.add(c); return c; });
const walkers = []; { const r = rng(77); for (let i = 0; i < 16; i++) { const c = makeCitizen(i + 40); scene.add(c); walkers.push({ c, x: (r() - 0.5) * 5, z0: -40 + r() * 95, dir: r() > 0.5 ? 1 : -1, sp: 1.0 + r() * 0.5, ph: r() * 6 }); } }
const face = (c, dx, dz) => { c.rotation.y = Math.atan2(dx, dz); };

// ---------- flying bolts ----------
const boltGeo = boltGeometry(0.42); const dummy = new THREE.Object3D();
function boltSwarm(n) { const m = new THREE.InstancedMesh(boltGeo, A.mat.glow, n); m.frustumCulled = false; scene.add(m); return m; }
const rain = boltSwarm(120); const rainData = []; { const r = rng(9);
  for (let i = 0; i < 120; i++) { const cf = i >= 70; const b = cf ? CAFE : PLOT; rainData.push({ t0: cf ? CUTS.plot + 2.8 + r() * 1.6 : CUTS.plot + 0.3 + r() * 2.0, x: b.x + (r() - 0.5) * 7, z: b.z + (r() - 0.5) * 6, dx: (r() - 0.5) * 10, sp: r() * 6, dur: 1.0 + r() * 0.4 }); } }
const stream = boltSwarm(340); const streamData = []; { const r = rng(10);
  for (let i = 0; i < 340; i++) streamData.push({ who: Math.floor(r() * crowd.length), t0: CUTS.stadium + 0.4 + r() * 4.8, dur: 0.8 + r() * 0.5, ox: (r() - 0.5) * 16, oz: (r() - 0.5) * 12, sp: r() * 6 }); }
function hide(m, i) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }

// ---------- lightning ----------
function makeLightning(from, to, seed, width) {
  const r = rng(seed); const parts = [];
  const strand = (a, b, n, w, jitter) => {
    const pts = []; const dir = b.clone().sub(a); const len = dir.length(); const side = V(dir.z, 0, -dir.x).normalize(); if (side.lengthSq() < 0.01) side.set(1, 0, 0); const side2 = new THREE.Vector3().crossVectors(dir, side).normalize();
    for (let i = 0; i <= n; i++) { const t = i / n, e = Math.sin(Math.PI * t); pts.push(a.clone().lerp(b, t).addScaledVector(side, (r() - 0.5) * jitter * len * e).addScaledVector(side2, (r() - 0.5) * jitter * len * e * 0.4)); }
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1], L = p.distanceTo(q); const c = new THREE.CylinderGeometry(w, w, L, 5); c.translate(0, L / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize())); c.translate(p.x, p.y, p.z); parts.push(c); }
    return pts;
  };
  const main = strand(from, to, 18, width, 0.15);
  for (let b = 0; b < 5; b++) { const p = main[3 + b * 3]; strand(p, p.clone().add(V((r() - 0.5) * 60, -20 - r() * 30, (r() - 0.5) * 24)), 6, width * 0.5, 0.2); }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(3.0, 3.4, 5.2), fog: false })); m.visible = false; scene.add(m); return m;
}
const peak = OLYMPUS.clone();
const strikes = [
  { t: 2.0, mesh: makeLightning(V(-20, 220, -60), V(0, 0, 0), 1, 0.24), power: 1 },
  { t: CUTS.gate - 0.14, mesh: makeLightning(V(40, 240, -140), V(18, 0, -60), 2, 0.4), power: 1.6 },
  { t: CUTS.wide + 0.02, mesh: makeLightning(peak.clone().add(V(160, 620, 40)), peak, 3, 4), power: 0.45 },
  { t: CUTS.title, mesh: makeLightning(peak.clone().add(V(-200, 660, 60)), peak, 4, 4.5), power: 0.8 },
];
const beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(16, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(6, 4, 1.2), fog: false })); beacon.position.copy(peak).y += 6; scene.add(beacon);

// ---------- post ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: params.has('nomsaa') ? 0 : 4 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, W, H); gtao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.4, thickness: 1.2, scale: 1.25, samples: 16 }); gtao.blendIntensity = 1;
{ const inner = gtao._renderOverride.bind(gtao); gtao._renderOverride = (...args) => { sky.mesh.visible = false; inner(...args); sky.mesh.visible = true; }; } // keep the sky out of the occlusion pass
 if (!FAST && !params.has('nogtao')) composer.addPass(gtao);
const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.00012, maxblur: 0.006 }); bokeh.uniforms.aspect.value = W / H; if (!FAST && !params.has('nobokeh')) composer.addPass(bokeh);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.45, 2.6));
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, 1.14); c = mix(c, c * c * (3.0 - 2.0 * c), 0.4); c *= vec3(1.03, 1.0, 0.95);
      vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.6;
      float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time * 61.0, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.03;
      gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade);

// ---------- overlay ----------
const caps = makeCaptions(el('caps'), CAPTIONS);
const BOLT_SVG = '<svg viewBox="-50 -105 100 210"><polygon fill="#ffd676" points="15,-100 -45,10 -5,10 -20,100 45,-20 5,-20 35,-100"/></svg>';
function makeTag(name) { const d = document.createElement('div'); d.className = 'tag'; d.innerHTML = BOLT_SVG + '<span>' + name + '</span>'; el('tags').appendChild(d); return d; }
const heroTag = makeTag(HERO);
const camSide = crowd.map((p, i) => ({ i, d: (p.to.x - STAD.x) * -0.62 + (p.to.z - STAD.z) * 0.78, l: Math.abs((p.to.x - STAD.x) * 0.78 + (p.to.z - STAD.z) * 0.62) })).filter((o) => o.l < 12 && o.d > 0).sort((a, b) => b.d - a.d).reduce((acc, o) => (acc.length < 5 && acc.every((q) => crowd[q].to.distanceTo(crowd[o.i].to) > 6) ? [...acc, o.i] : acc), []);
const crowdTags = camSide.map((i, k) => ({ i, tag: makeTag(NAMES[k * 3 + 1]), at: CUTS.stadium + 1.6 + k * 0.4 }));
const tmp = new THREE.Vector3();
function placeTag(tag, obj, opacity, lift = 2.25) {
  tmp.set(obj.position.x, obj.position.y + lift, obj.position.z).project(camera);
  if (opacity <= 0.001 || tmp.z > 1 || Math.abs(tmp.x) > 1.1) { tag.style.opacity = 0; return; }
  tag.style.opacity = opacity; tag.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * W}px, ${(-tmp.y * 0.5 + 0.5) * H}px) translate(-50%, -100%) translateY(-18px) scale(${0.8 + 0.2 * outCubic(opacity)})`;
}

// ---------- moods ----------
const MOODS = {
  storm: { sky: 'night', gain: [0.42, 0.5, 0.8], envI: 0.5, fog: 0x0b1230, dens: 0.0006, sun: 0.9, sunCol: 0x93aaff, exp: 1.0 },
  dawn: { sky: 'dusk', gain: [1.25, 1.1, 1.15], envI: 1.15, fog: 0xe6b7a8, dens: 0.00042, sun: 3.4, sunCol: 0xffbd8a, exp: 1.0 },
  gold: { sky: 'gold', gain: [1.7, 1.6, 1.55], envI: 1.0, fog: 0xc3d0e4, dens: 0.00034, sun: 4.2, sunCol: 0xffdcae, exp: 0.95 },
};
const col = new THREE.Color();

// ---------- the frame ----------
function frame(t) {
  t = clamp(t, 0, DURATION);
  const shot = t < CUTS.gate ? 'valley' : t < CUTS.plot ? 'gate' : t < CUTS.stadium ? 'plot' : t < CUTS.names ? 'stadium' : t < CUTS.wide ? 'names' : 'wide';
  const m = MOODS[shot === 'valley' ? 'storm' : shot === 'gate' ? 'dawn' : 'gold'];

  let flash = 0;
  for (const s of strikes) { const d = t - s.t; s.mesh.visible = (d >= 0 && d < 0.1) || (d > 0.16 && d < 0.3); if (d >= 0) flash = Math.max(flash, s.power * Math.exp(-d * 6) * (d < 0.1 || d > 0.16 ? 1 : 0.45)); }
  if (shot === 'valley') flash = Math.max(flash, 0.25 * Math.exp(-Math.abs(t - 0.75) * 14), 0.2 * Math.exp(-Math.abs(t - 1.25) * 16));
  const storm = shot === 'valley' ? 1 : 0.15; const boost = 1 + flash * (storm ? 2.2 : 0.2);
  sky.set(m.sky, SUN_DIR, m.gain.map((g) => g * (1 + flash * storm * 3)));
  scene.environment = A.env[m.sky]; scene.environmentIntensity = m.envI * boost; scene.environmentRotation.y = sky.mesh.rotation.y;
  scene.fog.color.set(m.fog).lerp(col.set(0x8f9bd8), sat(flash * storm * 0.45)); scene.fog.density = m.dens;
  sun.color.set(m.sunCol); sun.intensity = m.sun; flashLight.intensity = flash * storm * 2.4;
  renderer.toneMappingExposure = m.exp; beacon.scale.setScalar(1 + 0.12 * Math.sin(t * 5));

  const built = (a, b) => outCubic(ramp(t, a, b));
  const houseP = built(CUTS.plot + 1.1, CUTS.plot + 3.1), cafeP = built(CUTS.plot + 3.5, CUTS.plot + 5.3), stadP = ease(ramp(t, CUTS.stadium + 2.0, CUTS.stadium + 5.5));
  houseRise(houseP, shot === 'plot' ? t : 0); cafeRise(cafeP, shot === 'plot' && t > CUTS.plot + 2.6 ? t : 0); stadiumRise(stadP, shot === 'stadium' ? t : 0);
  stele.visible = t >= CUTS.names; fountain.visible = extras.visible = t >= CUTS.wide; way.visible = t >= CUTS.gate;
  for (const f of flames) f.children.forEach((c) => { const k = 0.75 + 0.35 * Math.sin(t * 13 + c.userData.ph * 3) + 0.2 * Math.sin(t * 29 + c.userData.ph); c.scale.set(k, k * 1.7, k); });
  const doorOpen = outCubic(ramp(t, CUTS.gate + 1.7, CUTS.gate + 3.0));
  gate.userData.doors.forEach(({ pivot, s }) => { pivot.rotation.y = s * doorOpen * 1.85; });

  const plotSpot = V(PLOT.x + 5.4, 0, PLOT.z + 8.4);
  if (shot === 'gate') { hero.visible = true; hero.position.set(0.5, 0, lerp(87, 70.5, ramp(t, CUTS.gate, CUTS.plot))); face(hero, 0, -1); pose(hero, t, true); }
  else if (shot === 'plot') { hero.visible = true; hero.position.copy(plotSpot); face(hero, -5, -8); pose(hero, t, false, er(t, CUTS.plot + 2.9, CUTS.plot + 3.3) * (1 - er(t, CUTS.plot + 4.6, CUTS.plot + 5.2))); }
  else { hero.visible = shot !== 'valley'; hero.position.copy(plotSpot); face(hero, 1, 1); pose(hero, t, false); }

  const showCrowd = t >= CUTS.stadium;
  for (const p of crowd) { p.c.visible = showCrowd; if (!showCrowd) continue; const k = ease(ramp(t, p.t0, p.t0 + p.dur)); p.c.position.lerpVectors(p.from, p.to, k); face(p.c, STAD.x - p.c.position.x, STAD.z - p.c.position.z); pose(p.c, t, k < 1, k >= 1 ? 0.5 + 0.5 * Math.sin(t * 2 + p.ph) : 0, p.ph); }
  watchers.forEach((c, i) => { c.visible = t >= CUTS.names; pose(c, t, false, t > CUTS.names + 2.0 ? 0.6 : 0, i); });
  walkers.forEach((w) => { w.c.visible = t >= CUTS.wide; const z = ((w.z0 + w.dir * w.sp * t + 40) % 95 + 95) % 95 - 40; w.c.position.set(w.x, 0, z); face(w.c, 0, w.dir); pose(w.c, t, true, 0, w.ph); });

  rainData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'plot') return hide(rain, i); const e = Math.pow(k, 1.4); dummy.position.set(b.x + b.dx * (1 - k), lerp(30, 0.8, e), b.z); dummy.rotation.set(0, b.sp + t * 7, 0.2); dummy.scale.setScalar(2.0 * Math.min(1, (1 - k) * 8)); dummy.updateMatrix(); rain.setMatrixAt(i, dummy.matrix); });
  rain.instanceMatrix.needsUpdate = true;
  const stadTop = stadP * stadium.userData.height;
  streamData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'stadium') return hide(stream, i); const p = crowd[b.who].c.position; dummy.position.set(lerp(p.x, STAD.x + b.ox, k), lerp(2, stadTop * 0.7 + 1, k) + Math.sin(k * Math.PI) * 14, lerp(p.z, STAD.z + b.oz, k)); dummy.rotation.set(0, b.sp + t * 8, 0.3); dummy.scale.setScalar(1.3 * Math.min(1, (1 - k) * 6, k * 10)); dummy.updateMatrix(); stream.setMatrixAt(i, dummy.matrix); });
  stream.instanceMatrix.needsUpdate = true;

  if (t >= CUTS.names) drawStele(Math.floor((t - CUTS.names - 0.2) / 0.07), er(t, CUTS.names + 1.95, CUTS.names + 2.3) * (0.86 + 0.14 * Math.sin(t * 6)));

  // camera: position, look-at, focus distance, blur strength, shadow area
  let pos, look, shadowR = 48, focus, focusAt, blur = 1;
  if (shot === 'valley') { const k = ramp(t, 0, CUTS.gate); pos = V(0, lerp(9, 7, k), lerp(58, 44, k)); look = V(0, lerp(330, 300, k), -2100); focus = V(0, 0, 0); focusAt = 300; blur = 0; }
  else if (shot === 'gate') { const k = ease(ramp(t, CUTS.gate, CUTS.plot)); pos = V(lerp(-2.4, 0.8, k), lerp(1.9, 2.7, k), lerp(96, 90, k)); look = V(0, lerp(8.2, 6.4, k), 62); focus = V(0, 0, 72); focusAt = pos.distanceTo(hero.position) + 2; blur = 0.6; }
  else if (shot === 'plot') { const k = ease(ramp(t, CUTS.plot, CUTS.stadium)); pos = V(lerp(-3.5, -7.5, k), lerp(5.6, 3.6, k), lerp(35, 33.5, k)); look = V(lerp(-16.5, -13.5, k), lerp(3.6, 3.2, k), 13); focus = V(-11, 0, 15); focusAt = 20; blur = 0.8; }
  else if (shot === 'stadium') { const k = ease(ramp(t, CUTS.stadium, CUTS.names)); pos = V(lerp(-26, -14, k), lerp(12, 24, k), lerp(30, 36, k)); look = V(STAD.x - 2, lerp(4, 8, k), STAD.z + 2); focus = STAD; shadowR = 80; focusAt = 70; blur = 0.25; }
  else if (shot === 'names') { const k = ease(ramp(t, CUTS.names, CUTS.wide)); pos = V(lerp(19.6, 22.5, k), lerp(5.2, 3.2, k), lerp(8.5, 14.6, k)); look = V(lerp(21, 22, k), lerp(6.0, 5.3, k), -3.5); focus = V(22, 0, -6); shadowR = 55; focusAt = pos.z + 3.5; blur = 1; }
  else { const k = outCubic(ramp(t, CUTS.wide, DURATION)); pos = V(lerp(8, -4, k), lerp(13, 50, k), lerp(36, 112, k)); look = V(lerp(6, 3, k), lerp(6, 40, k), lerp(-14, -200, k)); focus = V(2, 0, 4); shadowR = 110; focusAt = 120; blur = 0; }
  pos.x += Math.sin(t * 61) * flash * 0.25; pos.y += Math.sin(t * 47) * flash * 0.18;
  if (params.has('cam')) { const c = params.get('cam').split(',').map(Number); pos.set(c[0], c[1], c[2]); look.set(c[3], c[4], c[5]); el('caps').style.display = el('scrim').style.display = 'none'; }
  camera.position.copy(pos); camera.lookAt(look); camera.updateMatrixWorld();
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 260);
  const sc = sun.shadow.camera; if (sc.right !== shadowR) { sc.left = sc.bottom = -shadowR; sc.right = sc.top = shadowR; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix(); }
  bokeh.uniforms.focus.value = focusAt; bokeh.uniforms.aperture.value = 0.00016 * blur; bokeh.enabled = blur > 0;
  grade.uniforms.time.value = Math.round(t * 30);

  updateCaptions(caps, t);
  placeTag(heroTag, hero, shot === 'gate' ? er(t, CUTS.gate + 2.1, CUTS.gate + 2.5) : shot === 'plot' ? er(t, CUTS.plot + 0.3, CUTS.plot + 0.7) : 0);
  crowdTags.forEach(({ i, tag, at }) => placeTag(tag, crowd[i].c, shot === 'stadium' ? er(t, at, at + 0.3) : 0));
  const T = CUTS.title;
  el('flash').style.opacity = sat(flash * (shot === 'valley' ? 0.18 : 0.2) + (shot === 'valley' ? er(t, CUTS.gate - 0.1, CUTS.gate) : 0) + (shot === 'gate' ? 0.9 * (1 - ramp(t, CUTS.gate, CUTS.gate + 0.45)) : 0));
  el('scrim').style.opacity = 1 - er(t, CUTS.wide - 0.2, CUTS.wide + 0.3) * (1 - er(t, T - 0.2, T));
  el('dim').style.opacity = er(t, T - 0.1, T + 0.6) * 0.9;
  el('title').style.opacity = er(t, T + 0.05, T + 0.5); el('title').style.transform = `scale(${1.14 - 0.14 * outCubic(ramp(t, T + 0.05, T + 1.1)) + 0.02 * ramp(t, T + 1.1, DURATION)})`;
  el('tagline').style.opacity = er(t, T + 1.1, T + 1.6); el('soon').style.opacity = er(t, T + 1.8, T + 2.3);

  composer.render();
}

window.__duration = DURATION; window.__frame = frame; window.__ready = true;
if (!CAPTURE) {
  let held = parseFloat(params.get('t')) || 0, start = performance.now() - held * 1000, paused = params.has('pause');
  addEventListener('keydown', (e) => { if (e.key === ' ') { paused = !paused; start = performance.now() - held * 1000; } if (e.key === 'ArrowRight') { held += 0.5; start -= 500; } if (e.key === 'ArrowLeft') { held -= 0.5; start += 500; } });
  const loop = () => { if (!paused) held = ((performance.now() - start) / 1000) % (DURATION + 1); frame(held); el('hud').textContent = held.toFixed(2) + 's · space pauses · arrows scrub'; requestAnimationFrame(loop); };
  loop();
} else frame(0);
