// Zeus World teaser, built from the AI-generated model kit.
// Every frame is a pure function of time, so a frame always renders the same picture.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import { CUTS, DURATION, CAPTIONS, NAMES, HERO } from './timeline.js';
import { makeCaptions, updateCaptions } from './text.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
const stage = document.getElementById('stage');
const el = (id) => document.getElementById(id);
const { clamp, lerp } = THREE.MathUtils;
const sat = (x) => clamp(x, 0, 1);
const ramp = (t, a, b) => sat((t - a) / (b - a));
const ease = (x) => x * x * (3 - 2 * x);
const er = (t, a, b) => ease(ramp(t, a, b));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.prepend(renderer.domElement);
function fit() { const s = CAPTURE ? 1 : Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; stage.style.left = CAPTURE ? '0' : (innerWidth - W * s) / 2 + 'px'; }
addEventListener('resize', fit); fit();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.3, 3000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.fog = new THREE.Fog(0xffffff, 80, 420);

const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, low: { value: new THREE.Color() }, flash: { value: 0 }, stars: { value: 0 } },
  vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform float flash; uniform float stars; varying vec3 p;
    float h(vec3 v){ return fract(sin(dot(v, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    void main(){ float y = p.y; vec3 c = y > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, y)) : mix(mid, low, smoothstep(0.0, -0.2, y));
      vec3 q = floor(p * 420.0); float s = step(0.9975, h(q)) * smoothstep(0.05, 0.4, y); c += vec3(s) * stars;
      c += vec3(0.55, 0.62, 0.95) * flash; gl_FragColor = vec4(c, 1.0); }` });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), skyMat));

const hemi = new THREE.HemisphereLight(0xffffff, 0x8a6a48, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c4, 2.6); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const flashLight = new THREE.HemisphereLight(0xc6d2ff, 0x404a7a, 0); scene.add(flashLight);

// ---------- procedural textures ----------
function canvasTex(size, draw, repeat = 1) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const R = rng(5);
const grassTex = canvasTex(512, (x, s) => { const img = x.createImageData(s, s); for (let i = 0; i < s * s; i++) { const px = i % s, py = (i / s) | 0; const c = 0.5 + 0.5 * Math.sin(px * 0.045 + Math.sin(py * 0.03) * 2) * Math.cos(py * 0.05 + Math.sin(px * 0.02)); const k = 0.82 + 0.16 * c + 0.12 * (R() - 0.5); img.data.set([96 * k + 16 * c, 146 * k, 60 * k, 255], i * 4); } x.putImageData(img, 0, 0); }, 40);
const cobbleTex = canvasTex(256, (x, s) => { x.fillStyle = '#8f7d64'; x.fillRect(0, 0, s, s); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const o = (r % 2) * 16; const v = 200 + R() * 40; x.fillStyle = `rgb(${v},${v * 0.92},${v * 0.8})`; x.beginPath(); x.roundRect(c * 32 + o - 30 + 3, r * 32 + 3, 26, 26, 6); x.fill(); x.beginPath(); x.roundRect(c * 32 + o + 3, r * 32 + 3, 26, 26, 6); x.fill(); } });
const marble = new THREE.MeshStandardMaterial({ color: 0xece3d2, roughness: 0.5 });
const gold = new THREE.MeshStandardMaterial({ color: 0xf0bf55, roughness: 0.25, metalness: 1 });
const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(5, 3.2, 0.8), toneMapped: false });

// ---------- landscape ----------
const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 64), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const road = (w, len, x, z, ry) => { const t = cobbleTex.clone(); t.needsUpdate = true; t.repeat.set(w / 2.4, len / 2.4); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, 0.02, z); m.receiveShadow = true; scene.add(m); return m; };
road(5, 60, 0, 22, 0); // gate to plaza
road(4, 30, 10, -6, -0.9); // plaza to stadium
road(4, 14, -6, 13, 1.25); // plaza to Luna's plot
{ const t = cobbleTex.clone(); t.needsUpdate = true; t.repeat.set(5, 5); const plaza = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.03, 0); plaza.receiveShadow = true; scene.add(plaza); }

// rolling hills and Mount Olympus
const hillMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false });
function hill(x, z, r, h, seed, snow = 0) {
  const g = new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2); const p = g.attributes.position; const r2 = rng(seed); const col = new Float32Array(p.count * 3);
  const ph = [r2() * 6, r2() * 6, r2() * 6];
  for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i); const a = Math.atan2(vz, vx); const n = 1 + 0.12 * Math.sin(a * 3 + ph[0]) + 0.08 * Math.sin(a * 7 + ph[1]) + 0.05 * Math.sin(vy * 0.2 + ph[2]);
    const y = (vy / r) * h * n; p.setXYZ(i, vx * n, y, vz * n); const k = y / h; let c = snow ? new THREE.Color(0x6f7f58).lerp(new THREE.Color(0x8d8f99), sat(k * 2.2 - 0.15)) : new THREE.Color(0x7f9a55).lerp(new THREE.Color(0x9a8a6c), sat(k * 1.4 - 0.2)); if (snow) c.lerp(new THREE.Color(0xf6f4ef), sat((k - snow) * 5)); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, hillMat); m.position.set(x, -0.5, z); m.receiveShadow = true; scene.add(m); return m;
}
{ const r = rng(9); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + r() * 0.2; const d = 170 + r() * 90; hill(Math.cos(a) * d, Math.sin(a) * d - 40, 50 + r() * 50, 22 + r() * 30, i + 3); } }
const OLYMPUS = V(0, 0, -520);
hill(OLYMPUS.x, OLYMPUS.z, 210, 300, 77, 0.62); hill(-190, -470, 140, 150, 78, 0.8); hill(200, -480, 150, 170, 79, 0.78);
const PEAK = V(OLYMPUS.x, 296, OLYMPUS.z);
const beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(8, 5, 1.4), fog: false, toneMapped: false })); beacon.position.copy(PEAK).y += 6; scene.add(beacon);

// clouds
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.3, fog: false });
const clouds = new THREE.Group(); scene.add(clouds);
{ const r = rng(12); for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let j = 0; j < 7; j++) { const m = new THREE.Mesh(new THREE.SphereGeometry(8 + r() * 9, 14, 10), cloudMat); m.position.set((j - 3) * 9 + r() * 4, r() * 4, r() * 8); m.scale.y = 0.55; c.add(m); } c.position.set((r() - 0.5) * 900, 110 + r() * 90, -200 - r() * 420); c.userData.x = c.position.x; clouds.add(c); } }

// city wall either side of the gate
const GATE_Z = 46;
{ const wallMat = new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 0.6 }); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(90, 6.5, 2.4), wallMat); w.position.set(s * 52, 3.25, GATE_Z); w.castShadow = w.receiveShadow = true; scene.add(w); const cap = new THREE.Mesh(new THREE.BoxGeometry(90, 0.6, 3), marble); cap.position.set(s * 52, 6.8, GATE_Z); scene.add(cap); for (let i = 0; i < 9; i++) { const tw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8.5, 3.4), wallMat); tw.position.set(s * (14 + i * 10.5), 4.25, GATE_Z); tw.castShadow = true; scene.add(tw); const tc = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4), gold); tc.position.set(s * (14 + i * 10.5), 8.8, GATE_Z); scene.add(tc); } } }

// ---------- models ----------
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const STATIC = ['gate', 'door', 'stadium', 'namewall', 'cafebldg', 'cypress', 'olive', 'fountain', 'statue', 'brazier', 'cafe', 'body_plaster', 'body_marble', 'roof_terracotta', 'roof_azure', 'porch_doric', 'porch_ionic'];
const RIGGED = ['citizen', 'citizen_elder', 'citizen_f'];
const M = {}, CLIPS = {};
await Promise.all([...STATIC.map((id) => loader.loadAsync(`./models/${id}.glb`).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material.envMapIntensity = 0.8; } }); M[id] = g.scene; })),
  ...RIGGED.map((id) => loader.loadAsync(`./models/${id}.glb`).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); M[id] = g.scene; CLIPS[id] = g.animations; }).catch(() => {})),
  document.fonts.load('700 50px Cinzel'), document.fonts.load('900 132px Cinzel')]);
const HERO_MODEL = M.citizen_f ? 'citizen_f' : 'citizen';
const CROWD_MODELS = RIGGED.filter((id) => M[id]);

// copy of a model scaled to a height, centred, standing on y = 0, yawed so its front faces +z
function place(id, h, x, z, ry = 0, yaw = Math.PI / 4, parent = scene) {
  const inner = M[id].clone(true); inner.rotation.y = yaw; const holder = new THREE.Group(); holder.add(inner); holder.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(inner); const s = h / (b.max.y - b.min.y); const c = b.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b.min.y, -c.z); holder.scale.setScalar(s); const g = new THREE.Group(); g.add(holder); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  g.userData.size = b.getSize(new THREE.Vector3()).multiplyScalar(s); return g;
}
// copy scaled to fill exactly w x h x d (used for the modular villa parts)
function fitBox(id, w, h, d) {
  const inner = M[id].clone(true), holder = new THREE.Group(); holder.add(inner);
  const box = () => { holder.updateMatrixWorld(true); return new THREE.Box3().setFromObject(inner); };
  let b = box(), s = b.getSize(new THREE.Vector3()); if (s.z > s.x) { inner.rotation.y = Math.PI / 2; b = box(); s = b.getSize(new THREE.Vector3()); }
  const c = b.getCenter(new THREE.Vector3()); inner.position.set(-c.x, -b.min.y, -c.z); holder.scale.set(w / s.x, h / s.y, d / s.z); const g = new THREE.Group(); g.add(holder); return g;
}
function villa(x, z, ry, walls, roof, porch, parent = scene) {
  const VW = 6.4, VD = 4.4, VH = 3.0; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const parts = {};
  parts.walls = fitBox(walls, VW, VH, VD); g.add(parts.walls);
  parts.roof = fitBox(roof, VW + 0.9, 2.3, VD + 1.1); parts.roof.position.y = VH - 0.12; g.add(parts.roof);
  if (porch) { parts.porch = fitBox(porch, VW + 0.2, VH + 0.1, 1.9); parts.porch.position.z = VD / 2 + 0.85; g.add(parts.porch); }
  g.userData.parts = parts; return g;
}

// ---------- the city ----------
const gate = place('gate', 15, 0, GATE_Z, 0);
const gs = gate.userData.size; // passage is roughly the middle third of the gate
const PASS_W = gs.x * 0.36, DOOR_H = gs.y * 0.52;
const doors = [-1, 1].map((s) => { const pivot = new THREE.Group(); pivot.position.set(s * PASS_W / 2, 0, GATE_Z + gs.z * 0.12); const d = fitBox('door', PASS_W / 2, DOOR_H, 0.35); d.position.x = -s * PASS_W / 4; pivot.add(d); scene.add(pivot); return { pivot, s }; });
const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(PASS_W, DOOR_H), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1.6, 1.2, 0.7), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); doorGlow.position.set(0, DOOR_H / 2, GATE_Z - gs.z * 0.3); scene.add(doorGlow);

const PLOT = V(-14, 0, 16);
const luna = villa(PLOT.x, PLOT.z, 0.35, 'body_marble', 'roof_terracotta', 'porch_ionic');
const cafeB = place('cafebldg', 6.5, -4.5, 21, -0.5);
place('cafe', 2.2, -2.4, 24.5, -0.2);
const STAD = V(22, 0, -20);
const stadium = place('stadium', 15, STAD.x, STAD.z, -0.5);
const NAMEWALL = V(17, 0, 4);
const namewall = place('namewall', 8.5, NAMEWALL.x, NAMEWALL.z, -0.45, Math.PI / 4 - 0.35);
place('fountain', 3.2, 0, 0, 0);
place('statue', 5, 6.5, 6, -0.6); place('statue', 5, -6.5, 6, 0.6);
for (let z = 40; z > 10; z -= 7.5) for (const s of [-1, 1]) place('brazier', 2.3, s * 3.6, z, 0);
const braziersLit = [];
scene.traverse((o) => {});

// other citizens' villas around the city
const COMBOS = [['body_plaster', 'roof_terracotta', 'porch_doric'], ['body_marble', 'roof_azure', 'porch_ionic'], ['body_plaster', 'roof_azure', null], ['body_marble', 'roof_terracotta', 'porch_doric'], ['body_plaster', 'roof_terracotta', null], ['body_marble', 'roof_azure', 'porch_doric']];
const SPOTS = [[-28, 6, 0.6], [-26, 26, 0.2], [-36, 18, 0.9], [-24, -8, 0.4], [-38, -2, 0.8], [-14, 34, 0.1], [-30, 38, 0.3], [-44, 30, 0.7], [12, 26, -0.4], [24, 18, -0.7], [30, 32, -0.5], [14, 38, -0.2], [38, 10, -1.0], [-14, -16, 0.2], [-30, -22, 0.5], [44, 26, -0.8]];
const city = new THREE.Group(); scene.add(city);
SPOTS.forEach(([x, z, ry], i) => { const [w, r, p] = COMBOS[i % COMBOS.length]; villa(x, z, ry, w, r, p, city); });
// trees, avoiding buildings and roads
{ const r = rng(31); const busy = (x, z) => Math.abs(x) < 6 && z > -2 || Math.hypot(x, z) < 11 || Math.hypot(x - STAD.x, z - STAD.z) < 22 || Math.hypot(x - PLOT.x, z - PLOT.z) < 8 || Math.hypot(x - NAMEWALL.x, z - NAMEWALL.z) < 9 || Math.hypot(x + 4.5, z - 21) < 7 || SPOTS.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 6.5) || Math.abs(z - GATE_Z) < 4;
  let n = 0, guard = 0; while (n < 70 && guard++ < 3000) { const x = (r() - 0.5) * 130, z = (r() - 0.5) * 120 - 4; if (busy(x, z)) continue; if (r() < 0.55) place('cypress', 6 + r() * 4, x, z, r() * 6, 0); else place('olive', 3.5 + r() * 2, x, z, r() * 6, 0); n++; } }

// ---------- citizens ----------
function makeCitizen(id, h = 1.75) {
  const inner = SkeletonUtils.clone(M[id]); const mixer = new THREE.AnimationMixer(inner); const actions = {};
  for (const c of CLIPS[id]) actions[c.name] = mixer.clipAction(c);
  const holder = new THREE.Group(); holder.add(inner); holder.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(inner); const s = h / (b.max.y - b.min.y);
  inner.position.y = -b.min.y; holder.scale.setScalar(s); const g = new THREE.Group(); g.add(holder); scene.add(g);
  g.userData = { mixer, actions, current: null }; return g;
}
// deterministic pose: play one clip at a given local time
function pose(c, name, time) { const u = c.userData; const a = u.actions[name] || u.actions.Idle; if (u.current !== a) { u.mixer.stopAllAction(); a.play(); u.current = a; } a.time = ((time % a.getClip().duration) + a.getClip().duration) % a.getClip().duration; u.mixer.update(0); }
const face = (c, dx, dz) => { c.rotation.y = Math.atan2(dx, dz); };
const hero = makeCitizen(HERO_MODEL, 1.72);
const crowd = []; { const r = rng(42);
  for (let i = 0; i < 30; i++) { let a; do { a = r() * Math.PI * 2; } while (Math.abs(a - (Math.PI / 2 + 0.5)) < 0.5);
    const d0 = 30 + r() * 12, d1 = 19 + r() * 4; const c = makeCitizen(CROWD_MODELS[i % CROWD_MODELS.length], 1.65 + r() * 0.15);
    crowd.push({ c, from: V(STAD.x + Math.cos(a) * d0, 0, STAD.z + Math.sin(a) * d0), to: V(STAD.x + Math.cos(a) * d1, 0, STAD.z + Math.sin(a) * d1), t0: CUTS.stadium - 1.2 + r() * 1.5, dur: 3.4 + r() * 1.2, ph: r() * 3 }); } }
const watchers = [[-4.5, 4.2], [-3, 6], [-6, 6.5], [4.2, 4], [3.2, 6.2], [5.8, 6.6]].map(([x, z], i) => { const c = makeCitizen(CROWD_MODELS[i % CROWD_MODELS.length], 1.7); const p = V(x, 0, z).applyAxisAngle(V(0, 1, 0), -0.45).add(NAMEWALL); c.position.copy(p); c.rotation.y = -0.45 + Math.PI + Math.atan2(x, z) * 0.3; c.userData.ph = i; return c; });
const strollers = []; { const r = rng(77); for (let i = 0; i < 12; i++) { const c = makeCitizen(CROWD_MODELS[i % CROWD_MODELS.length], 1.7); strollers.push({ c, x: (r() - 0.5) * 3.2, z0: r() * 40, dir: r() > 0.5 ? 1 : -1, ph: r() * 3 }); } }

// ---------- bolts ----------
const boltShape = new THREE.Shape(); [[0.15, 1], [-0.45, -0.1], [-0.05, -0.1], [-0.2, -1], [0.45, 0.2], [0.05, 0.2], [0.35, 1]].forEach(([x, y], i) => (i ? boltShape.lineTo(x * 0.5, y * 0.5) : boltShape.moveTo(x * 0.5, y * 0.5)));
const boltGeo = new THREE.ExtrudeGeometry(boltShape, { depth: 0.12, bevelEnabled: false }); boltGeo.translate(0, 0, -0.06);
const dummy = new THREE.Object3D();
function swarm(n) { const m = new THREE.InstancedMesh(boltGeo, glow, n); m.frustumCulled = false; scene.add(m); return m; }
const rain = swarm(90); const rainData = []; { const r = rng(9); for (let i = 0; i < 90; i++) rainData.push({ t0: CUTS.plot + 0.2 + r() * 4.6, x: PLOT.x + (r() - 0.5) * 9, z: PLOT.z + (r() - 0.5) * 7, dx: (r() - 0.5) * 8, sp: r() * 6, dur: 0.9 + r() * 0.4 }); }
const stream = swarm(260); const streamData = []; { const r = rng(10); for (let i = 0; i < 260; i++) streamData.push({ who: (r() * 30) | 0, t0: CUTS.stadium + 0.6 + r() * 4.6, dur: 0.9 + r() * 0.5, ox: (r() - 0.5) * 14, oz: (r() - 0.5) * 10, sp: r() * 6 }); }
const hide = (m, i) => { dummy.position.set(0, -99, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); };

// glowing ring that marks where something is being built
function ring(r, x, z, k = 1) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 6, 96), glow); m.rotation.x = Math.PI / 2; m.scale.y = k; m.position.set(x, 0.12, z); m.visible = false; scene.add(m); return m; }
const plotRing = ring(5.4, PLOT.x, PLOT.z + 0.6, 0.85), stadRing = ring(19, STAD.x, STAD.z, 0.8);

// ---------- lightning ----------
function bolt3d(from, to, seed, width) {
  const r = rng(seed); const parts = [];
  const strand = (a, b, n, w, jit) => { const pts = []; const dir = b.clone().sub(a); const len = dir.length(); const side = V(dir.z, 0, -dir.x).normalize(); const side2 = new THREE.Vector3().crossVectors(dir, side).normalize();
    for (let i = 0; i <= n; i++) { const t = i / n, e = Math.sin(Math.PI * t); pts.push(a.clone().lerp(b, t).addScaledVector(side, (r() - 0.5) * jit * len * e).addScaledVector(side2, (r() - 0.5) * jit * len * e * 0.4)); }
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1], L = p.distanceTo(q); const c = new THREE.CylinderGeometry(w, w, L, 5); c.translate(0, L / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize())); c.translate(p.x, p.y, p.z); parts.push(c); } return pts; };
  const main = strand(from, to, 18, width, 0.15); for (let b = 0; b < 5; b++) { const p = main[3 + b * 3]; strand(p, p.clone().add(V((r() - 0.5) * 60, -25 - r() * 30, (r() - 0.5) * 20)), 6, width * 0.5, 0.2); }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(4, 4.6, 7), fog: false, toneMapped: false })); m.visible = false; scene.add(m); return m;
}
const strikes = [
  { t: 2.0, m: bolt3d(PEAK.clone().add(V(-40, 300, 40)), PEAK.clone().add(V(0, -40, 60)), 1, 2.2), p: 1 },
  { t: CUTS.gate - 0.14, m: bolt3d(V(30, 220, -60), V(10, 0, 10), 2, 0.6), p: 1.4 },
  { t: CUTS.wide + 0.02, m: bolt3d(PEAK.clone().add(V(120, 420, 30)), PEAK, 3, 3), p: 0.45 },
  { t: CUTS.title, m: bolt3d(PEAK.clone().add(V(-150, 440, 40)), PEAK, 4, 3.4), p: 0.8 },
];
strikes.forEach((s) => scene.add(s.m));

// ---------- names wall ----------
const nameCanvas = document.createElement('canvas'); nameCanvas.width = 900; nameCanvas.height = 1000;
const nameTex = new THREE.CanvasTexture(nameCanvas); nameTex.colorSpace = THREE.SRGBColorSpace; nameTex.anisotropy = 8;
const nwSize = namewall.userData.size;
const namePlane = new THREE.Mesh(new THREE.PlaneGeometry(nwSize.x * 0.36, nwSize.y * 0.44), new THREE.MeshBasicMaterial({ map: nameTex, transparent: true, depthWrite: false }));
namePlane.position.set(0, nwSize.y * 0.5, parseFloat(params.get('nz') || '0.05') * nwSize.z); namewall.add(namePlane);
let drawnKey = -1;
function drawNames(count, you) {
  const key = count * 1000 + Math.round(you * 100); if (key === drawnKey) return; drawnKey = key;
  const c = nameCanvas.getContext('2d'); c.clearRect(0, 0, 900, 1000); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < Math.min(count, 21); i++) { const x = 150 + (i % 3) * 300, y = 64 + Math.floor(i / 3) * 104; const fresh = count - i <= 2;
    c.font = '900 74px Cinzel'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText(NAMES[i], x + 2, y + 3); c.fillStyle = 'rgba(50,28,4,.6)'; c.fillText(NAMES[i], x - 2, y - 2); c.fillStyle = fresh ? '#ffbf2e' : '#8a5a12'; c.fillText(NAMES[i], x, y); }
  if (you > 0) { c.globalAlpha = you; c.font = '900 118px Cinzel'; c.shadowColor = '#ff9d00'; c.shadowBlur = 26; c.fillStyle = '#ffc93a'; c.fillText('YOUR NAME', 450, 900); c.shadowBlur = 0; c.lineWidth = 3; c.strokeStyle = '#8a5a12'; c.strokeText('YOUR NAME', 450, 900); c.globalAlpha = 1; }
  nameTex.needsUpdate = true;
}

// ---------- post ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.5, 1.4));
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv; void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, 1.1); c = mix(c, c*c*(3.0-2.0*c), 0.3); vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.55; float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time * 61.0, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.025; gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade);

// ---------- overlay ----------
const caps = makeCaptions(el('caps'), CAPTIONS);
const BOLT_SVG = '<svg viewBox="-50 -105 100 210"><polygon fill="#ffd676" points="15,-100 -45,10 -5,10 -20,100 45,-20 5,-20 35,-100"/></svg>';
const tag = (name) => { const d = document.createElement('div'); d.className = 'tag'; d.innerHTML = BOLT_SVG + '<span>' + name + '</span>'; el('tags').appendChild(d); return d; };
const heroTag = tag(HERO); const crowdTags = [0, 4, 8, 13, 17].map((i, k) => ({ i, t: tag(NAMES[k * 3 + 1]), at: CUTS.stadium + 1.6 + k * 0.35 }));
const tmp = new THREE.Vector3();
function placeTag(t, obj, op, lift = 2.15) { tmp.set(0, lift, 0); obj.localToWorld(tmp.set(0, 0, 0)); tmp.y += lift; tmp.project(camera);
  if (op <= 0.001 || tmp.z > 1 || Math.abs(tmp.x) > 1.05 || Math.abs(tmp.y) > 1.05) { t.style.opacity = 0; return; }
  t.style.opacity = op; t.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * W}px, ${(-tmp.y * 0.5 + 0.5) * H}px) translate(-50%, -100%) translateY(-18px) scale(${0.8 + 0.2 * outCubic(op)})`; }

// ---------- moods ----------
const MOODS = {
  storm: { top: 0x050818, mid: 0x1c2a5a, low: 0x0b1028, fog: 0x141c44, near: 250, far: 1700, sun: 0x8ea6ff, sunI: 0.45, hemiI: 0.12, env: 0.07, exp: 1.0, stars: 0.9, cloud: 0x1c2446 },
  dawn: { top: 0x2c4c9a, mid: 0xf7b48a, low: 0xc4906a, fog: 0xf0bf9e, near: 150, far: 1400, sun: 0xffbb85, sunI: 2.8, hemiI: 0.5, env: 0.5, exp: 1.0, stars: 0, cloud: 0xffd2b4 },
  gold: { top: 0x3f78cf, mid: 0xf6d2a6, low: 0xc79b6b, fog: 0xeed6b8, near: 160, far: 1500, sun: 0xffdcae, sunI: 3.0, hemiI: 0.62, env: 0.55, exp: 1.0, stars: 0, cloud: 0xfff2e2 },
};
const SUN_DIR = V(-0.65, 0.55, 0.5).normalize();

// ---------- the frame ----------
function frame(t) {
  t = clamp(t, 0, DURATION);
  const shot = t < CUTS.gate ? 'valley' : t < CUTS.plot ? 'gate' : t < CUTS.stadium ? 'plot' : t < CUTS.names ? 'stadium' : t < CUTS.wide ? 'names' : 'wide';
  const m = MOODS[shot === 'valley' ? 'storm' : shot === 'gate' ? 'dawn' : 'gold'];

  let flash = 0;
  for (const s of strikes) { const d = t - s.t; s.m.visible = (d >= 0 && d < 0.1) || (d > 0.16 && d < 0.3); if (d >= 0) flash = Math.max(flash, s.p * Math.exp(-d * 6) * (d < 0.1 || d > 0.16 ? 1 : 0.45)); }
  if (shot === 'valley') flash = Math.max(flash, 0.22 * Math.exp(-Math.abs(t - 0.8) * 14), 0.18 * Math.exp(-Math.abs(t - 1.3) * 16));
  const storm = shot === 'valley' ? 1 : 0.2;
  skyMat.uniforms.top.value.set(m.top); skyMat.uniforms.mid.value.set(m.mid); skyMat.uniforms.low.value.set(m.low); skyMat.uniforms.flash.value = flash * storm * 0.5; skyMat.uniforms.stars.value = m.stars;
  scene.fog.color.set(m.fog); scene.fog.near = m.near; scene.fog.far = m.far;
  sun.color.set(m.sun); sun.intensity = m.sunI; hemi.intensity = m.hemiI; scene.environmentIntensity = m.env; flashLight.intensity = flash * storm * 2.2; renderer.toneMappingExposure = m.exp;
  cloudMat.color.set(m.cloud); cloudMat.emissive.set(m.cloud); clouds.children.forEach((c, i) => { c.position.x = c.userData.x + t * (1.5 + (i % 3)); });
  beacon.scale.setScalar(1 + 0.12 * Math.sin(t * 5));

  // gate doors swing open on the music hit
  const open = outCubic(ramp(t, CUTS.gate + 1.7, CUTS.gate + 3.0));
  doors.forEach(({ pivot, s }) => { pivot.rotation.y = -s * open * 1.75; });
  doorGlow.material.opacity = shot === 'gate' ? open * 0.55 * (1 - er(t, CUTS.gate + 2.6, CUTS.gate + 4.6)) : 0;

  // Luna's villa assembles part by part; the cafe rises next to it
  const P = luna.userData.parts; const drop = (part, a) => { const k = ramp(t, a, a + 0.55); part.visible = k > 0; part.userData.base ??= part.position.y; part.position.y = part.userData.base + 7 * (1 - outBack(k)) * (k < 1 ? 1 : 0); };
  drop(P.walls, CUTS.plot + 0.9); drop(P.roof, CUTS.plot + 1.9); drop(P.porch, CUTS.plot + 2.9);
  plotRing.visible = shot === 'plot' && t < CUTS.plot + 3.4; plotRing.scale.x = plotRing.scale.z = 1 + 0.02 * Math.sin(t * 9);
  const cafeK = outCubic(ramp(t, CUTS.plot + 3.6, CUTS.plot + 4.8)); cafeB.visible = cafeK > 0; cafeB.position.y = -6.5 * (1 - cafeK);
  // the stadium rises as the crowd pours in their Bolts
  const stadK = ease(ramp(t, CUTS.stadium + 0.9, CUTS.stadium + 4.4)); stadium.visible = stadK > 0; stadium.position.y = -15.5 * (1 - stadK);
  stadRing.visible = shot === 'stadium' && stadK < 1;
  namewall.visible = t >= CUTS.names; city.visible = t >= CUTS.wide || shot === 'valley';

  // hero
  const plotSpot = V(PLOT.x + 4.8, 0, PLOT.z + 8.2);
  hero.visible = shot !== 'valley';
  if (shot === 'gate') { const k = ramp(t, CUTS.gate + 1.2, CUTS.plot + 1); hero.position.set(0.4, 0, lerp(GATE_Z + 14, GATE_Z - 4, k)); face(hero, 0, -1); pose(hero, t < CUTS.gate + 1.2 ? 'Idle' : 'Walk', t); }
  else if (shot === 'plot') { hero.position.copy(plotSpot); face(hero, -4.8, -8); const cheering = t > CUTS.plot + 3.1 && t < CUTS.plot + 5.6; pose(hero, cheering ? 'Cheer' : 'Idle', t - CUTS.plot - 3.1); }
  else { hero.position.copy(plotSpot); face(hero, 1, 1); pose(hero, 'Idle', t); }

  const showCrowd = t >= CUTS.stadium;
  for (const p of crowd) { p.c.visible = showCrowd; if (!showCrowd) continue; const k = ease(ramp(t, p.t0, p.t0 + p.dur)); p.c.position.lerpVectors(p.from, p.to, k); face(p.c, STAD.x - p.c.position.x, STAD.z - p.c.position.z); pose(p.c, k < 1 ? 'Walk' : (stadK > 0.95 ? 'Cheer' : 'Clap'), t + p.ph); }
  watchers.forEach((c) => { c.visible = t >= CUTS.names; if (c.visible) pose(c, t > CUTS.names + 2.0 ? 'Cheer' : 'Idle', t + c.userData.ph); });
  strollers.forEach((s) => { s.c.visible = t >= CUTS.wide; if (!s.c.visible) return; const z = 8 + ((s.z0 + s.dir * 1.2 * t) % 34 + 34) % 34; s.c.position.set(s.x, 0, z); face(s.c, 0, s.dir); pose(s.c, 'Walk', t + s.ph); });

  rainData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'plot') return hide(rain, i); dummy.position.set(b.x + b.dx * (1 - k), lerp(26, 1, Math.pow(k, 1.4)), b.z); dummy.rotation.set(0, b.sp + t * 7, 0.2); dummy.scale.setScalar(2.2 * Math.min(1, (1 - k) * 8)); dummy.updateMatrix(); rain.setMatrixAt(i, dummy.matrix); }); rain.instanceMatrix.needsUpdate = true;
  streamData.forEach((b, i) => { const k = (t - b.t0) / b.dur; if (k <= 0 || k >= 1 || shot !== 'stadium') return hide(stream, i); const p = crowd[b.who].c.position; dummy.position.set(lerp(p.x, STAD.x + b.ox, k), lerp(2, 4 + stadK * 9, k) + Math.sin(k * Math.PI) * 12, lerp(p.z, STAD.z + b.oz, k)); dummy.rotation.set(0, b.sp + t * 8, 0.3); dummy.scale.setScalar(1.6 * Math.min(1, (1 - k) * 6, k * 10)); dummy.updateMatrix(); stream.setMatrixAt(i, dummy.matrix); }); stream.instanceMatrix.needsUpdate = true;

  if (t >= CUTS.names) drawNames(Math.floor((t - CUTS.names - 0.2) / 0.075), er(t, CUTS.names + 1.95, CUTS.names + 2.3) * (0.86 + 0.14 * Math.sin(t * 6)));

  // cameras
  let pos, look, focus, sh = 40;
  if (shot === 'valley') { const k = ramp(t, 0, CUTS.gate); pos = V(0, lerp(16, 12, k), lerp(118, 102, k)); look = V(0, lerp(150, 135, k), -520); focus = V(0, 0, 40); sh = 80; }
  else if (shot === 'gate') { const k = ease(ramp(t, CUTS.gate, CUTS.plot)); pos = V(lerp(-4, 2, k), lerp(2.4, 3.2, k), lerp(GATE_Z + 34, GATE_Z + 27, k)); look = V(0, lerp(8.2, 6.4, k), GATE_Z - 6); focus = V(0, 0, GATE_Z); }
  else if (shot === 'plot') { const k = ease(ramp(t, CUTS.plot, CUTS.stadium)); pos = V(lerp(PLOT.x + 11, PLOT.x + 6, k), lerp(8.5, 6, k), lerp(PLOT.z + 25, PLOT.z + 23, k)); look = V(PLOT.x + lerp(0.5, 1.5, k), lerp(3.2, 2.6, k), PLOT.z + 1); focus = PLOT.clone(); sh = 30; }
  else if (shot === 'stadium') { const k = ease(ramp(t, CUTS.stadium, CUTS.names)); pos = V(lerp(-12, -5, k), lerp(15, 25, k), lerp(19, 25, k)); look = V(STAD.x - 2, lerp(2, 5, k), STAD.z + 2); focus = STAD.clone(); sh = 60; }
  else if (shot === 'names') { const k = ease(ramp(t, CUTS.names, CUTS.wide)); const n = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), -0.45); pos = NAMEWALL.clone().addScaledVector(n, lerp(13, 19, k)).add(V(0, lerp(5, 3.6, k), 0)); look = NAMEWALL.clone().add(V(0, 4.4, 0)); focus = NAMEWALL.clone(); sh = 25; }
  else { const k = outCubic(ramp(t, CUTS.wide, DURATION)); pos = V(lerp(10, -4, k), lerp(18, 62, k), lerp(50, 130, k)); look = V(lerp(4, 2, k), lerp(3, 8, k), lerp(-12, -120, k)); focus = V(2, 0, 4); sh = 90; }
  pos.x += Math.sin(t * 61) * flash * 0.25; pos.y += Math.sin(t * 47) * flash * 0.18;
  camera.position.copy(pos); camera.lookAt(look); camera.updateMatrixWorld();
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 200);
  const sc = sun.shadow.camera; if (sc.right !== sh) { sc.left = sc.bottom = -sh; sc.right = sc.top = sh; sc.near = 10; sc.far = 450; sc.updateProjectionMatrix(); }
  grade.uniforms.time.value = Math.round(t * 30);

  updateCaptions(caps, t);
  placeTag(heroTag, hero, shot === 'gate' ? er(t, CUTS.gate + 2.2, CUTS.gate + 2.6) : shot === 'plot' ? er(t, CUTS.plot + 0.3, CUTS.plot + 0.7) : 0);
  crowdTags.forEach(({ i, t: tg, at }) => placeTag(tg, crowd[i].c, shot === 'stadium' ? er(t, at, at + 0.3) : 0));
  const T = CUTS.title;
  el('flash').style.opacity = sat(flash * (shot === 'valley' ? 0.15 : 0.2) + (shot === 'valley' ? er(t, CUTS.gate - 0.1, CUTS.gate) : 0) + (shot === 'gate' ? 0.9 * (1 - ramp(t, CUTS.gate, CUTS.gate + 0.45)) : 0));
  el('scrim').style.opacity = 1 - er(t, CUTS.wide - 0.2, CUTS.wide + 0.3) * (1 - er(t, T - 0.2, T));
  el('dim').style.opacity = er(t, T - 0.1, T + 0.6) * 0.88;
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
