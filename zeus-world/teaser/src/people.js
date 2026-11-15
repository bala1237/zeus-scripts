// Citizens: draped figures built in code (no free realistic rigged people were available).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SKIN = [0xe8b998, 0xc98f62, 0x9a6540, 0x6e4329, 0xdba57c];
const DRAPE = [0xa8322d, 0x2c5d9a, 0x3d7d52, 0x7b4a9a, 0xc9822a, 0x2a8f8f, 0xb84a72, 0x8a6a2a];
const HAIR = [0x1e1510, 0x402a1a, 0x0d0d0d, 0x6e4a26, 0xa98f5a];
const mats = new Map(); const mat = (c, rough = 0.85) => { const k = c + ':' + rough; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: rough })); return mats.get(k); };

let geo;
function build() {
  // chiton: a lathe with soft folds that deepen toward the hem
  const prof = [[0.0, 0.06], [0.34, 0.06], [0.33, 0.3], [0.29, 0.62], [0.215, 0.98], [0.2, 1.06], [0.235, 1.2], [0.245, 1.32], [0.2, 1.42], [0.09, 1.47], [0.075, 1.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(prof, 40); const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = THREE.MathUtils.smoothstep(1.05 - y, 0, 0.95); const f = 1 + k * 0.085 * Math.sin(a * 11 + y * 3) + k * 0.04 * Math.sin(a * 5 - y * 5); p.setXYZ(i, x * f, y, z * f * 0.72); }
  body.computeVertexNormals();
  const belt = new THREE.TorusGeometry(0.212, 0.022, 6, 28); belt.rotateX(Math.PI / 2); belt.scale(1, 1, 0.74); belt.translate(0, 1.04, 0);
  // himation: a band from the left shoulder across to the right hip
  const sash = new THREE.TorusGeometry(0.33, 0.07, 8, 36); sash.scale(1, 1, 0.42); sash.rotateX(Math.PI / 2); sash.scale(0.78, 1, 0.9); sash.rotateZ(0.95); sash.translate(-0.02, 1.13, 0);
  const cape = new THREE.BoxGeometry(0.2, 0.75, 0.06, 2, 6, 1); cape.translate(0.19, 1.0, -0.17);
  const head = new THREE.SphereGeometry(0.115, 20, 16); head.scale(0.92, 1.12, 1); head.translate(0, 1.64, 0.01);
  const neck = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12); neck.translate(0, 1.52, 0);
  const hair = new THREE.SphereGeometry(0.123, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56); hair.scale(0.95, 1.1, 1.04); hair.translate(0, 1.655, -0.012);
  const bun = new THREE.SphereGeometry(0.055, 12, 10); bun.translate(0, 1.66, -0.13);
  const arm = (() => { const u = new THREE.CapsuleGeometry(0.043, 0.24, 4, 10); u.translate(0, -0.15, 0); const f = new THREE.CapsuleGeometry(0.036, 0.22, 4, 10); f.rotateX(-0.25); f.translate(0, -0.42, 0.03); const h = new THREE.SphereGeometry(0.045, 10, 8); h.scale(0.8, 1.2, 1); h.translate(0, -0.58, 0.065); return mergeGeometries([u, f, h]); })();
  const sleeve = new THREE.CapsuleGeometry(0.062, 0.1, 4, 10); sleeve.translate(0, -0.07, 0);
  const foot = new THREE.CapsuleGeometry(0.045, 0.12, 4, 8); foot.rotateX(Math.PI / 2); foot.scale(1, 0.7, 1); foot.translate(0, 0.035, 0.06);
  const laurel = new THREE.TorusGeometry(0.118, 0.014, 6, 24); laurel.rotateX(Math.PI / 2 - 0.25); laurel.translate(0, 1.7, 0);
  geo = { body, belt, drape: sash, skin: mergeGeometries([head, neck]), hair: mergeGeometries([hair, bun]), arm, sleeve, foot, laurel };
}

export function makeCitizen(i, hero = false) {
  if (!geo) build();
  const g = new THREE.Group(); const root = new THREE.Group(); g.add(root);
  const add = (ge, m, parent = root) => { const o = new THREE.Mesh(ge, m); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  const cloth = mat(hero ? 0xfbf7ee : [0xf4ecdc, 0xeadfc8, 0xf1e6d2, 0xe6d9c0][i % 4], 0.9), skin = mat(SKIN[i % SKIN.length], 0.62), gold = new THREE.MeshStandardMaterial({ color: 0xffc24a, metalness: 1, roughness: 0.25 });
  add(geo.body, cloth); add(geo.belt, hero ? gold : mat(0x5a3d22)); add(geo.drape, mat(hero ? 0xc9822a : DRAPE[i % DRAPE.length], 0.88)); add(geo.skin, skin); add(geo.hair, mat(HAIR[i % HAIR.length], 0.7));
  if (hero) add(geo.laurel, gold);
  const arms = [], feet = [];
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.245, 1.4, 0); add(geo.arm, skin, piv); add(geo.sleeve, cloth, piv); root.add(piv); arms.push(piv); const f = add(geo.foot, skin); f.position.x = s * 0.1; feet.push(f); }
  const sc = 1.02 + ((i * 37) % 11) / 110; g.scale.setScalar(sc);
  g.userData = { root, arms, feet };
  return g;
}

// walk cycle, idle sway and cheering, all as functions of time
export function pose(c, t, walking, cheer = 0, ph = 0) {
  const { root, arms, feet } = c.userData; const w = walking ? 1 : 0; const s = Math.sin(t * 7.4 + ph);
  root.position.y = w * Math.abs(Math.cos(t * 7.4 + ph)) * 0.035 + cheer * Math.abs(Math.sin(t * 6 + ph)) * 0.16;
  root.rotation.z = w * s * 0.035 + (1 - w) * Math.sin(t * 1.3 + ph) * 0.012; root.rotation.x = w * 0.05;
  arms[0].rotation.x = w * s * 0.5 - cheer * 2.7; arms[1].rotation.x = -w * s * 0.5 - cheer * 2.7;
  arms[0].rotation.z = -0.1 - cheer * 0.35; arms[1].rotation.z = 0.1 + cheer * 0.35;
  feet[0].position.z = w * s * 0.2; feet[1].position.z = -w * s * 0.2; feet[0].position.y = w * Math.max(0, -Math.cos(t * 7.4 + ph)) * 0.05; feet[1].position.y = w * Math.max(0, Math.cos(t * 7.4 + ph)) * 0.05;
}
