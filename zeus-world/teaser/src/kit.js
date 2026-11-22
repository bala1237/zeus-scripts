// Classical building kit: geometry helpers and the buildings of the district.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { A, prop } from './assets.js';

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), ONE = new THREE.Vector3(1, 1, 1);

function boxUV(g, tile) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// Collects geometry per material and merges it, so a building is a handful of draw calls.
export class Builder {
  constructor() { this.parts = new Map(); this.extras = []; }
  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = ONE) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(M4.compose(new THREE.Vector3(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), s));
    if (!this.parts.has(mat)) this.parts.set(mat, []); this.parts.get(mat).push(g); return this;
  }
  box(w, h, d, mat, x, y, z, ry = 0, rx = 0, rz = 0) { return this.add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, ry, rx, rz); }
  obj(o, x, y, z, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; this.extras.push(o); return this; }
  build() {
    const grp = new THREE.Group();
    for (const [mat, list] of this.parts) { const g = mergeGeometries(list); boxUV(g, mat.userData.tile || 1); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; grp.add(m); }
    this.extras.forEach((o) => grp.add(o)); return grp;
  }
}

function flat(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }

// Doric column: fluted shaft with entasis, echinus and abacus.
export function column(b, h, r, x, z, y = 0, mat = A.mat.marble) {
  const hs = h - r * 0.95; const shaft = new THREE.CylinderGeometry(r * 0.8, r, hs, 40, 6, true); const p = shaft.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = Math.round((a / (Math.PI * 2)) * 40); const t = (p.getY(i) + hs / 2) / hs; const s = (k % 2 ? 0.94 : 1) * (1 + 0.035 * Math.sin(Math.PI * t)); p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); }
  b.add(flat(shaft), mat, x, y + hs / 2, z);
  b.add(new THREE.CylinderGeometry(r * 1.28, r * 0.82, r * 0.45, 28), mat, x, y + hs + r * 0.225, z);
  b.add(new THREE.CylinderGeometry(r * 0.86, r * 0.86, r * 0.1, 28), mat, x, y + hs - r * 0.12, z);
  b.box(r * 2.7, r * 0.5, r * 2.7, mat, x, y + hs + r * 0.7, z);
}

function tri(w, h, d) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; }
export function boltGeometry(scale = 1, depth = 0.14) {
  const pts = [[0.15, 1], [-0.45, -0.1], [-0.05, -0.1], [-0.2, -1], [0.45, 0.2], [0.05, 0.2], [0.35, 1]];
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x * scale, y * scale) : s.moveTo(x * scale, y * scale))); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: depth * scale, bevelEnabled: true, bevelThickness: 0.03 * scale, bevelSize: 0.03 * scale, bevelSegments: 2 }); g.translate(0, 0, (-depth * scale) / 2); return g;
}

// Entablature and gabled roof over a w x d rectangle whose top of columns is at y.
function roofed(b, w, d, y, { pitch = 0.36, roofMat = A.mat.roof, frieze = A.mat.marble, glow = true } = {}) {
  const m = A.mat.marble;
  b.box(w, 0.36, d, m, 0, y + 0.18, 0);
  b.box(w - 0.08, 0.42, d - 0.08, frieze, 0, y + 0.57, 0);
  const n = Math.max(2, Math.round(w / 0.8));
  for (let i = 0; i <= n; i++) for (const s of [-1, 1]) b.box(0.24, 0.42, 0.08, m, -w / 2 + 0.2 + (i * (w - 0.4)) / n, y + 0.57, s * (d / 2 - 0.01));
  const nd = Math.max(2, Math.round(d / 0.8));
  for (let i = 0; i <= nd; i++) for (const s of [-1, 1]) b.box(0.08, 0.42, 0.24, m, s * (w / 2 - 0.01), y + 0.57, -d / 2 + 0.2 + (i * (d - 0.4)) / nd);
  const cw = w + 0.5, cd = d + 0.5, cy = y + 0.78;
  b.box(cw, 0.2, cd, m, 0, cy + 0.1, 0); b.box(cw + 0.16, 0.08, cd + 0.16, m, 0, cy + 0.24, 0);
  const ph = (cw / 2) * pitch, py = cy + 0.28, len = Math.hypot(cw / 2, ph), ang = Math.atan2(ph, cw / 2);
  for (const s of [-1, 1]) {
    b.add(tri(cw - 0.5, ph - 0.12, 0.25), A.mat.plaster, 0, py, s * (cd / 2 - 0.45));
    for (const k of [-1, 1]) b.box(len + 0.2, 0.2, 0.5, m, (k * cw) / 4, py + ph / 2 + 0.04, s * (cd / 2 - 0.25), 0, 0, -k * ang);
  }
  for (const k of [-1, 1]) b.box(len + 0.3, 0.16, cd - 0.2, roofMat, (k * cw) / 4, py + ph / 2 + 0.12, 0, 0, 0, -k * ang);
  b.box(0.3, 0.22, cd, m, 0, py + ph + 0.12, 0);
  if (glow) b.add(boltGeometry(0.5), A.mat.glow, 0, py + ph + 0.85, cd / 2 - 0.25);
  for (const k of [-1, 1]) b.add(new THREE.SphereGeometry(0.2, 12, 8), A.mat.gold, (k * cw) / 2, cy + 0.5, cd / 2 - 0.25);
  return py + ph + 1.4;
}

function steps(b, w, d, n = 3, mat = A.mat.marbleWarm) { for (let i = 0; i < n; i++) b.box(w + (n - 1 - i) * 0.7, 0.2, d + (n - 1 - i) * 0.7, mat, 0, 0.1 + i * 0.2, 0); return n * 0.2; }

function door(b, x, y, z, w, h, leaf = A.mat.bluePaint) {
  b.box(w + 0.5, h + 0.25, 0.3, A.mat.marble, x, y + (h + 0.25) / 2, z);
  b.box(w, h, 0.34, leaf, x, y + h / 2, z + 0.02);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) b.box(w / 2 - 0.16, h / 3 - 0.16, 0.4, leaf, x + (s * w) / 4, y + h / 6 + (i * h) / 3, z + 0.03);
  b.box(0.04, h, 0.42, A.mat.dark, x, y + h / 2, z + 0.02);
  for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.07, 10, 8), A.mat.gold, x + s * 0.12, y + h * 0.48, z + 0.26);
}
function windowAt(b, x, y, z, w = 0.9, h = 1.1) {
  b.box(w + 0.3, h + 0.3, 0.2, A.mat.marble, x, y, z); b.box(w, h, 0.24, A.mat.dark, x, y, z + 0.01);
  for (const s of [-1, 1]) b.box(w / 2, h, 0.06, A.mat.bluePaint, x + s * (w * 0.78), y, z + 0.1, s * 0.25);
  b.box(w + 0.5, 0.1, 0.34, A.mat.marble, x, y - h / 2 - 0.16, z + 0.06);
}

export function makeHouse(roofMat = A.mat.roof, flip = false) {
  const b = new Builder(); const top = steps(b, 8, 7.4);
  b.box(6.4, 3.1, 4.6, A.mat.plaster, 0, top + 1.55, -1.0);
  b.box(6.5, 0.5, 4.7, A.mat.marbleWarm, 0, top + 0.25, -1.0);
  for (const x of [-3.2, -1.07, 1.07, 3.2]) column(b, 3.1, 0.29, x, 2.95, top);
  for (const x of [-3.2, 3.2]) b.box(0.6, 3.1, 0.6, A.mat.marble, x, top + 1.55, 1.3);
  door(b, 0, top, 1.3, 1.3, 2.3); windowAt(b, -2.05, top + 1.75, 1.3); windowAt(b, 2.05, top + 1.75, 1.3);
  for (const z of [-2.2, 0]) for (const s of [-1, 1]) { b.box(0.2, 1.4, 1.2, A.mat.marble, s * 3.2, top + 1.75, z); b.box(0.24, 1.1, 0.9, A.mat.dark, s * 3.21, top + 1.75, z); }
  const h = roofed(b, 7.4, 6.9, top + 3.1, { roofMat });
  b.obj(prop('ceramic_vase_01', 0.9), -3.4, top, 3.3); b.obj(prop('potted_plant_01', 1.5), 3.5, top, 3.3, 1);
  b.obj(prop(flip ? 'brass_vase_01' : 'ceramic_vase_03', 0.8), 2.6, top, 3.35);
  const g = b.build(); g.userData.height = h; return g;
}

function stripes() { const c = document.createElement('canvas'); c.width = 256; c.height = 16; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f3ecdf' : '#b3342f'; x.fillRect(i * 32, 0, 32, 16); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
let awningMat;
export function makeCafe() {
  const b = new Builder();
  awningMat ??= Object.assign(new THREE.MeshStandardMaterial({ map: stripes(), roughness: 0.9, side: THREE.DoubleSide }), { userData: { tile: 3.2 } });
  b.box(9, 0.22, 9, A.mat.cobble, 0, 0.11, 0.8);
  b.box(6.8, 3.3, 4, A.mat.plaster, 0, 1.87, -1.4); b.box(6.9, 0.5, 4.1, A.mat.marbleWarm, 0, 0.47, -1.4);
  b.box(7.3, 0.3, 4.5, A.mat.marble, 0, 3.67, -1.4); b.box(7.5, 0.12, 4.7, A.mat.marble, 0, 3.88, -1.4);
  for (const x of [-3.2, 3.2]) b.box(0.5, 3.3, 0.5, A.mat.marble, x, 1.87, 0.55);
  b.box(3.4, 1.5, 0.3, A.mat.dark, 1.1, 2.3, 0.5); b.box(3.7, 0.16, 0.7, A.mat.wood, 1.1, 1.5, 0.75); b.box(3.6, 1.2, 0.3, A.mat.marbleWarm, 1.1, 0.85, 0.55);
  door(b, -2.0, 0.22, 0.6, 1.1, 2.3, A.mat.wood);
  b.box(4.2, 0.9, 0.16, A.mat.bluePaint, 0, 4.5, 0.4); b.box(4.4, 1.1, 0.1, A.mat.gold, 0, 4.5, 0.33); b.add(boltGeometry(0.34), A.mat.glow, 0, 4.5, 0.55);
  b.box(7.4, 0.06, 3.2, awningMat, 0, 3.05, 2.1, 0, 0.3); b.box(7.4, 0.3, 0.05, awningMat, 0, 2.47, 3.62);
  for (const x of [-3.5, 3.5]) { b.add(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 10), A.mat.wood, x, 1.42, 3.55); b.add(new THREE.SphereGeometry(0.1, 8, 6), A.mat.gold, x, 2.66, 3.55); }
  [[-2.4, 2.6, 0.3], [0.4, 3.4, 1.2], [2.9, 2.5, 2.2]].forEach(([x, z, r]) => {
    b.obj(prop('round_wooden_table_01', 0.78), x, 0.22, z, r);
    for (const a of [0.5, 2.6, 4.6]) b.obj(prop('painted_wooden_chair_01', 0.92), x + Math.cos(a + r) * 0.98, 0.22, z + Math.sin(a + r) * 0.98, -a - r - Math.PI / 2);
    b.obj(prop('ceramic_vase_03', 0.34), x + 0.1, 1.0, z);
  });
  b.obj(prop('wooden_barrels_01', 1.0), -3.6, 0.22, 1.2); b.obj(prop('potted_plant_01', 1.5), 3.9, 0.22, 1.2); b.obj(prop('potted_plant_01', 1.3), -4.0, 0.22, 4.4, 2);
  const g = b.build(); g.userData.height = 5.6; return g;
}

// points spaced evenly along an ellipse, with outward normals
function ellipse(rx, rz, n) {
  const S = 2000, pts = []; let len = 0; const cum = [0];
  for (let i = 1; i <= S; i++) { const a0 = ((i - 1) / S) * Math.PI * 2, a1 = (i / S) * Math.PI * 2; len += Math.hypot(rx * (Math.cos(a1) - Math.cos(a0)), rz * (Math.sin(a1) - Math.sin(a0))); cum.push(len); }
  let j = 0; for (let k = 0; k < n; k++) { const t = (k / n) * len; while (cum[j + 1] < t) j++; const a = ((j + (t - cum[j]) / (cum[j + 1] - cum[j])) / S) * Math.PI * 2; const nx = Math.cos(a) / rx, nz = Math.sin(a) / rz; pts.push({ x: rx * Math.cos(a), z: rz * Math.sin(a), ry: Math.atan2(nx, nz), a }); }
  return { pts, seg: len / n };
}
function archPanel(w, h, aw, ah, depth) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const o = new THREE.Path(); o.moveTo(-aw / 2, 0); o.lineTo(-aw / 2, ah); o.absarc(0, ah, aw / 2, Math.PI, 0, true); o.lineTo(aw / 2, 0); o.closePath(); s.holes.push(o);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -depth / 2); return g;
}
export function makeStadium() {
  const b = new Builder(); const RX = 21, RZ = 15.5, k = RZ / RX, N = 44, m = A.mat.marbleWarm;
  const tiers = 12, r0 = 10.5, step = 0.82, rise = 0.78; const pts = [new THREE.Vector2(r0, 0), new THREE.Vector2(r0, 1.2)];
  for (let i = 0; i < tiers; i++) { pts.push(new THREE.Vector2(r0 + i * step, 1.2 + (i + 1) * rise)); pts.push(new THREE.Vector2(r0 + (i + 1) * step, 1.2 + (i + 1) * rise)); }
  const top = 1.2 + tiers * rise; pts.push(new THREE.Vector2(RX - 0.4, top + 1.1)); pts.push(new THREE.Vector2(RX - 0.4, 0));
  const seatMat = A.mat.marble.clone(); seatMat.side = THREE.DoubleSide; seatMat.userData.tile = 3.2;
  b.add(flat(new THREE.LatheGeometry(pts, 72)), seatMat, 0, 0, 0, 0, 0, 0, new THREE.Vector3(1, 1, k));
  b.add(new THREE.CylinderGeometry(r0 + 0.1, r0 + 0.1, 0.14, 64), A.mat.sand, 0, 0.07, 0, 0, 0, 0, new THREE.Vector3(1, 1, k));
  const { pts: ring, seg } = ellipse(RX + 0.3, RZ + 0.3, N); const w = seg * 1.03, lv = 4.5;
  const p1 = archPanel(w, lv, w * 0.56, lv * 0.52, 1.5), p2 = archPanel(w, lv, w * 0.5, lv * 0.5, 1.3);
  ring.forEach((p, i) => {
    b.add(p1, m, p.x, 0, p.z, p.ry); b.add(p2, m, p.x, lv + 0.4, p.z, p.ry);
    b.box(w, 0.4, 1.9, A.mat.marble, p.x, lv + 0.2, p.z, p.ry); b.box(w, 0.4, 1.7, A.mat.marble, p.x, lv * 2 + 0.6, p.z, p.ry);
    b.box(w, 2.2, 1.0, m, p.x, lv * 2 + 1.9, p.z, p.ry); b.box(w, 0.3, 1.5, A.mat.marble, p.x, lv * 2 + 3.15, p.z, p.ry);
    b.box(w, 0.1, 1.3, A.mat.gold, p.x, lv * 2 + 3.35, p.z, p.ry);
    // pilaster on each joint
    const q = ring[(i + 1) % N]; const jx = (p.x + q.x) / 2 * 1.035, jz = (p.z + q.z) / 2 * 1.035;
    b.add(new THREE.CylinderGeometry(0.26, 0.3, lv - 0.3, 12), A.mat.marble, jx, lv / 2, jz); b.add(new THREE.CylinderGeometry(0.22, 0.26, lv - 0.3, 12), A.mat.marble, jx, lv * 1.5 + 0.4, jz);
    b.box(0.5, 1.9, 0.3, A.mat.marble, jx, lv * 2 + 1.9, jz, p.ry);
    if (i % 4 === 0) { b.add(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), A.mat.wood, p.x, lv * 2 + 5.3, p.z); b.box(1.9, 1.1, 0.05, i % 8 ? A.mat.blueCloth : A.mat.redCloth, p.x + Math.cos(p.ry) * 1.0, lv * 2 + 6.6, p.z - Math.sin(p.ry) * 1.0, p.ry); }
  });
  const g = b.build(); g.userData.height = lv * 2 + 8; g.userData.RX = RX; g.userData.RZ = RZ; return g;
}

export function flame(scale = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + (i % 3) * 0.035, 1), A.mat.flame); f.position.set(Math.cos(i * 2.3) * 0.08, 0.1 + i * 0.1, Math.sin(i * 2.3) * 0.08); f.userData.ph = i * 1.7; g.add(f); }
  g.scale.setScalar(scale); g.userData.flame = true; return g;
}
function brazier(b, x, z, flames, ped = 1.5) {
  b.box(1.0, ped, 1.0, A.mat.marble, x, ped / 2, z); b.box(1.25, 0.14, 1.25, A.mat.marble, x, ped + 0.07, z); b.box(1.25, 0.14, 1.25, A.mat.marble, x, 0.07, z);
  b.obj(prop('stone_fire_pit', 0.42), x, ped + 0.14, z); const f = flame(1.5); f.position.set(x, ped + 0.45, z); flames.push(f); b.extras.push(f);
}
function pedestal(b, x, z, id, h, ped = 1.6, ry = 0) { b.box(0.95, ped, 0.95, A.mat.marble, x, ped / 2, z); b.box(1.15, 0.14, 1.15, A.mat.marble, x, ped + 0.07, z); b.box(1.15, 0.2, 1.15, A.mat.marble, x, 0.1, z); b.obj(prop(id, h), x, ped + 0.14, z, ry); }

export function makeGate(flames) {
  const b = new Builder(); const m = A.mat.marble, sw = A.mat.sandstone;
  for (const s of [-1, 1]) {
    b.box(150, 8, 2.6, sw, s * 84.5, 4, 0); b.box(150, 0.5, 3.2, m, s * 84.5, 8.25, 0); b.box(150, 0.9, 3.0, A.mat.marbleWarm, s * 84.5, 0.45, 0);
    for (let i = 0; i < 30; i++) b.box(1.5, 0.9, 2.6, sw, s * (11.5 + i * 3.2), 8.95, 0);
    b.box(4.4, 11.4, 4.4, sw, s * 7.1, 5.7, 0); b.box(4.8, 0.9, 4.8, A.mat.marbleWarm, s * 7.1, 0.45, 0);
    column(b, 11, 0.62, s * 5.6, 3.1); column(b, 11, 0.62, s * 8.6, 3.1);
    b.obj(prop('lion_head', 1.9), s * 7.1, 5.6, 2.25);
    pedestal(b, s * 11.6, 5.2, 'marble_bust_01', 2.3, 2.2, s * -0.3); brazier(b, s * 3.9, 6.6, flames, 1.3);
  }
  for (let i = 0; i < 3; i++) b.box(21 - i * 0.8, 0.2, 6.4 - i * 0.7, A.mat.marbleWarm, 0, 0.1 + i * 0.2 - 0.2, 2.3);
  // entablature and pediment over the opening
  const y = 11.2, w = 20.6, d = 5.2;
  b.box(w, 0.7, d, m, 0, y + 0.35, 1.0); b.box(w - 0.1, 0.8, d - 0.1, A.mat.marbleWarm, 0, y + 1.1, 1.0);
  for (let i = 0; i <= 22; i++) b.box(0.42, 0.8, 0.12, m, -w / 2 + 0.3 + (i * (w - 0.6)) / 22, y + 1.1, 1.0 + d / 2);
  b.box(w + 0.8, 0.36, d + 0.8, m, 0, y + 1.68, 1.0); b.box(w + 1.0, 0.12, d + 1.0, A.mat.gold, 0, y + 1.92, 1.0);
  const ph = 3.5, cw = w + 0.8, len = Math.hypot(cw / 2, ph), ang = Math.atan2(ph, cw / 2);
  b.add(tri(cw - 0.8, ph - 0.2, 0.4), A.mat.plaster, 0, y + 1.98, 1.0 + d / 2 - 0.5); b.add(tri(cw - 0.8, ph - 0.2, d - 1.4), A.mat.sandstone, 0, y + 1.98, 0.7);
  for (const k of [-1, 1]) { b.box(len + 0.3, 0.34, 0.8, m, (k * cw) / 4, y + 1.98 + ph / 2 + 0.1, 1.0 + d / 2 - 0.2, 0, 0, -k * ang); b.box(len + 0.4, 0.2, d + 0.6, A.mat.roof, (k * cw) / 4, y + 1.98 + ph / 2 + 0.22, 1.0, 0, 0, -k * ang); }
  b.add(boltGeometry(1.15), A.mat.glow, 0, y + 3.35, 1.0 + d / 2 - 0.1);
  b.add(new THREE.SphereGeometry(0.4, 14, 10), A.mat.gold, 0, y + 1.98 + ph + 0.5, 1.0 + d / 2 - 0.2);
  const g = b.build();
  const doors = [];
  for (const s of [-1, 1]) {
    const db = new Builder(); const lw = 4.9, lh = 10.6;
    db.box(lw, lh, 0.36, A.mat.bronze, -s * lw / 2, lh / 2, 0);
    for (let i = 0; i < 4; i++) { for (const zz of [-1, 1]) db.box(lw - 1.0, lh / 4 - 0.7, 0.1, A.mat.bronze, -s * lw / 2, lh / 8 + (i * lh) / 4, zz * 0.2); db.box(lw, 0.16, 0.5, A.mat.gold, -s * lw / 2, (i * lh) / 4 + 0.1, 0); }
    db.box(lw, 0.16, 0.5, A.mat.gold, -s * lw / 2, lh - 0.08, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (const zz of [-1, 1]) db.add(new THREE.SphereGeometry(0.1, 8, 6), A.mat.gold, -s * (0.7 + j * 1.75), 0.55 + (i * lh) / 4, zz * 0.2);
    const pivot = db.build(); pivot.position.set(s * 4.9, 0.2, 0); g.add(pivot); doors.push({ pivot, s });
  }
  g.userData.doors = doors; return g;
}

export function makeFountain() {
  const b = new Builder(); const m = A.mat.marble;
  const prof = [[0, 0], [5.2, 0], [5.2, 0.25], [5.0, 0.25], [4.9, 0.9], [5.1, 1.0], [5.1, 1.15], [4.5, 1.15], [4.5, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y));
  b.add(new THREE.LatheGeometry(prof, 48), m); b.add(new THREE.CylinderGeometry(4.5, 4.5, 0.1, 48), A.mat.water, 0, 0.95, 0);
  const col = [[0, 0.5], [1.0, 0.5], [0.9, 0.8], [0.5, 1.0], [0.42, 2.6], [0.6, 2.8], [2.1, 3.2], [2.2, 3.45], [1.9, 3.45], [0.5, 3.25], [0, 3.25]].map(([x, y]) => new THREE.Vector2(x, y));
  b.add(new THREE.LatheGeometry(col, 40), m); b.add(new THREE.CylinderGeometry(1.9, 1.9, 0.06, 40), A.mat.water, 0, 3.38, 0);
  b.box(0.9, 0.9, 0.5, m, 0, 3.7, 0); b.obj(prop('horse_statue_01', 2.2), 0, 4.15, 0, 0.5);
  return b.build();
}

export function makeStele(texture, flames) {
  const b = new Builder(); const m = A.mat.marble;
  for (let i = 0; i < 3; i++) b.box(11.4 - i * 0.7, 0.24, 3.4 - i * 0.6, A.mat.marbleWarm, 0, 0.12 + i * 0.24, 0.2);
  b.box(8.3, 6.9, 0.9, m, 0, 4.17, 0); b.box(8.9, 0.34, 1.2, m, 0, 7.79, 0); b.box(9.2, 0.14, 1.36, A.mat.gold, 0, 8.03, 0);
  for (const s of [-1, 1]) column(b, 6.9, 0.3, s * 4.45, 0.35, 0.72);
  b.add(tri(9.2, 1.5, 1.2), m, 0, 8.1, 0); b.add(boltGeometry(0.42), A.mat.glow, 0, 8.75, 0.66);
  const g = b.build();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 6.5), new THREE.MeshBasicMaterial({ map: texture, transparent: true, color: new THREE.Color().setRGB(1.25, 1.25, 1.25) }));
  face.position.set(0, 4.17, 0.47); g.add(face);
  const b2 = new Builder(); for (const s of [-1, 1]) { brazier(b2, s * 6.6, 1.6, flames); pedestal(b2, s * 8.6, 0.3, 'marble_bust_01', 1.9, 1.8, -s * 0.4); } g.add(b2.build());
  return g;
}

// the road from the gate, lined with statues and braziers
export function makeSacredWay(flames) {
  const b = new Builder();
  for (let z = 52; z > -36; z -= 11) for (const s of [-1, 1]) { const odd = Math.round((52 - z) / 11) % 2; if (Math.abs(z) < 9) continue; if (odd) brazier(b, s * 4.6, z, flames, 1.2); else pedestal(b, s * 4.6, z, s > 0 ? 'marble_bust_01' : 'lion_head', 1.7, 1.7, s * -1.2); }
  return b.build();
}

// "rises from the ground" effect: a clipping plane with a glowing rim
export function makeRiser(group, footprint) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6); const H = group.userData.height; const cache = new Map();
  group.traverse((o) => { if (!o.isMesh) return; if (!cache.has(o.material)) { const m = o.material.clone(); m.clippingPlanes = [plane]; m.clipShadows = true; cache.set(o.material, m); } o.material = cache.get(o.material); });
  const ring = new THREE.Group();
  if (footprint.r) { const t = new THREE.Mesh(new THREE.TorusGeometry(footprint.r, 0.14, 6, 96), A.mat.glow); t.rotation.x = Math.PI / 2; t.scale.y = footprint.k ?? 1; ring.add(t); }
  else { const { w, d } = footprint; for (const [bw, bd, x, z] of [[w, 0.12, 0, d / 2], [w, 0.12, 0, -d / 2], [0.12, d, w / 2, 0], [0.12, d, -w / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.12, bd), A.mat.glow); m.position.set(x, 0, z + (footprint.oz ?? 0)); ring.add(m); } }
  ring.position.copy(group.position); ring.rotation.y = group.rotation.y; ring.visible = false;
  return { ring, set(p, outline = 0) { group.visible = p > 0; const y = group.position.y + p * H; plane.constant = p >= 1 ? 1e6 : y; ring.visible = (p > 0 && p < 1) || (p <= 0 && outline > 0); ring.position.y = p > 0 ? y : group.position.y + 0.1; } };
}
