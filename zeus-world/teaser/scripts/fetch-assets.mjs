// Downloads the free (CC0) Poly Haven assets the teaser uses into public/assets.
// Usage: node scripts/fetch-assets.mjs
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', 'public', 'assets');
const HDRIS = ['kloppenheim_06_puresky', 'qwantani_night_puresky', 'qwantani_dusk_2_puresky'];
const TEXTURES = ['marble_01', 'white_plaster_02', 'clay_roof_tiles_02', 'cobblestone_floor_04', 'leafy_grass', 'rocky_terrain_02', 'sand_01', 'large_sandstone_blocks', 'sparse_grass'];
const MODELS = ['marble_bust_01', 'horse_statue_01', 'lion_head', 'ceramic_vase_01', 'ceramic_vase_03', 'brass_vase_01', 'stone_fire_pit', 'pine_tree_01', 'island_tree_01', 'island_tree_02', 'tree_small_02', 'jacaranda_tree', 'searsia_lucida', 'round_wooden_table_01', 'painted_wooden_chair_01', 'potted_plant_01', 'planter_pot_clay', 'wooden_barrels_01'];
const get = async (url, file) => { if (existsSync(file)) return; mkdirSync(path.dirname(file), { recursive: true }); const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); writeFileSync(file, Buffer.from(await r.arrayBuffer())); };
const files = async (id) => (await fetch('https://api.polyhaven.com/files/' + id)).json();
for (const id of HDRIS) { const f = await files(id); await get(f.hdri['2k'].hdr.url, path.join(root, 'hdri', id + '.hdr')); console.log('hdri', id); }
for (const id of TEXTURES) {
  const f = await files(id); const maps = { diff: f.Diffuse, nor: f.nor_gl, arm: f.arm };
  for (const [k, m] of Object.entries(maps)) { if (!m) { console.log('  missing', id, k); continue; } await get(m['2k'].jpg.url, path.join(root, 'tex', id, k + '.jpg')); }
  console.log('tex', id);
}
for (const id of MODELS) {
  const f = await files(id); const g = f.gltf['1k'].gltf; const dir = path.join(root, 'models', id);
  await get(g.url, path.join(dir, id + '.gltf'));
  for (const [rel, inc] of Object.entries(g.include || {})) await get(inc.url, path.join(dir, rel));
  console.log('model', id);
}
