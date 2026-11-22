// The siege at the south gate: a TikTok battle shown as a fight outside the wall, driven by the two sides' share of the score.
// Our hoplites form up in front of the gate, the rival's army faces them, and the line between them moves with the score:
// towards the rival's camp when we lead, towards our gate when we trail. Arrows, catapult stones and dust do the rest.
// Everything is made in code (no models), and nothing here damages the city: what a loss leaves behind is ZW-015's job.
//
//   const battle = createBattle({ scene, camera, tickers, gateZ: 60, wallTop: 6, towers: [[-28, 60], [28, 60]], onResult });
//   battle.start({ rival: '@someone', seconds: 80 });   battle.setScore(ours, theirs);   battle.end();   battle.filming(true);
// Until real battle events are connected, city.js feeds it a made-up score.
import * as THREE from 'three';

export function createBattle({ scene, camera, controls = null, tickers, gateZ = 60, wallTop = 6, towers = [], onResult = () => {} }) {
  const rnd = (() => { let a = 2026; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const group = new THREE.Group(); group.visible = false; group.userData.dynamic = true; scene.add(group);
  const NEAR = gateZ + 9, FAR = gateZ + 46, CAMP = gateZ + 62, FILES = 24, RANKS = 3, GAP = 1.9;
  const st = { on: false, phase: 'idle', t: 0, share: 0.5, shown: 0.5, left: 0, seconds: 80, rival: 'Rival', result: null, enter: 0 };

  // ---------- ground: a worn road from the gate to the field
  { const road = new THREE.Mesh(new THREE.PlaneGeometry(6, CAMP - gateZ + 6), new THREE.MeshStandardMaterial({ color: 0xb9a37c, roughness: 1 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, (gateZ + CAMP) / 2 + 3); road.receiveShadow = true; group.add(road); }

  // ---------- soldiers: each army is a handful of instanced shapes, one copy per soldier
  const COL = { us: { tunic: 0xf2ead8, shield: 0x2f6fb0, crest: 0xe2a92e }, them: { tunic: 0x3b3642, shield: 0xa3262a, crest: 0x6d1216 } };
  const M4 = new THREE.Matrix4(), base = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const local = (x, y, z, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), ONE);
  function army(side, count) {
    const c = COL[side], std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
    const parts = [
      [new THREE.CylinderGeometry(0.22, 0.3, 1.1, 8), std(c.tunic), local(0, 0.75, 0)],
      [new THREE.SphereGeometry(0.2, 10, 8), std(0xd9a57e), local(0, 1.48, 0)],
      [new THREE.SphereGeometry(0.225, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), std(side === 'us' ? 0xc9a04a : 0x4a4a52, { metalness: 0.7, roughness: 0.35 }), local(0, 1.5, 0)],
      [new THREE.CylinderGeometry(0.075, 0.06, 0.36, 6), std(0xd9a57e), local(-0.11, 0.18, 0)],
      [new THREE.CylinderGeometry(0.075, 0.06, 0.36, 6), std(0xd9a57e), local(0.11, 0.18, 0)],
      [new THREE.BoxGeometry(0.05, 0.15, 0.36), std(c.crest), local(0, 1.76, 0)],
      [new THREE.CylinderGeometry(0.46, 0.46, 0.07, 14), std(c.shield, { metalness: 0.35, roughness: 0.45 }), local(-0.22, 1.0, 0.34, Math.PI / 2)],
      [new THREE.CylinderGeometry(0.1, 0.1, 0.09, 8), std(0xe2a92e, { metalness: 0.6, roughness: 0.35 }), local(-0.22, 1.0, 0.38, Math.PI / 2)],
      [new THREE.CylinderGeometry(0.03, 0.03, 2.5, 5), std(0x5d4630), local(0.3, 1.25, 0.55, 1.15)],
      [new THREE.CircleGeometry(0.5, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), local(0, 0.04, 0, -Math.PI / 2)],
    ].map(([g, m, l]) => { const im = new THREE.InstancedMesh(g, m, count); im.frustumCulled = false; group.add(im); return { im, l }; });
    const men = Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0, face: 0, lunge: 0, ph: rnd() * 6.28, k: 0.7 + rnd() * 0.6, s: 1 }));
    return { parts, men, write() { men.forEach((m, i) => { if (m.s <= 0.01) { for (const p of parts) p.im.setMatrixAt(i, ZERO); return; }
      base.compose(V.set(m.x, m.y, m.z), Q.setFromAxisAngle(UP, m.face), ONE.clone().multiplyScalar(m.s)); M4.makeTranslation(0, 0, m.lunge); base.multiply(M4);
      for (const p of parts) p.im.setMatrixAt(i, M4.multiplyMatrices(base, p.l)); }); for (const p of parts) p.im.instanceMatrix.needsUpdate = true; } };
  }
  const us = army('us', FILES * RANKS), them = army('them', FILES * RANKS), guard = army('us', 14);
  // standards: a pole and a cloth for every sixth file
  const flag = (color, stripe) => { const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 6), new THREE.MeshStandardMaterial({ color: 0x5d4630 })); pole.position.y = 2.2;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 6, 1), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 })); cloth.position.set(0.78, 3.8, 0);
    const band = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.22), new THREE.MeshStandardMaterial({ color: stripe, side: THREE.DoubleSide })); band.position.set(0.78, 3.8, 0.01); g.add(pole, cloth, band); g.userData.cloth = cloth; group.add(g); return g; };
  const flags = { us: [0, 1, 2, 3].map(() => flag(0x2f6fb0, 0xe2a92e)), them: [0, 1, 2, 3].map(() => flag(0xa3262a, 0x1c1418)) };

  // ---------- the rival's camp: tents, a big standard, three catapults
  const camp = new THREE.Group(); group.add(camp);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.2, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x8f2226 : 0xe8dcc4, roughness: 0.9 })); t.position.set(-32 + i * 8 + (rnd() - 0.5) * 2, 1.6, CAMP + 6 + (i % 3) * 3.5); camp.add(t); }
  const engines = [-18, 0, 18].map((x) => { const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6b4d31, roughness: 0.9 }), box = (w, h, d, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(px, py, pz); g.add(m); return m; };
    box(2.4, 0.3, 3.4, 0, 0.3, 0); box(0.25, 2.2, 0.25, -0.9, 1.4, 0.2); box(0.25, 2.2, 0.25, 0.9, 1.4, 0.2); box(2.1, 0.2, 0.2, 0, 2.4, 0.2);
    const arm = new THREE.Group(); arm.position.set(0, 2.3, 0.2); const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.2), wood); beam.position.z = 1.2; arm.add(beam); g.add(arm); g.position.set(x, 0, CAMP - 4); g.userData = { arm, fired: -9 }; camp.add(g); return g; });

  // ---------- things in the air: arrows, stones, dust
  const arrows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 0.95), new THREE.MeshBasicMaterial({ color: 0x2a2018 }), 180); arrows.frustumCulled = false; group.add(arrows);
  const shafts = Array.from({ length: 180 }, () => ({ t: 1, d: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), h: 0 }));
  const stones = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, emissive: 0xff6a1a, emissiveIntensity: 1.6 })); m.visible = false; group.add(m); return { m, t: 1, d: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), h: 0, dust: 0 }; });
  const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const puffs = Array.from({ length: 60 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; group.add(s); return { s, age: 1, life: 0 }; });
  function puff(x, y, z, color, size, life, rise) { const p = puffs.find((q) => q.age >= q.life); if (!p) return; Object.assign(p, { age: 0, life, size, rise, x, y, z }); p.s.material.color.set(color); p.s.visible = true; }
  function loose(a, b, h, d) { const s = shafts.find((q) => q.t >= 1); if (!s) return; s.t = 0; s.d = d; s.a.copy(a); s.b.copy(b); s.h = h; }
  function hurl(a, b, h, d, dust) { const s = stones.find((q) => q.t >= 1); if (!s) return; s.t = 0; s.d = d; s.a.copy(a); s.b.copy(b); s.h = h; s.dust = dust; s.m.visible = true; }

  // ---------- the score bar on the page: strength only, never numbers
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);display:none;font:700 14px system-ui;color:#1d1a2e;background:rgba(255,255,255,.92);padding:9px 14px 10px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.3);text-align:center;min-width:min(74vw,430px)';
  hud.innerHTML = '<div class="t" style="margin-bottom:6px"></div><div style="display:flex;align-items:center;gap:8px"><span class="a" style="color:#1f5c9a"></span><div style="flex:1;height:12px;border-radius:6px;background:#a3262a;overflow:hidden"><div class="b" style="height:100%;width:50%;background:linear-gradient(90deg,#2f6fb0,#5aa0e0);transition:width .4s"></div></div><span class="r" style="color:#8f1f23"></span></div><div class="n" style="font-weight:600;font-size:12px;margin-top:5px"></div>';
  document.body.append(hud); const $ = (c) => hud.querySelector(c);

  // ---------- the cinematic camera: a film crew's shots of the fight, each held a few seconds with a slow move, then a cut to the next.
  // Every shot is placed from where the fighting line is now, so it stays on the action as the line moves.
  // u runs 0 to 1 over the shot; f is the line's position. Each returns [camera position, what it looks at].
  const SHOTS = {
    line: (u, f, k) => [[k * (33 - 9 * u), 2.3, f + 0.3], [0, 1.5, f]],
    clash: (u, f, k) => [[k * (29 - 5 * u), 2.3, f - 3.4], [k * 6, 1.4, f + 0.6]],
    ours: (u, f, k) => [[k * (9 - 7 * u), 5.2, f - 17], [0, 1.6, f + 10]],
    theirs: (u, f, k) => [[k * (11 - 6 * u), 4.6, f + 15], [0, 3.6, gateZ]],
    engine: (u, f, k) => [[k * 18 + 5.5 - 2 * u, 3.6, CAMP + 3.5], [k * 18 - 5, 2.4, CAMP - 34]],
    wall: (u, f, k) => [[k * (15 - 7 * u), wallTop + 3.2, gateZ - 3.5], [0, 0.6, f]],
    high: (u, f, k) => { const a = k * (0.75 + 0.45 * u); return [[62 * Math.sin(a), 24, f + 50 * Math.cos(a)], [0, 2, f]]; },
    gate: (u, f, k) => [[k * (16 - 5 * u), 3.2, gateZ + 20 - 4 * u], [0, 3.4, gateZ]],
    rout: (u, f, k) => [[k * (10 - 4 * u), 4.2 + 2 * u, f - 16], [0, 2.5, CAMP - 6]],
  };
  const ORDER = ['line', 'clash', 'ours', 'engine', 'wall', 'theirs', 'clash', 'high'];
  const cine = { on: false, name: null, i: -1, t0: 0, len: 7, k: 1, P: new THREE.Vector3(), T: new THREE.Vector3() };
  function nextShot() { let name; if (st.phase === 'after') name = st.result === 'win' ? 'rout' : 'gate'; else { cine.i = (cine.i + 1) % ORDER.length; name = ORDER[cine.i];
      // when we are being pushed back the story is at the gate and on the wall; when we lead it is at their camp
      if (name === 'engine' && st.shown < 0.35) name = 'gate'; if (name === 'wall' && st.shown > 0.7) name = 'ours'; }
    cine.name = name; cine.t0 = st.t; cine.len = name === 'high' ? 8 : 6 + rnd() * 2.5; cine.k = rnd() < 0.5 ? 1 : -1; }
  function aim(name, u, k = 1) { const [p, q] = SHOTS[name](u, frontZ(), k); cine.P.set(...p); cine.T.set(...q); camera.position.copy(cine.P); if (controls) controls.target.copy(cine.T); else camera.lookAt(cine.T); }
  function film() { if (!cine.on) return; if (cine.name === null || st.t - cine.t0 > cine.len || (st.phase === 'after' && cine.name !== 'rout' && cine.name !== 'gate')) nextShot();
    const u = Math.min(1, (st.t - cine.t0) / cine.len); aim(cine.name, u * u * (3 - 2 * u) * 0.5 + u * 0.5, cine.k); }

  // ---------- running it
  const A = new THREE.Vector3(), B = new THREE.Vector3(); let volley = 0, shot = 0, dustAt = 0, last = null;
  const frontZ = () => NEAR + (FAR - NEAR) * st.shown;
  function place(t, dt) {
    const f = frontZ(), winning = st.shown, enter = Math.min(1, st.enter), away = st.phase === 'after' ? Math.min(1, (st.t - st.endAt) / 6) : 0, won = st.result === 'win';
    for (const [arm, dir, lead, list] of [[us, 1, winning, flags.us], [them, -1, 1 - winning, flags.them]]) {
      const mine = arm === us, fled = st.phase === 'after' && (mine ? !won : won) ? away : 0;
      arm.men.forEach((m, i) => { const file = i % FILES, rank = Math.floor(i / FILES), ragged = (1 - lead) * 0.45;
        const home = mine ? gateZ + 2 : CAMP, line = f - dir * (2.1 + rank * GAP), z0 = home + (line - home) * enter, z = z0 + (home - z0) * fled;
        m.x = (file - (FILES - 1) / 2) * 1.9 + Math.sin(t * 0.7 * m.k + m.ph) * (0.12 + ragged); m.z = z + Math.cos(t * 0.9 * m.k + m.ph) * (0.1 + ragged * 0.8);
        m.y = Math.abs(Math.sin(t * 4.2 * m.k + m.ph)) * 0.06; m.face = dir > 0 ? 0 : Math.PI; m.s = fled > 0.95 ? 0 : 1;
        m.lunge = rank === 0 && st.phase === 'fight' ? Math.max(0, Math.sin(t * 2.6 * m.k + m.ph * 3)) ** 6 * 0.55 : 0; });
      arm.write();
      list.forEach((g, i) => { const m = arm.men[FILES + 3 + i * 6]; g.position.set(m.x, 0, m.z); g.rotation.y = dir > 0 ? 0 : Math.PI; g.visible = m.s > 0.01; g.userData.cloth.rotation.y = Math.sin(t * 3 + i) * 0.25; });
    }
    guard.men.forEach((m, i) => { m.x = (i - 6.5) * 3.2 + (Math.abs(i - 6.5) < 1 ? Math.sign(i - 6.5) * 2.5 : 0); m.z = gateZ + 0.2; m.y = wallTop - 1.35; m.face = 0; m.lunge = 0; m.s = 1; }); guard.write();
  }
  function tick(t) {
    const dt = last === null ? 0.016 : Math.max(0, Math.min(0.1, t - last)); last = t; if (!st.on) return;
    st.t += dt; st.enter += dt / 7; st.shown += (st.share - st.shown) * Math.min(1, dt * 0.9);
    if (st.phase === 'fight') { st.left = Math.max(0, st.left - dt); if (st.left <= 0) end(); }
    place(t, dt);
    const f = frontZ(), fighting = st.phase === 'fight' && st.enter > 0.9;
    if (fighting) {
      volley -= dt; if (volley <= 0) { volley = 0.55 + rnd() * 0.5; const fromUs = rnd() < 0.35 + 0.3 * st.shown;
        for (let i = 0; i < 9; i++) { const x = (rnd() - 0.5) * 44; if (fromUs) loose(A.set(x, 1.6, f - 6), B.set(x + (rnd() - 0.5) * 6, 0.9, f + 2 + rnd() * 5), 5 + rnd() * 3, 1.1 + rnd() * 0.4); else loose(A.set(x, 1.6, f + 6), B.set(x + (rnd() - 0.5) * 6, 0.9, f - 2 - rnd() * 5), 5 + rnd() * 3, 1.1 + rnd() * 0.4); }
        if (f < gateZ + 30) for (let i = 0; i < 5; i++) { const x = (rnd() - 0.5) * 40; loose(A.set(x, wallTop + 0.6, gateZ + 0.5), B.set(x + (rnd() - 0.5) * 8, 0.9, f + 3 + rnd() * 5), 4, 1.3); } }
      shot -= dt; if (shot <= 0) { shot = 2.2 + rnd() * 2.2;
        if (rnd() < 0.55) { const e = engines[Math.floor(rnd() * engines.length)]; e.userData.fired = st.t; const hitWall = st.shown < 0.4 && rnd() < 0.7, x = (rnd() - 0.5) * (hitWall ? 26 : 40);
          hurl(A.set(e.position.x, 4.5, e.position.z), hitWall ? B.set(x, 1.5 + rnd() * (wallTop - 2), gateZ + 0.9) : B.set(x, 0.3, f - 4 - rnd() * 8), 16, 2.6, hitWall ? 2 : 1); }
        else if (towers.length) { const tw = towers[Math.floor(rnd() * towers.length)], deep = st.shown > 0.6 && rnd() < 0.6; hurl(A.set(tw[0], wallTop + 5, tw[1]), B.set((rnd() - 0.5) * 40, 0.3, deep ? CAMP + 2 + rnd() * 8 : f + 4 + rnd() * 8), 14, 2.4, 1); } }
      dustAt -= dt; if (dustAt <= 0) { dustAt = 0.12; puff((rnd() - 0.5) * 46, 0.6, f + (rnd() - 0.5) * 2.5, 0xd8c8a4, 2.2, 1.4, 1.4); }
    }
    shafts.forEach((s, i) => { if (s.t >= 1) { arrows.setMatrixAt(i, ZERO); return; } s.t = Math.min(1, s.t + dt / s.d); const k = s.t, y = (v) => s.a.y + (s.b.y - s.a.y) * v + s.h * 4 * v * (1 - v);
      A.lerpVectors(s.a, s.b, k); A.y = y(k); B.lerpVectors(s.a, s.b, Math.min(1, k + 0.02)); B.y = y(Math.min(1, k + 0.02)); M4.lookAt(A, B, UP); Q.setFromRotationMatrix(M4); arrows.setMatrixAt(i, M4.compose(A, Q, ONE)); });
    arrows.instanceMatrix.needsUpdate = true;
    for (const s of stones) { if (s.t >= 1) continue; s.t = Math.min(1, s.t + dt / s.d); const k = s.t; s.m.position.lerpVectors(s.a, s.b, k); s.m.position.y += s.h * 4 * k * (1 - k);
      if (s.t >= 1) { s.m.visible = false; for (let i = 0; i < 4 * s.dust; i++) puff(s.b.x + (rnd() - 0.5) * 2, s.b.y + rnd(), s.b.z + (rnd() - 0.5) * 2, s.dust > 1 ? 0xcfc4b0 : 0xd8c8a4, 2.6, 1.6, 2.2); } }
    for (const e of engines) { const a = st.t - e.userData.fired; e.userData.arm.rotation.x = a < 0.35 ? -1.1 * (a / 0.35) : a < 2 ? -1.1 * (1 - (a - 0.35) / 1.65) : 0; }
    for (const p of puffs) { if (p.age >= p.life) { p.s.visible = false; continue; } p.age += dt; const k = p.age / p.life; p.s.position.set(p.x, p.y + p.rise * k, p.z); p.s.scale.setScalar(p.size * (0.5 + k)); p.s.material.opacity = 0.6 * (1 - k); }
    $('.b').style.width = `${Math.round(st.shown * 100)}%`;
    if (st.phase === 'fight') { const s = Math.ceil(st.left); $('.n').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left · ${st.shown > 0.56 ? 'We are pushing them back' : st.shown < 0.44 ? 'They are at our gate. Hold the line!' : 'The line is holding'}`; }
    film();
    if (st.phase === 'after' && st.t - st.endAt > 13) stop();
  }
  tickers.push(tick);

  function start({ rival = 'Rival', seconds = 80, share = 0.5 } = {}) { Object.assign(st, { on: true, phase: 'fight', t: 0, enter: 0, share, shown: share, left: seconds, seconds, rival, result: null }); group.visible = true; hud.style.display = '';
    $('.t').textContent = '⚔ Battle at the South Gate'; $('.a').textContent = 'Zeus World'; $('.r').textContent = rival; for (const s of shafts) s.t = 1; for (const s of stones) { s.t = 1; s.m.visible = false; } }
  const setShare = (s) => { st.share = Math.min(0.97, Math.max(0.03, s)); };
  const setScore = (ours, theirs) => setShare(ours + theirs > 0 ? ours / (ours + theirs) : 0.5);
  function end() { if (st.phase !== 'fight') return; st.phase = 'after'; st.endAt = st.t; st.result = st.share >= 0.5 ? 'win' : 'loss'; st.share = st.result === 'win' ? 0.95 : 0.06;
    $('.t').textContent = st.result === 'win' ? '🏆 Victory at the South Gate!' : 'The gate is battered, but the city stands'; $('.n').textContent = st.result === 'win' ? `${st.rival} is driven from the field` : 'The builders will be needed at dawn';
    onResult(st.result, st); }
  function stop() { st.on = false; st.phase = 'idle'; group.visible = false; hud.style.display = 'none'; cine.on = false; cine.name = null; cine.i = -1; }
  // the cinematic camera takes over the view until filming(false), the battle's end, or the viewer grabbing the view
  const filming = (on) => { cine.on = on; if (on) cine.name = null; };
  // a single frame of the fight at a given share, for stills
  function pose(share, t = 8, shot = null) { start({ rival: '@rival_city', seconds: 80, share }); st.enter = 1; st.left = 47; last = null; for (let x = 0; x <= t; x += 0.05) tick(x); if (shot && SHOTS[shot]) aim(shot, 0.5); }
  return { start, setShare, setScore, end, stop, pose, filming, shots: Object.keys(SHOTS), state: st, cine };
}
