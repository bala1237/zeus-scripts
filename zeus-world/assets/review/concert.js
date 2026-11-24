// Concert mode: when the owner plays music, the city becomes the show. Evening falls, every lamp pulses on the beat, beams sweep
// from the wall towers, lantern strings chase over the plaza, coloured light washes the temple and the square, fireworks go up
// every eight beats, a crowd of citizens dances round the fountain, and the camera cuts on the beat.
//   const concert = createConcert({ scene, camera, controls, renderer, tickers, life, get, urls, dn, towers });
//   await concert.start({ bpm });   concert.tap();   concert.listen();   concert.stop();
// The beat comes from a clock at a tempo the owner taps in, or from listening to the music (see listen()).
// Every movement is made in code and timed to the tempo; nothing here costs anything.
import * as THREE from 'three';

const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

// Dances, written at one beat a second and four beats long; played faster or slower to match the tempo.
// Poses are turns seen from outside the figure (which faces +Z), converted to each bone's own frame, as in stand.js.
function danceClips(model) {
  model.updateMatrixWorld(true); const bones = []; model.traverse((o) => { if (o.isBone) bones.push(o); });
  const by = (n) => bones.find((b) => b.name === n), q = new THREE.Quaternion(), r = new THREE.Quaternion(), pw = new THREE.Quaternion(), bw = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const turned = (bone, turns) => { bone.parent.getWorldQuaternion(pw); bone.getWorldQuaternion(bw); q.identity(); for (const [axis, angle] of turns) q.premultiply(r.setFromAxisAngle(axis, angle)); return pw.clone().invert().multiply(q).multiply(bw); };
  const out = {}; for (const s of ['Left', 'Right']) { const up = by(`${s}Arm`), end = by(`${s}Hand`) || by(`${s}ForeArm`); up.getWorldPosition(a); end.getWorldPosition(b); out[s] = Math.atan2(b.x - a.x, a.y - b.y); }
  // each arm's angle from straight down is set by turning it about Z by (wanted angle - the angle it rests at)
  const L = (angle) => angle - out.Left, R = (angle) => -angle - out.Right;
  const legs = (k) => ({ LeftUpLeg: [[X, -0.22 * k]], LeftLeg: [[X, 0.44 * k]], RightUpLeg: [[X, -0.22 * k]], RightLeg: [[X, 0.44 * k]] });
  // k: the bounce, 1 on each beat falling to 0 between; s: a sway, one swing every two beats; h: a slower sway over four beats
  const POSES = {
    Groove: (k, s) => ({ ...legs(k), Hips: [[Z, 0.07 * s]], Head: [[Z, -0.06 * s], [X, 0.09 * k]],
      LeftArm: [[Z, L(0.28)], [X, -0.5 - 0.5 * s]], LeftForeArm: [[X, -1.1]], RightArm: [[Z, R(0.28)], [X, -0.5 + 0.5 * s]], RightForeArm: [[X, -1.1]] }),
    HandsUp: (k, s, h) => ({ ...legs(k), Hips: [[Z, 0.09 * s]], Head: [[X, -0.12]],
      LeftArm: [[Z, L(2.55 + 0.28 * s)]], LeftForeArm: [[X, -0.25 * k]], RightArm: [[Z, R(2.55 - 0.28 * s)]], RightForeArm: [[X, -0.25 * k]] }),
    Clap: (k, s) => ({ ...legs(k * 0.7), Hips: [[Z, 0.05 * s]], Head: [[X, 0.06 * k]],
      LeftArm: [[Z, L(0.2)], [X, -1.15], [Y, -0.15 - 0.42 * k]], LeftForeArm: [[X, -0.5]], RightArm: [[Z, R(0.2)], [X, -1.15], [Y, 0.15 + 0.42 * k]], RightForeArm: [[X, -0.5]] }),
    Ring: (k, s) => ({ LeftUpLeg: [[Z, 0.16 * Math.max(0, s)], [X, -0.15 * k]], LeftLeg: [[X, 0.3 * k]], RightUpLeg: [[Z, -0.16 * Math.max(0, -s)], [X, -0.15 * k]], RightLeg: [[X, 0.3 * k]], Hips: [[Z, 0.05 * s]],
      LeftArm: [[Z, L(1.25 + 0.12 * k)]], LeftForeArm: [[X, -0.3]], RightArm: [[Z, R(1.25 + 0.12 * k)]], RightForeArm: [[X, -0.3]] }),
  };
  const clips = {}, steps = 32, times = Array.from({ length: steps + 1 }, (_, i) => i * 4 / steps);
  for (const [name, fn] of Object.entries(POSES)) { const tracks = [];
    for (const bone of bones) { const v = []; for (const t of times) { const beat = t % 1, k = Math.cos(beat * Math.PI * 2) * 0.5 + 0.5, pose = fn(k * k, Math.sin(t * Math.PI), Math.sin(t * Math.PI / 2))[bone.name], x = pose ? turned(bone, pose) : bone.quaternion; v.push(x.x, x.y, x.z, x.w); }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, v)); }
    const hips = by('Hips'); tracks.push(new THREE.VectorKeyframeTrack('Hips.position', [0, 4], [...hips.position.toArray(), ...hips.position.toArray()]));
    clips[name] = new THREE.AnimationClip(name, 4, tracks); }
  return clips;
}

export function createConcert({ scene, camera, controls, renderer, tickers, life, get, urls, dn, towers = [], onChange = () => {} }) {
  const rnd = (() => { let a = 4711; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const st = { on: false, bpm: 120, beats: 0, pulse: 0, energy: 0.6, listening: false, shot: -1, shotAt: 0, ready: false };
  const group = new THREE.Group(); group.visible = false; group.userData.dynamic = true; scene.add(group);
  const PALETTE = [0xff3d81, 0x38b6ff, 0xffc93c, 0x7cff6b, 0xb967ff, 0xff7a2f], hue = new THREE.Color(), hue2 = new THREE.Color();
  const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  // ---------- beams from the towers: long cones of light that sweep
  const beamGeo = new THREE.CylinderGeometry(0.25, 3.6, 90, 14, 1, true).translate(0, 45, 0);
  const beams = [...towers, [-9, -30], [9, -30]].map(([x, z], i) => { const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    m.position.set(x, i < towers.length ? 11 : 1, z); m.userData = { ph: rnd() * 6.28, k: 0.5 + rnd() * 0.5, toward: Math.atan2(-x, -z) }; group.add(m); return m; });
  // ---------- lantern strings over the plaza, from the fountain's top out to the corners and across the sides
  const ENDS = [[-11, -11], [11, -11], [11, 11], [-11, 11]], PER = 13, strings = [];
  for (let i = 0; i < 4; i++) { strings.push([[0, 6.2, 0], [ENDS[i][0], 4.4, ENDS[i][1]]]); strings.push([[ENDS[i][0], 4.4, ENDS[i][1]], [ENDS[(i + 1) % 4][0], 4.4, ENDS[(i + 1) % 4][1]]]); }
  const lanterns = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false, fog: false }), strings.length * PER); lanterns.frustumCulled = false; group.add(lanterns);
  { const m = new THREE.Matrix4(); strings.forEach(([a, b], s) => { for (let i = 0; i < PER; i++) { const u = (i + 0.5) / PER; m.makeTranslation(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 1.1 * Math.sin(u * Math.PI), a[2] + (b[2] - a[2]) * u); lanterns.setMatrixAt(s * PER + i, m); lanterns.setColorAt(s * PER + i, hue.set(0xffffff)); } }); }
  const glow = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 1.5, map: soft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, fog: false, toneMapped: false, opacity: 0.55 })); glow.frustumCulled = false; group.add(glow);
  { const pos = new Float32Array(strings.length * PER * 3), m = new THREE.Matrix4(), v = new THREE.Vector3(); for (let i = 0; i < strings.length * PER; i++) { lanterns.getMatrixAt(i, m); v.setFromMatrixPosition(m).toArray(pos, i * 3); } glow.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); glow.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(strings.length * PER * 3), 3)); }
  // ---------- coloured light on the square and the temple (real lights, so they are only switched on for the concert)
  const washes = [[0, 7, 0, 46], [0, 6, -34, 60], [-13, 5, 0, 30], [13, 5, 0, 30]].map(([x, y, z, far]) => { const l = new THREE.PointLight(0xffffff, 0, far, 1.3); l.position.set(x, y, z); l.visible = false; scene.add(l); return l; });
  // ---------- fireworks
  const SPARKS = 110, shells = Array.from({ length: 5 }, () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.3, map: soft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, opacity: 0 })); p.frustumCulled = false; group.add(p);
    return { p, age: 9, c: new THREE.Vector3(), v: Array.from({ length: SPARKS }, () => new THREE.Vector3()) }; });
  function firework() { const s = shells.find((x) => x.age > 2.4); if (!s) return; s.age = 0; s.c.set((rnd() - 0.5) * 60, 30 + rnd() * 16, -22 + (rnd() - 0.5) * 50); s.p.material.color.set(PALETTE[Math.floor(rnd() * PALETTE.length)]);
    for (const v of s.v) v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(7 + rnd() * 6); }

  // ---------- the dancers: a ring round the fountain, and a crowd either side of it
  const dancers = [];
  async function gather() { const kinds = []; for (const url of urls) kinds.push({ url, clips: danceClips((await get(url)).scene) });
    const spots = []; for (let i = 0; i < 12; i++) spots.push({ ring: i / 12 * Math.PI * 2 });
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) spots.push({ x: side * (6.6 + i * 1.75) + (rnd() - 0.5) * 0.5, z: -3.4 + j * 2.25 + (rnd() - 0.5) * 0.5, face: side > 0 ? -Math.PI / 2 : Math.PI / 2 });
    for (const [i, spot] of spots.entries()) { const kind = kinds[i % kinds.length], me = await life.spawn(kind.url); me.w.visible = false;
      for (const [n, c] of Object.entries(kind.clips)) me.acts[n] = me.mixer.clipAction(c);
      dancers.push({ me, spot, ph: Math.floor(rnd() * 4) / 4, style: spot.ring !== undefined ? 'Ring' : null }); } }
  const STYLES = ['Groove', 'Clap', 'HandsUp', 'Groove'];
  function restyle(bar) { for (const [i, d] of dancers.entries()) { const name = d.style || STYLES[(bar + (i % 2 ? 1 : 0)) % STYLES.length]; if (d.cur === name) continue; const a = d.me.acts[name]; if (d.act) d.act.fadeOut(0.4); a.reset().fadeIn(0.4).play(); a.time = d.ph * 4; d.act = a; d.cur = name; } }

  // ---------- the camera: cuts on the beat. u runs 0 to 1 over the shot.
  const SHOTS = [
    { beats: 8, fov: 40, at: (u) => { const a = 0.7 + 0.5 * u; return [[36 * Math.sin(a), 19, 36 * Math.cos(a)], [0, 2, -2]]; } },
    { beats: 4, fov: 46, at: (u) => [[14.5 - 1.5 * u, 1.5, 5.2], [8.5, 1.45, 0]] },
    { beats: 4, fov: 36, at: (u) => [[1.4, 2.2, -11.5 - 2 * u], [0, 10, -47]] },
    { beats: 4, fov: 50, at: (u) => { const a = u * 0.9; return [[7.4 * Math.sin(a), 1.7, 7.4 * Math.cos(a) * 0.0 + 5.4 * Math.cos(a)], [0, 1.9, 0]]; } },
    { beats: 8, fov: 44, at: (u) => [[60 - 14 * u, 34, 84 - 10 * u], [0, 8, -12]] },
    { beats: 4, fov: 46, at: (u) => [[-14.5 + 1.5 * u, 1.5, -5.2], [-8.5, 1.45, 0]] },
    { beats: 4, fov: 54, at: (u) => { const a = u * 1.2; return [[0.5 * Math.sin(a), 30, 0.5 * Math.cos(a) + 0.01], [0, 0, 0]]; } },
    { beats: 4, fov: 40, at: (u) => [[0.8, 2.6, 27 - 6 * u], [0, 4, 0]] },
    { beats: 4, fov: 30, at: (u) => [[11.5, 2.0, -3 + 6 * u], [0, 1.7, 0]] },
  ];
  const limits = { polar: controls.maxPolarAngle, near: controls.minDistance, fov: camera.fov, spin: false, cam: null };
  const lens = (fov) => { if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); } };
  function aim(i, u) { const s = SHOTS[i], [p, q] = s.at(u); lens(s.fov); camera.position.set(...p); controls.target.set(...q); }
  let filming = true;

  // ---------- the beat: a clock at the tempo, re-set by taps or by the music when listening
  const taps = []; let audio = null, lastOnset = 0, avg = 0, onsets = [];
  function tap(now = performance.now() / 1000) { if (taps.length && (now - taps.at(-1) > 2.5 || now < taps.at(-1))) taps.length = 0;   // a pause starts a fresh count
    taps.push(now); while (taps.length > 6) taps.shift(); if (taps.length >= 3) { const d = (taps.at(-1) - taps[0]) / (taps.length - 1); st.bpm = Math.round(Math.min(200, Math.max(50, 60 / d))); } st.beats = Math.ceil(st.beats); st.pulse = 1; onChange(st); }
  // Listening: the page hears what the computer is playing and follows it. Chrome is asked to share a tab or the screen "with audio";
  // if that is refused it falls back to the default sound input (a microphone, or a loop-back device if one is set up).
  // source 'test' feeds it a made-up kick drum at ?bpm, to check the detector without any music.
  async function listen(source = 'share') { const ctx = new (window.AudioContext || window.webkitAudioContext)(), an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.5; let stream = null;
    if (source === 'test') { const osc = ctx.createOscillator(), g = ctx.createGain(); osc.frequency.value = 62; g.gain.value = 0; osc.connect(g); g.connect(an); osc.start(); const gap = 60 / (st.testBpm || 128), t0 = ctx.currentTime + 0.3; for (let i = 0; i < 200; i++) { g.gain.setValueAtTime(1, t0 + i * gap); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * gap + 0.16); } }
    else { try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); if (!stream.getAudioTracks().length) { stream.getTracks().forEach((t) => t.stop()); stream = null; } else stream.getVideoTracks().forEach((t) => t.stop()); } catch { stream = null; }
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      ctx.createMediaStreamSource(stream).connect(an); }
    if (ctx.state === 'suspended') await ctx.resume(); audio = { ctx, an, data: new Uint8Array(an.frequencyBinCount), stream }; st.listening = true; onsets = []; avg = 0; onChange(st); }
  function unlisten() { if (!audio) return; audio.stream?.getTracks().forEach((t) => t.stop()); audio.ctx.close(); audio = null; st.listening = false; onChange(st); }
  function hear(now, dt) { const { an, data } = audio; an.getByteFrequencyData(data); let bass = 0, all = 0; for (let i = 1; i <= 5; i++) bass += data[i]; bass /= 5 * 255; for (let i = 1; i < 120; i++) all += data[i]; all /= 119 * 255; level(bass, all, now, dt); }
  // bass and all are the loudness of the low notes and of everything, 0 to 1. A beat is the bass jumping well above its recent average.
  function level(bass, all, now, dt) {
    st.energy += (Math.min(1, all * 2.6) - st.energy) * Math.min(1, dt * 4); avg += (bass - avg) * Math.min(1, dt * 1.6);
    if (bass > avg * 1.3 + 0.05 && bass > 0.18 && now - lastOnset > 0.27) { const gap = now - lastOnset; lastOnset = now; st.pulse = 1;
      if (gap < 2) { let g = gap; while (g < 60 / 165) g *= 2; while (g > 60 / 75) g /= 2; onsets.push(g); if (onsets.length > 12) onsets.shift(); if (onsets.length >= 4) { const m = [...onsets].sort((a, b) => a - b)[onsets.length >> 1], bpm = Math.round(60 / m); if (bpm !== st.bpm) { st.bpm = bpm; onChange(st); } } }
      st.beats = Math.round(st.beats); } }

  // ---------- running it
  let last = null, lastBeat = -1; const col = new THREE.Color(), M = new THREE.Matrix4();
  tickers.push((t) => { const dt = last === null ? 0.016 : Math.max(0, Math.min(0.1, t - last)); last = t; if (!st.on) return;
    if (audio) hear(performance.now() / 1000, dt); else st.energy += (0.75 - st.energy) * dt;
    st.beats += dt * st.bpm / 60; st.pulse *= Math.exp(-dt * 5.5); const beat = Math.floor(st.beats), bar = Math.floor(beat / 4), e = 0.45 + 0.55 * st.energy;
    if (beat !== lastBeat) { lastBeat = beat; if (!audio) st.pulse = 1; if (beat % 8 === 0) { firework(); if (st.energy > 0.5) firework(); } if (beat % 16 === 0) restyle(Math.floor(beat / 16)); }
    dn.beat = st.pulse * e;
    hue.set(PALETTE[bar % PALETTE.length]); hue2.set(PALETTE[(bar + 2) % PALETTE.length]);
    for (const [i, b] of beams.entries()) { const u = b.userData; b.material.color.copy(i % 2 ? hue : hue2); b.material.opacity = (0.035 + 0.05 * st.pulse) * e; b.rotation.set(0.55 + 0.3 * Math.sin(t * 0.5 * u.k + u.ph), u.toward + 0.9 * Math.sin(t * 0.33 * u.k + u.ph * 2), 0, 'YXZ'); }
    const colors = glow.geometry.attributes.color; for (let i = 0; i < strings.length * PER; i++) { const on = (i + beat) % 3 === 0, k = on ? 0.6 + 0.4 * st.pulse : 0.3; col.set(PALETTE[(Math.floor(i / PER) + bar) % PALETTE.length]).multiplyScalar(k * (0.6 + 0.4 * e)); lanterns.setColorAt(i, col); colors.setXYZ(i, col.r, col.g, col.b); }
    lanterns.instanceColor.needsUpdate = true; colors.needsUpdate = true;
    for (const [i, l] of washes.entries()) { l.color.copy(i % 2 ? hue2 : hue); l.intensity = (i === 1 ? 60 : 55) * (0.35 + 0.65 * st.pulse) * e; }
    for (const s of shells) { if (s.age > 2.4) { s.p.material.opacity = 0; continue; } s.age += dt; const pos = s.p.geometry.attributes.position, k = 1 - Math.exp(-s.age * 2.2); for (let i = 0; i < SPARKS; i++) pos.setXYZ(i, s.c.x + s.v[i].x * k, s.c.y + s.v[i].y * k - 2.2 * s.age * s.age, s.c.z + s.v[i].z * k); pos.needsUpdate = true; s.p.material.opacity = Math.max(0, 1 - s.age / 2.4); }
    // the dancers: the ring turns round the fountain one step a beat; everyone dips a little on the beat
    const turn = st.beats * 0.11, dip = -0.035 * st.pulse;
    for (const d of dancers) { const w = d.me.w; if (d.spot.ring !== undefined) { const a = d.spot.ring + turn; w.position.set(Math.sin(a) * 5.3, 0.07 + dip, Math.cos(a) * 5.3); w.rotation.y = a + Math.PI; } else { w.position.set(d.spot.x, 0.07 + dip, d.spot.z); w.rotation.y = d.spot.face + 0.25 * Math.sin(st.beats * Math.PI / 2 + d.ph * 6); }
      d.me.mixer.timeScale = st.bpm / 60; d.me.mixer.update(dt); }
    if (filming) { if (st.shot < 0 || st.beats - st.shotAt >= SHOTS[st.shot].beats) { st.shot = (st.shot + 1) % SHOTS.length; st.shotAt = Math.floor(st.beats); } aim(st.shot, Math.min(1, (st.beats - st.shotAt) / SHOTS[st.shot].beats)); controls.autoRotate = false; } });

  async function start({ bpm = st.bpm } = {}) { if (st.on || st.starting) return; st.starting = true; if (!st.ready) { await gather(); st.ready = true; } st.starting = false;
    Object.assign(st, { on: true, bpm, beats: 0, pulse: 1, shot: -1, shotAt: 0 }); lastBeat = -1; filming = true; limits.spin = controls.autoRotate; limits.cam = [camera.position.clone(), controls.target.clone()];
    controls.maxPolarAngle = Math.PI; controls.minDistance = 0.5; group.visible = true; for (const l of washes) l.visible = true; for (const d of dancers) { d.me.w.visible = true; d.cur = null; d.act?.stop(); d.act = null; } restyle(0); dn.hold = 1; onChange(st); }
  function stop() { if (!st.on) return; st.on = false; group.visible = false; for (const l of washes) l.visible = false; for (const d of dancers) d.me.w.visible = false; dn.hold = null; dn.beat = 0; unlisten();
    controls.maxPolarAngle = limits.polar; controls.minDistance = limits.near; lens(limits.fov); controls.autoRotate = limits.spin; if (limits.cam) { camera.position.copy(limits.cam[0]); controls.target.copy(limits.cam[1]); } onChange(st); }
  // the viewer grabbing the view keeps the concert going but stops the camera cutting
  const release = () => { if (st.on && filming) { filming = false; lens(limits.fov); } };
  // one shot, for stills
  function pose(i, u = 0.5) { filming = false; aim(Math.min(SHOTS.length - 1, i), u); }
  return { start, stop, tap, listen, unlisten, release, pose, level, state: st, shots: SHOTS.length };
}
