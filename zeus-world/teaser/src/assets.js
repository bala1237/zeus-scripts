// Loads the Poly Haven skies, textures and models (see scripts/fetch-assets.mjs).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const base = './assets/'; const params = new URLSearchParams(location.search);
const tl = new THREE.TextureLoader(), gl = new GLTFLoader(), hl = new HDRLoader();
const tex = (url, srgb) => tl.loadAsync(base + url).then((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; });

export const SKIES = { gold: 'kloppenheim_06_puresky', dusk: 'qwantani_dusk_2_puresky', night: 'qwantani_night_puresky' };
// horizontal position (0..1) of the sun or brightest glow in each sky image
export const SKY_SUN_U = { gold: 0.607, dusk: 0.607, night: 0.61 };
const TEX = ['marble_01', 'white_plaster_02', 'clay_roof_tiles_02', 'cobblestone_floor_04', 'leafy_grass', 'rocky_terrain_02', 'sand_01', 'large_sandstone_blocks', 'sparse_grass'];
const MODELS = ['marble_bust_01', 'horse_statue_01', 'lion_head', 'ceramic_vase_01', 'ceramic_vase_03', 'brass_vase_01', 'stone_fire_pit', 'island_tree_02', 'searsia_lucida', 'round_wooden_table_01', 'painted_wooden_chair_01', 'potted_plant_01', 'planter_pot_clay', 'wooden_barrels_01'];

export const A = { tex: {}, model: {}, env: {}, sky: {}, mat: {} };

export async function loadAssets() {
  const jobs = [];
  for (const id of TEX) jobs.push(Promise.all([tex(`tex/${id}/diff.jpg`, true), tex(`tex/${id}/nor.jpg`), tex(`tex/${id}/arm.jpg`)]).then(([map, nor, arm]) => { A.tex[id] = { map, nor, arm }; }));
  for (const id of MODELS) jobs.push(gl.loadAsync(`${base}models/${id}/${id}.gltf`).then((g) => {
    g.scene.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; const m = o.material; if (m.transparent || m.alphaTest > 0) { m.transparent = false; m.alphaTest = 0.45; m.depthWrite = true; m.side = THREE.DoubleSide; } });
    A.model[id] = g.scene;
  }));
  for (const [k, id] of Object.entries(SKIES)) {
    jobs.push(hl.loadAsync(`${base}hdri/${id}.hdr`).then((t) => { t.mapping = THREE.EquirectangularReflectionMapping; A.env[k] = t; }));
    jobs.push(tl.loadAsync(`${base}hdri/${id}.jpg`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; A.sky[k] = t; }));
  }
  await Promise.all(jobs);
  const pbr = (id, tile, o = {}) => { const t = A.tex[id]; const m = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.nor, roughnessMap: t.arm, aoMap: t.arm, metalness: 0, ...o }); m.userData.tile = tile; return m; };
  const flat = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o }); m.userData.tile = 1; return m; };
  Object.assign(A.mat, {
    marble: pbr('marble_01', 3.2, { color: 0xfff8ee }),
    marbleWarm: pbr('marble_01', 3.2, { color: 0xf1dcc0 }),
    plaster: pbr('white_plaster_02', 2.6, { color: 0xfff1dc }),
    roof: pbr('clay_roof_tiles_02', 1.7, { color: 0xffd9c4 }),
    cobble: pbr('cobblestone_floor_04', 3.4, { color: 0xe9dcc6 }),
    sandstone: pbr('large_sandstone_blocks', 4.2, { color: 0xf4e3c8 }),
    sand: pbr('sand_01', 3, { color: 0xf3dfb4 }),
    bronze: flat(0x8a5a2b, { metalness: 0.9, roughness: 0.38 }),
    gold: flat(0xffc24a, { metalness: 1, roughness: 0.22, emissive: 0x7a4a00, emissiveIntensity: 0.5 }),
    wood: flat(0x6b4a2f, { roughness: 0.8 }),
    bluePaint: flat(0x2c5d9a, { roughness: 0.55 }),
    dark: flat(0x15120f, { roughness: 1 }),
    redCloth: flat(0xb3342f, { roughness: 0.9, side: THREE.DoubleSide }),
    blueCloth: flat(0x2c5d9a, { roughness: 0.9, side: THREE.DoubleSide }),
    whiteCloth: flat(0xf4efe4, { roughness: 0.9, side: THREE.DoubleSide }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x3fb2c8, roughness: 0.04, metalness: 0, transmission: 0, clearcoat: 1, transparent: true, opacity: 0.86 }),
    cypress: new THREE.MeshStandardMaterial({ map: A.tex.leafy_grass.map, normalMap: A.tex.leafy_grass.nor, color: 0x3d5a33, roughness: 0.95 }),
  });
  A.mat.cypress.userData.tile = 1.6;
  A.mat.glow = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(4.6, 3.0, 0.75) });
  A.mat.flame = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(6, 2.3, 0.4), transparent: true, opacity: 0.9, depthWrite: false });
}

// A copy of a loaded model, scaled so its height is `height` metres, sitting on y = 0.
export function prop(id, height) {
  const o = A.model[id].clone(true); const box = new THREE.Box3().setFromObject(o); const s = height / (box.max.y - box.min.y);
  const g = new THREE.Group(); o.scale.setScalar(s); o.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s); g.add(o); return g;
}
