// Rebuilds a rigged character's skin binding (which bone each vertex follows) from the shape of the body.
//   node reskin.mjs models/char_citizen_woman.glb [out.glb] [--hem 0.1]
// Why: the generator's automatic rig can bind body parts to the wrong bones. The woman citizen came with her whole
// upper body and head bound to her left forearm, which is invisible at rest and wrong as soon as she moves.
// The skeleton and the animations are left untouched; only JOINTS_0 and WEIGHTS_0 are rewritten.
// Scheme (the same one the working male citizen has): torso on the hips, head on the head bone, arms and bare legs on
// their own bones, clothing round the legs on the hips with a little sway from the thighs. The generated meshes have
// unreliable normals and a skeleton that sits towards the front of the body, so the rules go by region, not by nearest bone.
// See docs/knowledge/characters.md.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { Matrix4, Vector3 } from 'three';

const args = process.argv.slice(2), opt = {}; for (let i = args.length - 2; i >= 0; i--) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args.splice(i, 2)[1];
const [src, out = src] = args;
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src), root = doc.getRoot(), skin = root.listSkins()[0], joints = skin.listJoints(), ibm = skin.getInverseBindMatrices();
const J = Object.fromEntries(joints.map((j, i) => [j.getName(), i]));
const pos = joints.map((_, i) => new Vector3().setFromMatrixPosition(new Matrix4().fromArray(ibm.getElement(i, [])).invert()));   // each bone's pivot, in the mesh's own space
const need = ['Hips', 'neck', 'Head1', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand'];
for (const n of need) if (!(n in J)) throw new Error(`bone ${n} not found; this script expects the generator's 22-bone skeleton`);
const P = (n) => pos[J[n]], beyond = (a, b, k) => P(b).clone().add(P(b).clone().sub(P(a)).normalize().multiplyScalar(k));

for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
  const A = prim.getAttribute('POSITION'), idx = prim.getIndices(), n = A.getCount();
  let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { const y = A.getElement(i, [])[1]; lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const H = hi - lo;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const seg = (a, b, t0 = 0) => ({ a: a.clone().lerp(b, t0), ab: b.clone().sub(a.clone().lerp(b, t0)) }), c = new Vector3(), v = new Vector3();
  const dist = (s) => { const t = Math.min(1, Math.max(0, c.subVectors(v, s.a).dot(s.ab) / s.ab.lengthSq())); c.copy(s.a).addScaledVector(s.ab, t); return c.distanceTo(v); };   // leaves the closest point in c
  // The hem: the lowest point where the body is closed between the legs. Above it the legs are inside clothing (a skirt, a tunic)
  // or are the hips themselves; below it they are bare. --hem <height as a fraction, 0 feet to 1 head> overrides the guess.
  const cx = (P('LeftUpLeg').x + P('RightUpLeg').x) / 2; let hem = hi;
  if (opt.hem !== undefined) hem = lo + Number(opt.hem) * H; else for (let i = 0; i < n; i++) { const p = A.getElement(i, []); if (Math.abs(p[0] - cx) < 0.015 * H && p[1] < hem) hem = p[1]; }
  const neckY = (P('Head1').y + P('Head').y) / 2, hipY = P('Hips').y;
  // arms: the upper arm starts a little way down from the shoulder, so the shoulder itself stays with the body
  const arms = [], legs = [];
  for (const s of ['Left', 'Right']) { arms.push([`${s}Arm`, seg(P(`${s}Arm`), P(`${s}ForeArm`), 0.3), 0.055 * H], [`${s}ForeArm`, seg(P(`${s}ForeArm`), P(`${s}Hand`)), 0.045 * H], [`${s}Hand`, seg(P(`${s}Hand`), beyond(`${s}ForeArm`, `${s}Hand`, 0.07 * H)), 0.065 * H]);
    legs.push([`${s}Leg`, seg(P(`${s}Leg`), P(`${s}Foot`))], [`${s}Foot`, seg(P(`${s}Foot`), P(`${s}ToeBase`))], [`${s}ToeBase`, seg(P(`${s}ToeBase`), beyond(`${s}Foot`, `${s}ToeBase`, 0.04 * H))]); }
  // --legs 1, for a short tunic (the man): the hem can then be set below the cloth's lowest fold (--hem), inside the bare leg. Skin close to a
  // thigh bone follows that thigh; and faces that are the leg itself are kept where the hem crosses it, so the knee bends instead of parting.
  const LEGS = opt.legs !== undefined, thighs = []; for (const s of ['Left', 'Right']) thighs.push([`${s}UpLeg`, seg(P(`${s}UpLeg`), P(`${s}Leg`))]); const limb = new Uint8Array(n);
  const W = Array.from({ length: n }, () => new Map()), bare = new Uint8Array(n), lower = new Uint8Array(n);   // bare: a leg below the hem; lower: a forearm or hand
  for (let i = 0; i < n; i++) { v.fromArray(A.getElement(i, [])); const w = W[i]; let best = null, score = 1;
    // an arm owns what lies inside its own thickness; the upper arm only on its outer side, or it would take the ribs beside it
    for (const [owner, s, r] of arms) { const d = dist(s); if (d < r * score && (!owner.endsWith('tArm') || Math.abs(v.x - cx) > Math.abs(c.x - cx) - 0.035 * H)) { score = d / r; best = owner; } }
    if (best) { w.set(J[best], 1); if (!/Arm$/.test(best) || /ForeArm$/.test(best)) lower[i] = 1; }
    else if (v.y > neckY) w.set(J.Head, 1);
    else if (LEGS && v.y < hipY) {   // a short tunic: nothing is cut. Below the knee everything is leg; above it, what lies within a limb's thickness of a leg bone is that leg, and the rest is cloth on the hips, swayed by the thigh on its side
      const kneeY = (P('LeftLeg').y + P('RightLeg').y) / 2; let bd = Infinity, bo = null, br = 1;
      for (const [owner, sg, r] of [...thighs.map((x) => [...x, 0.052 * H]), ...legs.map((x) => [...x, 0.046 * H])]) { const d = dist(sg) / r; if (d < bd) { bd = d; bo = owner; br = r; } }
      if (v.y < kneeY - 0.035 * H) { let d2 = Infinity; for (const [owner, sg] of legs) { const d = dist(sg); if (d < d2) { d2 = d; bo = owner; } } w.set(J[bo], 1); limb[i] = 1; }
      else { const t = smooth(1.25, 0.85, bd), sway = 0.6 * smooth(0, hipY - kneeY, hipY - v.y), side = smooth(-0.04 * H, 0.04 * H, v.x - cx); if (t > 0) w.set(J[bo], t); if (t < 1) { w.set(J.Hips, (w.get(J.Hips) || 0) + (1 - t) * (1 - sway)); w.set(J.LeftUpLeg, (w.get(J.LeftUpLeg) || 0) + (1 - t) * sway * side); w.set(J.RightUpLeg, (w.get(J.RightUpLeg) || 0) + (1 - t) * sway * (1 - side)); } if (t > 0.5) limb[i] = 1; } }
    else if (v.y > hem) {   // torso and clothing: on the hips. Below the hips, clothing follows the thigh on its side more and more towards the hem, so a skirt is pushed by the stride and covers the legs; bound to the shins it would kick out behind
      const sway = 0.6 * smooth(0, hipY - hem, hipY - v.y), side = smooth(-0.04 * H, 0.04 * H, v.x - cx); w.set(J.Hips, 1 - sway); if (sway > 0) { w.set(J.LeftUpLeg, sway * side); w.set(J.RightUpLeg, sway * (1 - side)); } 
      if (LEGS && v.y < hipY) { let bd = Infinity, bo = null; for (const [owner, sg] of thighs) { const d = dist(sg); if (d < bd) { bd = d; bo = owner; } } const t = smooth(0.066 * H, 0.042 * H, bd); if (t > 0) { for (const [k, x] of w) w.set(k, x * (1 - t)); w.set(J[bo], (w.get(J[bo]) || 0) + t); if (bd < 0.05 * H) limb[i] = 1; } } }
    else { let bd = Infinity; for (const [owner, s] of legs) { const d = dist(s); if (d < bd) { bd = d; best = owner; } } w.set(J[best], 1); bare[i] = 1; if (bd < 0.05 * H) limb[i] = 1; } }
  console.log(`hem at ${((hem - lo) / H).toFixed(2)} of the height, neck at ${((neckY - lo) / H).toFixed(2)}`);
  // Faces that join a bare leg to the clothing above it (the underside of a skirt) would stretch into a sheet between the feet as the legs move.
  // They are inside the hem and never seen from above, so they are removed and the legs simply pass under the hem.
  // The same goes for stray faces joining a hand or forearm to the body beside it: they stretch into strings when the arm is raised.
  { const old = idx.getArray(), keep = []; let cutLeg = 0, cutArm = 0;
    for (let t = 0; t < old.length; t += 3) { const i = [old[t], old[t + 1], old[t + 2]], k = bare[i[0]] + bare[i[1]] + bare[i[2]], body = i.some((x) => !lower[x] && !W[x].has(J.LeftArm) && !W[x].has(J.RightArm));
      if ((k === 1 || k === 2) && !LEGS) cutLeg++; else if (i.some((x) => lower[x]) && body) cutArm++; else keep.push(...i); }
    console.log(`removed ${cutLeg} faces joining bare legs to clothing and ${cutArm} joining a hand or forearm to the body`); idx.setArray(new old.constructor(keep)); }
  // blend across the surface so joints bend smoothly; vertices split by texture seams are treated as one
  const key = new Map(), group = new Int32Array(n); for (let i = 0; i < n; i++) { const p = A.getElement(i, []), k = `${Math.round(p[0] * 2e4)},${Math.round(p[1] * 2e4)},${Math.round(p[2] * 2e4)}`; if (!key.has(k)) key.set(k, key.size); group[i] = key.get(k); }
  const G = key.size, nb = Array.from({ length: G }, () => new Set()), tri = idx.getArray();
  for (let t = 0; t < tri.length; t += 3) { const a = group[tri[t]], b = group[tri[t + 1]], d = group[tri[t + 2]]; nb[a].add(b).add(d); nb[b].add(a).add(d); nb[d].add(a).add(b); }
  let g = Array.from({ length: G }, () => new Map()); for (let i = 0; i < n; i++) if (!g[group[i]].size) for (const [k, x] of W[i]) g[group[i]].set(k, x);
  for (let pass = 0; pass < 6; pass++) { const next = Array.from({ length: G }, () => new Map());
    for (let i = 0; i < G; i++) { const m = next[i]; for (const [k, x] of g[i]) m.set(k, x * 0.5); const share = 0.5 / Math.max(1, nb[i].size); for (const o of nb[i]) for (const [k, x] of g[o]) m.set(k, (m.get(k) || 0) + x * share); if (!nb[i].size) for (const [k, x] of g[i]) m.set(k, x); }
    g = next; }
  const jo = new Uint8Array(n * 4), we = new Uint8Array(n * 4), used = new Map();
  for (let i = 0; i < n; i++) { const t4 = [...g[group[i]]].sort((a, b) => b[1] - a[1]).slice(0, 4), sum = t4.reduce((a, x) => a + x[1], 0); let left = 255;
    t4.forEach(([k, x], s) => { const q = s === t4.length - 1 ? left : Math.min(left, Math.round(255 * x / sum)); left -= q; jo[i * 4 + s] = q ? k : 0; we[i * 4 + s] = q; if (s === 0) used.set(k, (used.get(k) || 0) + 1); }); }
  for (const [sem, arr] of [['JOINTS_0', jo], ['WEIGHTS_0', we]]) { const old = prim.getAttribute(sem), acc = doc.createAccessor().setType('VEC4').setArray(arr).setNormalized(sem === 'WEIGHTS_0').setBuffer(old.getBuffer()); prim.setAttribute(sem, acc); if (!old.listParents().some((p) => p.propertyType === 'Primitive')) old.dispose(); }
  console.log(`${src}: ${n} vertices rebound. Main bone per vertex:`, [...used].sort((a, b) => b[1] - a[1]).map(([k, x]) => `${joints[k].getName()} ${x}`).join(', '));
}
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, doc);
