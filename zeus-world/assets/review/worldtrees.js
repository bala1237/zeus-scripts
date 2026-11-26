// The forest of the open world, made of the city's own trees (ZW-049). The owner's rule: nothing in the world may look more elementary
// than the city. So every tree here is one of the catalogue's four (the oak at three ages, and the cypress), shown four ways by distance:
//   closest (about 40 of them, within 40 m)    the catalogue model itself, textured, exactly as in the city
//   close (about 260, within 95 m)             the city's far-view model (models/far/)
//   the rest of the finest squares             a lighter model still (models/mid/, made with lod.mjs)
//   everything further                         a picture of the tree on three crossed cards, photographed from the model when the page loads
// The first two are chosen afresh as the camera moves: the trees nearest the camera are lifted out of the light version and drawn in full.
//   const trees = await createTrees({ renderer, scene, tickers });   trees.addTile(tile, data);   trees.removeTile(tile);   trees.update(cameraPosition)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// The forest kit (26 Nov 2026): six trees made for the open world the way the city's models were made. Each is at its real size.
// share: its part of the broad-leaved trees, out of 100. sink: how far its earth mound is set into the ground, as a part of its height.
// tint: a correction to its colour (the fir came out too blue, the plane too lime).
const SPECIES = [{ n: 'nature_tree_holm-oak', share: 54, sink: 0.055 }, { n: 'nature_tree_laurel', share: 24, sink: 0.05 }, { n: 'nature_tree_plane', share: 16, sink: 0.05, tint: [0.8, 0.86, 0.72] }, { n: 'nature_tree_olive', share: 6, sink: 0.06 },
  { n: 'nature_tree_stone-pine', sink: 0.05 }, { n: 'nature_tree_fir', sink: 0.06, tint: [0.72, 0.98, 0.74] }];
// undergrowth, on the ground nearest the camera: which version of the model is drawn (full, far or mid), and how deep its mound is set
const UNDER = [{ n: 'nature_fern', kit: 'mid', sink: 0.1 }, { n: 'nature_shrub_broom', kit: 'far', sink: 0.08 }, { n: 'nature_log_fallen', kit: 'full', sink: 0.12 }];
const RINGS = [{ kit: 'full', max: 28, r: 36 }, { kit: 'far', max: 220, r: 95 }];

export async function createTrees({ renderer, scene, tickers }) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const wind = { value: 0 }; tickers.push((t) => { wind.value = t; });
  // the trees lean a little in the wind: more at the top, each one out of step with its neighbours
  const sway = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uWind = wind; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n #ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23; float bend = position.y * position.y * 0.0014; transformed.x += bend * ( sin( uWind * 1.1 + ph ) + 0.4 * sin( uWind * 2.7 + ph * 1.7 ) ); transformed.z += bend * 0.7 * sin( uWind * 0.9 + ph * 1.3 );\n #endif'); }; m.customProgramCacheKey = () => 'sway'; return m; };
  const plain = sway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }));
  // a model as a list of pieces, each with its place in the model already worked into its shape, so that a piece can be drawn many times at once
  const parts = async (url, own) => { const g = await loader.loadAsync(url); g.scene.updateMatrixWorld(true); const out = []; g.scene.traverse((o) => { if (!o.isMesh) return; const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); let mat = plain; if (own) { mat = sway(o.material.clone()); mat.metalness = 0; mat.metalnessMap = null; mat.roughness = 0.9; mat.roughnessMap = null; mat.side = THREE.DoubleSide; } out.push({ geo, mat }); }); return out; };
  for (const u of UNDER) u.parts = await parts(u.kit === 'full' ? `./models/${u.n}.glb` : `./models/${u.kit}/${u.n}.glb`, u.kit === 'full');
  for (const s of SPECIES) { s.scale = 1; s.tint ||= [1, 1, 1]; [s.full, s.far, s.mid] = await Promise.all([parts(`./models/${s.n}.glb`, true), parts(`./models/far/${s.n}.glb`), parts(`./models/mid/${s.n}.glb`)]);
    const box = new THREE.Box3(); for (const p of s.far) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); } s.h = box.max.y; s.w = 2 * Math.max(box.max.x, -box.min.x, box.max.z, -box.min.z); s.card = card(s); }

  // ---------- the picture of a tree: its side and its top, photographed from the far-view model in flat light, on one sheet
  function card(s, list = s.far) { const W = 768, H = 512, rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter }), sc = new THREE.Scene(), flat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    for (const p of list) sc.add(new THREE.Mesh(p.geo, p.mat.map ? new THREE.MeshBasicMaterial({ map: p.mat.map, side: THREE.DoubleSide, alphaTest: 0.3 }) : flat)); const cam = new THREE.OrthographicCamera(-s.w / 2, s.w / 2, s.h, 0, 0.1, 200), was = renderer.getRenderTarget(), col = new THREE.Color(); renderer.getClearColor(col); const al = renderer.getClearAlpha(), auto = renderer.autoClear;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x2c4a22, 0); renderer.autoClear = false; renderer.clear(); renderer.setScissorTest(true);
    cam.position.set(0, 0, 60); cam.lookAt(0, 0, 0); cam.position.y = 0; cam.rotation.set(0, 0, 0); cam.updateProjectionMatrix(); rt.viewport.set(0, 0, 512, 512); rt.scissor.set(0, 0, 512, 512); renderer.setRenderTarget(rt); renderer.render(sc, cam);
    const top = new THREE.OrthographicCamera(-s.w / 2, s.w / 2, s.w / 2, -s.w / 2, 0.1, 200); top.position.set(0, 80, 0); top.up.set(0, 0, -1); top.lookAt(0, 0, 0); rt.viewport.set(512, 0, 256, 256); rt.scissor.set(512, 0, 256, 256); renderer.setRenderTarget(rt); renderer.render(sc, top);
    renderer.setScissorTest(false); rt.viewport.set(0, 0, W, H); rt.scissor.set(0, 0, W, H); renderer.setRenderTarget(was); renderer.setClearColor(col, al); renderer.autoClear = auto; flat.dispose();
    // three cards: two upright and crossed, one lying flat part way up for when the forest is seen from above. All lit as if facing the sky.
    const w = s.w / 2, h = s.h, u = 512 / W, pos = [], uv = [], idx = [], quad = (a, b, c, d, uvs) => { const k = pos.length / 3; pos.push(...a, ...b, ...c, ...d); uv.push(...uvs); idx.push(k, k + 1, k + 2, k, k + 2, k + 3, k + 2, k + 1, k, k + 3, k + 2, k); };
    quad([-w, 0, 0], [w, 0, 0], [w, h, 0], [-w, h, 0], [0, 0, u, 0, u, 1, 0, 1]); quad([0, 0, w], [0, 0, -w], [0, h, -w], [0, h, w], [0, 0, u, 0, u, 1, 0, 1]); quad([-w, h * 0.58, w], [w, h * 0.58, w], [w, h * 0.58, -w], [-w, h * 0.58, -w], [u, 0, 1, 0, 1, 0.5, u, 0.5]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); const nn = new Float32Array(pos.length); for (let i = 1; i < nn.length; i += 3) nn[i] = 1; geo.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); geo.setIndex(idx);
    return { geo, mat: new THREE.MeshStandardMaterial({ map: rt.texture, alphaTest: 0.42, roughness: 1, metalness: 0 }), rt }; }

  // ---------- the ground's own plants and stones, from the catalogue: grass and wild flowers as cards photographed from the city's models,
  // and the two scanned rocks as they are
  const ground = {}; for (const [k, n] of [['grass', 'nature_grass_t1_tuft'], ['flowers', 'nature_flowers_t1_wild']]) { const list = await parts(`./models/${n}.glb`, true), box = new THREE.Box3(); for (const p of list) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); } const o = { h: box.max.y, w: 2 * Math.max(box.max.x, -box.min.x, box.max.z, -box.min.z) }; ground[k] = card(o, list); }
  ground.rocks = [await parts('./models/nature_rock_t1_boulder.glb', true), await parts('./models/nature_rock_t1_small.glb', true)];

  // ---------- the pools for the nearest trees: one drawing per piece of each kind of tree, filled afresh as the camera moves
  const pools = RINGS.map((ring) => SPECIES.map((s) => s[ring.kit].map((p) => { const im = new THREE.InstancedMesh(p.geo, p.mat, ring.max); im.count = 0; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; })));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), C = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const pick = (x, z) => ((Math.imul(Math.round(x * 7), 2654435761) ^ Math.imul(Math.round(z * 7), 40503)) >>> 0) % 100;
  // broad-leaved: by share. Tall dark trees: the stone pine on low ground, the fir in the high country, mixed where they meet.
  const which = (i, x, z) => { let k = pick(x, z); for (let j = 0; j < 4; j++) { if (k < SPECIES[j].share) return j; k -= SPECIES[j].share; } return 0; }, dark = (x, y, z) => (y + 0.6 * pick(z, x) > 150 ? 5 : 4);
  const near = new Set(); let count = 0, tris = 0;
  // put a square's trees on it. d.treeA are broad-leaved (oaks of three ages), d.treeB the tall dark ones (cypress): [x, y, z, size, turn, shade] each
  function addTile(t, d) { const fine = t.s <= 64, lists = SPECIES.map(() => []); for (let i = 0; i < d.treeA.length; i += 6) lists[which(i / 6, d.treeA[i], d.treeA[i + 2])].push(d.treeA, i); for (let i = 0; i < d.treeB.length; i += 6) lists[dark(d.treeB[i], d.treeB[i + 1], d.treeB[i + 2])].push(d.treeB, i);
    t.treeIMs = []; if (fine) t.treeList = []; let n = 0;
    SPECIES.forEach((s, k) => { const L = lists[k], m = L.length / 2; if (!m) return; const kit = [s.card], ims = kit.map((p) => { const im = new THREE.InstancedMesh(p.geo, p.mat, m); im.castShadow = fine; im.receiveShadow = false; im.frustumCulled = true; return im; });
      for (let j = 0; j < m; j++) { const a = L[j * 2], i = L[j * 2 + 1], sc = a[i + 3] * s.scale, sh = a[i + 5]; P.set(a[i], a[i + 1] - s.sink * s.h * sc, a[i + 2]); Q.setFromAxisAngle(Y, a[i + 4]); S.set(sc, sc * (0.92 + 0.2 * ((j * 7919) % 13) / 13), sc); M.compose(P, Q, S); C.setRGB(sh * s.tint[0], sh * (0.97 + 0.06 * ((j * 31) % 7) / 7) * s.tint[1], sh * 0.94 * s.tint[2]);
        for (const im of ims) { im.setMatrixAt(j, M); im.setColorAt(j, C); } if (fine) t.treeList.push({ k, j, ims, m: M.clone(), c: C.clone(), x: a[i], z: a[i + 2], y: a[i + 1], lift: -1 }); }
      const r = Math.hypot(t.s * 0.71, 40); for (const im of ims) { im.boundingSphere = new THREE.Sphere(new THREE.Vector3(t.x + t.s / 2, t.cy ?? 0, t.z + t.s / 2), r + (t.dy ?? 60)); t.group.add(im); t.treeIMs.push(im); tris += m * (im.geometry.index ? im.geometry.index.count : im.geometry.attributes.position.count) / 3; } n += m; });
    if (fine && d.under) UNDER.forEach((u, k) => { const idx = []; for (let i = 0; i < d.under.length; i += 6) if (d.under[i + 5] === k) idx.push(i); if (!idx.length) return;
      for (const p of u.parts) { const im = new THREE.InstancedMesh(p.geo, p.mat, idx.length); idx.forEach((i, j) => { const sc = d.under[i + 3]; p.geo.boundingBox || p.geo.computeBoundingBox(); P.set(d.under[i], d.under[i + 1] - u.sink * p.geo.boundingBox.max.y * sc, d.under[i + 2]); Q.setFromAxisAngle(Y, d.under[i + 4]); S.setScalar(sc); im.setMatrixAt(j, M.compose(P, Q, S)); });
        im.castShadow = k === 2; im.receiveShadow = true; im.boundingSphere = new THREE.Sphere(new THREE.Vector3(t.x + t.s / 2, t.cy ?? 0, t.z + t.s / 2), Math.hypot(t.s * 0.71, 6) + (t.dy ?? 60)); t.group.add(im); t.treeIMs.push(im); tris += idx.length * (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3; } });
    t.trees = n; count += n; if (fine) { near.add(t); dirty = true; } }
  function removeTile(t) { if (!t.treeIMs) return; for (const im of t.treeIMs) { tris -= im.count * (im.geometry.index ? im.geometry.index.count : im.geometry.attributes.position.count) / 3; im.dispose(); } count -= t.trees || 0; near.delete(t); t.treeList = null; dirty = true; }
  // choose the nearest trees and draw them in full; put back the ones the camera has left behind
  let last = null, dirty = false; const cand = [];
  function update(cam) { if (!dirty && last && Math.hypot(cam.x - last.x, cam.z - last.z, cam.y - last.y) < 2.5) return; last = cam.clone(); dirty = false; cand.length = 0; const R = RINGS.at(-1).r;
    for (const t of near) { if (!t.treeList) continue; if (Math.hypot(Math.max(t.x - cam.x, 0, cam.x - t.x - t.s), Math.max(t.z - cam.z, 0, cam.z - t.z - t.s)) > R) { for (const e of t.treeList) if (e.lift >= 0) { e.lift = -1; for (const im of e.ims) { im.setMatrixAt(e.j, e.m); im.instanceMatrix.needsUpdate = true; } } continue; }
      for (const e of t.treeList) { e.d = Math.hypot(e.x - cam.x, e.z - cam.z, e.y + 6 - cam.y); cand.push(e); } }
    cand.sort((a, b) => a.d - b.d); const fill = RINGS.map(() => SPECIES.map(() => 0)), used = RINGS.map(() => 0);
    for (const e of cand) { let ring = -1; for (let r = 0; r < RINGS.length; r++) if (e.d <= RINGS[r].r && used[r] < RINGS[r].max) { ring = r; break; }
      if (ring !== e.lift) { for (const im of e.ims) { im.setMatrixAt(e.j, ring >= 0 ? ZERO : e.m); im.instanceMatrix.needsUpdate = true; } e.lift = ring; }
      if (ring >= 0) { const at = fill[ring][e.k]++; used[ring]++; for (const im of pools[ring][e.k]) { im.setMatrixAt(at, e.m); im.setColorAt(at, e.c); } } }
    pools.forEach((ring, r) => ring.forEach((ims, k) => { for (const im of ims) { im.count = fill[r][k]; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } })); stat.full = used[0]; stat.far = used[1]; }
  const stat = { full: 0, far: 0 };
  return { addTile, removeTile, update, stats: () => ({ trees: count, treeTriangles: Math.round(tris), inFull: stat.full, inFar: stat.far }), SPECIES, ground };
}
