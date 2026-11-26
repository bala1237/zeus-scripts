// The built places of the open world (ZW-049): the village of Riverbend, farmsteads in the fields, and the city by the sea.
// The city here is a stand-in made from the catalogue's own models on the real city's ground plan (walls 112 by 128 m, temple in the
// north, harbour on the east). The living city of city.html is written as a page and cannot yet be set down inside another scene.
//   const built = await createPlaces({ scene, heightAt, places, onProgress });
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export async function createPlaces({ scene, heightAt, places, camps = [], river = [], roadside = [], onProgress = () => {} }) {
  const lamps = []; // where light comes from after dark: lanterns, braziers and altars, a lamp by each door, the travellers' fires (worldair.js draws them)
  // Every model is loaded once and drawn in batches (ZW-052). What is set down is only written in a list; when all the lists are
  // complete, the things of one kind that stand in the same square of land (CELL metres) become one instanced draw per part of the
  // model, in two versions: the model itself, and its far-view version (models/far/, a few hundred triangles, no textures), which
  // is what a square further than FAR metres from the camera is drawn from. Only near squares cast shadows; flat paving casts none.
  const CELL = 128, FAR = 210, SHADOW = 150;
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const cache = {};
  const parts = (url) => loader.loadAsync(url).then((g) => { g.scene.updateMatrixWorld(true); const out = []; g.scene.traverse((o) => { if (o.isMesh) { const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); geo.computeBoundingBox(); out.push({ geo, mat: o.material }); } }); return out; });
  // the parts of one model that wear the same material are joined, so a model costs one draw per material, and its far version one draw in all
  const join = (list, one) => { const by = new Map(); for (const q of list) { const k = one ? 0 : q.mat.uuid; if (!by.has(k)) by.set(k, { mat: q.mat, geos: [] }); by.get(k).geos.push(q.geo); } const out = [];
    for (const g of by.values()) { if (g.geos.length === 1) { out.push({ geo: g.geos[0], mat: g.mat }); continue; } const names = Object.keys(g.geos[0].attributes).filter((n) => g.geos.every((x) => x.attributes[n] && x.attributes[n].itemSize === g.geos[0].attributes[n].itemSize && x.attributes[n].normalized === g.geos[0].attributes[n].normalized && x.attributes[n].array.constructor === g.geos[0].attributes[n].array.constructor));
      const clean = g.geos.map((x) => { const c = x.index ? x.toNonIndexed() : x.clone(); for (const n of Object.keys(c.attributes)) if (!names.includes(n)) c.deleteAttribute(n); c.morphAttributes = {}; return c; }), m = mergeGeometries(clean, false); if (m) { m.computeBoundingBox(); out.push({ geo: m, mat: g.mat }); } else for (const x of g.geos) out.push({ geo: x, mat: g.mat }); } return out; };
  const farMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const get = (n) => (cache[n] ||= Promise.all([parts(`./models/${n}.glb`), parts(`./models/far/${n}.glb`).catch(() => null)]).then(([full, far]) => { full = join(full, false); if (far) far = join(far, true); const box = new THREE.Box3(); for (const q of full) box.union(q.geo.boundingBox); return { full, far, box }; }).catch((e) => { console.warn('model missing', n, e.message); return null; }));
  const root = new THREE.Group(); scene.add(root); const jobs = [], cells = new Map(); let done = 0, placed = 0;
  // set a model down: x, z in the world, turned by ry, standing on the ground there (or at a given height)
  const put = (n, x, z, ry = 0, s = 1, y = null) => { placed++; jobs.push(get(n).then((m) => { onProgress(++done, jobs.length); if (!m) return; const g = y ?? heightAt(x, z), key = `${n}|${Math.floor(x / CELL)}|${Math.floor(z / CELL)}`; let c = cells.get(key); if (!c) cells.set(key, c = { n, m, list: [] }); c.list.push([x, g, z, ry, s]);
    const k = /lantern/.test(n) ? 'lamp' : /brazier|altar|shrine_roadside/.test(n) ? 'fire' : /^home_villa-walls|^biz_(?!stall)|^civic_(?!aqueduct)|decor_shrine|country_(barn|watermill|hut)/.test(n) ? 'door' : null; if (!k) return; const b = m.box;
    if (k === 'door') { const d = (b.max.z - b.min.z + b.max.x - b.min.x) * s / 4 + 0.8; lamps.push({ x: x + Math.sin(ry) * d, y: g + 2.1, z: z + Math.cos(ry) * d, ground: g, kind: k }); } else lamps.push({ x, y: g + b.max.y * s - (k === 'lamp' ? 0.35 : -0.1), z, ground: g, kind: k }); })); };
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
  const FARMS = [[-330, -70, 0.6, 0], [-420, 90, 2.2, 1], [-250, 120, -1.2, 2], [-520, -40, 1.5, 0], [-210, -190, 0.2, 1], [-300, 250, 3.0, 2], [-160, 200, -0.6, 0], [-600, 160, 0.9, 1]];
  for (const [x, z, ry, k] of FARMS) { const c = Math.cos(ry), sn = Math.sin(ry);
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
  // ---------- the countryside (phase 3): what the farms and the river have that the town does not. Models from blender/country.py.
  const spots = { farms: [], huts: [], horses: [[-92, 16, 1.9], [-96, 20.5, 2.3]], eagles: [[places.crest.x, places.crest.z, 110, 75], [places.village.x + 60, places.village.z - 160, 150, 95], [places.falls.x + 120, places.falls.z, 130, 60], [-300, 60, 170, 110]] };
  FARMS.forEach(([x, z, ry, k], i) => { const c = Math.cos(ry), sn = Math.sin(ry), L = (f, r) => [x + sn * f + c * r, z + c * f - sn * r]; // f metres to the front, r to the right
    put('country_barn', ...L(-2, -19), ry); put('country_haystack', ...L(-15, -25), i); if (i % 2) put('country_haystack', ...L(-20, -17), i * 2);
    const pen = L(-16, 2); for (let j = -2; j <= 1; j++) { put('country_fence', ...L(-11.5, 2 + j * 3 + 1.5), ry); put('country_fence', ...L(-20.5, 2 + j * 3 + 1.5), ry); } for (let j = 0; j < 3; j++) { put('country_fence', ...L(-13 - j * 3, -4), ry + Math.PI / 2); if (j) put('country_fence', ...L(-13 - j * 3, 8), ry + Math.PI / 2); }
    const f = { x, z, ry, k, pen };
    if (k === 0) { put('country_threshing-floor', ...L(4, 24), ry); f.ox = L(4, 31); } if (k === 1) { put('country_cart_hay', ...L(6, -16), ry + 0.5); f.horse = L(9.5, -14); } if (k === 2) put('country_beehives', ...L(-6, 15), ry - 0.4);
    spots.farms.push(f); });
  for (const k of ['hut1', 'hut2', 'hut3']) { const h = places[k]; put('country_hut_shepherd', h.x, h.z, 2.2); put('country_fence', h.x + 9, h.z - 2, 0.3); put('country_fence', h.x + 11.8, h.z - 2.9, 0.3); put('country_haystack', h.x - 8, h.z - 4, 1, 0.7); spots.huts.push({ x: h.x, z: h.z }); }
  for (const [x, z, ry] of roadside) put('country_shrine_roadside', x, z, ry);
  // the river by the village: the mill with its wheel over the water, a jetty with a boat, and a timber bridge to the far bank
  if (river.length) { const near = (X) => river.reduce((b, p) => (Math.abs(p[0] - X) < Math.abs(b[0] - X) ? p : b)), bank = (p, side) => { let d = 2; while (d < 60 && heightAt(p[0], p[1] + side * d) < p[3] + 0.08) d += 0.5; return d; };
    const m = near(places.village.x - 20), dm = bank(m, 1), my = m[3] - 0.15; put('country_watermill', m[0], m[1] + dm + 1.7, Math.PI / 2, 1, my); spots.mill = { x: m[0], y: my, z: m[1] + dm + 1.7, ry: Math.PI / 2 };
    const j = near(places.village.x - 75), dj = bank(j, 1); put('country_jetty', j[0], j[1] + dj - 2.6, 0, 1, j[3] + 0.3 - 3.0); spots.jetty = { x: j[0], y: j[3] + 0.85, z: j[1] + dj - 2.6 }; put('country_boat_fishing', j[0] - 4.6, j[1] + dj - 5.2, 0.12, 1, j[3] - 0.38); put('country_boat_fishing', j[0] + 70, j[1] - 1, -0.2, 1, j[3] - 0.38);
    const b = near(places.village.x + 110), hb = Math.max(heightAt(b[0], b[1] + 15), heightAt(b[0], b[1] - 15), b[3] + 0.4); put('country_bridge_timber', b[0], b[1], Math.PI / 2, 1, hb - 4.0); }
  put('country_boat_fishing', 116, -24, 0.9, 1, -0.38); put('country_boat_fishing', 122, 30, -0.5, 1, -0.38); put('country_boat_fishing', 131, 4, 2.4, 1, -0.38);
  // ---------- new places (phase 7)
  { // Thalassa, the harbour town: a paved quay along the shore, three jetties and the boats, a market hall, homes up the slope behind
    const h = places.harbour, at = (dx, dz) => [h.x + dx, h.z + dz]; let sx = h.x; while (sx < h.x + 400 && heightAt(sx, h.z) > 0.9) sx += 1; const q = sx - h.x - 6; // q: the quay's line, east of the centre
    pave('infra_tile_t1_plaza', h.x + q, h.z - 60, h.x + q, h.z + 60, 4); pave('infra_tile_t1_road', h.x - 60, h.z, h.x + q - 4, h.z, 2);
    for (const dz of [-44, 0, 44]) { put('country_jetty', sx + 2.5, h.z + dz, -Math.PI / 2, 1, 0.3 - 3.0); put('country_boat_fishing', sx + 6, h.z + dz - 4.2, 1.5, 1, -0.38); put('country_boat_fishing', sx + 9, h.z + dz + 4.4, 1.7, 1, -0.38); }
    put('country_boat_fishing', sx + 34, h.z - 22, 0.4, 1, -0.38); put('country_boat_fishing', sx + 52, h.z + 30, 2.6, 1, -0.38); put('landmark_trireme', sx + 46, h.z + 78, 0.2, 1, 0.1); put('civic_lighthouse', ...at(q - 2, -84));
    put('civic_stoa', ...at(q - 22, -26), Math.PI / 2); for (const [i, n] of ['biz_stall_t1_fish', 'biz_stall_t1_fish', 'biz_stall_t1_pottery', 'biz_stall_t1_fruit', 'biz_stall_t1_cloth'].entries()) put(n, ...at(q - 10, 12 + i * 7), -Math.PI / 2);
    put('decor_amphorae_t1_cluster', ...at(q - 5, -8), 0.4); put('decor_amphorae_t1_cluster', ...at(q - 4, 52), 2); put('decor_barrels_t1', ...at(q - 5, -40), 1); put('build_crates_t1', ...at(q - 6, 6), 0.3); put('build_crates_t1', ...at(q - 4, 40), 1.2); put('build_timber-stack_t1', ...at(q - 8, -54), 1.57); put('build_crane_t1', ...at(q - 1, -22), Math.PI / 2);
    for (const dz of [-60, -30, 0, 30, 60]) put('decor_lantern_t1_bronze', ...at(q + 3, dz + 15)); put('decor_brazier_t1', ...at(q + 2, -3)); put('decor_brazier_t1', ...at(q + 2, 3)); put('decor_shrine', ...at(q - 30, 6), Math.PI / 2); put('water_well', ...at(q - 36, -6));
    const kinds = [{ walls: 't1_stone', roof: 't1_terracotta', porch: 't2_doric' }, { walls: 't2_ochre', roof: 't1_terracotta' }, { walls: 't1_stone', upper: 't2_plaster', roof: 't1_terracotta' }, { walls: 't2_ochre', roof: 't3_azure', porch: 't2_doric' }];
    [[-34, -52], [-34, -34], [-36, 26], [-36, 44], [-36, 62], [-54, -58], [-56, -38], [-56, -18], [-56, 18], [-58, 40], [-58, 60], [-74, -30], [-76, 28]].forEach(([dx, dz], i) => villa(...at(q + dx + 6, dz), Math.PI / 2, kinds[i % kinds.length]));
    for (const [dx, dz] of [[-46, -8], [-46, 8], [-66, 0], [-20, -66], [-20, 74], [-84, -50], [-84, 50]]) put('nature_cypress_t1', ...at(q + dx, dz), 0, 1.5);
    spots.harbour = { x: h.x + q, z: h.z }; }
  { // the High Sanctuary on the plateau above the falls: the temple of Zeus facing the valley, an altar and fires before it, a ring of cypress
    const s = places.sanctuary, at = (dx, dz) => [s.x + dx, s.z + dz]; put('civic_temple-zeus_stage4', s.x - 6, s.z, Math.PI / 2); pave('infra_tile_t1_plaza', s.x + 12, s.z - 8, s.x + 12, s.z + 8, 9); put('decor_altar', ...at(20, 0), Math.PI / 2);
    for (const [dx, dz] of [[14, -10], [14, 10], [28, -10], [28, 10]]) put('decor_brazier_t1', ...at(dx, dz)); put('decor_shrine', ...at(22, -20), 0); put('decor_shrine', ...at(22, 20), Math.PI); put('decor_obelisk', ...at(34, 0)); put('decor_banner_t1_azure', ...at(10, -14)); put('decor_banner_t1_red', ...at(10, 14)); put('decor_bench_t1_marble', ...at(30, -16), 0); put('decor_bench_t1_marble', ...at(30, 16), Math.PI);
    for (let i = 0; i < 16; i++) { const a = 1.2 + i * (2 * Math.PI - 2.4) / 15; put('nature_cypress_t1', s.x + Math.cos(a) * 38, s.z + Math.sin(a) * 38, 0, 1.7); } spots.eagles.push([s.x, s.z, 90, 70]); }
  { // the olive grove: old trees in rows, an oil press, a cart, jars
    const g = places.grove; for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) { if (Math.abs(i) < 1 && Math.abs(j) < 1) continue; put('nature_tree_olive', g.x + i * 13 + (j % 2) * 4, g.z + j * 13 + ((i * 7 + j * 3) % 5) - 2, (i * 5 + j * 3) % 6, 0.85 + ((i * 3 + j * 7 + 20) % 5) * 0.06); }
    put('biz_olive-press_t1', g.x, g.z, 0.6); put('country_cart_hay', g.x + 9, g.z + 6, 2.2); put('decor_amphorae_t1_cluster', g.x - 6, g.z + 5, 1); put('decor_amphorae_t1_cluster', g.x - 7, g.z - 4, 2.5); put('country_hut_shepherd', g.x + 4, g.z - 58, 0.2); spots.farms.push({ x: g.x, z: g.z, ry: 0.6, k: 1, pen: [g.x + 20, g.z + 30], horse: [g.x + 12, g.z + 9] }); }
  { const r = places.ruins; put('country_ruin_temple', r.x, r.z, 0.5); put('nature_fern', r.x + 9, r.z + 4, 0, 1.4); put('nature_fern', r.x - 8, r.z - 6, 1, 1.3); put('nature_log_fallen', r.x - 4, r.z + 9, 0.8); }
  // travellers' camps beside the road: two logs and a fire
  for (const [x, z] of camps) { const g = heightAt(x, z); put('nature_log_fallen', x + 1.5, z + 0.4, 0.5, 0.42); put('nature_log_fallen', x - 1.3, z - 0.9, 2.3, 0.42); lamps.push({ x, y: g + 0.45, z, ground: g, kind: 'fire', size: 1.25 }); }
  await Promise.all(jobs);
  // ---------- the lists become batches
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), groups = []; let tris = 0;
  for (const c of cells.values()) { const flat = /^infra_tile/.test(c.n), mk = (list, mat, shadow) => list.map((q) => { const im = new THREE.InstancedMesh(q.geo, mat || q.mat, c.list.length); c.list.forEach(([x, y, z, ry, s], i) => im.setMatrixAt(i, M4.compose(V.set(x, y, z), Q.setFromAxisAngle(UP, ry), S.setScalar(s)))); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = shadow; im.receiveShadow = true; im.matrixAutoUpdate = false; root.add(im); return im; });
    const full = mk(c.m.full, null, !flat), far = c.m.far ? mk(c.m.far, farMat, false) : null, ball = new THREE.Sphere(); full.forEach((im, i) => (i ? ball.union(im.boundingSphere) : ball.copy(im.boundingSphere)));
    for (const q of c.m.full) tris += c.list.length * (q.geo.index ? q.geo.index.count : q.geo.attributes.position.count) / 3;
    if (far) for (const im of far) im.visible = false; groups.push({ n: c.n, list: c.list, full, far, ball, flat, near: true }); }
  // called every frame: which squares are drawn from the models themselves, which from the far-view versions, and which cast shadows
  function update(cam, focus) { for (const g of groups) { const d = Math.max(0, g.ball.center.distanceTo(cam) - g.ball.radius), near = !g.far || d < (g.near ? FAR * 1.08 : FAR); if (near !== g.near) { g.near = near; for (const im of g.full) im.visible = near; for (const im of g.far) im.visible = !near; }
      if (near && !g.flat) { const sh = Math.max(0, g.ball.center.distanceTo(focus) - g.ball.radius) < SHADOW; if (g.full[0].castShadow !== sh) for (const im of g.full) im.castShadow = sh; } } }
  // the batches of one model, for anything that wants to move them (worldlife.js rocks the boats): each has its list of [x, y, z, ry, s] and its instanced meshes
  const batchesOf = (n) => groups.filter((g) => g.n === n);
  return { root, lamps, spots, update, batchesOf, models: Object.keys(cache).length, placed, batches: groups.length, triangles: Math.round(tris) };
}
