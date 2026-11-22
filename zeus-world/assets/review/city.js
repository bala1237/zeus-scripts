// The whole scripted city in one scene: agora, temple, civic buildings, shops, homes, river, walls and harbour.
// ?view=wide|plaza|street|temple|harbour|river|homes   ?light=day|dusk
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createLife } from './life.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'wide', light = q.get('light') || 'day';
document.getElementById('label').textContent = q.get('label') || `City · ${view} · ${light}`;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.5, 900);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
// ?grade=soft is the old pale look; the default is graded for streaming (deeper sky and grass, harder sun, less fill)
const SOFT = q.get('grade') === 'soft';
const L = (SOFT ? {
  day: { sky: 0xbfd9ee, ground: 0x86a85f, sun: 0xfff1dc, sunI: 2.9, sunPos: [-60, 90, 70], hemi: 0.75, env: 0.5, exp: 1.0, lamp: 0 },
  dusk: { sky: 0xe9a878, ground: 0x6f8c52, sun: 0xff9a55, sunI: 1.9, sunPos: [-100, 30, 50], hemi: 0.4, env: 0.3, exp: 1.0, lamp: 1 },
} : {
  day: { sky: 0x5aa6e0, ground: 0x6f8f4c, sun: 0xffe9c4, sunI: 3.6, sunPos: [-70, 80, 60], hemi: 0.42, env: 0.3, exp: 0.9, lamp: 0 },
  dusk: { sky: 0xe07a4a, ground: 0x4f7a38, sun: 0xff8a45, sunI: 1.5, sunPos: [-100, 22, 50], hemi: 0.12, env: 0.2, exp: 0.8, lamp: 1 },
})[light];
if (!SOFT) renderer.domElement.style.filter = 'saturate(1.18) contrast(1.1)';
scene.background = new THREE.Color(L.sky); scene.fog = new THREE.Fog(L.sky, 160, 520);
scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exp;
if (!SOFT && light === 'dusk') scene.backgroundIntensity = 0.75;
if (!SOFT) {   // real sky from Poly Haven (CC0): a photo for the backdrop, its HDR for light and reflections
  const bg = await new THREE.TextureLoader().loadAsync(`./sky/${light}.jpg`); bg.mapping = THREE.EquirectangularReflectionMapping; bg.colorSpace = THREE.SRGBColorSpace;
  scene.background = bg; scene.backgroundRotation = new THREE.Euler(0, light === 'day' ? 2.2 : 3.9, 0);
  const env = await new RGBELoader().loadAsync(`./sky/${light}.hdr`); env.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = env; scene.environmentRotation = scene.backgroundRotation; scene.environmentIntensity = light === 'day' ? 0.6 : 0.45;
  scene.fog = new THREE.Fog(light === 'day' ? 0xa9c8e6 : 0xd99a78, 220, 700);
}
scene.add(new THREE.HemisphereLight(SOFT ? 0xffffff : 0xfff4e0, 0x7a6a48, L.hemi));
const sun = new THREE.DirectionalLight(L.sun, L.sunI); sun.position.set(...L.sunPos); sun.castShadow = true;
sun.shadow.mapSize.set(8192, 8192); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 100, bottom: -100, near: 1, far: 400 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const cache = {};
async function get(url) {
  if (!cache[url]) cache[url] = loader.loadAsync(url).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g; });
  return cache[url];
}
const M = (n) => `./models/${n}.glb`, R = (n) => `./ref/${n}.glb`;
// place a copy: position, yaw, optional uniform scale
async function put(url, x, z, ry = 0, s = 1, parent = scene, y = 0) {
  const g = await get(url); const o = g.scene.clone(true);
  o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); parent.add(o); return o;
}
// reference parts are stretched to their sockets, as the builder does
async function fit(url, w, h, d, parent, y = 0, z = 0) {
  const g = await get(url); const o = g.scene.clone(true); const hold = new THREE.Group(); hold.add(o);
  let b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3());
  if (s.z > s.x) { o.rotation.y = Math.PI / 2; b = new THREE.Box3().setFromObject(o); s = b.getSize(new THREE.Vector3()); }
  const c = b.getCenter(new THREE.Vector3()); o.position.set(-c.x, -b.min.y, -c.z); hold.scale.set(w / s.x, h / s.y, d / s.z);
  hold.position.set(0, y, z); parent.add(hold); return hold;
}
async function villa(parent, walls, roof, porch) {
  const W = 6.4, D = 4.4, H = 3.0; const g = new THREE.Group(); parent.add(g);
  if (walls.startsWith('ref:')) await fit(R(walls.slice(4)), W, H, D, g); else await put(M(walls), 0, 0, 0, 1, g);
  if (roof) await put(M(`home_villa-roof_${roof}`), 0, 0, 0, 1, g, H);          // scripted parts are already at real size
  if (porch) await put(M(`home_villa-porch_${porch}`), 0, D / 2, 0, 1, g);
  return g;
}
async function citizen(url, x, z, ry, clip = 'Idle', t = 0.4, parent = scene) {
  const g = await get(url); const o = SkeletonUtils.clone(g.scene);
  o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
  const hold = new THREE.Group(); hold.add(o); hold.updateMatrixWorld(true);
  o.traverse((m) => { if (m.isSkinnedMesh) m.skeleton.update(); });
  const b = new THREE.Box3().setFromObject(o, true); const h = b.max.y - b.min.y; hold.scale.setScalar(1.75 / h);
  const a = g.animations.find((c) => c.name === clip); if (a) { const mx = new THREE.AnimationMixer(o); mx.clipAction(a).play(); mx.setTime(t); }
  hold.position.set(x, 0, z); hold.rotation.y = ry; parent.add(hold); return hold;
}
function lampLight(x, y, z) { if (!L.lamp) return; const p = new THREE.PointLight(0xffb45a, 14, 12, 1.8); p.position.set(x, y, z); scene.add(p); }


const cams = {
  wide: [[95, 95, 150], [4, 0, -4]], plaza: [[13, 9, 22], [-2, 2, -6]], street: [[0.8, 3.2, 28.5], [-0.5, 3.0, 6]], temple: [[10, 5, -14], [-2, 6, -44]],
  harbour: [[98, 16, 46], [66, 3, 4]], river: [[-39, 5, 41.5], [-31, 0.3, 35]], homes: [[-52, 14, 70], [-32, 2, 44]], civic: [[-6, 26, 20], [20, 2, -22]], top: [[0, 260, 1], [0, 0, 0]],
};
camera.position.set(...cams[view][0]); camera.lookAt(...cams[view][1]);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...cams[view][1]); controls.update();
// slow turn round the chosen view by default; drag to orbit, right-drag or two fingers to pan, wheel or pinch to zoom
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 4; controls.maxDistance = 420;
controls.autoRotate = !q.has('shot') && q.get('spin') !== '0'; controls.autoRotateSpeed = 0.7;
window.__cam = () => camera.position.toArray();
{ const $ = (id) => document.getElementById(id), home = [camera.position.clone(), controls.target.clone()];
  const spin = $('spin'), label = () => { if (spin) spin.textContent = `⟳ Rotate: ${controls.autoRotate ? 'on' : 'off'}`; }; label();
  spin?.addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; label(); });
  $('reset')?.addEventListener('click', () => { camera.position.copy(home[0]); controls.target.copy(home[1]); });
  const hold = (el, fn) => { let t; const stop = () => clearInterval(t); el.addEventListener('pointerdown', () => { fn(); t = setInterval(fn, 40); }); for (const e of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(e, stop); };
  for (const b of document.querySelectorAll('[data-z]')) hold(b, () => { const d = camera.position.clone().sub(controls.target); const k = 1 + 0.03 * Number(b.dataset.z); if (d.length() * k > controls.minDistance && d.length() * k < controls.maxDistance) camera.position.copy(controls.target).add(d.multiplyScalar(k)); });
  for (const b of document.querySelectorAll('[data-p]')) hold(b, () => { const [x, z] = b.dataset.p.split(',').map(Number); const f = controls.target.clone().sub(camera.position); f.y = 0; const dist = camera.position.distanceTo(controls.target); f.normalize();
    const r = new THREE.Vector3(-f.z, 0, f.x), m = r.multiplyScalar(x).add(f.multiplyScalar(z)).multiplyScalar(dist * 0.012); camera.position.add(m); controls.target.add(m); }); }
// download every model at once, with a progress bar, then let the city appear as it is placed
const PRE = ['biz_bakery_t1', 'biz_cafe_t1', 'biz_flower-shop_t1', 'biz_forge_t1', 'biz_olive-press_t1', 'biz_pottery_t1', 'biz_scroll-shop_t1', 'biz_stall_t1_cloth', 'biz_stall_t1_fish', 'biz_stall_t1_fruit', 'biz_stall_t1_pottery', 'build_crane_t1', 'build_crates_t1', 'build_timber-stack_t1', 'char_citizen_elder', 'char_citizen_woman', 'civic_amphitheatre', 'civic_aqueduct', 'civic_bathhouse', 'civic_council-hall', 'civic_fountain-plaza', 'civic_gymnasium', 'civic_library', 'civic_lighthouse', 'civic_stoa', 'civic_temple-zeus_stage4', 'civic_tholos', 'decor_altar', 'decor_banner_t1_azure', 'decor_banner_t1_red', 'decor_barrels_t1', 'decor_bench_t1_marble', 'decor_brazier_t1', 'decor_bust_t1_marble', 'decor_cart_t1', 'decor_dining-set_t1', 'decor_garden-bed_t1', 'decor_garden-gate_t1_azure', 'decor_garden-wall_t1_plaster', 'decor_lantern_t1_bronze', 'decor_obelisk', 'decor_pergola_t1', 'decor_planter_t1', 'decor_shrine', 'decor_statue-plinth_t1', 'decor_sundial', 'decor_victory-column', 'home_cottage_t1', 'home_cottage_t2', 'home_grand-villa_t4', 'home_insula_t1', 'home_insula_t2', 'home_insula_t3', 'home_villa-porch_t2_doric', 'home_villa-porch_t3_ionic', 'home_villa-roof_t1_terracotta', 'home_villa-roof_t2_slate', 'home_villa-roof_t3_azure', 'home_villa-roof_t3_garden', 'home_villa-roof_t4_gold', 'home_villa-upper_t2_plaster', 'home_villa-upper_t3_marble', 'home_villa-walls_t1_stone', 'home_villa-walls_t2_ochre', 'home_villa-walls_t3_goldmarble', 'infra_bridge', 'infra_city-wall', 'infra_signpost', 'infra_street-lamp_t1', 'infra_tile_t1_plaza', 'infra_tile_t1_road', 'infra_wall-gate', 'infra_wall-tower', 'landmark_trireme', 'nature_bush_t1_myrtle', 'nature_bush_t1_oleander', 'nature_citizen-tree_stage1', 'nature_citizen-tree_stage2', 'nature_citizen-tree_stage3', 'nature_citizen-tree_stage4', 'nature_cypress_t1', 'nature_rock_t1_boulder', 'nature_rock_t1_coast', 'nature_rock_t1_small', 'water_pier', 'water_pond', 'water_quay', 'water_reflecting-pool', 'water_river-straight', 'water_stepping-stones', 'water_well'];
const bar = document.getElementById('load'); let done = 0;
const tick = () => { done++; if (bar) bar.firstElementChild.style.width = `${Math.round(100 * done / (PRE.length + 3))}%`; };
const tickers = [], clock = new THREE.Clock();
if (!q.has('shot')) renderer.setAnimationLoop(() => { const t = clock.getElapsedTime(); for (const f of tickers) f(t); controls.update(); renderer.render(scene, camera); });
await Promise.all([...PRE.map((n) => get(M(n)).then(tick)), ...['citizen'].map((n) => get(R(n)).then(tick))]);
if (bar) bar.remove();
const PI = Math.PI, P = (n, x, z, ry = 0, s = 1) => put(M(n), x, z, ry, s);
const rnd = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
// ---------- agora: paved square, fountain, stoas, market
for (let i = -6; i < 6; i++) for (let j = -6; j < 6; j++) await P('infra_tile_t1_plaza', i * 2 + 1, j * 2 + 1);
await P('civic_fountain-plaza', 0, 0);
await P('civic_stoa', -16.5, 0, PI / 2); await P('civic_stoa', 16.5, 0, -PI / 2);
const stalls = ['fruit', 'cloth', 'pottery', 'fish'];
for (let i = 0; i < 4; i++) { await P(`biz_stall_t1_${stalls[i]}`, -7.5 + i * 5, -7.5, 0); await P(`biz_stall_t1_${stalls[3 - i]}`, -7.5 + i * 5, 8, PI); }
for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) await P(x * z > 0 ? 'decor_banner_t1_red' : 'decor_banner_t1_azure', x, z);
await P('decor_victory-column', 0, -10.5); await P('decor_cart_t1', 6, 3.5, 0.6); await P('decor_barrels_t1', -6.5, 4, 1); await P('infra_signpost', 3.2, 11.2);
// ---------- sacred way north to the temple, library and council hall either side
for (let j = 0; j < 9; j++) for (const i of [-1, 1]) await P('infra_tile_t1_road', i, -13 - j * 2);
await P('civic_temple-zeus_stage4', 0, -47); await P('decor_altar', 0, -29.5); await P('decor_obelisk', -5, -28); await P('decor_obelisk', 5, -28);
await P('civic_library', -22, -26); const hall = await P('civic_council-hall', 22, -26);
await P('civic_tholos', -36, -12); await P('water_reflecting-pool', 0, -22.5, PI / 2, 0.6);
// ---------- main street south to the gate, shops and apartment blocks along it
for (let j = 0; j < 22; j++) for (const i of [-1, 1]) await P('infra_tile_t1_road', i, 13 + j * 2);
const west = ['biz_cafe_t1', 'biz_bakery_t1', 'biz_flower-shop_t1'], east = ['biz_pottery_t1', 'biz_scroll-shop_t1', 'biz_olive-press_t1'];
for (let i = 0; i < 3; i++) { await P(west[i], -7.5, 16.5 + i * 6.6, PI / 2); await P(east[i], 7.5, 16.5 + i * 6.6, -PI / 2); }
await P('home_insula_t2', -10, 42, PI / 2); await P('home_insula_t3', 10, 42, -PI / 2); await P('home_insula_t1', -10, 53, PI / 2); await P('biz_forge_t1', 9, 52, -PI / 2);
for (let j = 0; j < 6; j++) for (const s of [-1, 1]) await P('infra_street-lamp_t1', s * 2.6, 14 + j * 7.4);
// ---------- river from west to east with a bridge on the main street, pond and well
for (let i = -13; i <= 13; i++) if (i !== 0 && Math.abs(i) !== 1) await P('water_river-straight', i * 4, 35);
await P('infra_bridge', 0, 35, PI / 2); await P('water_river-straight', -5.6, 35, 0, 1); await P('water_river-straight', 5.6, 35, 0, 1);
await P('water_stepping-stones', -30, 35); await P('water_pond', -30, 16); await P('water_well', 22, 13); await P('decor_pergola_t1', -30, 8.5); await P('decor_dining-set_t1', -30, 8.5);
// ---------- civic buildings east and west
await P('civic_amphitheatre', 38, -6, -PI / 2); await P('civic_bathhouse', 26, 24, 0); await P('civic_gymnasium', -38, -40, 0);
for (let j = 0; j < 4; j++) await P('civic_aqueduct', -50, -58 + j * 8 + 4, PI / 2);
// ---------- homes: villas north-east, cottages and a grand villa
async function home(x, z, ry, walls, roof, porch, upper) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  await put(M(`home_villa-walls_${walls}`), 0, 0, 0, 1, g);
  let h = 3; if (upper) { await put(M(`home_villa-upper_${upper}`), 0, 0, 0, 1, g, 3); h = 6; }
  await put(M(`home_villa-roof_${roof}`), 0, 0, 0, 1, g, h); if (porch) await put(M(`home_villa-porch_${porch}`), 0, 2.2, 0, 1, g);
  g.userData.parts = g.children.slice();   // the building itself, without its garden
  await put(M('decor_garden-gate_t1_azure'), 0, 6.5, 0, 1, g); for (const u of [-3, -5, 3, 5]) await put(M('decor_garden-wall_t1_plaster'), u, 6.5, 0, 1, g);
  await put(M(`nature_citizen-tree_stage${2 + Math.floor(rnd() * 3)}`), 5.5, 3.5, rnd() * 6, 1, g); await put(M('decor_bench_t1_marble'), -4.6, 3.6, 0.4, 1, g);
  await put(M('decor_lantern_t1_bronze'), -1.7, 5.4, 0, 1, g); await put(M(rnd() > 0.5 ? 'decor_planter_t1' : 'decor_garden-bed_t1'), -4.5, 0.5, PI / 2, 1, g);
  return g;
}
const V = [['t1_stone', 't1_terracotta', 't2_doric', null], ['t2_ochre', 't1_terracotta', null, 't2_plaster'], ['t3_goldmarble', 't3_azure', 't3_ionic', null], ['t2_ochre', 't2_slate', 't2_doric', null],
  ['t3_goldmarble', 't4_gold', 't3_ionic', 't3_marble'], ['t1_stone', 't3_garden', null, null], ['t1_stone', 't2_slate', null, 't2_plaster'], ['t2_ochre', 't3_azure', 't3_ionic', null]];
for (let i = 0; i < 4; i++) await home([-46, -32, 22, 46][i], 47, PI, ...V[i]);
const row = []; for (let i = 0; i < 3; i++) row.push(await home(18 + i * 13, -56, 0, ...V[4 + i]));
await P('home_grand-villa_t4', -22, 22, PI / 2); await P('home_cottage_t1', 36, 40, PI); await P('home_cottage_t2', 46, 40, PI); await P('home_cottage_t2', 44, 24, -PI / 2); await P('home_cottage_t1', 44, 14, -PI / 2);
// ---------- city wall, towers and gate
const X0 = -56, X1 = 56, Z0 = -68, Z1 = 60;
for (let x = X0 + 4; x < X1; x += 8) { await P('infra_city-wall', x, Z0, PI); if (Math.abs(x) > 4) await P('infra_city-wall', x, Z1, 0); }
await P('infra_wall-gate', 0, Z1, 0);
for (let z = Z0 + 4; z < Z1; z += 8) { await P('infra_city-wall', X0, z, -PI / 2); if (z < 4 || z > 12) await P('infra_city-wall', X1, z, PI / 2); }
await P('infra_wall-gate', X1, 8, PI / 2);
for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [X0, -4], [X1, -28], [-28, Z0], [28, Z0], [-28, Z1], [28, Z1]]) await P('infra_wall-tower', x, z);
// ---------- harbour to the east: sea, quay, pier, lighthouse, trireme
const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 400), new THREE.MeshStandardMaterial({ name: 'water', color: 0x2f7fa6 }));
sea.rotation.x = -PI / 2; sea.position.set(72 + 150, 0.4, 0); sea.receiveShadow = true; scene.add(sea);
for (let z = -34; z <= 46; z += 4) await P('water_quay', 70.8, z, PI / 2);
for (let i = 0; i < 6; i++) for (let j = 0; j < 22; j++) await P('infra_tile_t1_road', 58 + i * 2 + 1, -35 + j * 2 + 1 + (j > 20 ? 0 : 0));
await P('water_pier', 75.4, 14, PI / 2); await P('water_pier', 75.4, -6, PI / 2); await P('landmark_trireme', 86, 4, 0, 0.8); await P('civic_lighthouse', 66, 40);
await P('build_crates_t1', 66, 2, 0.4); await P('decor_barrels_t1', 67, 10, 1); await P('build_crane_t1', 66, -14, -PI / 2); await P('biz_stall_t1_fish', 62, 18, -PI / 2); await P('build_timber-stack_t1', 63, -24, 0.3);
// ---------- trees, bushes, shrines, people
const T = ['nature_cypress_t1', 'nature_cypress_t1', 'nature_citizen-tree_stage3', 'nature_citizen-tree_stage4', 'nature_bush_t1_oleander', 'nature_bush_t1_myrtle'];
const spots = [[-12, -22], [12, -22], [-9, -40], [9, -40], [-16, -52], [16, -52], [-30, -22], [32, -18], [-44, 2], [-40, 22], [-22, 10], [-16, 30], [16, 30], [34, 30], [50, 4], [50, -40], [-50, 30], [-24, -58], [-36, 28], [22, 2], [-22, -2], [30, 8], [-46, 14], [48, 52], [-8, 28.5], [8, 28.5], [-14, 14], [14, 14], [40, -30], [-30, -4]];
for (let i = 0; i < spots.length; i++) await P(T[i % T.length], spots[i][0] + rnd() * 2, spots[i][1] + rnd() * 2, rnd() * 6, 0.9 + rnd() * 0.3);
for (let i = 0; i < 9; i++) for (const s of [-1, 1]) await P('nature_cypress_t1', s * 4.2, -14 - i * 2 - 0.5, i, 0.75);
await P('decor_shrine', -4.5, 30.5, PI / 2); await P('decor_sundial', 22, -12); await P('decor_statue-plinth_t1', -22, -12); await P('decor_brazier_t1', -2.6, -27.5); await P('decor_brazier_t1', 2.6, -27.5);
// rocks, bust and lion heads from Poly Haven scans
for (const [x, z, r, sc] of [[-34, 18.5, 0.5, 0.8], [-26.5, 13, 2.2, 0.6], [-20, 33, 1, 0.7], [12, 37.3, 3, 0.6], [30, 33, 0, 0.8], [-44, 37, 2, 1], [48, -12, 1, 1.2], [-42, -22, 4, 1.1]]) await P('nature_rock_t1_boulder', x, z, r, sc);
for (const [x, z, r] of [[-33, 36.8, 0], [18, 33.2, 3], [40, 36.6, 1], [-12, 33.3, 2]]) await P('nature_rock_t1_small', x, z, r);
for (const [x, z, r] of [[78, 52, 0], [80, -42, 2], [76, 58, 4]]) await P('nature_rock_t1_coast', x, z, r, 1.3);
await put(M('decor_bust_t1_marble'), -22, -12, 0, 1.1, scene, 1.38);
const C = [M('char_citizen_woman'), M('char_citizen_elder'), R('citizen')];
// ---------- life: walking citizens, buildings rising as Bolts come in, birds
const life = createLife({ scene, camera, renderer, get, tickers });
const N = Math.max(0, Math.min(120, Number(q.get('people') ?? 44)));
const stop = (face, act = ['Idle'], t = [4, 10], p = 0.75) => ({ stop: t, face, act, p });
const bridgeY = (x, z) => { const d = Math.abs(z - 35); if (Math.abs(x) > 2.2 || d > 8.4) return 0.07; return d < 4 ? 2.56 : d < 6.4 ? 2.56 - (d - 4) / 2.4 * 1.2 : 1.36 - (d - 6.4) / 2 * 1.29; };
const town = { height: bridgeY, nodes: {
  gate: [0, 57], s3: [0, 48], s2: [0, 43.6], m3: [0, 29.7], m2: [0, 23.1], m1: [0, 16.5], pS: [0, 11],
  w1: [-3.7, 16.5, stop(-PI / 2, ['Idle', 'Clap'])], w2: [-3.7, 23.1, stop(-PI / 2)], w3: [-3.7, 29.7, stop(-PI / 2)],
  e1: [3.7, 16.5, stop(PI / 2)], e2: [3.7, 23.1, stop(PI / 2, ['Idle', 'Clap'])], e3: [3.7, 29.7, stop(PI / 2)],
  fS: [0, 4.6, stop(PI, ['Idle'], [3, 7], 0.3)], fE: [4.6, 0], fN: [0, -4.6], fW: [-4.6, 0, stop(PI / 2, ['Idle'], [3, 8], 0.3)],
  sA: [-7.5, 5.9, stop(0)], sB: [-2.5, 5.9, stop(0, ['Idle', 'Clap'])], sC: [2.5, 5.9, stop(0)], sD: [7.5, 5.9, stop(0)],
  nA: [-7.5, -5.3, stop(PI)], nB: [-2.5, -5.3, stop(PI)], nC: [2.5, -5.3, stop(PI, ['Idle', 'Clap'])], nD: [7.5, -5.3, stop(PI)],
  gap: [0, -7.6], pN: [2.4, -9.4], cN: [2.4, -12.4], xr: [0, -13.2],
  sac2: [2.6, -19], sac3: [2.6, -25.4], pray: [1.0, -26.6, stop(PI, ['Cheer', 'Clap', 'Idle'], [5, 11], 1)],
  lib1: [-9, -13.2], lib: [-22, -15.9, stop(PI, ['Idle'], [5, 12], 1)],
  co1: [9, -13.2], watch: [18.5, -15.2, stop(2.6, ['Idle', 'Clap'], [6, 14], 1)] },
  edges: [['gate', 's3'], ['s3', 's2'], ['s2', 'm3'], ['m3', 'm2'], ['m2', 'm1'], ['m1', 'pS'], ['m1', 'w1'], ['m2', 'w2'], ['m3', 'w3'], ['m1', 'e1'], ['m2', 'e2'], ['m3', 'e3'],
    ['pS', 'fS'], ['fS', 'fE'], ['fE', 'fN'], ['fN', 'fW'], ['fW', 'fS'], ['fS', 'sB'], ['fS', 'sC'], ['sA', 'sB'], ['sB', 'sC'], ['sC', 'sD'], ['fN', 'nB'], ['fN', 'nC'], ['nA', 'nB'], ['nB', 'nC'], ['nC', 'nD'],
    ['fN', 'gap'], ['gap', 'pN'], ['pN', 'cN'], ['cN', 'xr'], ['xr', 'sac2'], ['sac2', 'sac3'], ['sac3', 'pray'], ['xr', 'lib1'], ['lib1', 'lib'], ['cN', 'co1'], ['co1', 'watch']] };
const quay = { height: () => 0.07, nodes: { a: [60, -27], b: [60, -12, stop(PI / 2, ['Idle'], [5, 12])], c: [60, 4, stop(PI / 2)], d: [60, 13.5, stop(PI / 2, ['Idle', 'Clap'])], g: [57.6, 8] }, edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['c', 'g']] };
await life.addWalkers(town, C, N); await life.addWalkers(quay, C, Math.round(N / 7));
// three sites: the council hall and two villas, each on its own clock so something is always going up
const SC = M('build_scaffolding_t1'), bays = (list) => ({ url: SC, list });
const side = (x, z0, n, levels, ry) => { const l = []; for (let k = 0; k < levels; k++) for (let i = 0; i < n; i++) l.push([x, z0 + i * 2.2, ry, k * 3.3]); return l; };
await life.construct({ name: 'Council Hall', by: '214 citizens', goal: 20000, objects: [hall], at: [22, -26], size: [12.4, 14], height: 9.3, start: 0.35, buildSecs: 80,
  scaffolds: bays([...side(29.0, -30.4, 3, 3, -PI / 2), ...side(15.0, -30.4, 3, 3, PI / 2)]), hoist: [29.6, -17.4, PI],
  workers: { count: 4, height: () => 0, nodes: { st: [31.5, -14.5, stop(0, ['Idle'], [2, 5])], a: [27, -16.4, stop(PI, ['Clap'], [5, 10], 1)], b: [18, -16.6, stop(PI, ['Clap'], [5, 10], 1)], c: [31.2, -24, stop(-PI / 2, ['Clap'], [5, 10], 1)] }, edges: [['st', 'a'], ['a', 'b'], ['st', 'c']] }, builderUrls: C });
await P('build_stone-blocks_t1', 32.5, -13.2, 0.4); await P('build_timber-stack_t1', 33.5, -20, PI / 2); await P('build_crates_t1', 14.5, -17, 0.3);
const owners = [['@maya_k', 1500], ['@nikos_22', 2400]];
for (const [i, hx] of [[0, 18], [2, 44]]) { const [who, goal] = owners[i / 2], tall = row[i].userData.parts.length > 3 || i === 0 ? 8.4 : 5.4;
  await life.construct({ name: `${who}'s villa`, by: who, goal, objects: row[i].userData.parts, at: [hx, -56], size: [7.3, 5.5], height: tall, start: i ? 0.8 : 0.05, buildSecs: 55, restSecs: 30,
    scaffolds: bays([...side(hx - 4.5, -57.1, 2, tall > 6 ? 2 : 1, PI / 2), ...side(hx + 4.5, -57.1, 2, tall > 6 ? 2 : 1, -PI / 2)]), hoist: [hx + 5.4, -52.2, PI],
    workers: { count: 2, height: () => 0, nodes: { st: [hx + 6.5, -50.5, stop(0, ['Idle'], [2, 5])], a: [hx + 1.5, -52.4, stop(PI, ['Clap'], [5, 10], 1)], b: [hx - 2.5, -52.4, stop(PI, ['Clap'], [5, 10], 1)] }, edges: [['st', 'a'], ['a', 'b']] }, builderUrls: C });
  await P('build_stone-blocks_t1', hx + 7.2, -49.4, 1.2, 0.8); }
if (!q.has('shot')) { const fps = document.createElement('div'); fps.style.cssText = 'position:fixed;right:12px;top:12px;font:600 12px system-ui;color:#1d1a2e;background:rgba(255,255,255,.7);padding:4px 8px;border-radius:6px'; document.body.append(fps);
  let n = 0, t0 = performance.now(); tickers.push(() => { n++; const now = performance.now(); if (now - t0 > 1000) { fps.textContent = `${Math.round(n * 1000 / (now - t0))} fps · ${life.count()} citizens`; n = 0; t0 = now; } }); }

// ---------- effects: moving water, glowing fire, lit lamps (found by material name, so new models get them for free)
{ // ripple normal map, tileable, made from a few crossing waves
  const N = 256, data = new Uint8Array(N * N * 4), W = [[1, 2, 0.5], [3, -1, 0.3], [-2, 5, 0.18], [6, 3, 0.1], [-5, -7, 0.07]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let dx = 0, dy = 0; for (const [a, b, k] of W) { const c = Math.cos((a * x + b * y) / N * 2 * PI + a) * k; dx += a * c; dy += b * c; }
    const i = (y * N + x) * 4, l = Math.hypot(dx * 0.35, dy * 0.35, 1); data[i] = 128 + 127 * dx * 0.35 / l; data[i + 1] = 128 + 127 * dy * 0.35 / l; data[i + 2] = 255 / l; data[i + 3] = 255; }
  const ripple = (rep) => { const t = new THREE.DataTexture(data, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
    // smooth sampling with mipmaps: the default for raw textures is blocky, which made the water grainy
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true; return t; };
  const waterCol = light === 'day' ? 0x2a86b4 : 0x3d6590;
  const water = (rep, speed, rough, ns) => { const m = new THREE.MeshStandardMaterial({ name: 'water', color: waterCol, roughness: rough, metalness: 0.35, normalMap: ripple(rep), normalScale: new THREE.Vector2(ns, ns), envMapIntensity: 1.2 });
    // three layers of the same ripples at unrelated sizes, turned and drifting different ways, so no repeat shows
    const u = { uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() } };
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u);
      sh.fragmentShader = 'uniform vec2 uA; uniform vec2 uB;\n' + sh.fragmentShader.replace('texture2D( normalMap, vNormalMapUv )',
        '( texture2D( normalMap, vNormalMapUv ) * 0.4 + texture2D( normalMap, mat2( 0.8, -0.6, 0.6, 0.8 ) * vNormalMapUv * 0.37 + uA ) * 0.35 + texture2D( normalMap, mat2( -0.28, 0.96, -0.96, -0.28 ) * vNormalMapUv * 0.113 + uB ) * 0.25 )'); };
    tickers.push((t) => { m.normalMap.offset.set(t * speed, t * speed * 0.6); u.uA.value.set(-t * speed * 0.7, t * speed * 0.45); u.uB.value.set(t * speed * 0.3, -t * speed * 0.5); m.normalScale.setScalar(ns * (1 + 0.2 * Math.sin(t * 0.9))); });
    return m; };
  // small pools are calmer and less mirror-like: sharp ripples there catch every lamp and turn to sparkle
  const pondWater = water(0.22, 0.03, 0.26, 0.26), seaWater = water(90, 0.02, 0.08, 0.5);
  // soft round glow for fires and lamps
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(0.25, 'rgba(255,160,70,0.55)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(cv), night = L.lamp ? 1 : 0, seen = new Set(), clusters = new Map(), glows = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh) return; const n = o.material.name;
    if (n === 'water') { o.material = o === sea ? seaWater : pondWater; o.castShadow = false; return; }
    if (n !== 'flame' && n !== 'coal') return;
    o.castShadow = false;
    if (!seen.has(o.material)) { seen.add(o.material); const m = o.material; m.emissive = new THREE.Color(n === 'flame' ? 0xffa040 : 0xff4a10); m.emissiveIntensity = n === 'flame' ? 2.2 + 2.5 * night : 1.6 + 1.5 * night; m.toneMapped = false;
      tickers.push((t) => { m.emissiveIntensity = (n === 'flame' ? 2.2 + 2.5 * night : 1.6 + 1.5 * night) * (0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7.3)); }); }
    if (n !== 'flame' || o.userData.site) return;   // no halo on a building that is still going up
    // one glow per separate flame: a street lamp's two lanterns share a mesh, so group its points by position
    if (!clusters.has(o.geometry)) { const pos = o.geometry.attributes.position, cells = new Map(), v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const k = `${Math.round(v.x / 0.9)},${Math.round(v.y / 0.9)},${Math.round(v.z / 0.9)}`; const c = cells.get(k) || { sum: new THREE.Vector3(), n: 0, min: v.clone(), max: v.clone() }; c.sum.add(v); c.n++; c.min.min(v); c.max.max(v); cells.set(k, c); }
      clusters.set(o.geometry, [...cells.values()].map((c) => ({ p: c.sum.divideScalar(c.n), r: Math.max(0.12, c.max.distanceTo(c.min) / 2) }))); }
    for (const c of clusters.get(o.geometry)) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.45 + 0.5 * night, fog: false, toneMapped: false }));
      const w = c.p.clone().applyMatrix4(o.matrixWorld), sc = new THREE.Vector3().setFromMatrixScale(o.matrixWorld).x; sp.position.copy(w); sp.userData = { s: Math.max(0.5, c.r * sc * (5 + 5 * night)), ph: w.x * 1.7 + w.z * 2.3 }; sp.scale.setScalar(sp.userData.s); scene.add(sp); glows.push(sp); }
  });
  tickers.push((t) => { for (const sp of glows) { const f = 0.9 + 0.1 * Math.sin(t * 9 + sp.userData.ph) * Math.sin(t * 5.7 + sp.userData.ph * 0.7); sp.scale.setScalar(sp.userData.s * f); sp.material.opacity = (0.45 + 0.5 * night) * (0.8 + 0.2 * f); } });
  if (night) { const spots = glows.map((g) => g.position).filter((p) => Math.hypot(p.x, p.z) < 34 || Math.abs(p.x) < 6).slice(0, 14);
    for (const p of spots) { const l = new THREE.PointLight(0xffa85a, 60, 16, 1.6); l.position.copy(p); scene.add(l); } }
  window.__fx = { glows: glows.length, tickers: tickers.length };
  if (q.has('shot')) for (const f of tickers) f(1.3);
}
// the sun's shadows are drawn once: only people and effects move, and they don't cast any
if (!q.has('shot')) { renderer.render(scene, camera); sun.shadow.autoUpdate = false; }
if (q.has('shot')) renderer.render(scene, camera);
window.ready = true;
