// The whole scripted city in one scene: agora, temple, civic buildings, shops, homes, river, walls and harbour.
// ?view=wide|plaza|street|temple|harbour|river|homes   ?light=day|dusk
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
const L = {
  day: { sky: 0xbfd9ee, ground: 0x86a85f, sun: 0xfff1dc, sunI: 2.9, sunPos: [-60, 90, 70], hemi: 0.75, env: 0.5, exp: 1.0, lamp: 0 },
  dusk: { sky: 0xe9a878, ground: 0x6f8c52, sun: 0xff9a55, sunI: 1.9, sunPos: [-100, 30, 50], hemi: 0.4, env: 0.3, exp: 1.0, lamp: 1 },
}[light];
scene.background = new THREE.Color(L.sky); scene.fog = new THREE.Fog(L.sky, 160, 520);
scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exp;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a48, L.hemi));
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
await P('civic_library', -22, -26); await P('civic_council-hall', 22, -26);
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
async function villa(x, z, ry, walls, roof, porch, upper) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  await put(M(`home_villa-walls_${walls}`), 0, 0, 0, 1, g);
  let h = 3; if (upper) { await put(M(`home_villa-upper_${upper}`), 0, 0, 0, 1, g, 3); h = 6; }
  await put(M(`home_villa-roof_${roof}`), 0, 0, 0, 1, g, h); if (porch) await put(M(`home_villa-porch_${porch}`), 0, 2.2, 0, 1, g);
  await put(M('decor_garden-gate_t1_azure'), 0, 6.5, 0, 1, g); for (const u of [-3, -5, 3, 5]) await put(M('decor_garden-wall_t1_plaster'), u, 6.5, 0, 1, g);
  await put(M(`nature_citizen-tree_stage${2 + Math.floor(rnd() * 3)}`), 5.5, 3.5, rnd() * 6, 1, g); await put(M('decor_bench_t1_marble'), -4.6, 3.6, 0.4, 1, g);
  await put(M('decor_lantern_t1_bronze'), -1.7, 5.4, 0, 1, g); await put(M(rnd() > 0.5 ? 'decor_planter_t1' : 'decor_garden-bed_t1'), -4.5, 0.5, PI / 2, 1, g);
}
const V = [['t1_stone', 't1_terracotta', 't2_doric', null], ['t2_ochre', 't1_terracotta', null, 't2_plaster'], ['t3_goldmarble', 't3_azure', 't3_ionic', null], ['t2_ochre', 't2_slate', 't2_doric', null],
  ['t3_goldmarble', 't4_gold', 't3_ionic', 't3_marble'], ['t1_stone', 't3_garden', null, null], ['t1_stone', 't2_slate', null, 't2_plaster'], ['t2_ochre', 't3_azure', 't3_ionic', null]];
for (let i = 0; i < 4; i++) await villa([-46, -32, 22, 46][i], 47, PI, ...V[i]);
for (let i = 0; i < 4; i++) await villa(18 + i * 13, -56, 0, ...V[4 + i]);
await P('home_grand-villa_t4', -22, 22, PI / 2); await P('home_cottage_t1', 36, 40, PI); await P('home_cottage_t2', 46, 40, PI); await P('home_cottage_t2', 44, 24, -PI / 2); await P('home_cottage_t1', 44, 14, -PI / 2);
// ---------- city wall, towers and gate
const X0 = -56, X1 = 56, Z0 = -68, Z1 = 60;
for (let x = X0 + 4; x < X1; x += 8) { await P('infra_city-wall', x, Z0, PI); if (Math.abs(x) > 4) await P('infra_city-wall', x, Z1, 0); }
await P('infra_wall-gate', 0, Z1, 0);
for (let z = Z0 + 4; z < Z1; z += 8) { await P('infra_city-wall', X0, z, -PI / 2); if (z < 4 || z > 12) await P('infra_city-wall', X1, z, PI / 2); }
await P('infra_wall-gate', X1, 8, PI / 2);
for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [X0, -4], [X1, -28], [-28, Z0], [28, Z0], [-28, Z1], [28, Z1]]) await P('infra_wall-tower', x, z);
// ---------- harbour to the east: sea, quay, pier, lighthouse, trireme
const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 400), new THREE.MeshStandardMaterial({ color: 0x2f7fa6, roughness: 0.12, metalness: 0.1 }));
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
const C = [M('char_citizen_woman'), M('char_citizen_elder'), R('citizen')];
const people = [[2, 4, 1, 'Idle'], [-3, -4, 2.5, 'Idle'], [-6, -5.6, 0, 'Idle'], [4.5, -5.8, 0.4, 'Cheer'], [0.6, 18, 3.1, 'Walk'], [-0.7, 26, 0, 'Walk'], [0.5, -20, 0, 'Walk'], [-1, -30.8, 0, 'Cheer'], [-12, 1, 1.6, 'Idle'], [12, -2, -1.6, 'Idle'],
  [-4.6, 17, 1.6, 'Idle'], [4.4, 23, -1.6, 'Idle'], [0.4, 35, 3.1, 'Walk'], [64, 6, 1.6, 'Idle'], [-28, 11, 0, 'Idle'], [30, -6, 1.6, 'Clap'], [0.8, 48, 3.1, 'Walk'], [-1.2, 6.5, 0.3, 'Clap']];
for (let i = 0; i < people.length; i++) await citizen(C[i % 3], people[i][0], people[i][1], people[i][2], people[i][3], 0.13 * i);
if (L.lamp) for (const [x, y, z] of [[0, 3, 0], [0, 5, -31], [0, 3, 20], [0, 3, 34], [-22, 4, -18], [22, 4, -18], [66, 13, 40], [0, 4, 58]]) { const p = new THREE.PointLight(0xffb45a, 220, 40, 1.8); p.position.set(x, y, z); scene.add(p); }

const cams = {
  wide: [[95, 95, 150], [4, 0, -4]], plaza: [[13, 9, 22], [-2, 2, -6]], street: [[0.6, 2.4, 33], [-0.5, 3.2, 8]], temple: [[10, 5, -14], [-2, 6, -44]],
  harbour: [[98, 16, 46], [66, 3, 4]], river: [[-18, 9, 50], [2, 1.5, 33]], homes: [[-52, 14, 70], [-32, 2, 44]], civic: [[-6, 26, 20], [20, 2, -22]], top: [[0, 260, 1], [0, 0, 0]],
};
camera.position.set(...cams[view][0]); camera.lookAt(...cams[view][1]);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...cams[view][1]); controls.update();
if (q.has('shot')) renderer.render(scene, camera); else renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.ready = true;
