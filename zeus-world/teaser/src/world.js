// Builds every object in the teaser world. Nothing here depends on time.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });
export const MAT = {
  marble: std(0xf3ecdc),
  cream: std(0xf0dfc0),
  stone: std(0xcfc3a8),
  terracotta: std(0xc8623a),
  blue: std(0x2f5fa8),
  bronze: std(0x8a5a2b, { metalness: 0.5, roughness: 0.5 }),
  gold: std(0xffc94a, { emissive: 0xffa520, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.35 }),
  wood: std(0x7a5232),
  sand: std(0xe4cf9c),
  road: std(0xdcc9a0),
  cypress: std(0x2f5d3a),
  olive: std(0x7d9a62),
  trunk: std(0x5d4630),
  red: std(0xc23b3b),
  white: std(0xffffff),
  water: std(0x66c8ff, { emissive: 0x2a8fd0, emissiveIntensity: 0.7, roughness: 0.2 }),
};
export const glowGold = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(3.2, 2.1, 0.5) });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);

function columnGeo(h, r) {
  const shaft = new THREE.CylinderGeometry(r * 0.85, r, h - 0.5, 8); shaft.translate(0, h / 2, 0);
  const base = new THREE.BoxGeometry(r * 2.7, 0.25, r * 2.7); base.translate(0, 0.125, 0);
  const cap = new THREE.BoxGeometry(r * 2.7, 0.25, r * 2.7); cap.translate(0, h - 0.125, 0);
  return mergeGeometries([shaft, base, cap].map((g) => g.toNonIndexed()));
}
function column(h, r, x, z, y = 0) { return mesh(columnGeo(h, r), MAT.marble, x, y, z); }

function gable(w, h, d, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

export function boltGeometry(scale = 1, depth = 0.14) {
  const p = [[0.15, 1], [-0.45, -0.1], [-0.05, -0.1], [-0.2, -1], [0.45, 0.2], [0.05, 0.2], [0.35, 1]];
  const s = new THREE.Shape(); p.forEach(([x, y], i) => (i ? s.lineTo(x * scale, y * scale) : s.moveTo(x * scale, y * scale))); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: depth * scale, bevelEnabled: false }); g.translate(0, 0, (-depth * scale) / 2);
  return g;
}

// ---------- terrain ----------
export function groundHeight(x, z) {
  const r = Math.hypot(x / 85, z / 105);
  const k = THREE.MathUtils.smoothstep(r, 1, 2.6);
  return k * (20 + 14 * Math.sin(x * 0.03 + 1) * Math.cos(z * 0.027) + 8 * Math.sin(x * 0.07 + z * 0.05));
}
function makeTerrain() {
  const g = new THREE.PlaneGeometry(1000, 1000, 150, 150); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
  const grass = new THREE.Color(0x86a857), meadow = new THREE.Color(0xa6b765), dry = new THREE.Color(0xb9a468), c = new THREE.Color();
  const r = rng(7);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); const h = groundHeight(x, z); pos.setY(i, h);
    c.copy(grass).lerp(meadow, r()).lerp(dry, THREE.MathUtils.clamp(h / 30, 0, 1));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const flat = g.toNonIndexed(); flat.computeVertexNormals();
  const m = new THREE.Mesh(flat, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  m.receiveShadow = true; return m;
}
function makeMountains() {
  const grp = new THREE.Group(); const r = rng(11);
  const rock = std(0x5d6aa6), rock2 = std(0x7480b8), snow = std(0xf4f6ff);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + r() * 0.2; const d = 260 + r() * 110; const h = 60 + r() * 70;
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * (0.7 + r() * 0.4), h, 6 + Math.floor(r() * 3)), r() > 0.5 ? rock : rock2);
    m.position.set(Math.sin(a) * d, h / 2 - 6, -Math.cos(a) * d); m.rotation.y = r() * 3; grp.add(m);
  }
  // Mount Olympus, due north
  const o = new THREE.Mesh(new THREE.ConeGeometry(120, 190, 7), rock); o.position.set(0, 89, -300); o.rotation.y = 0.4; grp.add(o);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(44, 70, 7), snow); cap.position.set(0, 150, -300); cap.rotation.y = 0.4; grp.add(cap);
  const o2 = new THREE.Mesh(new THREE.ConeGeometry(90, 120, 6), rock2); o2.position.set(-95, 54, -290); grp.add(o2);
  const o3 = new THREE.Mesh(new THREE.ConeGeometry(80, 105, 6), rock2); o3.position.set(100, 46, -285); grp.add(o3);
  const seat = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(5, 3.4, 1.0), fog: false })); seat.position.set(0, 188, -300); grp.add(seat);
  return grp;
}
export const OLYMPUS_PEAK = new THREE.Vector3(0, 186, -300);

function makeTrees() {
  const grp = new THREE.Group(); const r = rng(23);
  const cyp = [], oli = [], trunks = [];
  const blocked = (x, z) => Math.abs(x) < 6 || (Math.hypot(x + 12, z - 14) < 17) || (Math.hypot((x - 22) / 30, (z + 24) / 26) < 1) || (Math.abs(z - 62) < 5) || Math.hypot(x, z) < 12 || (x > 8 && x < 36 && z > -8 && z < 16) || Math.hypot(x + 8, z - 28) < 10;
  let n = 0, guard = 0;
  while (n < 150 && guard++ < 4000) {
    const x = (r() - 0.5) * 230, z = (r() - 0.5) * 260 - 10;
    if (blocked(x, z) || extraSpots.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < 8)) continue;
    const y = groundHeight(x, z); const s = 0.8 + r() * 0.8;
    const t = new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 1.4 * s, 5); t.translate(x, y + 0.7 * s, z); trunks.push(t.toNonIndexed());
    if (r() < 0.55) { const g = new THREE.ConeGeometry(1.0 * s, 6.5 * s, 6); g.translate(x, y + 1.2 * s + 3.25 * s, z); cyp.push(g.toNonIndexed()); }
    else { const g = new THREE.IcosahedronGeometry(1.7 * s, 0); g.scale(1, 0.8, 1); g.rotateY(r() * 3); g.translate(x, y + 2.3 * s, z); oli.push(g); }
    n++;
  }
  [[cyp, MAT.cypress], [oli, MAT.olive], [trunks, MAT.trunk]].forEach(([list, mat]) => { const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = true; m.receiveShadow = true; grp.add(m); });
  return grp;
}

// ---------- buildings ----------
export function makeHouse(roofMat = MAT.terracotta, doorMat = MAT.blue) {
  const g = new THREE.Group();
  g.add(box(8, 0.4, 7.4, MAT.stone, 0, 0.2, 0));
  g.add(box(6.4, 3.2, 5, MAT.cream, 0, 2.0, -0.6));
  const roof = gable(7.6, 1.9, 7.2, roofMat); roof.position.set(0, 4.05, 0.1); g.add(roof);
  g.add(box(7.6, 0.45, 7.2, MAT.marble, 0, 3.83, 0.1));
  for (const x of [-2.9, -1, 1, 2.9]) g.add(column(3.2, 0.26, x, 2.9, 0.4));
  g.add(box(1.2, 2.2, 0.2, doorMat, 0, 1.5, 1.95));
  for (const x of [-2.1, 2.1]) g.add(box(0.9, 0.9, 0.2, doorMat, x, 2.3, 1.95));
  const b = new THREE.Mesh(boltGeometry(0.55), glowGold); b.position.set(0, 4.75, 3.72); g.add(b);
  g.userData.height = 6.2;
  return g;
}
export function makeCafe() {
  const g = new THREE.Group();
  g.add(box(8.4, 0.3, 8, MAT.stone, 0, 0.15, 0.6));
  g.add(box(6.6, 3, 4, MAT.cream, 0, 1.8, -1.2));
  g.add(box(7, 0.4, 4.4, MAT.marble, 0, 3.5, -1.2));
  g.add(box(3.6, 0.9, 0.25, MAT.blue, 0, 4.15, 0.6));
  const b = new THREE.Mesh(boltGeometry(0.34), glowGold); b.position.set(0, 4.15, 0.78); g.add(b);
  for (let i = 0; i < 7; i++) { const s = box(0.95, 0.12, 2.6, i % 2 ? MAT.white : MAT.red, -2.85 + i * 0.95, 3.0, 2.0); s.rotation.x = 0.28; g.add(s); }
  for (const x of [-3.2, 3.2]) g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), MAT.wood, x, 1.6, 3.2));
  g.add(box(1.3, 2.1, 0.2, MAT.blue, -1.6, 1.35, 0.82)); g.add(box(2.2, 1.2, 0.2, MAT.blue, 1.4, 1.9, 0.82));
  for (const [x, z] of [[-2.2, 2.6], [0.2, 3.3], [2.4, 2.5]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 10), MAT.marble, x, 1.1, z));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6), MAT.wood, x, 0.7, z));
    for (const a of [0.6, 3.5]) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), MAT.wood, x + Math.cos(a) * 0.95, 0.55, z + Math.sin(a) * 0.95));
  }
  g.userData.height = 4.8;
  return g;
}
export function makeStadium() {
  const g = new THREE.Group(); const RX = 20, RZ = 15, k = RZ / RX;
  // stepped seating, drawn as a lathe profile and squashed into an oval
  const pts = []; const tiers = 7; const r0 = 10.5, step = 1.25, rise = 0.95;
  pts.push(new THREE.Vector2(r0, 0));
  for (let i = 0; i < tiers; i++) { pts.push(new THREE.Vector2(r0 + i * step, (i + 1) * rise)); pts.push(new THREE.Vector2(r0 + (i + 1) * step, (i + 1) * rise)); }
  pts.push(new THREE.Vector2(RX, tiers * rise + 1.6)); pts.push(new THREE.Vector2(RX, 0));
  const seats = new THREE.Mesh(new THREE.LatheGeometry(pts, 40).toNonIndexed(), std(0xf3ecdc, { side: THREE.DoubleSide })); seats.geometry.computeVertexNormals();
  seats.scale.z = k; seats.castShadow = true; seats.receiveShadow = true; g.add(seats);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.2, r0 + 0.2, 0.12, 40), MAT.sand); floor.position.y = 0.06; floor.scale.z = k; floor.receiveShadow = true; g.add(floor);
  const track = new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.12, 4, 40), MAT.white); track.rotation.x = Math.PI / 2; track.position.y = 0.14; track.scale.y = k; g.add(track);
  // outer colonnade and cornice
  const cols = []; const n = 36; const top = tiers * rise + 1.6;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const c = columnGeo(top + 2.6, 0.42); c.translate(Math.cos(a) * (RX + 0.9), 0, Math.sin(a) * (RX + 0.9) * k); cols.push(c); }
  const cm = new THREE.Mesh(mergeGeometries(cols), MAT.marble); cm.castShadow = true; cm.receiveShadow = true; g.add(cm);
  const cornice = new THREE.Mesh(new THREE.TorusGeometry(RX + 0.9, 0.55, 4, 40), MAT.marble); cornice.rotation.x = Math.PI / 2; cornice.rotation.z = Math.PI / 4; cornice.position.y = top + 2.9; cornice.scale.y = k; cornice.castShadow = true; g.add(cornice);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(RX + 0.9, 0.16, 4, 40), MAT.gold); trim.rotation.x = Math.PI / 2; trim.position.y = top + 3.5; trim.scale.y = k; g.add(trim);
  // banners
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.26; const x = Math.cos(a) * (RX + 0.9), z = Math.sin(a) * (RX + 0.9) * k; g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 5), MAT.wood, x, top + 5.2, z)); const f = box(1.5, 0.9, 0.06, i % 2 ? MAT.blue : MAT.red, x + 0.8, top + 6.3, z); g.add(f); }
  g.userData.height = top + 7.2; g.userData.RX = RX; g.userData.RZ = RZ;
  return g;
}
export function makeGate() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(box(140, 7, 2.4, MAT.stone, s * 76.5, 3.5, 0)); g.add(box(140, 0.6, 3, MAT.marble, s * 76.5, 7.3, 0));
    g.add(box(3.4, 11, 3.6, MAT.marble, s * 5.8, 5.5, 0));
    g.add(column(10.4, 0.55, s * 5.8, 2.6)); g.add(column(10.4, 0.55, s * 8.2, 2.6));
    const torch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), glowGold); torch.position.set(s * 8.2, 11.1, 2.6); g.add(torch);
  }
  g.add(box(19.6, 1.3, 4.6, MAT.marble, 0, 11.3, 0.4));
  const ped = gable(19.6, 3.4, 4.6, MAT.marble); ped.position.set(0, 11.95, 0.4); g.add(ped);
  g.add(box(19.6, 0.22, 4.7, MAT.gold, 0, 11.95, 0.4));
  const b = new THREE.Mesh(boltGeometry(1.1), glowGold); b.position.set(0, 13.35, 2.78); g.add(b);
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 4.1, 0, 0);
    const d = box(4.1, 9.6, 0.4, MAT.bronze, -s * 2.05, 4.8, 0); pivot.add(d);
    for (let i = 0; i < 3; i++) pivot.add(box(3.3, 0.18, 0.5, MAT.gold, -s * 2.05, 1.6 + i * 3.2, 0));
    g.add(pivot); doors.push({ pivot, s });
  }
  g.userData.doors = doors;
  return g;
}
export function makeFountain() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.8, 12), MAT.marble, 0, 0.4, 0));
  g.add(mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.2, 12), MAT.water, 0, 0.78, 0));
  g.add(column(3.6, 0.4, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.5, 0.5, 0.4, 10), MAT.marble, 0, 3.7, 0));
  const b = new THREE.Mesh(boltGeometry(0.9), glowGold); b.position.set(0, 5.0, 0); g.add(b);
  return g;
}
export function makeStele(texture) {
  const g = new THREE.Group();
  g.add(box(10.4, 0.7, 2.6, MAT.stone, 0, 0.35, 0));
  g.add(box(8.2, 6.9, 0.9, MAT.marble, 0, 4.15, 0));
  g.add(box(9, 0.5, 1.3, MAT.marble, 0, 7.85, 0));
  g.add(box(9, 0.14, 1.34, MAT.gold, 0, 8.15, 0));
  const ped = gable(9, 1.5, 1.3, MAT.marble); ped.position.set(0, 8.2, 0); g.add(ped);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 6.5), new THREE.MeshBasicMaterial({ map: texture, transparent: true, color: new THREE.Color().setRGB(1.25, 1.25, 1.25) }));
  face.position.set(0, 4.15, 0.47); g.add(face);
  for (const s of [-1, 1]) { g.add(column(2.6, 0.32, s * 5.9, 0.9)); g.add(mesh(new THREE.CylinderGeometry(0.75, 0.4, 0.4, 8), MAT.bronze, s * 5.9, 2.8, 0.9)); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), glowGold); f.position.set(s * 5.9, 3.4, 0.9); f.userData.flame = true; g.add(f); }
  return g;
}

// ---------- citizens ----------
const SKIN = [0xf1c9a5, 0xd9a273, 0xa9714b, 0x7a4b2e, 0xe8b88f];
const SASH = [0xc23b3b, 0x2f5fa8, 0x3d8f5a, 0x8e4fb0, 0xe0902b, 0x2aa3a3, 0xd6457e];
const HAIR = [0x2a1d14, 0x503420, 0x111111, 0x8a5a2b, 0xd8c08a];
const cg = {
  body: new THREE.CylinderGeometry(0.2, 0.44, 1.25, 8), shoulders: new THREE.SphereGeometry(0.27, 8, 6), head: new THREE.SphereGeometry(0.23, 10, 8),
  hair: new THREE.SphereGeometry(0.25, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), sash: new THREE.TorusGeometry(0.33, 0.07, 5, 12), laurel: new THREE.TorusGeometry(0.2, 0.035, 4, 10),
  arm: new THREE.CapsuleGeometry(0.075, 0.5, 2, 6),
};
export function makeCitizen(i, hero = false) {
  const g = new THREE.Group(); const sm = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const toga = sm(hero ? 0xffffff : [0xf7f1e3, 0xefe4cc, 0xf3ead8][i % 3]); const skin = sm(SKIN[i % SKIN.length]);
  const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  add(cg.body, toga, 0.63); add(cg.shoulders, toga, 1.22); add(cg.head, skin, 1.56); add(cg.hair, sm(HAIR[i % HAIR.length]), 1.6);
  const s = add(cg.sash, sm(hero ? 0xe0902b : SASH[i % SASH.length]), 1.0); s.rotation.set(Math.PI / 2, 0.75, 0); s.scale.set(1, 1, 2.2);
  if (hero) { const l = add(cg.laurel, MAT.gold, 1.72); l.rotation.x = Math.PI / 2; }
  const arms = [];
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(sd * 0.3, 1.24, 0); const a = new THREE.Mesh(cg.arm, skin); a.position.y = -0.3; a.castShadow = true; p.add(a); p.rotation.z = sd * 0.18; g.add(p); arms.push(p); }
  g.userData.arms = arms;
  return g;
}

// ---------- lightning ----------
export function makeLightning(from, to, seed, width = 0.3) {
  const r = rng(seed); const parts = [];
  const strand = (a, b, n, w, jitter) => {
    const pts = []; const dir = b.clone().sub(a); const len = dir.length();
    const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize(); if (side.lengthSq() < 0.01) side.set(1, 0, 0); const side2 = new THREE.Vector3().crossVectors(dir, side).normalize();
    for (let i = 0; i <= n; i++) { const t = i / n; const e = Math.sin(Math.PI * t); pts.push(a.clone().lerp(b, t).addScaledVector(side, (r() - 0.5) * jitter * len * e).addScaledVector(side2, (r() - 0.5) * jitter * len * e * 0.4)); }
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1]; const L = p.distanceTo(q); const c = new THREE.CylinderGeometry(w, w, L, 5); c.translate(0, L / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize())); c.translate(p.x, p.y, p.z); parts.push(c); }
    return pts;
  };
  const main = strand(from, to, 16, width, 0.16);
  for (let b = 0; b < 4; b++) { const p = main[3 + b * 3]; const end = p.clone().add(new THREE.Vector3((r() - 0.5) * 50, -18 - r() * 22, (r() - 0.5) * 20)); strand(p, end, 6, width * 0.5, 0.2); }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(2.6, 3.0, 4.6), fog: false }));
  m.visible = false; return m;
}

// ---------- clip-plane "rise from the ground" ----------
export function makeRiser(group, footprint) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6); const H = group.userData.height;
  const cache = new Map();
  group.traverse((o) => { if (!o.isMesh) return; if (!cache.has(o.material)) { const m = o.material.clone(); m.clippingPlanes = [plane]; m.clipShadows = true; cache.set(o.material, m); } o.material = cache.get(o.material); });
  const ring = new THREE.Group();
  if (footprint.r) { const t = new THREE.Mesh(new THREE.TorusGeometry(footprint.r, 0.16, 5, 48), glowGold); t.rotation.x = Math.PI / 2; t.scale.y = footprint.k ?? 1; ring.add(t); }
  else { const { w, d } = footprint; for (const [bw, bd, x, z] of [[w, 0.14, 0, d / 2], [w, 0.14, 0, -d / 2], [0.14, d, w / 2, 0], [0.14, d, -w / 2, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.14, bd), glowGold); b.position.set(x, 0, z); ring.add(b); } }
  ring.position.copy(group.position); ring.rotation.y = group.rotation.y; ring.visible = false;
  return { ring, set(p, outline = 0) {
    group.visible = p > 0; const y = group.position.y + p * H;
    plane.constant = p >= 1 ? 1e6 : y;
    ring.visible = (p > 0 && p < 1) || (p <= 0 && outline > 0);
    ring.position.y = p > 0 ? y : group.position.y + 0.12;
    const s = p > 0 ? 1 : 1 + 0.02 * Math.sin(outline * 9); ring.scale.set(s, 1, s);
  } };
}

// houses that only exist in the final wide shot: [x, z, rotationY]
export const extraSpots = [[-34, 8, 0.5], [-30, -8, 0.9], [-24, 30, 0.2], [-38, 26, 0.6], [-16, -22, 0.3], [-34, -26, 0.7], [14, 22, -0.5], [26, 12, -0.6], [38, 26, -0.8], [16, 40, -0.3], [-14, 44, 0.3], [36, 44, -0.6], [-44, 44, 0.5], [-48, -10, 1.0], [52, 6, -1.0]];

export function buildWorld(scene, steleTexture) {
  const W = {};
  scene.add(makeTerrain()); scene.add(makeMountains()); scene.add(makeTrees());
  const road = box(5, 0.06, 118, MAT.road, 0, 0.03, 3); road.castShadow = false; scene.add(road);
  W.gate = makeGate(); W.gate.position.set(0, 0, 62); scene.add(W.gate);

  W.house = makeHouse(); W.house.position.set(-16, 0, 14); W.house.rotation.y = 0.35; scene.add(W.house);
  W.cafe = makeCafe(); W.cafe.position.set(-6.2, 0, 11.5); W.cafe.rotation.y = 0.1; scene.add(W.cafe);
  W.stadium = makeStadium(); W.stadium.position.set(22, 0, -24); scene.add(W.stadium);
  W.houseRise = makeRiser(W.house, { w: 8.4, d: 7.8 }); W.cafeRise = makeRiser(W.cafe, { w: 8.8, d: 8.4 }); W.cafeRise.ring.position.z += 0.6;
  W.stadiumRise = makeRiser(W.stadium, { r: 22, k: 15 / 20 });
  scene.add(W.houseRise.ring, W.cafeRise.ring, W.stadiumRise.ring);

  W.stele = makeStele(steleTexture); W.stele.position.set(22, 0, -3.5); scene.add(W.stele);
  W.fountain = makeFountain(); scene.add(W.fountain);
  W.extras = new THREE.Group(); const r = rng(5);
  extraSpots.forEach(([x, z, ry], i) => { const h = i % 4 === 3 ? makeCafe() : makeHouse(i % 3 === 1 ? MAT.blue : MAT.terracotta, i % 3 === 1 ? MAT.terracotta : MAT.blue); h.position.set(x, 0, z); h.rotation.y = ry + (r() - 0.5) * 0.3; W.extras.add(h); });
  scene.add(W.extras);
  return W;
}
