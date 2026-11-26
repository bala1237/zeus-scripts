// Draws the land of the open world (ZW-049): the ground in tiles that are fine near the camera and coarse far away, the trees, the sea, the river and the falls.
//   const land = createLand({ scene, tickers });   land.update(cameraPosition);   land.settled() is true when everything wanted is drawn
// The ground is cut as a tree of squares: a square near the camera is split into four, and those again, down to 64 m. Each square is
// made by a worker (worldworker.js), so the picture never waits for it; until a square is ready, the coarser one it replaces stays up.
import * as THREE from 'three';
import { river, falls, heightAt } from './worldgen.js';

const ROOT = 4096, MIN = 64, REACH = 3, SPLIT = 1.45;
export function createLand({ scene, tickers, trees, workers = Math.max(2, Math.min(5, (navigator.hardwareConcurrency || 4) - 2)) }) {
  // ---------- the ground's surface: the colour comes with each point; a fine grain is laid over it so that it is not flat close up
  const grain = (() => { const S = 256, d = new Uint8Array(S * S * 4); let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; const v = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) v[i] = r(); // blur once so that it is grain and not static
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const a = (v[y * S + x] * 2 + v[y * S + (x + 1) % S] + v[((y + 1) % S) * S + x] + v[y * S + (x + S - 1) % S] + v[((y + S - 1) % S) * S + x]) / 6, k = (y * S + x) * 4, g = Math.round(255 * a); d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255; }
    const t = new THREE.DataTexture(d, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true; return t; })();
  // Real surfaces, scanned (Poly Haven, CC0): meadow grass, forest floor, bare earth, rock. The colour of every point still comes from
  // the land's own design (fields, roads, sand, snow); the scans supply what a flat colour cannot: blades, leaves, stones, cracks, and
  // the small shadows between them. Each is laid at two sizes so that its repeat does not show, blended by what the ground is made of there,
  // and faded out in the distance, where it would only shimmer. On steep ground the rock is laid from the side, not from above, or it smears.
  const TL = new THREE.TextureLoader(), held = {}, loading = [], surf = (n, kind) => held[`${n}_${kind}`];
  const SURF = [['leafy_grass', [0.59, 0.51, 0.35]], ['forrest_ground_01', [0.57, 0.53, 0.36]], ['brown_mud_dry', [0.45, 0.36, 0.24]], ['rock_face_03', [0.52, 0.41, 0.32]]];
  // the pictures are fetched before anything is drawn (`ready`), or the ground is black until they arrive
  for (const [n] of SURF) for (const kind of ['diff', 'nor']) loading.push(TL.loadAsync(`./ground/${n}_${kind}.jpg`).then((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (kind === 'diff') t.colorSpace = THREE.SRGBColorSpace; held[`${n}_${kind}`] = t; }));
  const ready = Promise.all(loading);
  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
  groundMat.onBeforeCompile = (sh) => { sh.uniforms.uGrain = { value: grain }; SURF.forEach(([n, avg], i) => { sh.uniforms[`uD${i}`] = { value: surf(n, 'diff') }; sh.uniforms[`uN${i}`] = { value: surf(n, 'nor') }; sh.uniforms[`uA${i}`] = { value: new THREE.Vector3(...avg.map((v) => v ** 2.2)) }; });
    sh.vertexShader = 'attribute vec3 mixw; varying vec2 vXZ; varying vec3 vMix; varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vXZ = position.xz; vMix = mixw; vWp = position; vWn = normal;');
    sh.fragmentShader = `varying vec2 vXZ; varying vec3 vMix; varying vec3 vWp; varying vec3 vWn; uniform sampler2D uGrain, uD0, uD1, uD2, uD3, uN0, uN1, uN2, uN3; uniform vec3 uA0, uA1, uA2, uA3;
      vec3 lay(sampler2D t, vec3 avg, float s1, float s2) { return mix(texture2D(t, vXZ / s1).rgb, texture2D(t, vXZ / s2 + 0.37).rgb, 0.4) / avg; }
      vec3 gSurf; vec3 gNor; float gNear;
      void surface() { float d = length(vWp - cameraPosition); gNear = 1.0 - smoothstep(180.0, 700.0, d); float wr = vMix.z, wd = vMix.y, wf = vMix.x, wg = max(0.0, 1.0 - wr - wd - wf);
        vec3 an = abs(normalize(vWn)); float side = smoothstep(0.5, 0.8, max(an.x, an.z));
        vec3 rk = mix(lay(uD3, uA3, 9.0, 41.0), mix(texture2D(uD3, vWp.zy / 11.0).rgb, texture2D(uD3, vWp.xy / 11.0).rgb, step(an.x, an.z)) / uA3, side);
        gSurf = wg * lay(uD0, uA0, 3.2, 17.0) + wf * lay(uD1, uA1, 3.6, 19.0) + wd * lay(uD2, uA2, 2.6, 13.0) + wr * rk; gSurf = mix(vec3(1.0), gSurf, gNear);
        vec3 nm = wg * texture2D(uN0, vXZ / 3.2).xyz + wf * texture2D(uN1, vXZ / 3.6).xyz + wd * texture2D(uN2, vXZ / 2.6).xyz + wr * texture2D(uN3, vXZ / 9.0).xyz; gNor = (nm * 2.0 - 1.0) * gNear; }
      ` + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n surface(); float g2 = texture2D( uGrain, vXZ / 53.0 + 0.37 ).r, g3 = texture2D( uGrain, vXZ / 410.0 + 0.11 ).r; diffuseColor.rgb *= gSurf * ( 0.74 + 0.26 * g2 + 0.26 * g3 );')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n { vec3 wn = normalize( normalize( vWn ) + vec3( gNor.x, 0.0, gNor.y ) * 0.55 ); normal = normalize( ( viewMatrix * vec4( wn, 0.0 ) ).xyz ); }'); };

  const tint = (g, c, top = c, y0 = 0, y1 = 1) => { const p = g.attributes.position, col = new Float32Array(p.count * 3), a = new THREE.Color(c), b = new THREE.Color(top), t = new THREE.Color(); for (let i = 0; i < p.count; i++) { t.copy(a).lerp(b, THREE.MathUtils.clamp((p.getY(i) - y0) / (y1 - y0), 0, 1)); col.set([t.r, t.g, t.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; };
  const join = (parts) => { const pos = [], col = [], nor = []; for (const g of parts) { const n = g.index ? g.toNonIndexed() : g; if (!g.userData.round) n.computeVertexNormals(); pos.push(...n.attributes.position.array); col.push(...n.attributes.color.array); nor.push(...n.attributes.normal.array); } const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return o; };
  const lump = (r, x, y, z, sy, seed, fine = 2) => { const g = new THREE.IcosahedronGeometry(r, fine), p = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < p.count; i++) { const ox = p.getX(i), oy = p.getY(i), oz = p.getZ(i), k = 1 + 0.2 * Math.sin(ox * 3.1 + seed) * Math.cos(oz * 2.7 + seed * 2) + 0.12 * Math.sin(oy * 5 + seed * 3) + 0.07 * Math.sin(ox * 9 + oz * 7 + seed), l = Math.hypot(ox, oy, oz) || 1; nn.setXYZ(i, ox / l * 0.8, oy / l * 0.8 + 0.35, oz / l * 0.8); p.setXYZ(i, ox * k + x, oy * k * sy + y, oz * k + z); } g.userData.round = true; return g; };
  const wind = { value: 0 }; tickers.push((t) => { wind.value = t; });

  // ---------- the squares
  const tiles = new Map(), queue = [], pool = [], busy = new Map(); let serial = 0, wanted = new Set(), last = null, made = 0;
  for (let i = 0; i < workers; i++) { const w = new Worker(new URL('./worldworker.js', import.meta.url), { type: 'module' }); w.onmessage = (e) => done(w, e.data); pool.push(w); }
  const keyOf = (s, x, z) => `${s}:${x}:${z}`, cellsFor = (s) => (s >= 1024 ? 64 : 32), treesFor = (s) => (s <= 128 ? 1 : s <= 512 ? 0.6 : s <= 1024 ? 0.2 : 0);
  const arrived = []; function done(w, d) { const key = busy.get(w); busy.delete(w); arrived.push([key, d]); pump(); }
  function integrate(ms = 3.5) { const t0 = performance.now(); let any = false; while (arrived.length && (performance.now() - t0 < ms || !any)) { const [key, d] = arrived.shift(); build(key, d); any = true; } if (any) show(); }
  function build(key, d) { const t = tiles.get(key); if (t && !t.ready) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(d.nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(d.col, 3)); g.setAttribute('mixw', new THREE.BufferAttribute(d.mix, 3)); g.setIndex(new THREE.BufferAttribute(d.idx, 1));
      const cy = (d.minY + d.maxY) / 2; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(t.x + t.s / 2, cy, t.z + t.s / 2), Math.hypot(t.s * 0.71, (d.maxY - d.minY) / 2 + 12));
      t.mesh = new THREE.Mesh(g, groundMat); t.mesh.receiveShadow = true; t.mesh.castShadow = false; t.mesh.matrixAutoUpdate = false; t.group = new THREE.Group(); t.group.add(t.mesh);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
      t.cy = cy; t.dy = (d.maxY - d.minY) / 2; trees.addTile(t, d);
      // grass and wild flowers: cards photographed from the catalogue's own tuft and flowers. Rocks: the catalogue's two scanned rocks.
      { const G = trees.ground, split = [[], []]; for (let i = 0; i < d.grass.length; i += 6) split[d.grass[i + 5] >= 2 ? 1 : 0].push(i);
        split.forEach((idx, f) => { if (!idx.length) return; const kit = f ? G.flowers : G.grass, im = new THREE.InstancedMesh(kit.geo, kit.mat, idx.length); idx.forEach((i, j) => { const sc = d.grass[i + 3] * (f ? 1.1 : 0.95), k = f ? 1 : d.grass[i + 5]; P.set(d.grass[i], d.grass[i + 1] - 0.04, d.grass[i + 2]); Q.setFromAxisAngle(Y, d.grass[i + 4]); S.set(sc, sc * (0.8 + 0.5 * ((j * 13) % 7) / 7), sc); im.setMatrixAt(j, M.compose(P, Q, S)); im.setColorAt(j, f ? C.setRGB(1, 1, 1) : C.setRGB(0.62 * k, 0.98 * k, 0.5 * k)); });
          im.receiveShadow = true; im.boundingSphere = g.boundingSphere.clone(); t.group.add(im); });
        if (t.s <= MIN && d.rocks.length) [0, 1].forEach((v) => { const idx = []; for (let i = 0; i < d.rocks.length; i += 6) if (((i / 6) % 3 === 0 ? 0 : 1) === v) idx.push(i); if (!idx.length) return;
          for (const p of G.rocks[v]) { const im = new THREE.InstancedMesh(p.geo, p.mat, idx.length); idx.forEach((i, j) => { const sc = d.rocks[i + 3] * (v ? 0.8 : 0.55); P.set(d.rocks[i], d.rocks[i + 1] - 0.1 * sc, d.rocks[i + 2]); Q.setFromAxisAngle(Y, d.rocks[i + 4]); S.setScalar(sc); im.setMatrixAt(j, M.compose(P, Q, S)); }); im.castShadow = im.receiveShadow = true; im.boundingSphere = g.boundingSphere.clone(); t.group.add(im); } }); }
      t.ready = true; made++; scene.add(t.group); } }
  function pump() { while (queue.length && pool.some((w) => !busy.has(w))) { const key = queue.shift(), t = tiles.get(key); if (!t || t.ready || t.sent) continue; const w = pool.find((x) => !busy.has(x)); busy.set(w, key); t.sent = true; w.postMessage({ id: ++serial, x: t.x, z: t.z, size: t.s, cells: cellsFor(t.s), trees: treesFor(t.s), grass: t.s <= MIN }); } }
  const overlap = (a, b) => a.x < b.x + b.s && b.x < a.x + a.s && a.z < b.z + b.s && b.z < a.z + a.s;
  // what is shown: every wanted square that is ready, and any older square still covering ground whose wanted square is not ready yet
  function show() { const waiting = []; for (const k of wanted) { const t = tiles.get(k); if (t && !t.ready) waiting.push(t); }
    for (const [k, t] of tiles) { if (!t.ready) continue; const keep = wanted.has(k) || waiting.some((w) => overlap(w, t)); if (!keep) { scene.remove(t.group); trees.removeTile(t); t.mesh.geometry.dispose(); tiles.delete(k); } } }
  // `also` is a second place to make ready: where the camera will be after the next cut, so that the land is there when it arrives
  let lastAlso = null; function update(cam, force = false, also = null) { integrate(force ? 1e9 : 3.5); const moved = !last || Math.hypot(cam.x - last.x, cam.z - last.z) >= 10 || Math.abs(cam.y - last.y) >= 30, alsoMoved = (also && (!lastAlso || Math.hypot(also.x - lastAlso.x, also.z - lastAlso.z) > 20)) || (!also && lastAlso); if (!force && !moved && !alsoMoved) return; last = cam.clone(); lastAlso = also ? { x: also.x, y: also.y, z: also.z } : null; const want = new Set(), order = [], eyes = also ? [cam, also] : [cam];
    // seen from high up, the ground beneath is far away, so the squares need not be so fine
    const lifts = eyes.map((c) => Math.max(0, c.y - heightAt(c.x, c.z) - 40));
    const visit = (s, x, z) => { let d = 1e9; eyes.forEach((c, i) => { d = Math.min(d, Math.hypot(Math.max(x - c.x, 0, c.x - x - s), Math.max(z - c.z, 0, c.z - z - s), lifts[i])); }); if (s > MIN && d < s * SPLIT) { const h = s / 2; visit(h, x, z); visit(h, x + h, z); visit(h, x, z + h); visit(h, x + h, z + h); } else { const k = keyOf(s, x, z); want.add(k); if (!tiles.has(k)) { tiles.set(k, { s, x, z, ready: false, sent: false }); order.push([d, k]); } } };
    const rx = Math.floor(cam.x / ROOT), rz = Math.floor(cam.z / ROOT); for (let j = -REACH; j <= REACH; j++) for (let i = -REACH; i <= REACH; i++) visit(ROOT, (rx + i) * ROOT, (rz + j) * ROOT);
    wanted = want; for (const [k, t] of tiles) if (!t.ready && !t.sent && !want.has(k)) tiles.delete(k);
    for (let i = queue.length - 1; i >= 0; i--) if (!tiles.has(queue[i])) queue.splice(i, 1);
    order.sort((a, b) => a[0] - b[0]); for (const [, k] of order) queue.push(k); queue.sort((a, b) => { const ta = tiles.get(a), tb = tiles.get(b); return Math.hypot(ta.x + ta.s / 2 - cam.x, ta.z + ta.s / 2 - cam.z) - ta.s * 0.3 - (Math.hypot(tb.x + tb.s / 2 - cam.x, tb.z + tb.s / 2 - cam.z) - tb.s * 0.3); });
    show(); pump(); }
  const settled = () => { integrate(1e9); for (const k of wanted) { const t = tiles.get(k); if (!t || !t.ready) return false; } return wanted.size > 0; };
  const stats = () => { let n = 0, tris = 0; for (const t of tiles.values()) if (t.ready) { n++; tris += t.mesh.geometry.index.count / 3; } return { squares: n, wanted: wanted.size, groundTriangles: tris, made, ...trees.stats() }; };

  // ---------- water. A ripple pattern, made once, is laid over itself at three sizes moving three ways, so that it never visibly repeats.
  const ripple = (() => { const S = 256, d = new Uint8Array(S * S * 4), W = [[1, 0.4, 1], [-0.6, 1, 0.7], [0.3, -1, 0.55], [2, 1.3, 0.3], [-1.7, 2.1, 0.25]], hgt = (x, y) => W.reduce((s, w) => s + w[2] * Math.cos(2 * Math.PI * (w[0] * x + w[1] * y) / S + w[0] * 1.7), 0);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1), l = Math.hypot(dx * 6, dy * 6, 1), k = (y * S + x) * 4; d[k] = 128 - 127 * dx * 6 / l; d[k + 1] = 128 - 127 * dy * 6 / l; d[k + 2] = 255 / l; d[k + 3] = 255; }
    const t = new THREE.DataTexture(d, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true; return t; })();
  function water(color, speed, rough, ns, flow = [1, 0.6]) { const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.35, normalMap: ripple, normalScale: new THREE.Vector2(ns, ns), envMapIntensity: 1.25, transparent: true, opacity: 0.93 });
    const u = { uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() }, uC: { value: new THREE.Vector2() } };
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u); sh.fragmentShader = 'uniform vec2 uA; uniform vec2 uB; uniform vec2 uC;\n' + sh.fragmentShader.replace('texture2D( normalMap, vNormalMapUv )',
      '( texture2D( normalMap, mat2( 0.92, 0.39, -0.39, 0.92 ) * vNormalMapUv + uC ) * 0.26 + texture2D( normalMap, mat2( 0.8, -0.6, 0.6, 0.8 ) * vNormalMapUv * 0.37 + uA ) * 0.34 + texture2D( normalMap, mat2( -0.28, 0.96, -0.96, -0.28 ) * vNormalMapUv * 0.113 + uB ) * 0.4 )'); };
    tickers.push((t) => { u.uC.value.set(t * speed * flow[0], t * speed * flow[1]); u.uA.value.set(-t * speed * 0.7, t * speed * 0.45); u.uB.value.set(t * speed * 0.3, -t * speed * 0.5); }); return m; }
  // the sea: one great sheet at sea level that moves with the camera in whole steps of its pattern, so the pattern stays where it is
  const SEA_STEP = 96, seaGeo = new THREE.PlaneGeometry(64000, 64000).rotateX(-Math.PI / 2); { const uv = seaGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 64000 / SEA_STEP * 2, uv.getY(i) * 64000 / SEA_STEP * 2); }
  const seaMat = water(0x1b6a96, 0.012, 0.2, 0.13); seaMat.normalMap = ripple.clone(); seaMat.normalMap.anisotropy = 1; seaMat.normalMap.needsUpdate = true; const sea = new THREE.Mesh(seaGeo, seaMat); sea.position.y = 0; sea.receiveShadow = true; sea.renderOrder = 1; scene.add(sea);
  tickers.push(() => { if (last) sea.position.set(Math.round(last.x / SEA_STEP) * SEA_STEP, 0, Math.round(last.z / SEA_STEP) * SEA_STEP); });
  // the river: a ribbon laid along its course at the water's level; where the level drops steeply it becomes white water and, at the cliff, the falls
  const R = river(), F = falls(), rp = [], ruv = [], ri = [], wp = [], wuv = [], wi = []; const steep = (i) => { const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)]; return (a[3] - b[3]) / Math.max(1, b[4] - a[4]); };
  for (let i = 0; i < R.length; i++) { const p = R[i], a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = p[2] + 2.5;
    rp.push(p[0] + nx * w, p[3], p[1] + nz * w, p[0] - nx * w, p[3], p[1] - nz * w); ruv.push(0, p[4] / 26, w * 2 / 26, p[4] / 26); if (i) { const k = (i - 1) * 2; ri.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const rivMat = water(0x2f86a8, 0.09, 0.16, 0.5, [0, -1]); rivMat.side = THREE.DoubleSide; const riv = new THREE.Mesh(rg, rivMat); riv.receiveShadow = true; riv.renderOrder = 1; scene.add(riv);
  // white water: a sheet of falling streaks over every steep stretch, strongest at the cliff
  const fallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: wind, uFog: { value: new THREE.Color(0xa9c8e6) }, uDen: { value: 0.00013 }, uDim: { value: 1 } },
    vertexShader: '#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec2 vUv; varying float vK; varying float vD; attribute float k; void main() { vUv = uv; vK = k; vec4 mv = modelViewMatrix * vec4( position, 1.0 ); vD = -mv.z; gl_Position = projectionMatrix * mv;\n#include <logdepthbuf_vertex>\n}',
    fragmentShader: `#include <logdepthbuf_pars_fragment>
varying vec2 vUv; varying float vK; varying float vD; uniform float uT; uniform vec3 uFog; uniform float uDen; uniform float uDim;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
#include <logdepthbuf_fragment>
 float s = n(vec2(vUv.x * 22.0, vUv.y * 3.0 - uT * 2.6)) * 0.6 + n(vec2(vUv.x * 61.0, vUv.y * 7.0 - uT * 4.1)) * 0.4; float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
        float a = clamp(vK * (0.55 + 0.9 * s) * edge, 0.0, 0.97); vec3 c = mix(vec3(0.72, 0.86, 0.93), vec3(1.0), s); float f = 1.0 - exp(-uDen * uDen * vD * vD); gl_FragColor = vec4(mix(c * uDim, uFog, f), a); }` });
  const wk = []; for (let i = 0; i < R.length; i++) { const p = R[i], a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = p[2] + 1.5, s = THREE.MathUtils.smoothstep(Math.max(steep(i), steep(Math.max(0, i - 1)), steep(Math.min(R.length - 1, i + 1))), 0.05, 0.5);
    const fx = dx / l * 1.6 * s, fz = dz / l * 1.6 * s; wp.push(p[0] + nx * w + fx, p[3] + 0.35, p[1] + nz * w + fz, p[0] - nx * w + fx, p[3] + 0.35, p[1] - nz * w + fz); wuv.push(0, p[4] / 9 + p[3] / 5, 1, p[4] / 9 + p[3] / 5); wk.push(s, s); if (i) { const k = (i - 1) * 2; wi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2)); wg.setAttribute('k', new THREE.Float32BufferAttribute(wk, 1)); wg.setIndex(wi);
  const white = new THREE.Mesh(wg, fallMat); white.renderOrder = 2; white.frustumCulled = false; scene.add(white);
  // mist at the foot of the falls: soft puffs that rise, spread and fade, one after another
  const puff = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const mist = []; for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0, color: 0xeaf4fa })); s.renderOrder = 3; scene.add(s); mist.push({ s, ph: i / 22, a: i * 2.399, r: 6 + (i * 37 % 17) }); }
  tickers.push((t) => { for (const m of mist) { const u = (t * 0.11 + m.ph) % 1; m.s.position.set(F.x + Math.cos(m.a) * m.r * (0.4 + u), F.foot + 2 + u * 34, F.z + Math.sin(m.a) * m.r * (0.4 + u)); const sc = 14 + 46 * u; m.s.scale.set(sc, sc, 1); m.s.material.opacity = 0.5 * Math.sin(Math.PI * u) ** 1.2; } });
  return { update, settled, stats, integrate, ready, groundMat, fallMat, sea, river: riv, tiles };
}
