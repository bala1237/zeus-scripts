// The animals of the open world (ZW-051, phase 6): flocks round the shepherds' huts, stock at the farms, horses at the gate,
// eagles over the hills. The models stand still (they have no bones); a flock is many of them turned every way, and each animal
// is drawn from its full model when the camera is near and from its far-view model otherwise. The eagles do move: they circle.
//   const animals = await createAnimals({ scene, heightAt, spots, tickers });   animals.update(cameraPosition)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const NEAR = 55, SEEN = 1100;
export async function createAnimals({ scene, heightAt, spots, tickers }) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const parts = async (url) => { const g = await loader.loadAsync(url); g.scene.updateMatrixWorld(true); const out = []; g.scene.traverse((o) => { if (o.isMesh) { const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); if (o.material.metalness !== undefined) { o.material.metalness = 0; o.material.roughness = Math.max(o.material.roughness, 0.85); } out.push({ geo, mat: o.material }); } }); return out; };
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const herd = { sheep: [], goat: [], horse: [], ox: [], dog: [] }, add = (k, x, z, ry = rnd() * 6.283, s = 0.92 + rnd() * 0.16) => herd[k].push({ x, y: heightAt(x, z), z, ry, s });
  const flock = (k, cx, cz, n, r0, r1) => { for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = r0 + (r1 - r0) * Math.sqrt(rnd()); add(k, cx + Math.cos(a) * r, cz + Math.sin(a) * r, rnd() < 0.6 ? a + 1.6 + rnd() : rnd() * 6.283); } };
  for (const h of spots.huts) { flock('sheep', h.x + 18, h.z + 14, 13, 4, 30); flock('goat', h.x - 16, h.z + 10, 4, 3, 14); add('dog', h.x + 4.5, h.z + 5, 0.6); }
  for (const f of spots.farms) { flock(f.k === 1 ? 'goat' : 'sheep', f.pen[0], f.pen[1], 5, 0.5, 3.6); if (f.ox) { add('ox', f.ox[0], f.ox[1], f.ry + 1.2, 1); add('ox', f.ox[0] + 2.2, f.ox[1] + 1.1, f.ry + 1.4, 1); } if (f.horse) add('horse', f.horse[0], f.horse[1], f.ry + 2.4, 1); if (f.k === 2) add('dog', f.x + Math.sin(f.ry) * 5, f.z + Math.cos(f.ry) * 5, f.ry); }
  for (const [x, z, ry] of spots.horses || []) add('horse', x, z, ry, 1);

  const kinds = []; for (const k of Object.keys(herd)) { const list = herd[k]; if (!list.length) continue; const [full, far] = await Promise.all([parts(`./models/animal_${k}.glb`), parts(`./models/far/animal_${k}.glb`)]);
    const mk = (ps, shadow) => ps.map((p) => { const im = new THREE.InstancedMesh(p.geo, p.mat, list.length); im.count = 0; im.castShadow = shadow; im.receiveShadow = shadow; im.frustumCulled = false; scene.add(im); return im; });
    kinds.push({ list, full: mk(full, true), far: mk(far, false) }); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0); let tick = 0;
  function update(cam, force) { if (!force && tick++ % 12) return; for (const k of kinds) { let a = 0, b = 0; for (const o of k.list) { const d = Math.hypot(o.x - cam.x, o.z - cam.z, o.y - cam.y); if (d > SEEN) continue; M.compose(P.set(o.x, o.y, o.z), Q.setFromAxisAngle(UP, o.ry), S.setScalar(o.s)); if (d < NEAR) { for (const im of k.full) im.setMatrixAt(a, M); a++; } else { for (const im of k.far) im.setMatrixAt(b, M); b++; } }
      for (const im of k.full) { im.count = a; im.instanceMatrix.needsUpdate = true; } for (const im of k.far) { im.count = b; im.instanceMatrix.needsUpdate = true; } } }

  // eagles: each glides a wide circle over its ground, banked into the turn, rising and sinking a little
  const eagle = await loader.loadAsync('./models/animal_eagle.glb'), eagles = (spots.eagles || []).map(([x, z, r, h], i) => { const o = eagle.scene.clone(true); o.traverse((c) => { if (c.isMesh) c.castShadow = true; }); scene.add(o); return { o, x, z, r, h: heightAt(x, z) + h, ph: i * 2.1, w: (i % 2 ? -1 : 1) * 11 / r }; });
  tickers.push((t) => { for (const e of eagles) { const a = e.ph + t * e.w; e.o.position.set(e.x + Math.cos(a) * e.r, e.h + 6 * Math.sin(t * 0.13 + e.ph), e.z + Math.sin(a) * e.r); e.o.rotation.set(0, -a + (e.w > 0 ? Math.PI : 0), 0, 'YXZ'); e.o.rotation.z = (e.w > 0 ? -1 : 1) * 0.3; } });
  return { update, count: Object.values(herd).reduce((n, l) => n + l.length, 0) + eagles.length, herd };
}
