// Measures what the city page holds in memory: node measure.mjs [out.json] [simulated minutes] [width height] [extra query]
// Needs the review server running (npm run review). Rendering here is software, so megabytes of process memory are
// indicative only; the counts and the calculated sizes are exact. See docs/knowledge/performance.md.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [out = 'renders/measure.json', mins = 10, w = 1280, h = 720, extra = ''] = process.argv.slice(2);
const MB = (n) => Math.round(n / 1048576 * 10) / 10;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
// resident memory of the browser's processes, by role
const procs = () => { const r = { renderer: 0, gpu: 0 };
  for (const l of execSync('ps -eo rss,args').toString().split('\n')) { const m = l.trim().match(/^(\d+)\s+(.*)$/); if (!m || !/chrom/i.test(m[2])) continue;
    if (m[2].includes('--type=renderer')) r.renderer = Math.max(r.renderer, +m[1] * 1024); else if (m[2].includes('--type=gpu-process')) r.gpu += +m[1] * 1024; }
  return { tabMB: MB(r.renderer), gpuMB: MB(r.gpu) }; };
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('pageerror', (e) => console.error('page error:', e.message));
await p.goto('about:blank'); const empty = procs();
const t0 = Date.now();
await p.goto(`http://localhost:4180/city.html?shot&light=cycle&${extra}`, { timeout: 0 });
await p.waitForFunction('window.ready === true', null, { timeout: 900000 });
console.error(`loaded and drawn once in ${Math.round((Date.now() - t0) / 1000)} s`);

// what the scene holds, calculated from the objects themselves
const inventory = await p.evaluate(async () => {
  const { renderer, scene, cache, sun } = window.__zw, SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap'];
  const texBytes = (t) => { const i = t.image; if (!i || !i.width) return 0; const px = i.width * i.height, bpp = t.type === 1016 ? 8 : t.type === 1015 ? 16 : 4; return px * bpp * (t.generateMipmaps || t.mipmaps?.length > 1 ? 4 / 3 : 1); };
  const geoBytes = (g) => { let n = g.index ? g.index.array.byteLength : 0; for (const a of Object.values(g.attributes)) n += (a.data ? a.data.array : a.array).byteLength; return n; };
  const tris = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
  const models = [];
  for (const [url, pr] of Object.entries(cache)) { const g = await pr, tex = new Map(), geo = new Map(); let maxTex = 0;
    g.scene.traverse((o) => { if (!o.isMesh) return; geo.set(o.geometry.uuid, o.geometry); for (const m of [].concat(o.material)) for (const s of SLOTS) if (m[s]) { tex.set(m[s].source.uuid, m[s]); maxTex = Math.max(maxTex, m[s].image?.width || 0); } });
    models.push({ model: url.split('/').pop().replace('.glb', ''), textures: tex.size, largest: maxTex, textureBytes: [...tex.values()].reduce((a, t) => a + texBytes(t), 0), geometryBytes: [...geo.values()].reduce((a, x) => a + geoBytes(x), 0), triangles: Math.round([...geo.values()].reduce((a, x) => a + tris(x), 0)) }); }
  // everything in the live scene, each texture and geometry counted once
  const tex = new Map(), geo = new Map(); let meshes = 0, skinned = 0, sceneTris = 0, materials = new Set();
  scene.traverse((o) => { if (o.isSprite) { if (o.material.map) tex.set(o.material.map.source.uuid, o.material.map); return; } if (!o.isMesh) return; meshes++; if (o.isSkinnedMesh) skinned++; geo.set(o.geometry.uuid, o.geometry); sceneTris += tris(o.geometry);
    for (const m of [].concat(o.material)) { materials.add(m); for (const s of SLOTS) if (m[s]) tex.set(m[s].source.uuid, m[s]); } });
  const sm = sun.shadow.mapSize, cv = renderer.domElement, gl = renderer.getContext(), samples = gl.getParameter(gl.SAMPLES) || 1;
  const envs = [scene.environment].filter(Boolean);
  return { models, scene: { meshes, skinned, materials: materials.size, triangles: Math.round(sceneTris), uniqueGeometries: geo.size, uniqueTextures: tex.size,
      textureBytes: [...tex.values()].reduce((a, t) => a + texBytes(t), 0), geometryBytes: [...geo.values()].reduce((a, x) => a + geoBytes(x), 0) },
    shadow: (() => { const m = sun.shadow.map, c = m?.texture.format === 1028 ? 1 : 4, d = m?.depthTexture?.type === 1012 ? 2 : 4; return { size: [sm.x, sm.y], bytes: sm.x * sm.y * (c + d), note: `colour layer ${c} byte(s) a pixel, depth ${d}` }; })(),
    canvas: { size: [cv.width, cv.height], samples, bytes: cv.width * cv.height * 4 * (samples + 2) + cv.width * cv.height * 4 * samples, note: 'multisampled colour and depth, resolved copy, and the kept copy (preserveDrawingBuffer)' },
    hdr: envs.map((e) => [e.image.width, e.image.height]), maxTextureSize: renderer.capabilities.maxTextureSize };
});

// a frame's cost, and how things change over simulated time: tick the scene forward and draw every 30 simulated seconds
const sample = (t) => p.evaluate(async (t) => { const { renderer, scene, camera, tickers, sun } = window.__zw; sun.shadow.autoUpdate = false;
  renderer.render(scene, camera); const i = renderer.info; globalThis.gc?.();
  return { t, drawCalls: i.render.calls, trianglesDrawn: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length, heapMB: Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 }; }, t);
const series = []; const push = async (t) => { const s = { ...(await sample(t)), ...procs() }; series.push(s); console.error(JSON.stringify(s)); };
await push(8);
for (let t = 8; t < mins * 60;) { const to = Math.min(mins * 60, t + 30);
  await p.evaluate(([a, z]) => { for (let x = a + 0.05; x <= z + 1e-6; x += 0.05) for (const f of window.__zw.tickers) f(x); }, [t, to]); t = to; await push(t); }
const result = { when: new Date().toISOString(), viewport: [+w, +h], query: extra, emptyPage: empty, inventory, series };
writeFileSync(out, JSON.stringify(result, null, 1));
const S = inventory.scene, top = (k) => [...inventory.models].sort((a, z) => z[k] - a[k]).slice(0, 12).map((m) => `  ${m.model.padEnd(34)} ${String(MB(m[k])).padStart(7)} MB  largest ${m.largest}`).join('\n');
console.log(`models loaded: ${inventory.models.length}
scene: ${S.meshes} meshes (${S.skinned} skinned), ${S.materials} materials, ${S.triangles.toLocaleString()} triangles, ${S.uniqueGeometries} geometries, ${S.uniqueTextures} textures
calculated graphics memory: textures ${MB(S.textureBytes)} MB, geometry ${MB(S.geometryBytes)} MB, shadow map ${MB(inventory.shadow.bytes)} MB, canvas ${MB(inventory.canvas.bytes)} MB
model textures if nothing were shared: ${MB(inventory.models.reduce((a, m) => a + m.textureBytes, 0))} MB
largest by texture memory:\n${top('textureBytes')}
largest by geometry memory:\n${top('geometryBytes')}
first frame: ${series[0].drawCalls} draw calls, ${series[0].trianglesDrawn.toLocaleString()} triangles drawn
process memory (software rendering): empty page tab ${empty.tabMB} / gpu ${empty.gpuMB} MB; city at start tab ${series[0].tabMB} / gpu ${series[0].gpuMB} MB; after ${mins} simulated minutes tab ${series.at(-1).tabMB} / gpu ${series.at(-1).gpuMB} MB
over time: geometries ${series[0].geometries} -> ${series.at(-1).geometries}, textures ${series[0].textures} -> ${series.at(-1).textures}, script memory ${series[0].heapMB} -> ${series.at(-1).heapMB} MB`);
await b.close();
