// What happens after a battle is won: the storm of gold, the triumph of the battle's top three, and a tour of the first one's home.
//   const after = createAftermath({ scene, camera, controls, renderer, tickers, life, names, heroModels, height });
//   await after.play({ heroes: [{ name, home }], startAt, onDone });
// A hero's home is { box, front: [x, z] }: the building's bounds (measured before the city's pieces are instanced) and the direction its door faces.
// Everything is made in code. The heroes walk; there is no chariot yet because the catalogue has no horses.
import * as THREE from 'three';

export function createAftermath({ scene, camera, controls, renderer, tickers, life, names, heroModels, height = () => 0.07, instant = false }) {
  const rnd = (() => { let a = 777; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const st = { on: false, phase: null, t: 0, t0: 0, heroes: [], walkers: [], onDone: null, cut: -1 };
  const group = new THREE.Group(); group.visible = false; group.userData.dynamic = true; scene.add(group);
  const ease = (k) => k * k * (3 - 2 * k), clamp = (x) => Math.min(1, Math.max(0, x));
  const P = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();

  // ---------- page layers: a dark wash for the storm, a gold wash for the blaze, a title
  const layer = (css) => { const el = document.createElement('div'); el.style.cssText = `position:fixed;inset:0;pointer-events:none;opacity:0;${css}`; renderer.domElement.after(el); return el; };
  const dark = layer('background:#0d1430;mix-blend-mode:multiply'), gold = layer('background:radial-gradient(circle at 50% 35%,rgba(255,214,110,.9),rgba(255,170,40,.35) 55%,rgba(255,150,20,0) 80%);mix-blend-mode:screen');
  const title = document.createElement('div'); title.style.cssText = 'position:fixed;left:5vw;bottom:15vh;color:#fff;pointer-events:none;opacity:0;transition:opacity 1s;text-shadow:0 2px 14px rgba(0,0,0,.8);font-family:Georgia,"Times New Roman",serif';
  title.innerHTML = '<div class="n" style="font-size:clamp(26px,4.4vw,54px);letter-spacing:.05em;font-variant:small-caps"></div><div style="height:2px;width:72px;background:#e2a92e;margin:8px 0"></div><div class="s" style="font:500 clamp(13px,1.5vw,19px) system-ui;letter-spacing:.04em"></div>';
  document.body.append(title); if (instant) title.style.transition = 'none';
  const say = (n, s) => { title.querySelector('.n').textContent = n; title.querySelector('.s').textContent = s; title.style.opacity = n ? 1 : 0; };

  // ---------- the storm of gold: clouds, Zeus's eyes, a blaze on the temple roof, a rain of gold
  const soft = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
  const cloudTex = soft('rgba(40,44,66,0.95)', 'rgba(40,44,66,0)'), glowTex = soft('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const TEMPLE = new THREE.Vector3(0, 12, -47);
  const clouds = Array.from({ length: 22 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0, fog: false })); s.position.set((rnd() - 0.5) * 150, 34 + rnd() * 16, -75 + (rnd() - 0.5) * 60); s.scale.setScalar(50 + rnd() * 45); s.userData.dx = (rnd() - 0.5) * 2; group.add(s); return s; });
  const eyes = [-7, 7].map((x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfe4ff, transparent: true, depthWrite: false, depthTest: false, opacity: 0, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); s.position.set(x, 33, -74); s.scale.set(9, 3.4, 1); group.add(s); return s; });
  const blaze = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc23a, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); blaze.position.copy(TEMPLE); blaze.scale.setScalar(34); group.add(blaze);
  const blazeLight = new THREE.PointLight(0xffc23a, 0, 120, 1.4); blazeLight.position.set(0, 16, -44); group.add(blazeLight);
  const DROPS = 2600, rainPos = new Float32Array(DROPS * 3); for (let i = 0; i < DROPS; i++) { rainPos[i * 3] = (rnd() - 0.5) * 170; rainPos[i * 3 + 1] = rnd() * 50; rainPos[i * 3 + 2] = (rnd() - 0.5) * 170 - 5; }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xffd45a, size: 0.75, map: glowTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); rain.frustumCulled = false; group.add(rain);
  const STRIKES = [1.6, 2.7, 3.5, 4.4, 5.2, 6.0];

  // ---------- camera: each cut is [start second, lens, a function of (seconds into the phase) giving position and target]
  const limits = { polar: controls.maxPolarAngle, near: controls.minDistance, fov: camera.fov };
  const free = (on) => { controls.maxPolarAngle = on ? Math.PI : limits.polar; controls.minDistance = on ? 0.5 : limits.near; controls.autoRotate = false; if (!on && camera.fov !== limits.fov) { camera.fov = limits.fov; camera.updateProjectionMatrix(); } };
  const lens = (fov) => { if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); } };
  const move = (a, b, k) => { P.set(...a[0]).lerp(A.set(...b[0]), k); T.set(...a[1]).lerp(B.set(...b[1]), k); };
  const lead = () => st.walkers[0]?.w.position || P.set(0, 0, 30);
  // The bridge on the main street has high parapets and apartment blocks on both banks, so the procession is filmed crossing it from
  // over the river to the east, never from the deck or the banks.
  const CUTS = {
    storm: [
      [0, 46, (e) => move([[1.2, 2.2, -5], [0, 22, -52]], [[0.6, 2.6, -9], [0, 24, -52]], ease(clamp(e / 7)))],
      [7, 40, (e) => move([[34, 24, 44], [0, 8, -18]], [[26, 30, 50], [0, 6, -14]], ease(clamp((e - 7) / 7)))],
    ],
    triumph: [
      [0, 40, (e) => move([[3.6, 2.0, 50.5], [0, 1.6, 58]], [[2.9, 2.0, 47.5], [0, 1.6, 53]], ease(clamp(e / 7)))],
      [7, 42, (e) => move([[-13, 20, 45], [0, 1, 34]], [[-11, 16, 39], [0, 1.5, 30]], ease(clamp((e - 7) / 5)))],
      [12, 34, (e) => { const p = lead(); move([[15.5, 2.5, 35.3], [0, 3.2, 35]], [[12.5, 3.0, 35.3], [0, 3.2, 35]], ease(clamp((e - 12) / 7))); T.set(0, p.y + 1.3, Math.min(41, Math.max(29, p.z))); }],
      [19, 36, () => { const p = lead(); P.set(p.x + 1.7, p.y + 2.7, Math.max(8.5, p.z - 6.5)); T.set(p.x, p.y + 1.5, p.z + 1.5); }],
    ],
  };
  function film(name, e) { const cuts = CUTS[name]; let i = 0; while (i + 1 < cuts.length && e >= cuts[i + 1][0]) i++; const hard = i !== st.cut; st.cut = i; lens(cuts[i][1]); cuts[i][2](e);
    const k = hard || name === 'storm' || cuts[i][2].length ? 1 : 0.12; camera.position.lerp(P, k); controls.target.lerp(T, k); }

  // ---------- the triumph: the top three walk in through the south gate and up the main street
  const wreathMat = new THREE.MeshStandardMaterial({ color: 0xe2a92e, metalness: 0.7, roughness: 0.3 });
  async function muster(heroes) { const made = [];
    for (const [i, h] of heroes.entries()) { const z0 = 57 + i * 2.4, graph = { height, nodes: { a: [0, z0], b: [0, 15 + i * 2.2, { stop: [90, 90], face: 0, act: ['Cheer', 'Clap'], p: 1 }] }, edges: [['a', 'b']] };
      const [w] = await life.addWalkers(graph, [heroModels[i % heroModels.length]], 1, { start: 'a', speed: 1.55, lane: 0 });
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 6, 14), wreathMat); crown.rotation.x = Math.PI / 2; crown.position.y = 1.72; w.w.add(crown);
      if (names) { const tag = names.tag(h.name, 0.42); tag.position.y = 2.25; w.w.add(tag); } w.hero = true; made.push(w); }
    return made; }
  let cheerAt = 0;

  // ---------- the house tour: three shots made from the home's own size and the way its door faces
  let home = null; const wreaths = [];
  function survey(h) { const box = h.box;
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), f = new THREE.Vector3(h.front[0], 0, h.front[1]).normalize(), side = new THREE.Vector3(-f.z, 0, f.x), r = Math.max(s.x, s.z) / 2;
    return { c, s, f, side, r, door: c.clone().addScaledVector(f, (Math.abs(f.x) * s.x + Math.abs(f.z) * s.z) / 2) }; }
  // The first two shots stay above roof height, because a home's neighbours can stand only a few metres in front of it; only the last comes down to the door.
  function hang(h) { for (const w of wreaths.splice(0)) w.removeFromParent(); const v = survey(h), m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 20), new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.8 }));
    m.position.copy(v.door).addScaledVector(v.f, 0.12); m.position.y = 3.25; m.lookAt(m.position.clone().add(v.f)); const bow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), wreathMat); bow.position.y = -0.3; m.add(bow); m.userData.dynamic = true; scene.add(m); wreaths.push(m); }
  function tour(e) { const v = home, at = (fwd, sideways, y) => [v.door.x + v.f.x * fwd + v.side.x * sideways, y, v.door.z + v.f.z * fwd + v.side.z * sideways], mid = [v.c.x, v.s.y * 0.5, v.c.z];
    if (e < 6) { lens(40); move([at(15, 6, 9.5), mid], [at(10, 2, 7), mid], ease(clamp(e / 6))); }
    else if (e < 13) { const a = -0.3 + 1.2 * ease(clamp((e - 6) / 7)), d = v.r + 9; lens(36); P.set(v.c.x + (v.f.x * Math.cos(a) + v.side.x * Math.sin(a)) * d, 8.5, v.c.z + (v.f.z * Math.cos(a) + v.side.z * Math.sin(a)) * d); T.set(...mid); }
    else { lens(34); move([at(5.6, -1.0, 1.9), [v.door.x, 2.3, v.door.z]], [at(3.3, -0.4, 2.0), [v.door.x, 2.5, v.door.z]], ease(clamp((e - 13) / 5.5))); }
    camera.position.copy(P); controls.target.copy(T); }

  const LEN = { storm: 14.5, triumph: 27, home: 18.5 };
  function begin(phase, t) { st.phase = phase; st.t0 = t; st.cut = -1; cheerAt = 0;
    if (phase === 'storm') say('The Storm of Gold', 'Zeus has seen the victory');
    if (phase === 'triumph') say('The Triumph', st.heroes.map((h) => h.name).join('  ·  '));
    if (phase === 'home') { home = survey(st.heroes[0].home); hang(st.heroes[0].home); say(`Home of ${st.heroes[0].name}`, 'Champion of the battle'); } }
  const ORDER = ['storm', 'triumph', 'home'];
  let last = null, struck = 0;
  tickers.push((t) => { const dt = last === null ? 0.016 : Math.max(0, Math.min(0.1, t - last)); last = t; if (!st.on) return;
    if (st.t0 === null) { begin(st.phase, t); st.t0 -= st.skip || 0; st.skip = 0; } const e = t - st.t0;
    // the storm's layers ease in and out whatever the phase, so leaving it early never leaves the sky dark
    const s = st.phase === 'storm' ? e : 99, darkK = clamp(s / 1.4) * (1 - clamp((s - 11.5) / 2.5)), goldK = clamp((s - 5) / 2) * (1 - clamp((s - 11.5) / 2.5));
    dark.style.opacity = 0.62 * darkK * (1 - 0.55 * goldK); gold.style.opacity = 0.34 * goldK; group.visible = darkK > 0.005 || goldK > 0.005;
    for (const c of clouds) { c.material.opacity = 0.8 * darkK; c.position.x += c.userData.dx * dt; } for (const y of eyes) y.material.opacity = clamp((s - 0.9) / 0.8) * (1 - clamp((s - 7.5) / 1.5)) * (0.75 + 0.25 * Math.sin(t * 9));
    blaze.material.opacity = 0.85 * goldK; blazeLight.intensity = 900 * goldK; rain.material.opacity = 0.9 * goldK;
    if (goldK > 0) { for (let i = 0; i < DROPS; i++) { rainPos[i * 3 + 1] -= dt * (9 + (i % 7)); if (rainPos[i * 3 + 1] < 0) rainPos[i * 3 + 1] += 50; } rainGeo.attributes.position.needsUpdate = true; }
    if (st.phase === 'storm') { while (struck < STRIKES.length && e >= STRIKES[struck]) { life.strike((rnd() - 0.5) * 9, 11.5, -45 + (rnd() - 0.5) * 6); struck++; } if (e > 5.4 && !cheerAt) { cheerAt = 1; life.cheerNear(0, -10, 400, 8); } film('storm', e); }
    if (st.phase === 'triumph') { const p = lead(); if (e > cheerAt) { cheerAt = e + 2.2; for (const w of life.walkers()) if (!w.hero && Math.hypot(w.w.position.x - p.x, w.w.position.z - p.z) < 11 && w.cheer <= 0) { w.cheer = 3 + rnd() * 2; w.face = Math.atan2(p.x - w.w.position.x, p.z - w.w.position.z); w.yaw = w.face; w.w.rotation.y = w.yaw; w.play(rnd() < 0.6 ? 'Cheer' : 'Clap'); } } film('triumph', e); }
    if (st.phase === 'home') tour(e);
    if (e >= LEN[st.phase]) { const i = ORDER.indexOf(st.phase); if (st.phase === 'triumph') { life.remove(st.walkers); st.walkers = []; } if (i + 1 < ORDER.length && st.heroes.length) begin(ORDER[i + 1], t); else finish(); } });
  function finish() { st.on = false; st.phase = null; say('', ''); dark.style.opacity = 0; gold.style.opacity = 0; group.visible = false; if (st.walkers.length) { life.remove(st.walkers); st.walkers = []; } free(false); const f = st.onDone; st.onDone = null; f?.(); }
  // heroes: the battle's top three, first place first. startAt lets a still or a test begin at 'triumph' or 'home', and skip starts that many seconds into it.
  async function play({ heroes, startAt = 'storm', skip = 0, onDone = null }) { if (st.on) return; st.heroes = heroes; st.onDone = onDone; st.skip = skip; struck = 0; st.walkers = await muster(heroes); free(true); st.phase = startAt; st.t0 = null; st.on = true; }
  return { play, stop: finish, state: st, lengths: LEN };
}
