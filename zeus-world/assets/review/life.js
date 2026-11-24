// Life in the city scene: citizens who walk and stop, buildings that rise as Bolts come in, and birds.
// Everything here is a timed demo loop; in the real game the simulation would drive the same pieces.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { standClip } from './stand.js';

export function createLife({ scene, camera, renderer, get, tickers, farUrl = () => null, farAt = 45, farMaterial = (m) => m }) {
  const rnd = (() => { let a = 99; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const pick = (l) => l[Math.floor(rnd() * l.length)];
  const soft = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
  const blobTex = soft('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'), puffTex = soft('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const blobGeo = new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2);
  const TINTS = [0xffffff, 0xffe2c4, 0xd6e6ff, 0xffd0d0, 0xdff3c8, 0xfff0a8, 0xe9d4ff, 0xc9f0ee];
  const walkers = [];

  // ---------- citizens
  async function spawn(url) {
    const g = await get(url); const o = SkeletonUtils.clone(g.scene); const tint = new THREE.Color(pick(TINTS));
    o.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; m.material = m.material.clone(); m.material.color.multiply(tint); } });
    const hold = new THREE.Group(); hold.add(o); hold.updateMatrixWorld(true);
    o.traverse((m) => { if (m.isSkinnedMesh) m.skeleton.update(); });
    const b = new THREE.Box3().setFromObject(o, true); hold.scale.setScalar((1.66 + rnd() * 0.16) / (b.max.y - b.min.y));
    const w = new THREE.Group(); w.add(hold);   // a soft blob stands in for the shadow: real shadows are drawn once, for the buildings
    const blob = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.position.y = 0.03; w.add(blob);
    scene.add(w);
    // a far-view body on the same skeleton: a fifth of the triangles, swapped in when the citizen is small on screen
    const swap = { hi: [], lo: null, far: false }, fu = farUrl(url); o.traverse((m) => { if (m.isSkinnedMesh) swap.hi.push(m); });
    if (fu && swap.hi.length === 1) { const fg = await get(fu), hi = swap.hi[0]; let src = null; fg.scene.traverse((m) => { if (m.isSkinnedMesh) src ||= m; });
      const bones = src ? src.skeleton.bones.map((b) => hi.skeleton.getBoneByName(b.name)) : [];
      if (src && bones.every(Boolean)) { const lo = new THREE.SkinnedMesh(src.geometry, farMaterial(hi.material)); lo.position.copy(src.position); lo.quaternion.copy(src.quaternion); lo.scale.copy(src.scale); lo.frustumCulled = false; lo.castShadow = false; lo.visible = false;
        hi.parent.add(lo); lo.bind(new THREE.Skeleton(bones, src.skeleton.boneInverses), src.bindMatrix); swap.lo = lo; } }
    const mixer = new THREE.AnimationMixer(o), acts = {}; for (const c of g.animations) acts[c.name] = mixer.clipAction(c);
    acts.Idle = mixer.clipAction(standClip(g.scene));   // the supplied Idle is a turning stride; standing still uses the pose made in stand.js
    const me = { w, mixer, acts, swap, cur: null, yaw: 0,
      play(name, scale = 1) { const a = acts[name] || acts.Idle; if (!a) return; a.timeScale = scale; if (this.cur === a) return; if (this.cur) this.cur.fadeOut(0.3); a.reset().fadeIn(0.3).play(); this.cur = a; } };
    mixer.setTime(rnd() * 3);
    return me;
  }

  // graph: { nodes: { name: [x, z, { stop: [min, max] seconds, face: yaw, act: ['Idle', ...], p: chance of stopping }] }, edges: [[a, b], ...], height: (x, z) => y }
  // opts: start (the node everyone sets out from, in place of a random spot), speed, lane (sideways offset from the line)
  async function addWalkers(graph, urls, count, opts = {}) {
    const nb = {}; for (const [a, b] of graph.edges) { (nb[a] ||= []).push(b); (nb[b] ||= []).push(a); }
    const names = Object.keys(graph.nodes).filter((n) => nb[n]);
    const made = await Promise.all(Array.from({ length: count }, (_, i) => spawn(urls[i % urls.length])));
    for (const me of made) {
      me.graph = graph; me.nb = nb; me.from = opts.start ?? pick(names); me.to = pick(nb[me.from]); me.k = opts.start ? 0 : rnd(); me.speed = opts.speed ?? 0.95 + rnd() * 0.5; me.lane = opts.lane ?? (0.3 + rnd() * 0.45) * (rnd() < 0.85 ? 1 : -1); me.pause = 0; me.cheer = 0;
      const [x, z] = point(me); me.w.position.set(x, graph.height?.(x, z) ?? 0, z); me.play('Walk', me.speed / 1.25); walkers.push(me);
    }
    return made;
  }
  function point(me) { const a = me.graph.nodes[me.from], b = me.graph.nodes[me.to]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    return [a[0] + (b[0] - a[0]) * me.k - dz * me.lane, a[1] + (b[1] - a[1]) * me.k + dx * me.lane, dx, dz, l]; }
  function step(me, dt) {
    if (me.w.visible) me.mixer.update(dt);   // no point posing a skeleton nobody can see; the walk itself carries on below
    if (me.cheer > 0) { me.cheer -= dt; if (me.cheer <= 0) me.play(me.pause > 0 ? 'Idle' : 'Walk', me.speed / 1.25); else return; }
    if (me.pause > 0) { me.pause -= dt; if (me.pause <= 0) me.play('Walk', me.speed / 1.25); else { turn(me, me.face, dt); return; } }
    let [x, z, dx, dz, l] = point(me); me.k += me.speed * dt / l;
    if (me.k >= 1) { const o = me.graph.nodes[me.to][2] || {}, prev = me.from; me.from = me.to; me.k = 0;
      const opts = me.nb[me.from].filter((n) => n !== prev); me.to = opts.length ? pick(opts) : prev;
      if (o.stop && rnd() < (o.p ?? 0.75)) { me.pause = o.stop[0] + rnd() * (o.stop[1] - o.stop[0]); me.face = o.face ?? me.yaw; me.play(pick(o.act || ['Idle'])); return; }
      [x, z, dx, dz] = point(me); }
    const p = me.w.position, f = Math.min(1, dt * 5); p.x += (x - p.x) * f; p.z += (z - p.z) * f; p.y = me.graph.height?.(p.x, p.z) ?? 0;
    turn(me, Math.atan2(dx, dz), dt);
  }
  function turn(me, yaw, dt) { let d = yaw - me.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); me.yaw += d * Math.min(1, dt * 7); me.w.rotation.y = me.yaw; }
  function cheerNear(x, z, r, secs) { for (const me of walkers) if (Math.hypot(me.w.position.x - x, me.w.position.z - z) < r) { me.cheer = secs * (0.7 + rnd() * 0.5); me.face = Math.atan2(x - me.w.position.x, z - me.w.position.z); me.yaw = me.face; me.w.rotation.y = me.yaw; me.play(rnd() < 0.6 ? 'Cheer' : 'Clap'); } }

  // ---------- construction: a building rises behind scaffolding while its Bolts bar fills, then Zeus strikes and the crowd cheers
  const sites = [], labels = document.createElement('div'); labels.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden'; document.body.append(labels);
  const flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;background:#e6f0ff;opacity:0;pointer-events:none'; document.body.append(flash);
  renderer.localClippingEnabled = true;
  const puffs = Array.from({ length: 36 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); return { s, age: 9, life: 1 }; });
  function puff(x, y, z, color, size, life, rise) { const p = puffs.find((q) => q.age >= q.life); if (!p) return; Object.assign(p, { age: 0, life, size, rise, x, y, z }); p.s.material.color.set(color); p.s.visible = true; }
  // lightning: a white-hot core inside a wider blue-white glow, forking on the way down, with a burst of light and sparks where it lands
  const boltCore = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), boltGlow = new THREE.MeshBasicMaterial({ color: 0x9cc8ff, toneMapped: false, fog: false, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
  const boltLight = new THREE.PointLight(0xdfeaff, 0, 140, 1.2); scene.add(boltLight);
  const burst = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xeaf3ff, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); burst.visible = false; scene.add(burst);
  const bolt = new THREE.Group(); bolt.visible = false; scene.add(bolt); let boltAge = 9;
  const yAxis = new THREE.Vector3(0, 1, 0);
  function limb(a, b, r) { const d = b.clone().sub(a), len = d.length(); for (const [mat, k] of [[boltCore, 1], [boltGlow, 4.2]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * k, r * k, len, 6), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(yAxis, d.clone().normalize()); bolt.add(m); } }
  function fork(from, dir, r, steps) { let p = from.clone(); for (let i = 0; i < steps; i++) { const n = p.clone().add(new THREE.Vector3(dir.x * (2.5 + rnd() * 3) + (rnd() - 0.5) * 3, -(2 + rnd() * 3.5), dir.z * (2.5 + rnd() * 3) + (rnd() - 0.5) * 3)); limb(p, n, r * (1 - i / (steps + 1))); p = n; } }
  function strike(x, y, z) { for (const m of bolt.children) m.geometry.dispose(); bolt.clear(); let p = new THREE.Vector3(x, y, z); const nodes = [p];
    while (p.y < 130) { const n = new THREE.Vector3(p.x + (rnd() - 0.5) * 7, p.y + 5 + rnd() * 6, p.z + (rnd() - 0.5) * 7); limb(p, n, 0.11 + 0.1 * Math.min(1, p.y / 60)); p = n; nodes.push(p); }
    for (let i = 0; i < 4; i++) { const from = nodes[2 + Math.floor(rnd() * Math.min(9, nodes.length - 3))], a = rnd() * 6.28; fork(from, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 0.07, 2 + Math.floor(rnd() * 3)); }
    boltLight.position.set(x, y + 6, z); burst.position.set(x, y + 0.6, z); for (let i = 0; i < 10; i++) puff(x + (rnd() - 0.5) * 3, y + rnd() * 1.5, z + (rnd() - 0.5) * 3, i % 2 ? 0xfff0b0 : 0xbfdcff, 1.2, 0.7 + rnd() * 0.5, 2.5 + rnd() * 2); boltAge = 0; }

  async function construct({ name, by, goal, objects, at: [x, z], size: [w, d], height, scaffolds = [], hoist, buildSecs = 70, restSecs = 26, start = 0, workers, builderUrls }) {
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    for (const o of objects) o.traverse((m) => { if (!m.isMesh) return; m.userData.site = true; m.castShadow = false; m.material = m.material.clone(); m.material.clippingPlanes = [plane]; m.material.side = THREE.DoubleSide; });
    const sg = await get(scaffolds.url), scaf = scaffolds.list.map(([sx, sz, ry, sy]) => { const o = sg.scene.clone(true); o.position.set(sx, sy, sz); o.rotation.y = ry; o.userData.dynamic = true; o.traverse((m) => { if (m.isMesh) m.castShadow = false; }); scene.add(o); return o; });   // shown and hidden as the building rises, so it must stay a separate object
    // a timber hoist lifts marble blocks to the top of the wall
    let block, rope; if (hoist) { const [hx, hz, ry] = hoist, H = height + 2.2, wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 }), g = new THREE.Group(); g.position.set(hx, 0, hz); g.rotation.y = ry; scene.add(g);
      const add = (sx, sy, sz, px, py, pz, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wood); m.position.set(px, py, pz); m.rotation.z = rz; g.add(m); };
      add(0.28, H, 0.28, 0, H / 2, 0); add(3.2, 0.2, 0.2, 1.2, H - 0.1, 0); add(0.14, 2.6, 0.14, 0.85, H - 1.0, 0, -0.75); add(1.6, 0.2, 1.6, 0, 0.1, 0);
      block = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 0.65), new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.5 })); scene.add(block);
      rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), new THREE.MeshBasicMaterial({ color: 0xb09868 })); scene.add(rope);
      const tip = new THREE.Vector3(2.6, H - 0.2, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(hx, 0, hz)); block.userData.tip = tip; }
    const el = document.createElement('div'); el.style.cssText = 'position:absolute;transform:translate(-50%,-100%);font:700 13px system-ui;color:#1d1a2e;background:rgba(255,255,255,.9);padding:7px 10px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.25);text-align:center';
    el.innerHTML = '<div class="t"></div><div style="height:7px;border-radius:4px;background:#d9d4c8;margin:5px 0 4px;overflow:hidden"><div class="b" style="height:100%;width:0;background:linear-gradient(90deg,#e2b34a,#ffd978)"></div></div><div class="n" style="font-weight:600;font-size:12px"></div>'; labels.append(el);
    if (workers) (await addWalkers(workers, builderUrls, workers.count || 3)).forEach((m) => { m.builder = true; });
    sites.push({ name, by, goal, x, z, w, d, height, plane, scaf, block, rope, el, buildSecs, restSecs, start, done: null, dust: 0 });
  }
  function siteStep(s, t, dt) {
    const cycle = s.buildSecs + s.restSecs, ph = (t + s.start * cycle) % cycle, k = Math.min(1, ph / s.buildSecs), done = ph >= s.buildSecs, h = 0.25 + k * (s.height + 0.3);
    s.plane.constant = done ? 1e4 : h;
    for (const o of s.scaf) o.visible = !done && o.position.y < h + 0.4;
    if (s.block) { const tip = s.block.userData.tip, c = (t * 0.16 + s.start) % 1, y = 0.4 + Math.min(1, c / 0.8) * Math.max(0.4, Math.min(h + 0.4, tip.y - 1) - 0.4), show = !done && c < 0.86;
      s.block.visible = s.rope.visible = show; s.block.position.set(tip.x, y, tip.z); s.rope.position.set(tip.x, (y + tip.y) / 2 + 0.25, tip.z); s.rope.scale.y = Math.max(0.01, tip.y - y - 0.5); }
    if (!done) { s.dust -= dt; if (s.dust <= 0) { s.dust = 0.35 + rnd() * 0.5; const side = Math.floor(rnd() * 4), u = rnd() - 0.5;
      puff(s.x + (side < 2 ? u * s.w : (side - 2.5) * s.w), h, s.z + (side < 2 ? (side - 0.5) * s.d : u * s.d), 0xe8dcc0, 1.6, 1.3, 1.2); } }
    if (s.done !== null && done && !s.done) { strike(s.x, s.height, s.z); cheerNear(s.x, s.z, 34, 7); for (let i = 0; i < 14; i++) puff(s.x + (rnd() - 0.5) * s.w, s.height * (0.3 + rnd() * 0.8), s.z + (rnd() - 0.5) * s.d, 0xffd45a, 1.4, 1.8, 2.5); }
    s.done = done;
    const bolts = Math.round(s.goal * k / 10) * 10, q = s.el.querySelector.bind(s.el);
    q('.t').textContent = done ? `✔ ${s.name} complete!` : `🔨 ${s.name}`; q('.b').style.width = `${k * 100}%`;
    q('.n').textContent = done ? `Built by ${s.by}` : `⚡ ${bolts.toLocaleString()} / ${s.goal.toLocaleString()} Bolts`;
    camera.updateMatrixWorld();
    const v = new THREE.Vector3(s.x, s.height + 3.5, s.z).project(camera), on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    s.el.style.display = on ? '' : 'none'; if (on) { s.el.style.left = `${(v.x + 1) / 2 * innerWidth}px`; s.el.style.top = `${(1 - v.y) / 2 * innerHeight}px`; }
  }

  // ---------- birds: a small flock circling over the city
  const birds = []; { const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.16, 0, 0, -0.16, 0.62, 0, -0.05], 3)); wing.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: 0x2c2c33, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) { const g = new THREE.Group(), l = new THREE.Mesh(wing, mat), r = new THREE.Mesh(wing, mat); r.scale.x = -1; g.add(l, r); scene.add(g);
      birds.push({ g, l, r, cx: (rnd() - 0.5) * 50, cz: (rnd() - 0.5) * 60 - 6, rad: 14 + rnd() * 26, y: 16 + rnd() * 16, sp: (0.12 + rnd() * 0.1) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * 6.28, flap: 7 + rnd() * 4 }); } }

  let last = null; const frustum = new THREE.Frustum(), view = new THREE.Matrix4(), inv = new THREE.Matrix4(), ball = new THREE.Sphere(new THREE.Vector3(), 1.7);
  tickers.push((t) => { const dt = last === null ? 0.016 : Math.min(0.1, t - last); last = t;
    // citizens outside the camera's view are neither posed nor drawn
    camera.updateMatrixWorld(); frustum.setFromProjectionMatrix(view.multiplyMatrices(camera.projectionMatrix, inv.copy(camera.matrixWorld).invert()));
    for (const me of walkers) { ball.center.copy(me.w.position); ball.center.y += 0.9; me.w.visible = frustum.intersectsSphere(ball); step(me, dt);
      const sw = me.swap; if (sw.lo && me.w.visible) { const d = camera.position.distanceTo(me.w.position), far = sw.far ? d > farAt * 0.93 : d > farAt * 1.07; if (far !== sw.far) { sw.far = far; sw.lo.visible = far; sw.hi[0].visible = !far; } } }
    for (const s of sites) siteStep(s, t, dt);
    for (const p of puffs) { if (p.age >= p.life) { p.s.visible = false; continue; } p.age += dt; const k = p.age / p.life; p.s.position.set(p.x, p.y + p.rise * k, p.z); p.s.scale.setScalar(p.size * (0.5 + k)); p.s.material.opacity = 0.7 * (1 - k); }
    boltAge += dt; bolt.visible = boltAge < 0.55 && (boltAge < 0.12 || Math.sin(boltAge * 70) > -0.2); boltLight.intensity = boltAge < 0.7 ? 1100 * (1 - boltAge / 0.7) : 0; flash.style.opacity = boltAge < 0.4 ? 0.38 * (1 - boltAge / 0.4) : 0;
    burst.visible = boltAge < 0.7; if (burst.visible) { burst.scale.setScalar(6 + 26 * boltAge); burst.material.opacity = 0.9 * (1 - boltAge / 0.7); }
    for (const b of birds) { const a = b.ph + t * b.sp; b.g.position.set(b.cx + Math.cos(a) * b.rad, b.y + Math.sin(t * 0.4 + b.ph) * 1.5, b.cz + Math.sin(a) * b.rad); b.g.rotation.y = -a + (b.sp > 0 ? Math.PI : 0);
      const f = Math.sin(t * b.flap + b.ph) * 0.7; b.l.rotation.z = f; b.r.rotation.z = -f; } });

  // take people out of the city again (a procession that has arrived, for instance)
  function remove(list) { for (const me of list) { const i = walkers.indexOf(me); if (i >= 0) walkers.splice(i, 1); me.mixer.stopAllAction(); scene.remove(me.w); } }
  return { addWalkers, remove, construct, cheerNear, strike, walkers: () => walkers, count: () => walkers.length, shown: () => walkers.filter((m) => m.w.visible).length };
}
