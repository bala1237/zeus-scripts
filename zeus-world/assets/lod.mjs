// Makes the far-view version of a model: the same shape with far fewer triangles, for use when it is small on screen.
//   node lod.mjs models/nature_cypress_t1.glb 3000 [round]   ->  models/far/nature_cypress_t1.glb
// The far file carries no textures. Each vertex carries a colour instead, averaged from the texture, and in the city the far model
// wears a copy of the near model's material without its texture maps. So it costs no texture memory.
// Skins and animations are kept, so a far citizen can be driven by the near citizen's skeleton. See docs/knowledge/performance.md.
// Generated meshes resist the usual simplifier: they are made of thousands of loose islands it will not join, so it stops well
// short of any target (tried with and without ignoring texture seams). This uses vertex clustering instead: coarse close up,
// but it always reaches the budget and holds the overall shape and colour, which is all that shows at a distance.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dequantize, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs'; import { dirname, basename, join } from 'node:path';

const [src, budget = 4000, mode = ''] = process.argv.slice(2), round = mode === 'round';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src); await doc.transform(dequantize());
const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()), tris = (p) => p.getIndices().getCount() / 3, total = prims.reduce((a, p) => a + tris(p), 0);
let after = 0;
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
for (const p of prims) { const P = p.getAttribute('POSITION'), pos = P.getArray(), n = P.getCount(), old = p.getIndices().getArray(), target = Math.max(12, Math.floor(budget * tris(p) / total));
  // each vertex's colour, read from the texture where the vertex sits on it. The far model carries colours on its vertices instead of a texture:
  // a vertex that stands in for a whole cluster then shows the cluster's average colour, not whatever texel it happened to sit on
  const mat = p.getMaterial(), tex = mat?.getBaseColorTexture(), uv = p.getAttribute('TEXCOORD_0'), f = mat?.getBaseColorFactor() || [1, 1, 1, 1], col = new Float32Array(n * 3);
  const wsum = new Float32Array(n);   // colour is gathered per face and shared out to its corners, weighted by the face's size
  if (tex && uv) { const { data, info } = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), tt = mat.getBaseColorTextureInfo().getExtension('KHR_texture_transform'), off = tt?.getOffset() || [0, 0], sc = tt?.getScale() || [1, 1], U = uv.getArray();
    const texel = (x, y, out) => { x = x * sc[0] + off[0]; y = y * sc[1] + off[1]; const px = Math.min(info.width - 1, Math.floor((x - Math.floor(x)) * info.width)), py = Math.min(info.height - 1, Math.floor((y - Math.floor(y)) * info.height)), o = (py * info.width + px) * 4; for (let c = 0; c < 3; c++) out[c] += lin(data[o + c]) * f[c]; };
    // sampled inside each face, not at its corners: on generated models the corners sit on the texture's seams, which are darker than the surface
    const S = [[1 / 3, 1 / 3, 1 / 3], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]], e1 = [0, 0, 0], e2 = [0, 0, 0];
    for (let i = 0; i < old.length; i += 3) { const t = [old[i], old[i + 1], old[i + 2]], c = [0, 0, 0];
      for (const w of S) texel(w[0] * U[t[0] * 2] + w[1] * U[t[1] * 2] + w[2] * U[t[2] * 2], w[0] * U[t[0] * 2 + 1] + w[1] * U[t[1] * 2 + 1] + w[2] * U[t[2] * 2 + 1], c);
      for (let k = 0; k < 3; k++) { e1[k] = pos[t[1] * 3 + k] - pos[t[0] * 3 + k]; e2[k] = pos[t[2] * 3 + k] - pos[t[0] * 3 + k]; }
      const area = Math.hypot(e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]) + 1e-12;
      for (const v of t) { for (let k = 0; k < 3; k++) col[v * 3 + k] += c[k] / S.length * area; wsum[v] += area; } } }
  else for (let v = 0; v < n; v++) { for (let c = 0; c < 3; c++) col[v * 3 + c] = f[c]; wsum[v] = 1; }
  const nor = p.getAttribute('NORMAL')?.getArray();
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (let v = 0; v < n; v++) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], pos[v * 3 + c]); hi[c] = Math.max(hi[c], pos[v * 3 + c]); }
  const size = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  // snap vertices to a grid and let every vertex in a cell become the first one found there; triangles that collapse or repeat are dropped
  const cluster = (cells) => { const step = size / cells, rep = new Map(), to = new Uint32Array(n);
    for (let v = 0; v < n; v++) { const k = Math.floor((pos[v * 3] - lo[0]) / step) + 2048 * (Math.floor((pos[v * 3 + 1] - lo[1]) / step) + 2048 * Math.floor((pos[v * 3 + 2] - lo[2]) / step)); if (!rep.has(k)) rep.set(k, v); to[v] = rep.get(k); }
    const seen = new Set(), keep = []; for (let i = 0; i < old.length; i += 3) { const a = to[old[i]], b = to[old[i + 1]], c = to[old[i + 2]]; if (a === b || b === c || a === c) continue; const k = [a, b, c].sort((x, y) => x - y).join(','); if (seen.has(k)) continue; seen.add(k); keep.push(a, b, c); }
    return keep; };
  // the finest grid that meets the budget
  let a = 2, b = 1024, idx = cluster(a); while (b - a > 1) { const mid = (a + b) >> 1, t = cluster(mid); if (t.length / 3 <= target) { a = mid; idx = t; } else b = mid; }
  // every vertex that survives takes the average colour and the average facing of the cluster it stands for
  { const step = size / a, sum = new Map(), cell = (v) => Math.floor((pos[v * 3] - lo[0]) / step) + 2048 * (Math.floor((pos[v * 3 + 1] - lo[1]) / step) + 2048 * Math.floor((pos[v * 3 + 2] - lo[2]) / step));
    for (let v = 0; v < n; v++) { const k = cell(v); let t = sum.get(k); if (!t) sum.set(k, t = [0, 0, 0, 0, 0, 0, 0, 0]); for (let c = 0; c < 3; c++) { t[c] += col[v * 3 + c]; if (nor) t[3 + c] += nor[v * 3 + c]; } t[6]++; t[7] += wsum[v]; }
    const c8 = new Uint8Array(n * 3), nn = nor ? new Float32Array(nor) : null, mid = [(lo[0] + hi[0]) / 2, lo[1] + (hi[1] - lo[1]) * 0.55, (lo[2] + hi[2]) / 2];
    for (let v = 0; v < n; v++) { const t = sum.get(cell(v)); for (let c = 0; c < 3; c++) c8[v * 3 + c] = Math.round(255 * Math.min(1, t[c] / (t[7] || 1))); if (nn) { const l = Math.hypot(t[3], t[4], t[5]); if (l > 0.2 * t[6]) for (let c = 0; c < 3; c++) nn[v * 3 + c] = t[3 + c] / l;
        // foliage: leaves face every way, so their own facing lights badly once simplified. Facing outward from the middle of the plant lights it as one rounded mass. Mixed with straight up, so the plant catches the sun evenly whichever side it is seen from, as the many leaf tops of the full model do.
        if (round) { const dx = pos[v * 3] - mid[0], dz = pos[v * 3 + 2] - mid[2], d = [dx, 0.4 * (pos[v * 3 + 1] - mid[1]) + 0.35 * Math.hypot(dx, dz), dz], dl = Math.hypot(...d) || 1; let x = 0; const m = [0, 1, 2].map((c) => 0.35 * d[c] / dl + 0.2 * nn[v * 3 + c] + (c === 1 ? 0.45 : 0)); x = Math.hypot(...m) || 1; for (let c = 0; c < 3; c++) nn[v * 3 + c] = m[c] / x; } } }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(c8).setNormalized(true).setBuffer(P.getBuffer())); if (nn) p.getAttribute('NORMAL').setArray(nn); p.setAttribute('TEXCOORD_0', null); }
  // keep only the vertices still in use
  const map = new Int32Array(n).fill(-1); let m = 0; const out = new Uint32Array(idx.length); for (let i = 0; i < idx.length; i++) { if (map[idx[i]] < 0) map[idx[i]] = m++; out[i] = map[idx[i]]; }
  for (const sem of p.listSemantics()) { const a = p.getAttribute(sem), size = a.getElementSize(), arr = a.getArray(), next = new arr.constructor(m * size); for (let v = 0; v < n; v++) if (map[v] >= 0) for (let c = 0; c < size; c++) next[map[v] * size + c] = arr[v * size + c];
    p.setAttribute(sem, doc.createAccessor().setType(a.getType()).setArray(next).setNormalized(a.getNormalized()).setBuffer(a.getBuffer())); }
  p.setIndices(doc.createAccessor().setType('SCALAR').setArray(m > 65535 ? out : new Uint16Array(out)).setBuffer(p.getIndices().getBuffer())); after += out.length / 3; }
// with its roughness map gone a material would fall back to fully metallic, which renders dark; plants and people are neither metal nor shiny
for (const mat of doc.getRoot().listMaterials()) { if (mat.getMetallicRoughnessTexture()) mat.setMetallicFactor(0).setRoughnessFactor(0.9); mat.setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null); }
await doc.transform(prune());
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
const out = join(dirname(src), 'far', basename(src)); mkdirSync(dirname(out), { recursive: true }); await io.write(out, doc);
console.log(`${out}: ${total} -> ${after} triangles`);
