// Soldiers for the battle: a real human figure (the man citizen with his arms properly bound, models/char_soldier.glb)
// carrying a helmet, a round shield and a spear, with a fighting stance and a spear thrust made in code.
//   const kit = await soldierKit({ get, url, farUrl, farMaterial });   const s = kit.make('us' | 'them');
//   s.g is the figure to place; s.play('March' | 'Guard' | 'Thrust'); s.update(dt, camera) each frame.
// Gear is fitted in the guard stance: each piece is placed where it should be in the world, then handed to the bone that carries it.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ours: white tunics, bronze helmets, blue shields rimmed in gold. Theirs: darker tunics, iron helmets, crimson shields rimmed in black.
// The tint multiplies the whole body, skin included, and the scene is lit brightly, so it has to be strong to read at all and cannot go much darker.
const TEAM = { us: { tint: 0xffffff, shield: 0x2f6fb0, crest: 0x2f6fb0, rim: 0xe2a92e, helm: 0xc9973a, trim: 0x8f6a2a }, them: { tint: 0x6e4a54, shield: 0x9a1d22, crest: 0xb3262b, rim: 0x2a2226, helm: 0x55555e, trim: 0x2c2c33 } };
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

// poses are written as turns seen from outside the figure (which faces +Z), per bone, and converted to each bone's own frame
function clips(model) {
  model.updateMatrixWorld(true); const bones = []; model.traverse((o) => { if (o.isBone) bones.push(o); });
  const by = (n) => bones.find((b) => b.name === n), q = new THREE.Quaternion(), r = new THREE.Quaternion(), pw = new THREE.Quaternion(), bw = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const turned = (bone, turns) => { bone.parent.getWorldQuaternion(pw); bone.getWorldQuaternion(bw); q.identity(); for (const [axis, angle] of turns) q.premultiply(r.setFromAxisAngle(axis, angle)); return pw.clone().invert().multiply(q).multiply(bw); };
  const out = {}; for (const s of ['Left', 'Right']) { const up = by(`${s}Arm`), end = by(`${s}Hand`); up.getWorldPosition(a); end.getWorldPosition(b); out[s] = Math.atan2(b.x - a.x, a.y - b.y); }
  const inL = -(out.Left - 0.12), inR = -(out.Right + 0.12);
  // k runs 0 (guard) to 1 (full thrust); w is a slow wave for breathing and weight
  const pose = (k, w) => ({
    Hips: [[X, 0.07 + 0.16 * k]],
    LeftUpLeg: [[X, -0.34 - 0.22 * k]], LeftLeg: [[X, 0.3 + 0.2 * k]], RightUpLeg: [[X, 0.2 + 0.14 * k]], RightLeg: [[X, 0.16]],
    LeftArm: [[Z, inL], [X, -0.85 + 0.04 * w]], LeftForeArm: [[X, -0.95]],
    RightArm: [[Z, inR], [X, 0.42 - 1.35 * k + 0.03 * w]], RightForeArm: [[X, -1.25 + 0.95 * k]],
    Head: [[X, -0.06 - 0.1 * k]],
  });
  const make = (name, seconds, steps, fn) => { const times = Array.from({ length: steps + 1 }, (_, i) => i * seconds / steps), tracks = [];
    for (const bone of bones) { const v = []; for (const t of times) { const [k, w] = fn(t / seconds), p = pose(k, w)[bone.name], x = p ? turned(bone, p) : bone.quaternion; v.push(x.x, x.y, x.z, x.w); } tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, v)); }
    const hips = by('Hips'); tracks.push(new THREE.VectorKeyframeTrack('Hips.position', [0, seconds], [...hips.position.toArray(), ...hips.position.toArray()]));
    return new THREE.AnimationClip(name, seconds, tracks); };
  const jab = (u) => { const x = u < 0.42 ? 0 : u < 0.56 ? (u - 0.42) / 0.14 : u < 0.8 ? 1 - (u - 0.56) / 0.24 : 0; return x * x * (3 - 2 * x); };
  return { Guard: make('Guard', 3, 12, (u) => [0, Math.sin(u * Math.PI * 2)]), Thrust: make('Thrust', 1.7, 34, (u) => [jab(u), Math.sin(u * Math.PI * 2)]) };
}

export async function soldierKit({ get, url, farUrl, farMaterial = (m) => m, height = 1.78 }) {
  const g = await get(url), fg = farUrl ? await get(farUrl) : null, made = clips(g.scene), walk = g.animations.find((c) => c.name === 'Walk');
  let farSrc = null; fg?.scene.traverse((m) => { if (m.isSkinnedMesh) farSrc ||= m; });
  const gearMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.42, side: THREE.DoubleSide });
  const templates = {};
  for (const [team, c] of Object.entries(TEAM)) {
    const o = SkeletonUtils.clone(g.scene); o.updateMatrixWorld(true); const bone = {}; o.traverse((b) => { if (b.isBone) bone[b.name] = b; });
    // into the guard stance, so the gear is fitted to the pose it is mostly seen in
    const mx = new THREE.AnimationMixer(o); mx.clipAction(made.Guard).play(); mx.setTime(0.001); o.updateMatrixWorld(true);
    let skinned = null; o.traverse((m) => { if (m.isSkinnedMesh) { skinned ||= m; m.skeleton.update(); } });
    const h = new THREE.Box3().setFromObject(o, true).getSize(new THREE.Vector3()).y, P = (n) => bone[n].getWorldPosition(new THREE.Vector3());
    const tint = new THREE.Color(c.tint), body = skinned.material.clone(); body.color.multiply(tint); skinned.material = body;
    const fit = (obj, to, world) => { const m = new THREE.Matrix4().copy(to.matrixWorld).invert().multiply(world); obj.matrixAutoUpdate = false; obj.matrix.copy(m); to.add(obj); };
    const at = (pos, quat = new THREE.Quaternion()) => new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
    // Each piece of gear is one mesh, coloured per vertex, so a soldier costs three draw calls for his gear instead of eight.
    const part = (geo, color, m = null) => { if (m) geo.applyMatrix4(m); const g = geo.toNonIndexed(), n = g.attributes.position.count, col = new Float32Array(n * 3), k = new THREE.Color(color); for (let i = 0; i < n; i++) col.set([k.r, k.g, k.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g; };
    const piece = (parts) => new THREE.Mesh(mergeGeometries(parts), gearMat), T4 = (x, y, z, rx = 0, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)), new THREE.Vector3(1, 1, 1));
    // helmet: a cap with a brow band and a crest in the side's colour
    fit(piece([part(new THREE.SphereGeometry(0.078 * h, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), c.helm), part(new THREE.TorusGeometry(0.077 * h, 0.008 * h, 6, 18), c.trim, T4(0, -0.012 * h, 0, Math.PI / 2)),
      part(new THREE.CircleGeometry(0.108 * h, 18, 0, Math.PI), c.crest, T4(0, -0.004 * h, 0, 0, Math.PI / 2))]), bone.Head, at(P('Head').add(new THREE.Vector3(0, 0.058 * h, 0.012 * h))));
    // shield: a round shield on the left forearm, facing forward
    fit(piece([part(new THREE.CylinderGeometry(0.2 * h, 0.2 * h, 0.022 * h, 22), c.shield, T4(0, 0, 0, Math.PI / 2)), part(new THREE.TorusGeometry(0.2 * h, 0.012 * h, 6, 26), c.rim),
      part(new THREE.SphereGeometry(0.05 * h, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), c.rim, T4(0, 0, 0.008 * h, Math.PI / 2))]), bone.LeftForeArm, at(P('LeftForeArm').lerp(P('LeftHand'), 0.6).add(new THREE.Vector3(-0.02 * h, 0.0, 0.07 * h))));
    // spear: through the right hand, pointing forward and slightly up
    { const len = 1.3 * h, dir = new THREE.Vector3(0, 0.14, 1).normalize(), quat = new THREE.Quaternion().setFromUnitVectors(Y, dir);
      fit(piece([part(new THREE.CylinderGeometry(0.011 * h, 0.011 * h, len, 6), 0x5d4630), part(new THREE.ConeGeometry(0.024 * h, 0.13 * h, 6), 0xd0d0d8, T4(0, len / 2 + 0.06 * h, 0))]), bone.RightHand, at(P('RightHand').addScaledVector(dir, 0.18 * len), quat)); }
    mx.stopAllAction(); mx.uncacheRoot(o);
    templates[team] = { o, h, body, farBody: farSrc ? farMaterial(body) : null };
  }
  const blobGeo = new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2), blobMat = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.3, depthWrite: false });
  const ball = new THREE.Sphere(new THREE.Vector3(), 1.9);
  function make(team) { const t = templates[team], o = SkeletonUtils.clone(t.o), holder = new THREE.Group(); holder.add(o); holder.scale.setScalar(height / t.h);
    let hi = null; o.traverse((m) => { if (m.isSkinnedMesh) { hi ||= m; m.frustumCulled = false; m.castShadow = false; } else if (m.isMesh) m.castShadow = false; });
    let lo = null; if (farSrc) { const bones = farSrc.skeleton.bones.map((b) => hi.skeleton.getBoneByName(b.name)); if (bones.every(Boolean)) { lo = new THREE.SkinnedMesh(farSrc.geometry, t.farBody); lo.position.copy(farSrc.position); lo.quaternion.copy(farSrc.quaternion); lo.scale.copy(farSrc.scale); lo.frustumCulled = false; lo.castShadow = false; lo.visible = false; hi.parent.add(lo); lo.bind(new THREE.Skeleton(bones, farSrc.skeleton.boneInverses), farSrc.bindMatrix); } }
    const gr = new THREE.Group(); gr.add(holder); const blob = new THREE.Mesh(blobGeo, blobMat); blob.position.y = 0.035; gr.add(blob); gr.userData.dynamic = true;
    const mixer = new THREE.AnimationMixer(o), acts = { March: mixer.clipAction(walk), Guard: mixer.clipAction(made.Guard), Thrust: mixer.clipAction(made.Thrust) }, me = { g: gr, mixer, acts, cur: null, far: false, seen: true,
      play(name, scale = 1, at = null) { const a = acts[name]; a.timeScale = scale; if (me.cur === a) return; if (me.cur) me.cur.fadeOut(0.35); a.reset().fadeIn(0.35).play(); if (at !== null) a.time = at * a.getClip().duration; me.cur = a; },
      // pose only those in view, and swap to the light body beyond a distance
      update(dt, camera, frustum, farAt = 24) { if (!gr.visible) return; ball.center.copy(gr.position); ball.center.y += 0.9; me.seen = frustum.intersectsSphere(ball); holder.visible = me.seen; if (!me.seen) return; mixer.update(dt);
        if (lo) { const d = camera.position.distanceTo(gr.position), far = me.far ? d > farAt * 0.93 : d > farAt * 1.07; if (far !== me.far) { me.far = far; lo.visible = far; hi.visible = !far; } } } };
    return me; }
  return { make, clips: made, templates };
}
