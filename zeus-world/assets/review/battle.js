// The siege at the south gate: a TikTok battle shown as a fight outside the wall, driven by the two sides' share of the score.
// Our hoplites form up in front of the gate, the rival's army faces them, and the line between them moves with the score:
// towards the rival's camp when we lead, towards our gate when we trail. Arrows, catapult stones and dust do the rest.
// The soldiers are real figures from soldier.js. Nothing here damages the city: what a loss leaves behind is ZW-015's job.
//
//   const battle = createBattle({ scene, camera, controls, tickers, kit, gateZ: 60, wallTop: 6, towers: [[-28, 60], [28, 60]], onResult });
//   battle.start({ rival: '@someone', seconds: 80 });   battle.setScore(ours, theirs);   battle.end();   battle.filming(true);
// Until real battle events are connected, city.js feeds it a made-up score.
import * as THREE from 'three';

export function createBattle({ scene, camera, controls = null, tickers, kit, gateZ = 60, wallTop = 6, towers = [], onResult = () => {} }) {
  const rnd = (() => { let a = 2026; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const group = new THREE.Group(); group.visible = false; group.userData.dynamic = true; scene.add(group);
  const NEAR = gateZ + 9, FAR = gateZ + 46, CAMP = gateZ + 62, FILES = 16, RANKS = 3, GAP = 1.9, STEP = 1.9;
  const st = { on: false, phase: 'idle', t: 0, share: 0.5, shown: 0.5, left: 0, seconds: 80, rival: 'Rival', result: null, enter: 0, shake: 0 };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

  // ---------- ground: a worn road from the gate to the field
  { const road = new THREE.Mesh(new THREE.PlaneGeometry(6, CAMP - gateZ + 6), new THREE.MeshStandardMaterial({ color: 0xb9a37c, roughness: 1 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, (gateZ + CAMP) / 2 + 3); road.receiveShadow = true; group.add(road); }

  // ---------- the armies
  function army(side, count) { const men = Array.from({ length: count }, () => { const sol = kit.make(side); group.add(sol.g); return { x: 0, z: 0, face: 0, act: 'Guard', ph: rnd(), k: 0.8 + rnd() * 0.4, s: 1, sol }; });
    return { men, write() { for (const m of men) { const g = m.sol.g; g.visible = m.s > 0.01; if (!g.visible) continue; g.position.set(m.x, 0, m.z); g.rotation.y = m.face; m.sol.play(m.act, m.act === 'March' ? 1.35 * m.k : m.k, m.ph); } } }; }
  const us = army('us', FILES * RANKS), them = army('them', FILES * RANKS), guard = army('us', 10), everyone = [...us.men, ...them.men, ...guard.men];
  // standards: a pole and a cloth, carried in the second rank
  const flag = (color, stripe) => { const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), new THREE.MeshStandardMaterial({ color: 0x5d4630 })); pole.position.y = 2.3;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 6, 1), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 })); cloth.position.set(0.78, 4.0, 0);
    const band = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.22), new THREE.MeshStandardMaterial({ color: stripe, side: THREE.DoubleSide })); band.position.set(0.78, 4.0, 0.01); g.add(pole, cloth, band); g.userData.cloth = cloth; group.add(g); return g; };
  const flags = { us: [0, 1, 2].map(() => flag(0x2f6fb0, 0xe2a92e)), them: [0, 1, 2].map(() => flag(0xa3262a, 0x1c1418)) };

  // ---------- the rival's camp: tents and three catapults
  const camp = new THREE.Group(); group.add(camp);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.2, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x8f2226 : 0xe8dcc4, roughness: 0.9 })); t.position.set(-32 + i * 8 + (rnd() - 0.5) * 2, 1.6, CAMP + 6 + (i % 3) * 3.5); camp.add(t); }
  const engines = [-18, 0, 18].map((x) => { const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6b4d31, roughness: 0.9 }), box = (w, h, d, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(px, py, pz); g.add(m); return m; };
    box(2.4, 0.3, 3.4, 0, 0.3, 0); box(0.25, 2.2, 0.25, -0.9, 1.4, 0.2); box(0.25, 2.2, 0.25, 0.9, 1.4, 0.2); box(2.1, 0.2, 0.2, 0, 2.4, 0.2);
    const arm = new THREE.Group(); arm.position.set(0, 2.3, 0.2); const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.2), wood); beam.position.z = 1.2; arm.add(beam); g.add(arm); g.position.set(x, 0, CAMP - 4); g.userData = { arm, fired: -9 }; camp.add(g); return g; });

  // ---------- arrows: a shaft, a bronze head and feathers, flying on an arc and left standing where they land
  const ARROWS = 240, wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.8 });
  const arrowParts = [
    [new THREE.CylinderGeometry(0.016, 0.016, 1.05, 5).rotateX(Math.PI / 2), wood],
    [new THREE.ConeGeometry(0.045, 0.16, 5).rotateX(Math.PI / 2).translate(0, 0, 0.6), new THREE.MeshStandardMaterial({ color: 0xb8a070, metalness: 0.7, roughness: 0.35 })],
    [new THREE.BoxGeometry(0.11, 0.004, 0.22).translate(0, 0, -0.42), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9, side: THREE.DoubleSide })],
    [new THREE.BoxGeometry(0.004, 0.11, 0.22).translate(0, 0, -0.42), new THREE.MeshStandardMaterial({ color: 0xb23a32, roughness: 0.9, side: THREE.DoubleSide })],
  ].map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, ARROWS); im.frustumCulled = false; group.add(im); return im; });
  const shafts = Array.from({ length: ARROWS }, () => ({ t: 1, d: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), h: 0, stuck: 0, p: new THREE.Vector3(), v: new THREE.Vector3(0, 0, 1) }));
  const stones = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), new THREE.MeshStandardMaterial({ color: 0x4a4038, emissive: 0xff5a10, emissiveIntensity: 2.2, flatShading: true })); m.visible = false; group.add(m); return { m, t: 1, d: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), h: 0, dust: 0, trail: 0 }; });
  const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const puffs = Array.from({ length: 140 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; group.add(s); return { s, age: 1, life: 0 }; });
  function puff(x, y, z, color, size, life, rise, glow = false) { const p = puffs.find((q) => q.age >= q.life); if (!p) return; Object.assign(p, { age: 0, life, size, rise, x, y, z }); p.s.material.color.set(color); p.s.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; p.s.visible = true; }
  function loose(a, b, h, d) { const s = shafts.find((q) => q.t >= 1 && q.stuck <= 0); if (!s) return; s.t = 0; s.d = d; s.a.copy(a); s.b.copy(b); s.h = h; }
  function hurl(a, b, h, d, dust) { const s = stones.find((q) => q.t >= 1); if (!s) return; s.t = 0; s.d = d; s.a.copy(a); s.b.copy(b); s.h = h; s.dust = dust; s.m.visible = true; }

  // ---------- the score bar on the page: strength only, never numbers
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);display:none;font:700 14px system-ui;color:#1d1a2e;background:rgba(255,255,255,.92);padding:9px 14px 10px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.3);text-align:center;min-width:min(74vw,430px)';
  hud.innerHTML = '<div class="t" style="margin-bottom:6px"></div><div style="display:flex;align-items:center;gap:8px"><span class="a" style="color:#1f5c9a"></span><div style="flex:1;height:12px;border-radius:6px;background:#a3262a;overflow:hidden"><div class="b" style="height:100%;width:50%;background:linear-gradient(90deg,#2f6fb0,#5aa0e0);transition:width .4s"></div></div><span class="r" style="color:#8f1f23"></span></div><div class="n" style="font-weight:600;font-size:12px;margin-top:5px"></div>';
  document.body.append(hud); const $ = (c) => hud.querySelector(c);

  // ---------- the action camera: fast cuts between close shots, hand-held, shaken by every impact.
  // Each shot is placed from where the fighting line is now. u runs 0 to 1 over the shot, f is the line's position, k is which side
  // of the field (1 or -1), and c is what the shot picked to look at when it began (a soldier's place in the line, an arrow, a stone).
  const frontZ = () => NEAR + (FAR - NEAR) * st.shown, fileX = (i) => (i - (FILES - 1) / 2) * STEP;
  const SHOTS = {
    duel: { s: 1.9, fov: 42, at: (u, f, k, c) => [[fileX(c.i) + k * (2.0 - 0.5 * u), 1.05, f + 0.5], [fileX(c.i), 1.4, f - 2.1]] },
    enemy: { s: 1.6, fov: 42, at: (u, f, k, c) => [[fileX(c.i) + k * (2.0 - 0.5 * u), 1.05, f - 0.5], [fileX(c.i), 1.4, f + 2.1]] },
    shields: { s: 2.3, fov: 50, at: (u, f, k) => [[k * (-13 + 20 * u), 1.3, f - 0.1], [k * (-6 + 20 * u), 1.3, f - 2.2]] },
    faces: { s: 1.7, fov: 15, at: (u, f, k) => [[k * (24 - 1.5 * u), 1.72, f - 2.0], [0, 1.6, f - 2.1]] },
    shoulder: { s: 2.0, fov: 54, at: (u, f, k, c) => [[fileX(c.i) + 0.55, 1.95, f - 4.0 + 0.5 * u], [fileX(c.i) - 0.3, 1.45, f + 3]] },
    theirs: { s: 2.0, fov: 54, at: (u, f, k, c) => [[fileX(c.i) - 0.55, 1.95, f + 4.0 - 0.5 * u], [fileX(c.i) + 0.3, 1.5, f - 3]] },
    arrow: { s: 1.7, fov: 58, ride: 'arrow' }, stone: { s: 2.9, fov: 54, ride: 'stone' },
    engine: { s: 1.8, fov: 46, at: (u, f, k, c) => [[c.e + k * (5.2 - 0.8 * u), 2.6, CAMP + 2.6], [c.e - k * 1.5, 2.3, CAMP - 14]] },
    wall: { s: 2.2, fov: 44, at: (u, f, k) => [[k * (7 - 2 * u), wallTop + 2.0, gateZ - 1.6], [k * 1.5, 0.8, f]] },
    wide: { s: 3.2, fov: 38, at: (u, f, k) => { const a = k * (0.8 + 0.25 * u); return [[52 * Math.sin(a), 17, f + 42 * Math.cos(a)], [0, 2, f]]; } },
    gate: { s: 4.5, fov: 42, at: (u, f, k) => [[k * (16 - 5 * u), 3.2, gateZ + 20 - 4 * u], [0, 3.4, gateZ]] },
    rout: { s: 4.5, fov: 40, at: (u, f, k) => [[k * (10 - 4 * u), 4.2 + 2 * u, f - 16], [0, 2.5, CAMP - 6]] },
  };
  const ORDER = ['wide', 'duel', 'faces', 'arrow', 'shields', 'enemy', 'shoulder', 'stone', 'duel', 'wall', 'theirs', 'engine', 'faces', 'arrow', 'duel', 'shields'];
  const cine = { on: false, name: null, i: -1, t0: 0, len: 2, k: 1, c: {}, P: new THREE.Vector3(), T: new THREE.Vector3() };
  const limits = controls ? { polar: controls.maxPolarAngle, near: controls.minDistance, fov: camera.fov } : null;
  const free = (on) => { if (!controls) return; controls.maxPolarAngle = on ? Math.PI : limits.polar; controls.minDistance = on ? 0.3 : limits.near; if (!on && camera.fov !== limits.fov) { camera.fov = limits.fov; camera.updateProjectionMatrix(); } };
  const lens = (fov) => { if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); } };
  function nextShot() { let name; if (st.phase === 'after') name = st.result === 'win' ? 'rout' : 'gate'; else { cine.i = (cine.i + 1) % ORDER.length; name = ORDER[cine.i];
      // when we are being pushed back the story is at the gate; a ride needs something in the air to ride
      if (name === 'engine' && st.shown < 0.35) name = 'gate';
      if (name === 'arrow') { const a = shafts.find((q) => q.t < 0.3 && q.d > 1.0 && q.stuck <= 0); if (a) cine.c = { ride: a }; else name = 'duel'; }
      if (name === 'stone') { const s = stones.find((q) => q.t < 0.35); if (s) cine.c = { ride: s }; else name = 'shields'; } }
    if (!SHOTS[name].ride) cine.c = { i: 2 + Math.floor(rnd() * (FILES - 4)), e: engines[Math.floor(rnd() * engines.length)].position.x };
    cine.name = name; cine.t0 = st.t; cine.len = SHOTS[name].s * (0.9 + rnd() * 0.25); cine.k = rnd() < 0.5 ? 1 : -1; }
  const D = new THREE.Vector3();
  function aim(name, u, k = 1, c = { i: 7, e: 0 }, t = 0) { const shot = SHOTS[name]; lens(shot.fov);
    if (shot.ride) { const o = c.ride, pos = shot.ride === 'arrow' ? o.p : o.m.position; D.copy(shot.ride === 'arrow' ? o.v : D.subVectors(o.b, o.a).setY(0).normalize());
      cine.P.copy(pos).addScaledVector(D, shot.ride === 'arrow' ? -2.4 : -5).add(D.set(0.5, shot.ride === 'arrow' ? 0.55 : 1.6, 0)); cine.T.copy(pos).add(D.set(0, shot.ride === 'arrow' ? 0.05 : -0.4, 0)); }
    else { const [p, q] = shot.at(u, frontZ(), k, c); cine.P.set(...p); cine.T.set(...q); }
    // hand-held: always a little, and a jolt when something lands
    const a = 0.018 + 0.16 * st.shake; cine.P.x += Math.sin(t * 13.1) * a; cine.P.y += Math.sin(t * 17.3 + 1) * a * 0.8; cine.T.x += Math.sin(t * 11.7 + 2) * a * 1.5; cine.T.y += Math.sin(t * 15.1) * a * 1.2;
    camera.position.copy(cine.P); if (controls) controls.target.copy(cine.T); else camera.lookAt(cine.T); }
  function film() { if (!cine.on) return; const shot = SHOTS[cine.name], gone = shot?.ride && cine.c.ride.t >= 1;
    if (cine.name === null || st.t - cine.t0 > cine.len || gone || (st.phase === 'after' && cine.name !== 'rout' && cine.name !== 'gate')) nextShot();
    aim(cine.name, Math.min(1, (st.t - cine.t0) / cine.len), cine.k, cine.c, st.t); }

  // ---------- running it
  const A = new THREE.Vector3(), B = new THREE.Vector3(), frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), inv = new THREE.Matrix4(); let volley = 0, shot = 0, dustAt = 0, last = null;
  function place(t) {
    const f = frontZ(), winning = st.shown, enter = Math.min(1, st.enter), away = st.phase === 'after' ? Math.min(1, (st.t - st.endAt) / 6) : 0, won = st.result === 'win', fighting = st.phase === 'fight' && enter >= 1;
    for (const [arm, dir, lead, list] of [[us, 1, winning, flags.us], [them, -1, 1 - winning, flags.them]]) {
      const mine = arm === us, fled = st.phase === 'after' && (mine ? !won : won) ? away : 0;
      arm.men.forEach((m, i) => { const file = i % FILES, rank = Math.floor(i / FILES), ragged = (1 - lead) * 0.35;
        const home = mine ? gateZ + 2 : CAMP, line = f - dir * (2.1 + rank * GAP), z0 = home + (line - home) * enter, z = z0 + (home - z0) * fled, moving = !fighting || fled > 0;
        m.x = fileX(file) + Math.sin(t * 0.5 * m.k + m.ph * 6) * (0.05 + ragged); m.z = z + Math.cos(t * 0.6 * m.k + m.ph * 6) * (0.05 + ragged * 0.8);
        m.face = (dir > 0) !== (fled > 0) ? 0 : Math.PI; m.s = fled > 0.95 ? 0 : 1; m.act = moving ? 'March' : rank === 0 ? 'Thrust' : 'Guard'; });
      arm.write();
      list.forEach((g, i) => { const m = arm.men[FILES + 2 + i * 5]; g.position.set(m.x + 0.5, 0, m.z); g.rotation.y = dir > 0 ? 0 : Math.PI; g.visible = m.s > 0.01; g.userData.cloth.rotation.y = Math.sin(t * 3 + i) * 0.25; });
    }
    guard.men.forEach((m, i) => { m.x = (i - 4.5) * 3.4 + (Math.abs(i - 4.5) < 1 ? Math.sign(i - 4.5) * 2.6 : 0); m.z = gateZ + 0.15; m.face = 0; m.s = 1; m.act = 'Guard'; }); guard.write();
    for (const m of guard.men) m.sol.g.position.y = wallTop - 1.5;
  }
  function tick(t) {
    const dt = last === null ? 0.016 : Math.max(0, Math.min(0.1, t - last)); last = t; if (!st.on) return;
    st.t += dt; st.enter += dt / 7; st.shown += (st.share - st.shown) * Math.min(1, dt * 0.9); st.shake *= Math.exp(-dt * 3.2);
    if (st.phase === 'fight') { st.left = Math.max(0, st.left - dt); if (st.left <= 0) end(); }
    place(t);
    const f = frontZ(), fighting = st.phase === 'fight' && st.enter > 0.9;
    if (fighting) {
      volley -= dt; if (volley <= 0) { volley = 0.5 + rnd() * 0.45; const fromUs = rnd() < 0.35 + 0.3 * st.shown;
        for (let i = 0; i < 14; i++) { const x = (rnd() - 0.5) * 30; if (fromUs) loose(A.set(x, 1.8, f - 7), B.set(x + (rnd() - 0.5) * 6, 0.25, f + 2.5 + rnd() * 6), 5 + rnd() * 4, 1.2 + rnd() * 0.5); else loose(A.set(x, 1.8, f + 7), B.set(x + (rnd() - 0.5) * 6, 0.25, f - 2.5 - rnd() * 6), 5 + rnd() * 4, 1.2 + rnd() * 0.5); }
        if (f < gateZ + 30) for (let i = 0; i < 6; i++) { const x = (rnd() - 0.5) * 34; loose(A.set(x, wallTop + 0.6, gateZ + 0.5), B.set(x + (rnd() - 0.5) * 8, 0.25, f + 3 + rnd() * 6), 4, 1.4); } }
      shot -= dt; if (shot <= 0) { shot = 2.0 + rnd() * 2.0;
        if (rnd() < 0.55) { const e = engines[Math.floor(rnd() * engines.length)]; e.userData.fired = st.t; const hitWall = st.shown < 0.4 && rnd() < 0.7, x = (rnd() - 0.5) * (hitWall ? 26 : 30);
          hurl(A.set(e.position.x, 4.5, e.position.z), hitWall ? B.set(x, 1.5 + rnd() * (wallTop - 2), gateZ + 0.9) : B.set(x, 0.3, f - 8 - rnd() * 8), 16, 2.6, hitWall ? 2 : 1); }
        else if (towers.length) { const tw = towers[Math.floor(rnd() * towers.length)], deep = st.shown > 0.6 && rnd() < 0.6; hurl(A.set(tw[0], wallTop + 5, tw[1]), B.set((rnd() - 0.5) * 30, 0.3, deep ? CAMP + 2 + rnd() * 8 : f + 8 + rnd() * 8), 14, 2.4, 1); } }
      dustAt -= dt; if (dustAt <= 0) { dustAt = 0.1; puff((rnd() - 0.5) * 32, 0.5, f + (rnd() - 0.5) * 3, 0xd8c8a4, 2.0, 1.4, 1.3); }
    }
    // arrows: fly, then stand where they landed for a few seconds
    shafts.forEach((s, i) => { if (s.t >= 1 && s.stuck <= 0) { for (const im of arrowParts) im.setMatrixAt(i, ZERO); return; }
      if (s.t < 1) { s.t = Math.min(1, s.t + dt / s.d); const k = s.t, y = (v) => s.a.y + (s.b.y - s.a.y) * v + s.h * 4 * v * (1 - v); A.lerpVectors(s.a, s.b, k); A.y = y(k); B.lerpVectors(s.a, s.b, Math.min(1, k + 0.02)); B.y = y(Math.min(1, k + 0.02));
        s.v.subVectors(B, A); if (s.v.lengthSq() > 1e-8) s.v.normalize(); s.p.copy(A); if (s.t >= 1) { s.stuck = 4 + rnd() * 4; s.p.addScaledVector(s.v, -0.35); } }
      else s.stuck -= dt;
      B.copy(s.p).add(s.v); M4.lookAt(B, s.p, UP); Q.setFromRotationMatrix(M4); M4.compose(s.p, Q, ONE); for (const im of arrowParts) im.setMatrixAt(i, M4); });
    for (const im of arrowParts) im.instanceMatrix.needsUpdate = true;
    // stones: a burning trail in flight, and a burst and a jolt where they land
    for (const s of stones) { if (s.t >= 1) continue; s.t = Math.min(1, s.t + dt / s.d); const k = s.t; s.m.position.lerpVectors(s.a, s.b, k); s.m.position.y += s.h * 4 * k * (1 - k); s.m.rotation.x += dt * 5; s.m.rotation.z += dt * 3;
      s.trail -= dt; if (s.trail <= 0) { s.trail = 0.035; const p = s.m.position; puff(p.x, p.y, p.z, 0xff8a2a, 0.9, 0.45, 0.2, true); puff(p.x, p.y + 0.2, p.z, 0x55504a, 1.1, 0.9, 0.9); }
      if (s.t >= 1) { s.m.visible = false; st.shake = Math.min(1, st.shake + 0.5 + 10 / (10 + camera.position.distanceTo(s.b))); for (let i = 0; i < 6; i++) puff(s.b.x + (rnd() - 0.5) * 1.5, s.b.y + 0.4, s.b.z + (rnd() - 0.5) * 1.5, 0xffb040, 1.6, 0.5, 1.5, true);
        for (let i = 0; i < 7 * s.dust; i++) puff(s.b.x + (rnd() - 0.5) * 3, s.b.y + rnd() * 1.2, s.b.z + (rnd() - 0.5) * 3, s.dust > 1 ? 0xcfc4b0 : 0xc9b68e, 3.0, 1.8, 2.6); } }
    for (const e of engines) { const a = st.t - e.userData.fired; e.userData.arm.rotation.x = a < 0.35 ? -1.1 * (a / 0.35) : a < 2 ? -1.1 * (1 - (a - 0.35) / 1.65) : 0; }
    for (const p of puffs) { if (p.age >= p.life) { p.s.visible = false; continue; } p.age += dt; const k = p.age / p.life; p.s.position.set(p.x, p.y + p.rise * k, p.z); p.s.scale.setScalar(p.size * (0.5 + k)); p.s.material.opacity = 0.6 * (1 - k); }
    $('.b').style.width = `${Math.round(st.shown * 100)}%`;
    if (st.phase === 'fight') { const s = Math.ceil(st.left); $('.n').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left · ${st.shown > 0.56 ? 'We are pushing them back' : st.shown < 0.44 ? 'They are at our gate. Hold the line!' : 'The line is holding'}`; }
    film();
    // pose the soldiers the camera can see, after the camera has moved
    camera.updateMatrixWorld(); frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, inv.copy(camera.matrixWorld).invert())); for (const m of everyone) m.sol.update(dt, camera, frustum);
    if (st.phase === 'after' && st.t - st.endAt > 13) stop();
  }
  tickers.push(tick);

  function start({ rival = 'Rival', seconds = 80, share = 0.5 } = {}) { Object.assign(st, { on: true, phase: 'fight', t: 0, enter: 0, share, shown: share, left: seconds, seconds, rival, result: null, shake: 0 }); group.visible = true; hud.style.display = '';
    $('.t').textContent = '⚔ Battle at the South Gate'; $('.a').textContent = 'Zeus World'; $('.r').textContent = rival; for (const s of shafts) { s.t = 1; s.stuck = 0; } for (const s of stones) { s.t = 1; s.m.visible = false; } }
  const setShare = (s) => { st.share = Math.min(0.97, Math.max(0.03, s)); };
  const setScore = (ours, theirs) => setShare(ours + theirs > 0 ? ours / (ours + theirs) : 0.5);
  function end() { if (st.phase !== 'fight') return; st.phase = 'after'; st.endAt = st.t; st.result = st.share >= 0.5 ? 'win' : 'loss'; st.share = st.result === 'win' ? 0.95 : 0.06;
    $('.t').textContent = st.result === 'win' ? '🏆 Victory at the South Gate!' : 'The gate is battered, but the city stands'; $('.n').textContent = st.result === 'win' ? `${st.rival} is driven from the field` : 'The builders will be needed at dawn';
    onResult(st.result, st); }
  function stop() { st.on = false; st.phase = 'idle'; group.visible = false; hud.style.display = 'none'; if (cine.on) free(false); cine.on = false; cine.name = null; cine.i = -1; }
  // the action camera takes over the view until filming(false), the battle's end, or the viewer grabbing the view
  const filming = (on) => { if (on === cine.on) return; cine.on = on; free(on); if (on) cine.name = null; };
  // a single frame of the fight at a given share, for stills; shot names one of the camera's shots
  function pose(share, t = 8, shotName = null) { start({ rival: '@rival_city', seconds: 80, share }); st.enter = 1; st.left = 47; last = null; for (let x = 0; x <= t; x += 0.05) tick(x);
    if (shotName && SHOTS[shotName]) { free(true); let c = { i: 7, e: 0 }; if (SHOTS[shotName].ride) { const o = shotName === 'arrow' ? shafts.find((q) => q.t < 1 && q.t > 0.2) : stones.find((q) => q.t < 1); if (!o) return; c = { ride: o }; } aim(shotName, 0.5, 1, c, t); tick(t); aim(shotName, 0.5, 1, c, t); } }
  return { start, setShare, setScore, end, stop, pose, filming, shots: Object.keys(SHOTS), state: st, cine };
}
