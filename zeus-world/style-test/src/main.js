// Zeus World style test: one citizen's plot built from AI-generated models.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');
const EXT = import.meta.env.VITE_MODEL_EXT || 'glb'; // the published page uses self-contained .json glTF files
const $ = (id) => document.getElementById(id);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 400);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.55;

// warm gradient sky
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
  vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 p; void main(){ float h = p.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bottom, smoothstep(0.0, -0.3, h)); gl_FragColor = vec4(c, 1.0); }' });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), skyMat));
scene.fog = new THREE.Fog(0xf1d2ad, 40, 120);

const hemi = new THREE.HemisphereLight(0xffffff, 0x8a6a48, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c4, 2.6); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 });
scene.add(sun);

const LIGHTS = {
  day: { top: 0x5d9be0, mid: 0xcfe2f2, bottom: 0xb7c99a, fog: 0xd6e4ee, sun: 0xfff1dc, sunI: 2.8, sunPos: [-10, 18, 9], hemiI: 0.75, exp: 1.0 },
  gold: { top: 0x4a6fb8, mid: 0xf6c99a, bottom: 0xc79b6b, fog: 0xf1cfa6, sun: 0xffc98e, sunI: 3.0, sunPos: [-14, 9, 8], hemiI: 0.55, exp: 1.02 },
};
let mood = 'gold';
function applyLight(k) {
  const L = LIGHTS[k]; skyMat.uniforms.top.value.set(L.top); skyMat.uniforms.mid.value.set(L.mid); skyMat.uniforms.bottom.value.set(L.bottom);
  scene.fog.color.set(L.fog); sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.sunPos); hemi.intensity = L.hemiI; renderer.toneMappingExposure = L.exp;
  $('light').textContent = k === 'gold' ? 'Daylight' : 'Golden hour';
}
applyLight(mood);

// ---------- the plot: grass island, marble border, cobbled path ----------
function noiseTex(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const img = x.createImageData(size, size);
  for (let i = 0; i < size * size; i++) { const [r, g, b] = fn(i % size, Math.floor(i / size)); img.data.set([r, g, b, 255], i * 4); }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const grassTex = noiseTex(512, (x, y) => { const v = rnd(); const c = 0.5 + 0.5 * Math.sin(x * 0.045 + Math.sin(y * 0.03) * 2) * Math.cos(y * 0.05 + Math.sin(x * 0.02)); const k = 0.82 + 0.18 * c + 0.12 * (v - 0.5); return [92 * k + 18 * c, 142 * k, 58 * k]; }); grassTex.repeat.set(3, 3);
const marble = new THREE.MeshStandardMaterial({ color: 0xe8dfd0, roughness: 0.5, metalness: 0 });
const gold = new THREE.MeshStandardMaterial({ color: 0xf0bf55, roughness: 0.25, metalness: 1 });
const cobbleTex = noiseTex(256, (x, y) => { const cx = Math.floor(x / 32), cy = Math.floor(y / 32 + (cx % 2) * 0.5); const v = 0.75 + 0.25 * Math.sin(cx * 12.9 + cy * 78.2); const edge = (x % 32 < 2 || (y + (cx % 2) * 16) % 32 < 2) ? 0.55 : 1; return [222 * v * edge, 204 * v * edge, 176 * v * edge]; }); cobbleTex.repeat.set(1, 4);

const PLOT = 14;
const island = new THREE.Group(); scene.add(island);
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(PLOT * 0.78, PLOT * 0.7, 2.2, 48, 1), new THREE.MeshStandardMaterial({ color: 0xb9946a, roughness: 1 })); base.position.y = -1.15; base.receiveShadow = true; island.add(base);
  const lawn = new THREE.Mesh(new THREE.CylinderGeometry(PLOT * 0.78, PLOT * 0.78, 0.1, 48), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 })); lawn.position.y = -0.05; lawn.receiveShadow = true; island.add(lawn);
  // marble plot border and gold corner posts
  const plot = new THREE.Group(); island.add(plot);
  for (const [w, d, x, z] of [[PLOT, 0.5, 0, PLOT / 2], [PLOT, 0.5, 0, -PLOT / 2], [0.5, PLOT, PLOT / 2, 0], [0.5, PLOT, -PLOT / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), marble); m.position.set(x, 0.1, z); m.castShadow = m.receiveShadow = true; plot.add(m); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.9, 16), marble); p.position.set(sx * PLOT / 2, 0.45, sz * PLOT / 2); p.castShadow = true; plot.add(p); const b = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), gold); b.position.set(sx * PLOT / 2, 1.02, sz * PLOT / 2); plot.add(b); }
  const path = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 6.4), new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.9 })); path.position.set(0, 0.03, 3.6); path.receiveShadow = true; plot.add(path);
}

// soft clouds drifting around the island
const clouds = new THREE.Group(); scene.add(clouds);
{ const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xfff2e2, emissiveIntensity: 0.35 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); const a = (i / 9) * Math.PI * 2; const r = 22 + (i % 3) * 7;
    for (let j = 0; j < 6; j++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.6 + rnd() * 1.8, 16, 12), cm); m.position.set((j - 2.5) * 1.8, rnd() * 0.8, rnd() * 2); m.scale.y = 0.6; c.add(m); }
    c.position.set(Math.cos(a) * r, -4 - (i % 4) * 2.5 + (i % 2) * 7, Math.sin(a) * r); c.rotation.y = -a; c.userData.a = a; c.userData.r = r; clouds.add(c); } }
// rocky underside so the plot reads as a floating island
{ const g = new THREE.ConeGeometry(PLOT * 0.7, 9, 9, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 4.4) { p.setX(i, p.getX(i) * (0.85 + rnd() * 0.3)); p.setZ(i, p.getZ(i) * (0.85 + rnd() * 0.3)); } } g.computeVertexNormals();
  const rock = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9c7a58, roughness: 1, flatShading: true })); rock.rotation.x = Math.PI; rock.position.y = -6.7; island.add(rock); }

// ---------- models ----------
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const PARTS = { walls: [['body_plaster', 'Plaster', 300], ['body_marble', 'Marble', 800]], roof: [['roof_terracotta', 'Terracotta', 200], ['roof_azure', 'Azure', 600]], porch: [[null, 'None', 0], ['porch_doric', 'Doric', 250], ['porch_ionic', 'Ionic', 700]] };
const ITEMS = ['olive', 'fountain', 'cafe', 'statue', 'brazier', ...Object.values(PARTS).flat().map((p) => p[0]).filter(Boolean)];
const models = {}; let loaded = 0;
function fit(obj, height) {
  const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()); const s = height / size.y;
  const g = new THREE.Group(); obj.scale.setScalar(s); obj.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s); g.add(obj); return g;
}
await Promise.all(ITEMS.map((id) => loader.loadAsync(`./models/${id}.${EXT}`).then((g) => {
  g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; const m = o.material; if (m.map) m.map.anisotropy = 8; m.envMapIntensity = 0.8; } });
  models[id] = g.scene; $('bar').style.width = (++loaded / ITEMS.length) * 100 + '%';
})));

const place = (id, h, x, z, ry = 0) => { const o = fit(models[id].clone(true), h); o.position.set(x, 0, z); o.rotation.y = ry; island.add(o); return o; };
// AI models face the camera they were generated from (three-quarter view), so a 45 degree turn puts the front toward +z.
const FRONT = Math.PI / 4 + (parseFloat(params.get('rot')) || 0);
// ---------- modular villa: walls + roof + porch snap to fixed sockets ----------
const VW = 6.4, VD = 4.4, VH = 3.0, VZ = -2.6; // footprint width, depth, wall height, centre z
const FLIP = new Set((params.get('flip') || '').split(',')); // parts whose generated front faces backwards
// Scale a generated part to exactly fill a w x h x d box, long side along x, front toward +z.
function fitBox(id, w, h, d) {
  const inner = models[id].clone(true), holder = new THREE.Group(); holder.add(inner);
  const box = () => { holder.updateMatrixWorld(true); return new THREE.Box3().setFromObject(inner); };
  let b = box(), s = b.getSize(new THREE.Vector3());
  if (s.z > s.x) { inner.rotation.y = Math.PI / 2; b = box(); s = b.getSize(new THREE.Vector3()); }
  if (FLIP.has(id) !== !!PART_FLIP[id]) { inner.rotation.y += Math.PI; b = box(); }
  const c = b.getCenter(new THREE.Vector3()); inner.position.set(-c.x, -b.min.y, -c.z);
  holder.scale.set(w / s.x, h / s.y, d / s.z); const g = new THREE.Group(); g.add(holder); return g;
}
const PART_FLIP = {};
const SOCKETS = {
  walls: (id) => { const o = fitBox(id, VW, VH, VD); o.position.set(0, 0, VZ); return o; },
  roof: (id) => { const o = fitBox(id, VW + 0.9, 2.3, VD + 1.1); o.position.set(0, VH - 0.12, VZ); return o; },
  porch: (id) => { const o = fitBox(id, VW + 0.2, VH + 0.1, 1.9); o.position.set(0, 0, VZ + VD / 2 + 0.85); return o; },
};
const villa = { walls: null, roof: null, porch: null }; const choice = { walls: 0, roof: 0, porch: 1 };
for (const k of ['walls', 'roof', 'porch']) { const v = parseInt(params.get(k)); if (!Number.isNaN(v) && PARTS[k][v]) choice[k] = v; }
function setPart(k, i, animate) {
  if (villa[k]) island.remove(villa[k]); villa[k] = null; choice[k] = i; const id = PARTS[k][i][0];
  if (id) { villa[k] = SOCKETS[k](id); island.add(villa[k]); if (animate) rising = { obj: villa[k], t: 0, y: villa[k].position.y }; }
}
['walls', 'roof', 'porch'].forEach((k) => setPart(k, choice[k], false));
place('olive', 3.0, -5.1, -4.9, 0.4); place('olive', 2.7, 5.2, -5.0, 1.9);
place('fountain', 1.9, -3.9, 3.2, FRONT);
place('cafe', 2.3, 4.0, 3.0, FRONT + 0.3);
place('statue', 3.1, -5.3, -0.6, FRONT + 0.5);
const braziers = [place('brazier', 2.1, -1.7, 5.6, FRONT), place('brazier', 2.1, 1.7, 5.6, FRONT)];

// flickering glow on the braziers
const flames = braziers.map((b) => { const l = new THREE.PointLight(0xff9a3c, 3, 6, 2); l.position.set(b.position.x, 2.2, b.position.z); island.add(l); return l; });

// ---------- citizen ----------
let citizen = null, mixer = null; const actions = {};
try {
  const g = await loader.loadAsync(`./models/citizen.${EXT}`);
  g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  citizen = fit(g.scene, 1.75); citizen.position.set(0, 0, 5.4); island.add(citizen);
  if (g.animations.length) { mixer = new THREE.AnimationMixer(g.scene); g.animations.forEach((c) => (actions[c.name] = mixer.clipAction(c))); actions.Idle?.play(); }
} catch (e) { console.warn('citizen model missing', e); }

// ---------- post ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.45, 1.6); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- camera ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -0.6, 0.6); // aimed low so the plot sits above the build panel controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 12; controls.maxDistance = 46; controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.3;
controls.autoRotate = !SHOT; controls.autoRotateSpeed = 0.6;
function frameCamera() { const portrait = innerHeight > innerWidth; camera.fov = portrait ? 44 : 32; camera.position.set(14, 12, 22).normalize().multiplyScalar(portrait ? 30 : 27); camera.updateProjectionMatrix(); }
frameCamera();
if (params.get('cam')) { const c = params.get('cam').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); if (c.length > 3) controls.target.set(c[3], c[4], c[5]); }
controls.update();

// ---------- UI ----------
let rising = null, celebrate = 0, last = performance.now() / 1000; const t0 = last;
// the citizen strolls between spots on the plot and pauses at each
const SPOTS = [[0, 5.4], [-2.6, 3.8], [-1.6, 2.2], [2.4, 2.4], [2.9, 4.4]].map(([x, z]) => new THREE.Vector3(x, 0, z));
let walk = { i: 0, wait: 2.5 }, current = 'Idle';
function play(name) { if (!mixer || current === name || !actions[name]) return; actions[current]?.fadeOut(0.3); actions[name].reset().fadeIn(0.3).play(); current = name; }
function stroll(dt) {
  if (!citizen) return;
  if (celebrate > 0) { celebrate -= dt; play('Cheer'); citizen.lookAt(camera.position.x, 0, camera.position.z); return; }
  if (walk.wait > 0) { walk.wait -= dt; play('Idle'); if (walk.wait <= 0) walk.i = (walk.i + 1) % SPOTS.length; return; }
  const goal = SPOTS[walk.i], d = goal.clone().sub(citizen.position); d.y = 0; const dist = d.length();
  if (dist < 0.05) { walk.wait = 2 + (walk.i % 3); return; }
  play('Walk'); const step = Math.min(dist, dt * 1.15); citizen.position.addScaledVector(d.normalize(), step);
  const yaw = Math.atan2(d.x, d.z); let dy = yaw - citizen.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); citizen.rotation.y += dy * Math.min(1, dt * 8);
}
function toast(t) { $('toast').textContent = t; $('toast').style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => ($('toast').style.opacity = 0), 1800); }
// build panel: one row of chips per slot, priced in Bolts, against an earned balance
const EARNED = 2000;
function spent() { return Object.entries(choice).reduce((n, [k, i]) => n + PARTS[k][i][2], 0); }
function refresh() {
  const left = EARNED - spent(); $('bolts').textContent = left.toLocaleString();
  $('tier').textContent = Object.entries(choice).filter(([k, i]) => PARTS[k][i][0]).map(([k, i]) => PARTS[k][i][1]).join(' · ');
  document.querySelectorAll('.chip').forEach((c) => { const k = c.dataset.slot, i = +c.dataset.i; const on = choice[k] === i; c.setAttribute('aria-pressed', on);
    c.disabled = !on && left - PARTS[k][i][2] + PARTS[k][choice[k]][2] < 0; });
}
for (const [k, opts] of Object.entries(PARTS)) {
  const row = document.createElement('div'); row.className = 'slot'; row.innerHTML = `<span class="slot-name">${{ walls: 'Walls', roof: 'Roof', porch: 'Porch' }[k]}</span>`;
  opts.forEach(([id, name, cost], i) => { const b = document.createElement('button'); b.className = 'chip'; b.id = `chip-${k}-${i}`; b.dataset.slot = k; b.dataset.i = i;
    b.innerHTML = `${name}<small>${cost ? cost + ' ⚡' : 'Free'}</small>`;
    b.onclick = () => { if (choice[k] === i) return; setPart(k, i, true); refresh(); if (id) { toast(`${name} ${k === 'walls' ? 'walls' : k} placed`); celebrate = 2.4; } };
    row.appendChild(b); });
  $('build').appendChild(row);
}
refresh();
$('light').onclick = () => { mood = mood === 'gold' ? 'day' : 'gold'; applyLight(mood); };
$('spin').onclick = () => { controls.autoRotate = !controls.autoRotate; $('spin').textContent = controls.autoRotate ? 'Pause spin' : 'Spin'; };
if (params.get('light') === 'day') { mood = 'day'; applyLight('day'); }

addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; frameCamera(); controls.update(); });

const tmp = new THREE.Vector3();
function tick() {
  const now = performance.now() / 1000, dt = SHOT ? 1 / 30 : Math.min(now - last, 0.05), t = now - t0; last = now;
  stroll(dt); clouds.children.forEach((c, i) => { const a = c.userData.a + t * 0.01; c.position.x = Math.cos(a) * c.userData.r; c.position.z = Math.sin(a) * c.userData.r; c.rotation.y = -a; });
  if (rising) { rising.t = Math.min(1, rising.t + dt * 1.6); const k = 1 - Math.pow(1 - rising.t, 3); rising.obj.position.y = rising.y + 2.5 * (1 - k); rising.obj.scale.setScalar(0.9 + 0.1 * k); if (rising.t >= 1) rising = null; }
  flames.forEach((l, i) => (l.intensity = 2.6 + 0.6 * Math.sin(t * 11 + i * 2) + 0.3 * Math.sin(t * 23 + i)));
  mixer?.update(dt); controls.update();
  tmp.set(0, VH + 3.0, VZ).project(camera);
  $('plaque').style.transform = `translate(${(tmp.x * 0.5 + 0.5) * innerWidth}px, ${(-tmp.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
  composer.render();
  if (!SHOT) requestAnimationFrame(tick);
}
$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 700);
if (SHOT) { const n = parseInt(params.get('frames')) || 3; for (let i = 0; i < n; i++) tick(); window.__ready = true; } else tick();
