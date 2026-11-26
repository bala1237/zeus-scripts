// The built places of the open world (ZW-049): the village of Riverbend, farmsteads in the fields, and the city by the sea.
// The city here is a stand-in made from the catalogue's own models on the real city's ground plan (walls 112 by 128 m, temple in the
// north, harbour on the east). The living city of city.html is written as a page and cannot yet be set down inside another scene.
//   const built = await createPlaces({ scene, heightAt, places, onProgress });
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export async function createPlaces({ scene, heightAt, places, camps = [], onProgress = () => {} }) {
  const lamps = []; // where light comes from after dark: lanterns, braziers and altars, a lamp by each door, the travellers' fires (worldair.js draws them)
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const cache = {}, M = (n) => `./models/${n}.glb`;
  const get = (n) => (cache[n] ||= loader.loadAsync(M(n)).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g.scene; }).catch((e) => { console.warn('model missing', n, e.message); return null; }));
  const root = new THREE.Group(); scene.add(root); const jobs = []; let done = 0;
  // set a model down: x, z in the world, turned by ry, standing on the ground there (or at a given height)
  const put = (n, x, z, ry = 0, s = 1, y = null) => jobs.push(get(n).then((m) => { onProgress(++done, jobs.length); if (!m) return; const o = m.clone(true); o.position.set(x, y ?? heightAt(x, z), z); o.rotation.y = ry; o.scale.setScalar(s); o.updateMatrixWorld(true); o.traverse((c) => { c.matrixAutoUpdate = false; }); root.add(o);
    const k = /lantern/.test(n) ? 'lamp' : /brazier|altar/.test(n) ? 'fire' : /^home_villa-walls|^biz_(?!stall)|^civic_(?!aqueduct)|decor_shrine/.test(n) ? 'door' : null; if (!k) return; const b = new THREE.Box3().setFromObject(o), g = o.position.y;
    if (k === 'door') { const d = (b.max.z - b.min.z + b.max.x - b.min.x) / 4 + 0.8; lamps.push({ x: x + Math.sin(ry) * d, y: g + 2.1, z: z + Math.cos(ry) * d, ground: g, kind: k }); } else lamps.push({ x, y: k === 'lamp' ? b.max.y - 0.35 : b.max.y + 0.1, z, ground: g, kind: k }); }));
  const face = (x, z, cx, cz) => Math.atan2(cx - x, cz - z);

  // A Zeus World home, built the way the city builds them: walls, an upper floor if it has one, a roof, and a columned porch.
  // The parts are made to fit one another: the upper floor sits 3 m up, the roof on top, the porch 2.2 m in front.
  const villa = (x, z, ry, { walls = 't1_stone', upper = null, roof = 't1_terracotta', porch = null } = {}) => { const y = heightAt(x, z), c = Math.cos(ry), sn = Math.sin(ry); put(`home_villa-walls_${walls}`, x, z, ry, 1, y); let h = 3; if (upper) { put(`home_villa-upper_${upper}`, x, z, ry, 1, y + 3); h = 6; } put(`home_villa-roof_${roof}`, x, z, ry, 1, y + h); if (porch) put(`home_villa-porch_${porch}`, x + sn * 2.2, z + c * 2.2, ry, 1, y); };
  // a strip of paving: tiles 2 m square laid from one point to another, `wide` tiles across
  const pave = (n, x0, z0, x1, z1, wide = 1) => { const L = Math.hypot(x1 - x0, z1 - z0), k = Math.max(1, Math.round(L / 2)), ry = Math.atan2(x1 - x0, z1 - z0), px = Math.cos(ry), pz = -Math.sin(ry); for (let i = 0; i <= k; i++) for (let w = 0; w < wide; w++) { const o = (w - (wide - 1) / 2) * 2, x = x0 + (x1 - x0) * i / k + px * o, z = z0 + (z1 - z0) * i / k + pz * o; put(n, x, z, ry, 1, heightAt(x, z) + 0.02); } };

  // ---------- Riverbend: a Greek village. A paved square with a well, a columned hall, a shrine and banners; villas with porches round it;
  // workshops and stalls; the road paved where it runs through.
  { const v = places.village, at = (dx, dz) => [v.x + dx, v.z + dz], KINDS = [{ walls: 't1_stone', roof: 't1_terracotta', porch: 't2_doric' }, { walls: 't2_ochre', roof: 't1_terracotta' }, { walls: 't1_stone', roof: 't2_slate', porch: 't2_doric' }, { walls: 't2_ochre', upper: 't2_plaster', roof: 't1_terracotta', porch: 't2_doric' }, { walls: 't1_stone', roof: 't3_azure', porch: 't3_ionic' }, { walls: 't2_ochre', roof: 't2_slate' }];
    [[-30, -26], [-12, -31], [10, -30], [31, -25], [-31, 24], [-11, 30], [12, 29], [33, 23], [-50, -6], [52, 2], [-52, 20], [54, -22]].forEach(([dx, dz], i) => { const [x, z] = at(dx, dz); villa(x, z, face(x, z, v.x, v.z), KINDS[i % KINDS.length]); });
    for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) put('infra_tile_t1_plaza', v.x + i * 2, v.z + j * 2, 0, 1, heightAt(v.x, v.z) + 0.02);
    pave('infra_tile_t1_road', v.x - 70, v.z + 2, v.x - 10, v.z, 2); pave('infra_tile_t1_road', v.x + 10, v.z, v.x + 80, v.z - 4, 2);
    put('water_well', ...at(0, 0)); put('civic_stoa', ...at(0, -52), 0); put('decor_shrine', ...at(-22, 2), Math.PI / 2); put('decor_statue-plinth_t1', ...at(7, -6)); put('decor_altar', ...at(0, -40));
    put('decor_banner_t1_azure', ...at(-9, -7)); put('decor_banner_t1_red', ...at(9, -7)); put('decor_banner_t1_azure', ...at(9, 7)); put('decor_banner_t1_red', ...at(-9, 7));
    put('decor_lantern_t1_bronze', ...at(-9, 0)); put('decor_lantern_t1_bronze', ...at(9, 0)); put('decor_bench_t1_marble', ...at(-5, 7), Math.PI); put('decor_bench_t1_marble', ...at(5, 7), Math.PI); put('decor_brazier_t1', ...at(-4, -44)); put('decor_brazier_t1', ...at(4, -44));
    put('biz_stall_t1_fruit', ...at(15, -10), -0.5); put('biz_stall_t1_cloth', ...at(-16, 11), 2.6); put('biz_stall_t1_fish', ...at(17, 11), -2.5); put('biz_stall_t1_pottery', ...at(-16, -10), 0.5); put('decor_cart_t1', ...at(24, 4), 1.1); put('decor_amphorae_t1_cluster', ...at(-20, 14), 1.2); put('decor_barrels_t1', ...at(21, -13), 0.3);
    put('biz_forge_t1', ...at(70, -16), -1.6); put('biz_olive-press_t1', ...at(-68, -30), 0.9); put('biz_pottery_t1', ...at(-70, 18), 1.6); put('biz_bakery_t1', ...at(72, 16), -1.6); put('decor_pergola_t1', ...at(-40, 40), 0.4); put('build_timber-stack_t1', ...at(80, -28), 0.7);
    put('infra_signpost', ...at(84, 2), 1.2); put('decor_obelisk', ...at(92, -10)); for (let i = 0; i < 7; i++) { put('nature_cypress_t1', ...at(-26 + i * 9, -62), 0, 1.5); } for (const [dx, dz] of [[-62, -8], [-62, 34], [64, 34], [40, 44], [-24, 46]]) put('nature_cypress_t1', ...at(dx, dz), 0, 1.4); }

  // ---------- farmsteads in the fields between the forest and the walls: a stone villa, a pergola, a cart, a low wall
  for (const [x, z, ry, k] of [[-330, -70, 0.6, 0], [-420, 90, 2.2, 1], [-250, 120, -1.2, 2], [-520, -40, 1.5, 0], [-210, -190, 0.2, 1], [-300, 250, 3.0, 2], [-160, 200, -0.6, 0], [-600, 160, 0.9, 1]]) { const c = Math.cos(ry), sn = Math.sin(ry);
    villa(x, z, ry, [{ walls: 't1_stone', roof: 't1_terracotta', porch: 't2_doric' }, { walls: 't2_ochre', roof: 't1_terracotta' }, { walls: 't1_stone', roof: 't2_slate' }][k]); put('decor_pergola_t1', x + c * 9, z - sn * 9, ry); put('decor_cart_t1', x - c * 8 + sn * 3, z + sn * 8 + c * 3, ry + 1); put('decor_amphorae_t1_cluster', x + sn * 5 + c * 4, z + c * 5 - sn * 4, ry);
    for (let i = -2; i <= 2; i++) put('decor_garden-wall_t1_plaster', x + sn * 9 + c * i * 2, z + c * 9 - sn * i * 2, ry); put('nature_cypress_t1', x - c * 7 - sn * 6, z + sn * 7 - c * 6, 0, 1.4); }
  put('decor_shrine', places.crest.x + 8, places.crest.z - 10, 1.9); put('infra_signpost', places.crest.x - 4, places.crest.z + 5, 0.4); put('decor_bench_t1_marble', places.crest.x + 3, places.crest.z + 8, 1.4);

  // ---------- the city: walls with towers and gates, the temple, the civic buildings, homes, the lighthouse and the colossus by the harbour
  { const Y = 4, X0 = -56, X1 = 56, Z0 = -68, Z1 = 60, c = (n, x, z, ry = 0, s = 1) => put(n, x, z, ry, s, Y);
    for (let x = X0 + 4; x < X1; x += 8) { c('infra_city-wall', x, Z0); if (Math.abs(x) > 5) c('infra_city-wall', x, Z1); } c('infra_wall-gate', 0, Z1);
    for (let z = Z0 + 4; z < Z1; z += 8) { if (Math.abs(z) > 5) c('infra_city-wall', X0, z, Math.PI / 2); c('infra_city-wall', X1, z, Math.PI / 2); } c('infra_wall-gate', X0, 0, Math.PI / 2);
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [X0, -30], [X0, 30], [0, Z0]]) c('infra_wall-tower', x, z);
    c('civic_temple-zeus_stage4', 0, -44); c('civic_stoa', -30, -6, Math.PI / 2); c('civic_council-hall', 32, -38); c('civic_library', -34, -42); c('civic_fountain-plaza', 0, 4); c('civic_amphitheatre', 34, 24, -Math.PI / 2); c('civic_bathhouse', -36, 26); c('civic_gymnasium', 32, -8);
    c('civic_tholos', 16, -20); c('decor_victory-column', 0, -22); c('decor_obelisk', -14, 4); c('decor_obelisk', 14, 4);
    [['home_insula_t1', -42, 46], ['home_insula_t2', -27, 46], ['home_insula_t3', -12, 46], ['home_insula_t1', 12, 46, Math.PI], ['home_insula_t2', 27, 46], ['home_grand-villa_t4', 42, 44], ['home_insula_t3', -44, 8, Math.PI / 2], ['home_insula_t1', 44, 4, -Math.PI / 2]].forEach(([n, x, z, ry]) => c(n, x, z, ry || 0));
    // more homes inside the walls, in rows, and a town that has outgrown them along the road to the west gate
    for (const [x, z, ry, n] of [[-44, -22, Math.PI / 2, 2], [-44, -56, 0, 1], [-18, -60, 0, 3], [18, -60, 0, 2], [44, -58, 0, 1], [46, -22, -Math.PI / 2, 3], [-16, 22, Math.PI, 1], [16, 24, Math.PI, 2], [-20, 36, 0, 3], [4, 34, 0, 1], [46, 30, -Math.PI / 2, 2]]) c(`home_insula_t${n}`, x, z, ry);
    for (let i = 0; i < 16; i++) { const x = -78 - i * 15 - (i % 3) * 3, far = i / 16; for (const sgn of [-1, 1]) { if ((i * 7 + (sgn > 0 ? 3 : 0)) % 5 === 0) continue; const z = sgn * (13 + (i % 4) * 2.5 + far * 6), n = far < 0.4 ? `home_insula_t${1 + (i + (sgn > 0 ? 1 : 0)) % 3}` : i % 2 ? 'home_cottage_t2' : 'home_cottage_t1'; put(n, x, z, sgn > 0 ? Math.PI : 0); if (far < 0.5 && i % 2) put(n === 'home_cottage_t1' ? 'home_cottage_t2' : 'home_insula_t1', x - 3, z + sgn * 15, sgn > 0 ? Math.PI : 0); } }
    put('biz_bakery_t1', -92, -30, 0.3); put('biz_pottery_t1', -108, 34, 2.9); put('biz_cafe_t1', -128, -32, 0.2); put('biz_stall_t1_fruit', -76, 9, 1.6); put('biz_stall_t1_pottery', -82, -9, -1.5); put('water_well', -150, 30); put('decor_shrine', -200, -22, 0.4);
    for (let i = 0; i < 9; i++) c('civic_aqueduct', -60 - i * 8, -62, 0);
    c('civic_lighthouse', 70, 44); put('landmark_colossus', 72, -44, Math.PI / 2, 1, 2.6); put('landmark_trireme', 104, 6, 0.3, 1, 0.1); }
  // travellers' camps beside the road: two logs and a fire
  for (const [x, z] of camps) { const g = heightAt(x, z); put('nature_log_fallen', x + 1.5, z + 0.4, 0.5, 0.42); put('nature_log_fallen', x - 1.3, z - 0.9, 2.3, 0.42); lamps.push({ x, y: g + 0.45, z, ground: g, kind: 'fire', size: 1.25 }); }
  await Promise.all(jobs);
  let tris = 0; root.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return { root, lamps, models: Object.keys(cache).length, placed: jobs.length, triangles: Math.round(tris) };
}
