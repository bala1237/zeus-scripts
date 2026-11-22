// A standing pose with a little life in it, made in code from a character's rest pose.
// The clip called "Idle" that the rigging service supplies is a wide stride that turns round, which looks wrong
// on someone who has stopped at a stall. This one stands with feet together and arms hanging, breathes, shifts the arms
// a touch and looks slowly from side to side. It works for any of the citizen skeletons: it only needs bones named
// LeftArm, RightArm and Head, and uses "neck" for the breathing lean if there is one.
import * as THREE from 'three';

const cache = new Map();
// model: the loaded scene the clones are made from. Returns one clip per model, shared by all its clones (tracks go by bone name).
export function standClip(model, { seconds = 7, steps = 28, arm = 0.2 } = {}) {
  if (cache.has(model)) return cache.get(model);
  model.updateMatrixWorld(true);
  const bones = []; model.traverse((o) => { if (o.isBone) bones.push(o); });
  const by = (n) => bones.find((b) => b.name === n), times = Array.from({ length: steps + 1 }, (_, i) => i * seconds / steps);
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), q = new THREE.Quaternion(), r = new THREE.Quaternion(), pw = new THREE.Quaternion(), bw = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3();
  // the bone's own rotation that results from turning it, as seen from outside, by the given turns (applied in order)
  const turned = (bone, turns) => { bone.parent.getWorldQuaternion(pw); bone.getWorldQuaternion(bw); q.identity(); for (const [axis, angle] of turns) q.premultiply(r.setFromAxisAngle(axis, angle)); return pw.clone().invert().multiply(q).multiply(bw); };
  // how far each upper arm must swing in for the hand to hang at `arm` radians from straight down. Measured to the hand, because some rest poses bend at the elbow. (the rest pose has the arms held out)
  const drop = {}; for (const s of ['Left', 'Right']) { const up = by(`${s}Arm`), end = by(`${s}Hand`) || by(`${s}ForeArm`); if (!up || !end) continue; up.getWorldPosition(a); end.getWorldPosition(b); const out = Math.atan2(b.x - a.x, a.y - b.y); drop[up.name] = -(out - Math.sign(out) * arm); }
  const tracks = [], wave = (t, period, phase = 0) => Math.sin((t / period + phase) * 2 * Math.PI);
  for (const bone of bones) { const v = [];
    for (const t of times) { let k = bone.quaternion;
      if (bone.name in drop) k = turned(bone, [[Z, drop[bone.name] + 0.025 * wave(t, seconds, bone.name.startsWith('Left') ? 0 : 0.5)], [X, 0.05 * wave(t, seconds / 2, bone.name.startsWith('Left') ? 0.1 : 0.6)]]);   // arms hang, and drift a little
      else if (bone.name === 'Head') k = turned(bone, [[Y, 0.22 * wave(t, seconds)], [X, 0.04 * wave(t, seconds / 2, 0.2)]]);   // a slow look from side to side
      else if (bone.name === 'neck') k = turned(bone, [[X, 0.012 * wave(t, seconds / 2)]]);   // breathing
      v.push(k.x, k.y, k.z, k.w); }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, v)); }
  const hips = by('Hips'); if (hips) tracks.push(new THREE.VectorKeyframeTrack('Hips.position', [0, seconds], [...hips.position.toArray(), ...hips.position.toArray()]));   // the walk moves the hips; this puts them back
  const clip = new THREE.AnimationClip('Stand', seconds, tracks); cache.set(model, clip); return clip;
}
