// Turns a raw generated model into a catalogue-ready one, following the asset bible (part 1.4 and 1.7):
// front faces +Z, origin at bottom centre, real-world size, triangle budget, WebP textures, meshopt.
//
// node normalize.mjs <in.glb> <out.glb> --fit W,H,D [--yaw 45] [--tris 30000] [--tex 1024]
//   --fit   largest uniform scale that fits inside a W x H x D metre box (use 0 to ignore an axis)
//   --yaw   degrees to turn about Y so the front faces +Z (raw image-to-3D models face the diagonal: 45)
//   --tris  triangle budget; the mesh is simplified only if it is over budget
//   --tex   maximum texture size
//   --maxerr  largest simplification error allowed, as a fraction of the model size (default 0.01).
//             Use about 0.003 for foliage: leaves are small, and a looser limit strips them off.
//             The budget is a target: the model stays over it rather than lose its shape.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { getBounds, cloneDocument, simplify, weld, dedup, prune, textureCompress, resample } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const [inp, out, ...rest] = process.argv.slice(2);
const opt = { yaw: 45, tris: 30000, tex: 1024, fit: '0,0,0', maxerr: 0.01 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1];
const [W, H, D] = String(opt.fit).split(',').map(Number);

await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];

// One root node carries the whole correction, so the original hierarchy is untouched.
const root = doc.createNode('root');
for (const n of scene.listChildren()) { scene.removeChild(n); root.addChild(n); }
scene.addChild(root);
const a = Number(opt.yaw) * Math.PI / 180;
root.setRotation([0, Math.sin(a / 2), 0, Math.cos(a / 2)]);

const b = getBounds(scene);
const size = [0, 1, 2].map(i => b.max[i] - b.min[i]);
const ratios = [[W, size[0]], [H, size[1]], [D, size[2]]].filter(([t]) => t > 0).map(([t, s]) => t / s);
const s = ratios.length ? Math.min(...ratios) : 1;
const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
root.setScale([s, s, s]);
root.setTranslation([-cx * s, -b.min[1] * s, -cz * s]);

let tris = 0;
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
const ratio = Math.min(1, Number(opt.tris) / tris);

await doc.transform(dedup(), weld());
// Simplify towards the budget. The error limit starts strict and is relaxed only as far as --maxerr allows.
const count = (d) => { let t = 0; for (const m of d.getRoot().listMeshes()) for (const p of m.listPrimitives()) t += p.getIndices().getCount() / 3; return t; };
const budget = Number(opt.tris);
let work = doc;
if (ratio < 1) for (const error of [0.002, 0.003, 0.005, 0.01, 0.02, 0.05].filter((e) => e <= Number(opt.maxerr))) {
  work = cloneDocument(doc);
  // texture seams stop a single pass early, so repeat until the budget is met or nothing more comes off
  for (let i = 0, t = count(work); i < 6 && t > budget * 1.05; i++) {
    await work.transform(simplify({ simplifier: MeshoptSimplifier, ratio: budget / t, error }));
    const n = count(work); if (n > t * 0.97) break; t = n;
  }
  if (count(work) <= budget * 1.05) break;
}
await work.transform(resample(), prune(), textureCompress({ targetFormat: 'webp', resize: [Number(opt.tex), Number(opt.tex)] }));
work.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, work);

let after = 0;
for (const m of work.getRoot().listMeshes()) for (const p of m.listPrimitives()) after += (p.getIndices()?.getCount() ?? 0) / 3;
const fb = getBounds(work.getRoot().getDefaultScene() || work.getRoot().listScenes()[0]);
const dims = [0, 1, 2].map(i => (fb.max[i] - fb.min[i]).toFixed(2)).join(' x ');
const { size: bytes } = await import('node:fs').then(fs => fs.statSync(out));
console.log(`${out}: ${dims} m, ${Math.round(tris)} -> ${Math.round(after)} triangles, ${(bytes / 1024).toFixed(0)} KB`);
