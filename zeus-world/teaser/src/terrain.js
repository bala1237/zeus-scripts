// Terrain, mountains, sky dome and trees.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { A, prop, SKY_SUN_U } from './assets.js';

export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; }
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); a *= 0.5; f *= 2.03; } return s; }
function ridged(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * (1 - Math.abs(noise(x * f, y * f) * 2 - 1)); a *= 0.5; f *= 2.1; } return s; }
const ss = THREE.MathUtils.smoothstep;

export const OLYMPUS = new THREE.Vector3(0, 0, -2100);
export function groundHeight(x, z) {
  const r = Math.hypot(x / 95, z / 115);
  const hills = ss(r, 1, 2.6) * (5 + 15 * fbm(x * 0.011 + 3, z * 0.011));
  const far = ss(r, 4.0, 10.0) * (10 + 170 * Math.pow(ridged(x * 0.0022 + 7, z * 0.0022 + 2), 1.6));
  const d = Math.hypot(x - OLYMPUS.x, (z - OLYMPUS.z) * 1.15);
  const oly = 430 * Math.exp(-Math.pow(d / 250, 2)) * (0.62 + 0.5 * ridged(x * 0.004, z * 0.004, 4) + 0.12 * ridged(x * 0.017, z * 0.017, 3)) + 170 * Math.exp(-Math.pow(d / 520, 2));
  return hills + far + oly * ss(r, 5, 9); // the valley floor stays exactly flat
}
OLYMPUS.y = groundHeight(0, -2100);

export function makeTerrain() {
  const N = 440, S = 6400; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position; const col = new Float32Array(pos.count * 3), mix = new Float32Array(pos.count), uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, groundHeight(x, z)); uv.setXY(i, x * 0.22, z * 0.22); }
  g.computeVertexNormals(); const nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const slope = 1 - nor.getY(i);
    const rock = Math.max(ss(slope, 0.2, 0.5), ss(y, 70, 150)); mix[i] = rock;
    const patch = 0.82 + 0.36 * fbm(x * 0.02, z * 0.02, 3); const dry = fbm(x * 0.006 + 9, z * 0.006, 3);
    let r = patch * (0.8 + 0.28 * dry), gg = patch * (1.0 + 0.04 * dry), b = patch * (0.66 - 0.1 * dry);
    const snow = ss(y, 330, 470) * (0.55 + 0.45 * fbm(x * 0.03, z * 0.03, 2));
    const rk = 0.55 + 0.3 * fbm(x * 0.01, z * 0.01, 3); r = r * (1 - rock) + (rk * 0.95 + snow * 1.9) * rock; gg = gg * (1 - rock) + (rk * 0.93 + snow * 1.95) * rock; b = b * (1 - rock) + (rk * 1.0 + snow * 2.1) * rock;
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rockMix', new THREE.BufferAttribute(mix, 1));
  const grass = A.tex.leafy_grass, rock = A.tex.rocky_terrain_02;
  const m = new THREE.MeshStandardMaterial({ map: grass.map, normalMap: grass.nor, roughness: 1, metalness: 0, vertexColors: true, color: 0xa3ad8c });
  if (!location.search.includes('plain')) m.onBeforeCompile = (sh) => {
    sh.uniforms.rockMap = { value: rock.map };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float rockMix; varying float vRock; varying vec2 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRock = rockMix; vW = position.xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D rockMap; varying float vRock; varying vec2 vW;')
      .replace('#include <map_fragment>', 'vec3 gcol = mix(texture2D(map, vW * 0.21).rgb, texture2D(map, vW * 0.027).rgb, 0.5);\nvec3 rcol = mix(texture2D(rockMap, vW * 0.05).rgb, texture2D(rockMap, vW * 0.008).rgb, 0.5) * 1.5;\ndiffuseColor.rgb *= mix(gcol * 1.3, rcol, vRock);');
  };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; return mesh;
}

export function makeSky() {
  const g = new THREE.SphereGeometry(7000, 64, 32); g.scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, fog: false }); // writes depth so ambient occlusion leaves it alone // after the flip the inside faces are front faces
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { mesh, set(key, sunDir, gain) { mat.map = A.sky[key]; mat.color.setRGB(gain[0], gain[1], gain[2]); mesh.rotation.y = SKY_SUN_U[key] * Math.PI * 2 - Math.atan2(sunDir.z, sunDir.x); } };
}

export function makeTrees(blocked) {
  const grp = new THREE.Group(); const r = rng(23);
  const base = new THREE.IcosahedronGeometry(1, 3); const cyp = [], trunks = []; let n = 0, guard = 0;
  while (n < 420 && guard++ < 9000) {
    const wide = n > 170; const x = (r() - 0.5) * (wide ? 900 : 300), z = wide ? -560 + r() * 520 : (r() - 0.5) * 330 - 20; if (blocked(x, z, 4)) continue;
    const y = groundHeight(x, z); const s = 0.8 + r() * 0.9; const g = base.clone(); g.deleteAttribute('uv'); const p = g.attributes.position; const sx = r() * 10;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i); const t = (py + 1) / 2; const w = 1.25 * (1 - 0.45 * t * t); const d = 1 + 0.2 * (fbm(px * 3 + sx, py * 6 + pz * 3, 3) - 0.5) * 2; p.setXYZ(i, px * w * d * s, Math.pow(t, 1.9) * 9.5 * s, pz * w * d * s); }
    g.translate(x, y + 0.5 * s, z); cyp.push(g);
    const t = new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 1.2 * s, 6); t.translate(x, y + 0.5 * s, z); trunks.push(t.toNonIndexed()); n++;
  }
  const cg = mergeGeometries(cyp); cg.computeVertexNormals();
  const p = cg.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + p.getZ(i)) / 1.6; uv[i * 2 + 1] = p.getY(i) / 1.6; } cg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const cm = new THREE.Mesh(cg, A.mat.cypress); cm.castShadow = cm.receiveShadow = true; grp.add(cm);
  const tm = new THREE.Mesh(mergeGeometries(trunks), A.mat.wood); tm.castShadow = true; grp.add(tm);
  return grp;
}

// a few detailed scanned trees and shrubs close to the cameras: [x, z, height, model]
export const HERO_TREES = [[-27, 8, 7.5, 'island_tree_02'], [-22, 24, 5.2, 'searsia_lucida'], [-3, 4, 6.5, 'island_tree_02'], [-24, -2, 5, 'searsia_lucida'], [12, 54, 6, 'searsia_lucida'], [-13, 53, 7, 'island_tree_02'], [44, -6, 5.5, 'searsia_lucida'], [-6, -12, 5, 'searsia_lucida'], [36, 8, 6.5, 'island_tree_02'], [-9.5, 20, 3.2, 'searsia_lucida'], [9, 70, 4.2, 'searsia_lucida'], [-10, 72, 3.6, 'searsia_lucida']];
export function makeHeroTrees() { const g = new THREE.Group(); HERO_TREES.forEach(([x, z, h, id], i) => { const t = prop(id, h); t.position.set(x, groundHeight(x, z) - 0.05, z); t.rotation.y = i * 1.3; g.add(t); }); return g; }
