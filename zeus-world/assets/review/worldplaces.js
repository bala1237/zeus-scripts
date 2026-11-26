// The built places of the open world (ZW-049): the village of Riverbend, farmsteads in the fields, and the city by the sea.
// The city here is a stand-in made from the catalogue's own models on the real city's ground plan (walls 112 by 128 m, temple in the
// north, harbour on the east). The living city of city.html is written as a page and cannot yet be set down inside another scene.
//   const built = await createPlaces({ scene, heightAt, places, onProgress });
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export async function createPlaces({ scene, heightAt, places, onProgress = () => {} }) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const cache = {}, M = (n) => `./models/${n}.glb`;
  const get = (n) => (cache[n] ||= loader.loadAsync(M(n)).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g.scene; }).catch((e) => { console.warn('model missing', n, e.message); return null; }));
  const root = new THREE.Group(); scene.add(root); const jobs = []; let done = 0;
  // set a model down: x, z in the world, turned by ry, standing on the ground there (or at a given height)
  const put = (n, x, z, ry = 0, s = 1, y = null) => jobs.push(get(n).then((m) => { onProgress(++done, jobs.length); if (!m) return; const o = m.clone(true); o.position.set(x, y ?? heightAt(x, z), z); o.rotation.y = ry; o.scale.setScalar(s); o.updateMatrixWorld(true); o.traverse((c) => { c.matrixAutoUpdate = false; }); root.add(o); }));
  const face = (x, z, cx, cz) => Math.atan2(cx - x, cz - z);

  // ---------- Riverbend: cottages round a green with a well, a forge, a press, stalls, and the road running through
  { const v = places.village, at = (dx, dz) => [v.x + dx, v.z + dz], homes = [[-34, -24], [-14, -30], [8, -28], [30, -22], [-30, 22], [-10, 28], [12, 26], [34, 20], [-52, -2], [54, 30], [-58, 30]];
    homes.forEach(([dx, dz], i) => { const [x, z] = at(dx, dz); put(i % 2 ? 'home_cottage_t2' : 'home_cottage_t1', x, z, face(x, z, v.x, v.z)); });
    put('water_well', ...at(-2, 0)); put('biz_stall_t1_fruit', ...at(14, -9), 0.4); put('biz_stall_t1_cloth', ...at(-16, 9), 3.5); put('biz_stall_t1_fish', ...at(18, 10), -2.4); put('decor_cart_t1', ...at(6, 8), 1.1); put('decor_cart_t1', ...at(-44, 14), 0.3);
    put('biz_forge_t1', ...at(48, -8), -1.6); put('biz_olive-press_t1', ...at(-40, -44), 0.5); put('decor_shrine', ...at(64, 6), -1.57); put('build_timber-stack_t1', ...at(52, -24), 0.7); put('build_timber-stack_t1', ...at(-62, -18), 2.1); put('decor_barrels_t1', ...at(22, -12), 0.3); put('decor_amphorae_t1_cluster', ...at(-20, 14), 1.2); put('decor_brazier_t1', ...at(4, -4)); put('infra_signpost', ...at(40, 4), 1.2); }

  // ---------- farmsteads in the fields between the forest and the walls
  for (const [x, z, ry] of [[-330, -70, 0.6], [-420, 90, 2.2], [-250, 120, -1.2], [-520, -40, 1.5], [-210, -190, 0.2], [-300, 250, 3.0], [-160, 200, -0.6], [-600, 160, 0.9]]) { put('home_cottage_t1', x, z, ry); put('decor_cart_t1', x + 7 * Math.cos(ry), z + 7 * Math.sin(ry), ry + 1); put('build_timber-stack_t1', x - 8 * Math.sin(ry), z + 8 * Math.cos(ry), ry); }
  put('decor_shrine', places.crest.x + 8, places.crest.z - 10, 1.9); put('infra_signpost', places.crest.x - 4, places.crest.z + 5, 0.4);

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
  await Promise.all(jobs);
  let tris = 0; root.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return { root, models: Object.keys(cache).length, placed: jobs.length, triangles: Math.round(tris) };
}
