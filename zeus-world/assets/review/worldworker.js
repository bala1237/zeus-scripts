// Makes one tile of the land off the main thread, so that the picture never stops while new land is prepared (ZW-049).
// In: { id, x, z, size, cells, trees }  (x, z is the tile's corner; trees is how thickly to plant: 1 full, 0 none)
// Out: { id, pos, nor, col, idx, treeA, treeB, grass, rocks, minY, maxY }  ground mesh with a skirt round its edge; two lists of trees [x, y, z, size, turn, shade];
//      grass tufts [x, y, z, size, turn, shade] on the finest tiles only; rocks [x, y, z, size, turn, shade]
import { heightAt, forestAt, groundAt, riverNear, places } from './worldgen.js';
const hash = (x, z, k) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(k | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
self.onmessage = (e) => { const { id, x, z, size, cells, trees } = e.data, n = cells + 1, step = size / cells, H = new Float32Array((n + 2) * (n + 2));
  // heights one row beyond the tile on every side, so that the lighting matches the neighbouring tiles exactly
  for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) H[(j + 1) * (n + 2) + i + 1] = heightAt(x + i * step, z + j * step);
  const ring = 4 * cells, count = n * n + ring, pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), col = new Float32Array(count * 3), idx = new Uint32Array((cells * cells + ring) * 6); let minY = 1e9, maxY = -1e9;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i, hx = (i) => H[(j + 1) * (n + 2) + i + 1], h = hx(i), wx = x + i * step, wz = z + j * step;
    const dx = H[(j + 1) * (n + 2) + i] - H[(j + 1) * (n + 2) + i + 2], dz = H[j * (n + 2) + i + 1] - H[(j + 2) * (n + 2) + i + 1], l = Math.hypot(dx, 2 * step, dz), N = [dx / l, 2 * step / l, dz / l];
    pos[k * 3] = wx; pos[k * 3 + 1] = h; pos[k * 3 + 2] = wz; nor[k * 3] = N[0]; nor[k * 3 + 1] = N[1]; nor[k * 3 + 2] = N[2]; if (h < minY) minY = h; if (h > maxY) maxY = h;
    // far tiles have no trees of their own, so there the forest is painted onto the ground
    const f = h > 1 ? forestAt(wx, wz, h) : 0, c = groundAt(wx, wz, h, N, f * (trees > 0.5 ? 0.55 : 1)); col[k * 3] = c[0] ** 2.2; col[k * 3 + 1] = c[1] ** 2.2; col[k * 3 + 2] = c[2] ** 2.2; }
  let t = 0; for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[t++] = a; idx[t++] = c; idx[t++] = b; idx[t++] = b; idx[t++] = c; idx[t++] = d; }
  // the skirt: the edge repeated lower down, so that no gap shows where a fine tile meets a coarse one
  const drop = Math.max(3, size * 0.05), edge = []; for (let i = 0; i < cells; i++) edge.push(i); for (let j = 0; j < cells; j++) edge.push(j * n + cells); for (let i = cells; i > 0; i--) edge.push(cells * n + i); for (let j = cells; j > 0; j--) edge.push(j * n);
  for (let e2 = 0; e2 < ring; e2++) { const s = edge[e2], k = n * n + e2; pos[k * 3] = pos[s * 3]; pos[k * 3 + 1] = pos[s * 3 + 1] - drop; pos[k * 3 + 2] = pos[s * 3 + 2]; for (let q = 0; q < 3; q++) { nor[k * 3 + q] = nor[s * 3 + q]; col[k * 3 + q] = col[s * 3 + q]; } }
  for (let e2 = 0; e2 < ring; e2++) { const a = edge[e2], b = edge[(e2 + 1) % ring], c = n * n + e2, d = n * n + (e2 + 1) % ring; idx[t++] = a; idx[t++] = b; idx[t++] = c; idx[t++] = b; idx[t++] = d; idx[t++] = c; }
  // trees: one chance per plot of ground, at a place fixed by the plot's own number, so the same trees always stand in the same places
  const A = [], B = []; if (trees > 0) { const plot = trees >= 1 ? 7.4 : trees >= 0.5 ? 8.4 : 13, i0 = Math.ceil(x / plot), j0 = Math.ceil(z / plot);
    for (let j = j0; j * plot < z + size; j++) for (let i = i0; i * plot < x + size; i++) { const px = (i + hash(i, j, 1) * 0.9) * plot, pz = (j + hash(i, j, 2) * 0.9) * plot, h = heightAt(px, pz); if (h < 1.6) continue; const f = forestAt(px, pz, h);
      // a few lone trees stand in open country too, away from the water
      const lone = f < 0.05 && h > 5 && hash(i, j, 7) < 0.012 && riverNear(px, pz).d > 30; if (hash(i, j, 3) > f * 1.05 && !lone) continue;
      const pine = hash(i, j, 4) < 0.16 + 0.55 * Math.min(1, Math.max(0, (h - 110) / 180)) + (lone ? 0.25 : 0), s = (0.72 + 0.5 * hash(i, j, 5)) * (lone ? 1.1 : 1); (pine ? B : A).push(px, h - 0.15, pz, s, hash(i, j, 6) * 6.283, 0.78 + 0.44 * hash(i, j, 8)); } }
  // grass and flowers: only on the finest tiles, which are the ones under the camera. Thick in meadows, thin under trees, none on rock, sand or road.
  const G = [], K = []; if (e.data.grass) { const plot = 1.15, i0 = Math.ceil(x / plot), j0 = Math.ceil(z / plot);
    for (let j = j0; j * plot < z + size; j++) for (let i = i0; i * plot < x + size; i++) { const px = (i + hash(i, j, 11)) * plot, pz = (j + hash(i, j, 12)) * plot, fi = (px - x) / step, fj = (pz - z) / step, ii = Math.min(cells - 1, Math.floor(fi)), jj = Math.min(cells - 1, Math.floor(fj)), u = fi - ii, v = fj - jj, at = (a, b) => H[(b + 1) * (n + 2) + a + 1];
      const h = (at(ii, jj) * (1 - u) + at(ii + 1, jj) * u) * (1 - v) + (at(ii, jj + 1) * (1 - u) + at(ii + 1, jj + 1) * u) * v; if (h < 2.4) continue; if (Math.abs(px - places.village.x) < 10.5 && Math.abs(pz - places.village.z) < 8.5) continue; if (Math.abs(px - places.village.x) < 84 && Math.abs(pz - places.village.z + 1) < 4.2) continue; const sl = Math.abs(at(ii + 1, jj) - at(ii, jj)) + Math.abs(at(ii, jj + 1) - at(ii, jj)); if (sl > step * 0.75) continue;
      const k2 = (jj * n + ii) * 3, green = col[k2 + 1] - Math.max(col[k2], col[k2 + 2]); if (green < 0.02 || hash(i, j, 13) > 0.72) continue; const flower = hash(i, j, 14) < 0.03;
      G.push(px, h - 0.03, pz, (0.55 + 0.75 * hash(i, j, 15)) * (flower ? 1.15 : 1), hash(i, j, 16) * 6.283, flower ? 2 + Math.floor(hash(i, j, 17) * 3) : 0.75 + 0.4 * hash(i, j, 18)); } }
  // rocks: on steep and stony ground, and a few in the open
  if (trees > 0.3) { const plot = 11, i0 = Math.ceil(x / plot), j0 = Math.ceil(z / plot);
    for (let j = j0; j * plot < z + size; j++) for (let i = i0; i * plot < x + size; i++) { const r1 = hash(i, j, 21); if (r1 > 0.34) continue; const px = (i + hash(i, j, 22)) * plot, pz = (j + hash(i, j, 23)) * plot, h = heightAt(px, pz); if (h < 0.4) continue; const e2 = 3, sl = Math.hypot(heightAt(px + e2, pz) - h, heightAt(px, pz + e2) - h) / e2;
      if (sl < 0.3 && r1 > 0.02) continue; K.push(px, h - 0.25, pz, (0.5 + 1.9 * hash(i, j, 24) ** 2) * (sl > 0.3 ? 1.5 : 1), hash(i, j, 25) * 6.283, 0.7 + 0.5 * hash(i, j, 26)); } }
  // undergrowth, on the finest tiles: ferns under the trees, broom on open dry slopes, a fallen log here and there in the forest. Kind: 0 fern, 1 broom, 2 log
  const U = []; if (e.data.grass) { const plot = 3.4, i0 = Math.ceil(x / plot), j0 = Math.ceil(z / plot);
    for (let j = j0; j * plot < z + size; j++) for (let i = i0; i * plot < x + size; i++) { const r1 = hash(i, j, 31); if (r1 > 0.5) continue; const px = (i + hash(i, j, 32)) * plot, pz = (j + hash(i, j, 33)) * plot, h = heightAt(px, pz); if (h < 2.5) continue; const f = forestAt(px, pz, h);
      if (f > 0.3 && r1 < 0.46 * f) U.push(px, h, pz, 0.8 + 0.7 * hash(i, j, 34), hash(i, j, 35) * 6.283, 0); else if (f > 0.4 && r1 > 0.4965) U.push(px, h, pz, 0.85 + 0.4 * hash(i, j, 34), hash(i, j, 35) * 6.283, 2); else if (f < 0.2 && f > 0.001 && r1 < 0.07) U.push(px, h, pz, 0.8 + 0.6 * hash(i, j, 34), hash(i, j, 35) * 6.283, 1); } }
  const treeA = new Float32Array(A), treeB = new Float32Array(B), grass = new Float32Array(G), rocks = new Float32Array(K), under = new Float32Array(U);
  self.postMessage({ id, pos, nor, col, idx, treeA, treeB, grass, rocks, under, minY: minY - drop, maxY }, [pos.buffer, nor.buffer, col.buffer, idx.buffer, treeA.buffer, treeB.buffer, grass.buffer, rocks.buffer, under.buffer]); };
