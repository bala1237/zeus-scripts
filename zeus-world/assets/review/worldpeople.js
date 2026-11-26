// The people of the open world (ZW-051, phase 1): the newcomer whose journey the story follows, and everyone who lives along the way.
// They are the city's own three citizens (a man, a woman, an elder), each in the city's own colours. All are adults.
//   const people = await createPeople({ scene, heightAt, road });
//   people.update(seconds, dt, cameraPosition);     moves the walkers and plays the bodies that are near enough to be seen
//   people.subject({ x, z, yaw, walking })          puts the newcomer where the story's shot wants them; null hides them
// A person is drawn in full within about 55 m, as the city's far-view body out to 420 m, and not at all beyond. Bodies further than
// 160 m are not animated: nobody can tell, and it is most of the cost.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { standClip } from './stand.js';

const KINDS = ['char_citizen_man', 'char_citizen_woman', 'char_citizen_elder'], TINTS = [0xffffff, 0xffe2c4, 0xd6e6ff, 0xffd0d0, 0xdff3c8, 0xfff0a8, 0xe9d4ff, 0xc9f0ee], FAR = 55, SEEN = 420, ALIVE = 160;
export async function createPeople({ scene, heightAt, places, road, hero: q0 }) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const src = {};
  for (const k of KINDS) { const [hi, lo] = await Promise.all([loader.loadAsync(`./models/${k}.glb`), loader.loadAsync(`./models/far/${k}.glb`)]); src[k] = { hi, lo, stand: standClip(hi.scene) }; }
  let seed = 41; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const farMat = (m) => { const c = m.clone(); c.map = null; c.normalMap = null; c.roughnessMap = null; c.metalnessMap = null; c.metalness = 0; c.roughness = 0.9; c.vertexColors = true; c.side = THREE.DoubleSide; return c; };
  // one person: the full body, and the far-view body bound to the same bones so that one skeleton moves both
  function make(kind, tintHex) { const g = src[kind], o = SkeletonUtils.clone(g.hi.scene), tint = new THREE.Color(tintHex ?? TINTS[Math.floor(rnd() * TINTS.length)]); let hi = null;
    o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; m.material = m.material.clone(); m.material.color.multiply(tint); if (m.isSkinnedMesh) hi ||= m; } });
    const hold = new THREE.Group(); hold.add(o); hold.updateMatrixWorld(true); o.traverse((m) => { if (m.isSkinnedMesh) m.skeleton.update(); }); const b = new THREE.Box3().setFromObject(o, true); hold.scale.setScalar((1.66 + rnd() * 0.16) / (b.max.y - b.min.y));
    let lo = null, from = null; g.lo.scene.traverse((m) => { if (m.isSkinnedMesh) from ||= m; });
    if (hi && from) { const bones = from.skeleton.bones.map((x) => hi.skeleton.getBoneByName(x.name)); if (bones.every(Boolean)) { lo = new THREE.SkinnedMesh(from.geometry, farMat(hi.material)); lo.position.copy(from.position); lo.quaternion.copy(from.quaternion); lo.scale.copy(from.scale); lo.frustumCulled = false; lo.castShadow = false; lo.visible = false; hi.parent.add(lo); lo.bind(new THREE.Skeleton(bones, from.skeleton.boneInverses), from.bindMatrix); } }
    const w = new THREE.Group(); w.add(hold); scene.add(w); const mixer = new THREE.AnimationMixer(o), acts = {}; for (const c of g.hi.animations) acts[c.name] = mixer.clipAction(c); acts.Idle = mixer.clipAction(g.stand);
    const me = { w, mixer, acts, hi, lo, cur: null, far: false, x: 0, z: 0, yaw: 0, play(name, scale = 1) { const a = acts[name] || acts.Idle; a.timeScale = scale; if (this.cur === a) return; if (this.cur) this.cur.fadeOut(0.3); a.reset().fadeIn(0.3).play(); this.cur = a; } };
    mixer.setTime(rnd() * 3); me.play('Idle'); mixer.update(rnd() * 5); return me; }
  const place = (p, x, z, yaw) => { p.x = x; p.z = z; p.yaw = yaw; p.w.position.set(x, heightAt(x, z), z); p.w.rotation.y = yaw; };
  const all = [], kindOf = (i) => KINDS[i % KINDS.length];
  // someone standing: at a stall, by the well, on a porch. `at` is where they look.
  const stand = (x, z, at) => { const p = make(kindOf(all.length)); place(p, x, z, at ? Math.atan2(at[0] - x, at[1] - z) : rnd() * 6.28); p.kind = 'stand'; all.push(p); return p; };
  // someone walking to and fro along a line of points, pausing at each end
  const walk = (pts, speed = 1.15 + rnd() * 0.3) => { const p = make(kindOf(all.length)), len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); Object.assign(p, { kind: 'walk', pts, len, total: len.at(-1), speed, s: rnd() * len.at(-1), dir: rnd() < 0.5 ? 1 : -1, pause: 0 }); all.push(p); return p; };

  // ---------- Riverbend: sellers behind their stalls and buyers before them, people at the well and the shrine, others crossing the square
  { const v = places.village, at = (dx, dz) => [v.x + dx, v.z + dz];
    for (const [sx, sz] of [[15, -10], [-16, 11], [17, 11], [-16, -10]]) { const c = at(sx, sz), out = Math.hypot(sx, sz), ux = sx / out, uz = sz / out; stand(c[0] + ux * 1.6, c[1] + uz * 1.6, c); stand(c[0] - ux * 2.1, c[1] - uz * 2.1, c); if (rnd() < 0.6) stand(c[0] - ux * 2.4 + uz * 1.1, c[1] - uz * 2.4 - ux * 1.1, c); }
    stand(...at(1.8, 1.4), at(0, 0)); stand(...at(-1.9, -1.2), at(0, 0)); stand(...at(-19.5, 2), at(-22, 2)); stand(...at(-4.6, 5.6), at(6, -6)); stand(...at(5.4, 5.6), at(-6, -6)); stand(...at(0.8, -37.4), at(0, -40)); stand(...at(-1.4, -47.5), at(0, 0)); stand(...at(67, -14), at(70, -16)); stand(...at(69, 14), at(72, 16));
    walk([at(-62, 2), at(-30, 1), at(-8, 4), at(8, -4), at(40, -1), at(74, -3)]); walk([at(70, -4), at(30, 0), at(6, 5), at(-9, -4), at(-40, 1)]); walk([at(-1, -46), at(-2, -20), at(-6, -6), at(-6, 6), at(-28, 20)]); walk([at(8, 6), at(6, -6), at(2, -20), at(3, -44)]); walk([at(28, 19), at(12, 8), at(-12, 8), at(-27, 20)]); walk([at(-28, -22), at(-12, -9), at(12, -9), at(28, -21)]); }
  // ---------- the farmsteads: someone under the pergola, someone between the house and the cart
  for (const [x, z, ry] of [[-330, -70, 0.6], [-420, 90, 2.2], [-250, 120, -1.2], [-520, -40, 1.5], [-210, -190, 0.2], [-300, 250, 3.0], [-160, 200, -0.6], [-600, 160, 0.9]]) { const c = Math.cos(ry), s = Math.sin(ry); stand(x + c * 8, z - s * 8, [x, z]); walk([[x + s * 4, z + c * 4], [x - c * 6 + s * 4, z + s * 6 + c * 4], [x - c * 7 + s * 2, z + s * 7 + c * 2]], 1.0); }
  // ---------- travellers on the road, each keeping to a stretch of it; one resting on the hill, looking at the city
  { const R = road, n = R.length; for (const [a, b] of [[0.06, 0.2], [0.22, 0.36], [0.4, 0.52], [0.56, 0.7], [0.66, 0.8], [0.78, 0.9], [0.84, 0.97]]) { const pts = []; for (let i = Math.floor(a * n); i < Math.floor(b * n); i += 3) pts.push([R[i][0] + 1.2, R[i][2] + 0.8]); if (pts.length > 2) walk(pts); }
    stand(places.crest.x + 4.4, places.crest.z + 7, [places.city.x, places.city.z]); stand(places.crest.x + 6, places.crest.z - 8.4, [places.crest.x + 8, places.crest.z - 10]); }
  // ---------- the town outside the west gate and the square inside it
  { walk([[-70, 2], [-110, 3], [-160, 1], [-215, 3]]); walk([[-230, -2], [-170, -3], [-120, -1], [-74, -2]]); walk([[-150, 27], [-128, 6], [-128, -24]]); walk([[-60, 1], [-40, 0], [-12, 4], [0, 12], [0, 40]]); walk([[-12, 6], [12, 6], [16, -16], [0, -24], [-14, -10]]); walk([[30, -2], [10, 0], [-10, -2], [-34, 0]]);
    stand(-74.5, 9, [-76, 9]); stand(-78, 10.6, [-76, 9]); stand(-83.6, -9, [-82, -9]); stand(-80, -10.4, [-82, -9]); stand(-150, 27.6, [-150, 30]); stand(-57.4, 3.4, [-70, 0]); stand(-57.4, -3.4, [-70, 0]); stand(1.6, -19, [0, -44]); stand(-2, -17.6, [0, -44]); stand(3, 8, [0, 4]); }

  // ---------- the newcomer: one person, in travelling white, who stands or walks wherever the story's shot puts them
  const hero = make(q0 || 'char_citizen_man', 0xffffff); hero.w.visible = false; let heroOn = false;
  function subject(s) { heroOn = !!s; hero.w.visible = heroOn; if (!s) return; place(hero, s.x, s.z, s.yaw); hero.play(s.walking ? 'Walk' : 'Idle', s.walking ? (s.speed ?? 1.35) / 1.25 : 1); }

  const V = new THREE.Vector3();
  function update(t, dt, cam) { for (const p of all) { if (p.kind === 'walk') { if (p.pause > 0) { p.pause -= dt; if (p.pause <= 0) p.play('Walk', p.speed / 1.25); } else { p.s += p.dir * p.speed * dt; if (p.s >= p.total || p.s <= 0) { p.s = Math.min(p.total, Math.max(0, p.s)); p.dir *= -1; p.pause = 2 + rnd() * 5; p.play('Idle'); }
          let i = 1; while (i < p.len.length - 1 && p.len[i] < p.s) i++; const k = (p.s - p.len[i - 1]) / (p.len[i] - p.len[i - 1] || 1), a = p.pts[i - 1], b = p.pts[i], want = Math.atan2((b[0] - a[0]) * p.dir, (b[1] - a[1]) * p.dir); let dy = want - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.x = a[0] + (b[0] - a[0]) * k; p.z = a[1] + (b[1] - a[1]) * k; p.yaw += dy * Math.min(1, dt * 5); if (p.cur !== p.acts.Walk) p.play('Walk', p.speed / 1.25); } }
      const d = Math.hypot(p.x - cam.x, p.z - cam.z, (p.w.position.y || 0) - cam.y); p.w.visible = d < SEEN; if (!p.w.visible) continue; if (p.kind === 'walk') { p.w.position.set(p.x, heightAt(p.x, p.z), p.z); p.w.rotation.y = p.yaw; }
      const far = p.far ? d > FAR * 0.93 : d > FAR * 1.07; if (far !== p.far && p.lo) { p.far = far; p.hi.visible = !far; p.lo.visible = far; } if (d < ALIVE) p.mixer.update(dt); }
    if (heroOn) { const d = V.set(hero.x - cam.x, 0, hero.z - cam.z).length(), far = d > FAR; if (hero.lo && far !== hero.far) { hero.far = far; hero.hi.visible = !far; hero.lo.visible = far; } hero.mixer.update(dt); } }
  return { update, subject, count: all.length + 1, all, hero };
}
