// Look test (asset bible milestone): one street of six plots built only from catalogue models.
// ?view=wide|street|villas|site|garden   ?light=day|dusk
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'wide', light = q.get('light') || 'day';
document.getElementById('label').textContent = q.get('label') || `Street test · ${view} · ${light}`;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 600);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
const L = {
  day: { sky: 0xbfd9ee, ground: 0x86a85f, sun: 0xfff1dc, sunI: 2.9, sunPos: [-30, 42, 34], hemi: 0.75, env: 0.5, exp: 1.0, lamp: 0 },
  dusk: { sky: 0xe9a878, ground: 0x6f8c52, sun: 0xff9a55, sunI: 1.9, sunPos: [-46, 13, 24], hemi: 0.4, env: 0.3, exp: 1.0, lamp: 1 },
}[light];
scene.background = new THREE.Color(L.sky); scene.fog = new THREE.Fog(L.sky, 90, 260);
scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exp;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a48, L.hemi));
const sun = new THREE.DirectionalLight(L.sun, L.sunI); sun.position.set(...L.sunPos); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 40, bottom: -40, near: 1, far: 160 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }));
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
  if (roof) await fit(R(roof), W + 0.9, 2.3, D + 1.1, g, H - 0.12);
  if (porch) await fit(R(porch), W + 0.2, H + 0.1, 1.9, g, 0, D / 2 + 0.85);
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

// ---------- layout: road along X, three plots (16 x 12 m) on each side
const PW = 16, PD = 12, ROAD = 4, N = 3, X0 = -PW * N / 2;
for (let i = 0; i < PW * N / 2 + 4; i++) for (let j = 0; j < ROAD / 2; j++) await put(M('infra_tile_t1_road'), X0 - 3 + i * 2, -ROAD / 2 + 1 + j * 2);
const PLOTS = [
  { walls: 'home_villa-walls_t1_stone', roof: 'roof_terracotta', porch: 'porch_doric', tree: 3 },
  { walls: 'home_villa-walls_t2_ochre', roof: 'roof_terracotta', porch: null, tree: 4 },
  { walls: 'home_villa-walls_t3_goldmarble', roof: 'roof_azure', porch: 'porch_ionic', tree: 2 },
  { walls: 'home_villa-walls_t3_goldmarble', roof: null, porch: null, site: true, tree: 1 },
  { walls: 'ref:body_plaster', roof: 'roof_azure', porch: 'porch_doric', tree: 3 },
  { walls: 'home_villa-walls_t2_ochre', roof: 'roof_terracotta', porch: 'porch_doric', tree: 2, cafe: true },
];
for (let k = 0; k < 6; k++) {
  const p = PLOTS[k], side = k < 3 ? -1 : 1, col = k % 3;
  const plot = new THREE.Group(); scene.add(plot);            // plot space: front edge on z = 0, house behind at -z
  plot.position.set(X0 + PW / 2 + col * PW, 0, side * ROAD / 2); plot.rotation.y = side < 0 ? 0 : Math.PI;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.3, PD - 0.3), new THREE.MeshStandardMaterial({ color: new THREE.Color(L.ground).multiplyScalar(1.12), roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.012, -PD / 2); lawn.receiveShadow = true; plot.add(lawn);
  const house = await villa(plot, p.walls, p.roof, p.porch); house.position.set(p.cafe ? -3.2 : 0, 0, -6.4);
  // front garden wall with a gate in the middle, boundary stones down the sides and along the back
  for (const x of [-7, -5, -3, 3, 5, 7]) await put(M('decor_garden-wall_t1_plaster'), x, -0.3, 0, 1, plot);
  await put(M('decor_garden-gate_t1_azure'), 0, -0.3, 0, 1, plot);
  for (let i = 0; i < 6; i++) { await put(M('infra_boundary_t1_stones'), -PW / 2 + 0.25, -1.4 - i * 2 + 0.4, Math.PI / 2, 1, plot); await put(M('infra_boundary_t1_stones'), PW / 2 - 0.25, -1.4 - i * 2 + 0.4, -Math.PI / 2, 1, plot); }
  for (let i = 0; i < 8; i++) await put(M('infra_boundary_t1_stones'), -PW / 2 + 1 + i * 2, -PD + 0.25, 0, 1, plot);
  // mosaic path from the gate to the door
  await put(M('infra_tile_t1_mosaic'), house.position.x * 0, -1.5, 0, 0.8, plot); await put(M('infra_tile_t1_mosaic'), house.position.x * 0.5, -3.0, 0, 0.8, plot);
  if (p.site) {                                               // a house going up
    for (const x of [-2.2, 0, 2.2]) await put(M('build_scaffolding_t1'), x, -6.4 + 2.9, 0, 1, plot);
    await put(M('build_scaffolding_t1'), 3.85, -6.4, Math.PI / 2, 1, plot);
    await put(M('build_crane_t1'), -5.2, -5.6, Math.PI / 2, 1, plot);
    await put(M('build_stone-blocks_t1'), -5.0, -2.2, 0.3, 1, plot); await put(M('build_timber-stack_t1'), 5.4, -2.6, 1.3, 1, plot);
    await put(M('build_crates_t1'), 3.0, -1.6, -0.4, 1, plot);
    await citizen(M('char_citizen_elder'), -2.6, -2.4, 0.6, 'Idle', 0.3, plot); await citizen(R('citizen'), 1.0, -2.8, -2.2, 'Cheer', 0.5, plot);
  } else {
    await put(M(`nature_citizen-tree_stage${p.tree}`), 5.2, -3.6, k, 1, plot);
    await put(M('decor_bench_t1_marble'), 4.9, -6.4, -Math.PI / 2, 1, plot);
    await put(M('decor_lantern_t1_bronze'), -1.6, -1.3, 0, 1, plot); lampLight(plot.position.x - 1.2 * (side < 0 ? 1 : -1), 2.1, plot.position.z + (side < 0 ? -1.3 : 1.3));
    await put(M('decor_amphorae_t1_cluster'), -4.6, -4.2, 0.4, 1, plot);
    await put(M('nature_bush_t1_myrtle'), -5.6, -1.4, 1, 1, plot); await put(M('nature_bush_t1_oleander'), 6.6, -1.5, 2, 1, plot);
    await put(M('nature_flowers_t1_wild'), -3.0, -1.2, 0, 1, plot); await put(M('nature_flowers_t1_wild'), 2.6, -1.2, 2, 1, plot);
    for (const x of [-6.6, -5.4]) await put(M('nature_hedge_t1_box'), x * 0 + (x < -6 ? -6.2 : -6.2), x < -6 ? -7.5 : -9.6, Math.PI / 2, 1, plot);
    await put(M('decor_pot_t1_large'), (p.cafe ? -3.2 : 0) - 2.4, -3.7, 0, 1, plot); await put(M('decor_pot_t1_medium'), (p.cafe ? -3.2 : 0) + 2.4, -3.7, 0, 1, plot);
    await put(M('nature_cypress_t1'), -6.6, -10.4, k, 1, plot); await put(M('nature_cypress_t1'), 6.4, -10.2, k + 1, 0.85, plot);
    await put(M('decor_plaque_t1_bronze'), 4.0, -3.1, 0, 1, plot);
    if (p.cafe) { await put(M('biz_cafe_t1'), 4.3, -7.6, 0, 1, plot); }
    await citizen(k % 2 ? M('char_citizen_woman') : R('citizen'), 1.2 - k * 0.3, -1.9, 2.6 - k, 'Idle', 0.2 * k, plot);
  }
}
// street lamps at the plot corners, a few people on the road
for (let i = 0; i <= N; i++) for (const s of [-1, 1]) { const x = X0 + i * PW, z = s * (ROAD / 2 - 0.45); await put(M('infra_street-lamp_t1'), x, z, 0); lampLight(x, 3.0, z); }
await citizen(M('char_citizen_woman'), -6, 0.4, Math.PI / 2, 'Walk', 0.3); await citizen(M('char_citizen_elder'), 9, -0.5, -Math.PI / 2, 'Walk', 0.6);
await citizen(R('citizen'), 2, 0.2, 2.0, 'Idle', 0.1);

const cams = {
  wide: [[30, 34, 44], [0, 1, -1]], street: [[-27, 1.9, 0.4], [10, 2.6, -1.2]], villas: [[-8, 6.5, 13], [-8, 2.2, -8.5]],
  site: [[-5, 7.5, -7.5], [-17, 2.2, 8]], garden: [[4.5, 3.2, 3.2], [-2.5, 1.6, -8.5]], ochre: [[6, 4.2, 6.5], [-1, 2.0, -8.4]], gold: [[21, 4.5, 7], [15.5, 2.2, -8.4]],
};
camera.position.set(...cams[view][0]); camera.lookAt(...cams[view][1]);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...cams[view][1]); controls.update();
if (q.has('shot')) renderer.render(scene, camera); else renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.ready = true;
