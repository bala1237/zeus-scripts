// The picture side of the gift moments (ZW-045): a storm over the temple, lightning that reaches down and strikes, the flash and the
// ring that spread from where it lands, sparks, gold rain, flames on the pillars, and a name forged in light. gifts.js is the script;
// this draws what it asks for.
//   const fx = createGiftFx({ scene, pillars: [{ x, z, top }], peak: Vector3, soft: a soft round texture });
//   fx.bolt(pillarIndex or -1 for the temple's peak, power);   fx.arc(fromPillar, toPillar);
//   fx.update(dt, { cloud, rain, flames, level, camera, anticipation });   fx.draw(rig, gain)  between rig.begin() and rig.end()
//   fx.shake  how hard the camera should be shaken this frame, in metres
//   makeNameMaterial(texture)  the material for a name: uReveal 0..1 writes it on from the left behind a white-hot edge, uBurn 0..1 burns it away
import * as THREE from 'three';
import { prepare } from './constellations.js';

const NOISE = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }`;

export function makeNameMaterial(map) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  uniforms: { map: { value: map }, uReveal: { value: 0 }, uBurn: { value: 0 }, uTime: { value: 0 }, uLevel: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D map; uniform float uReveal, uBurn, uTime, uLevel; varying vec2 vUv; ${NOISE}
    void main() { float a = texture2D(map, vUv).a; if (a < 0.01 || uLevel < 0.001) discard;
      float edgeX = uReveal * 1.08 - 0.04, shown = smoothstep(edgeX + 0.012, edgeX - 0.012, vUv.x), edge = exp(-pow((vUv.x - edgeX) / 0.022, 2.0)) * step(uReveal, 0.999) * step(0.001, uReveal);
      // molten gold: deeper at the foot of the letters, near white at the top, with a highlight that keeps travelling across
      vec3 gold = mix(vec3(1.0, 0.52, 0.10), vec3(1.0, 0.93, 0.66), smoothstep(0.25, 0.8, vUv.y)); float sheen = pow(0.5 + 0.5 * sin(vUv.x * 9.0 - uTime * 2.6 + vUv.y * 2.0), 6.0);
      // burning away: eaten by noise from the edges of each letter, with an ember rim
      float n = fbm(vUv * vec2(26.0, 7.0)), keep = smoothstep(uBurn * 1.15 - 0.08, uBurn * 1.15, n), rim = (1.0 - keep) * smoothstep(uBurn * 1.15 - 0.2, uBurn * 1.15 - 0.08, n);
      vec3 c = gold * (2.0 + 2.2 * sheen) * shown * keep + vec3(1.0, 0.97, 0.9) * edge * 7.0 + vec3(1.0, 0.35, 0.05) * rim * shown * 3.0 * step(0.001, uBurn);
      gl_FragColor = vec4(c * a * uLevel, a); }` }); }

export function createGiftFx({ scene, pillars, peak, soft }) {
  // ---------- the sky: storm cloud lit from inside, the flash of a strike, and the ring that spreads from it. One full-screen shader.
  const U = { uT: { value: 0 }, uCloud: { value: 0 }, uFlick: { value: 0 }, uFlickX: { value: 0.5 }, uFlash: { value: 0 }, uRing: { value: 0 }, uRingI: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.6) }, uAspect: { value: 16 / 9 }, uAurora: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT, uCloud, uFlick, uFlickX, uFlash, uRing, uRingI, uAspect, uAurora; uniform vec2 uCenter; ${NOISE}
      void main() { vec2 uv = vUv, p = vec2(uv.x * uAspect, uv.y); vec3 col = vec3(0.0);
        if (uCloud > 0.002) { float mask = smoothstep(0.38, 0.98, uv.y), c = smoothstep(0.32, 0.82, fbm(p * vec2(1.5, 2.6) + vec2(uT * 0.045, -uT * 0.02))), c2 = fbm(p * 4.2 + vec2(-uT * 0.09, uT * 0.03));
          col += vec3(0.085, 0.06, 0.17) * c * mask * uCloud * (0.5 + 0.9 * c2);
          float d = uv.x - uFlickX; col += vec3(0.72, 0.68, 1.0) * uFlick * exp(-d * d * 7.0) * mask * (0.25 + 1.5 * c * c2) * uCloud; }
        // an aurora for the larger shows: curtains of green rising into violet, hanging across the top of the sky and slowly folding
        if (uAurora > 0.002) { float a = fbm(vec2(uv.x * 2.2 + uT * 0.06, uT * 0.04)), band = 0.76 + 0.09 * sin(uv.x * 4.0 + uT * 0.25 + a * 4.0), curt = exp(-pow((uv.y - band) / 0.14, 2.0)), rays = 0.5 + 0.5 * sin(uv.x * 46.0 + a * 26.0 + uT * 0.6);
          col += mix(vec3(0.08, 0.85, 0.5), vec3(0.55, 0.22, 0.95), smoothstep(band - 0.06, band + 0.17, uv.y)) * curt * (0.35 + 0.65 * rays) * uAurora * 0.5; }
        float r = length((uv - uCenter) * vec2(uAspect, 1.0));
        // the flash is strongest where the bolt lands and is held well under white everywhere else
        col += vec3(1.0, 0.92, 0.76) * uFlash * (0.14 + 0.55 * exp(-r * 2.4));
        col += vec3(1.0, 0.76, 0.32) * exp(-pow((r - uRing) / (0.02 + 0.03 * uRing), 2.0)) * uRingI * 1.5;
        gl_FragColor = vec4(col, max(col.r, max(col.g, col.b))); }` }));
  sky.frustumCulled = false; sky.renderOrder = 40; scene.add(sky);

  // ---------- sparks and gold rain: points that fly, fall and fade
  const N = 1100, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), span = new Float32Array(N), grav = new Float32Array(N), tint = new Float32Array(N * 3); let next = 0;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3)); pos.fill(-999);
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ map: soft, size: 0.12, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, sizeAttenuation: true })); points.frustumCulled = false; scene.add(points);
  function spawn(x, y, z, vx, vy, vz, seconds, g, r, gg, b) { const i = next; next = (next + 1) % N; pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; life[i] = span[i] = seconds; grav[i] = g; tint[i * 3] = r; tint[i * 3 + 1] = gg; tint[i * 3 + 2] = b; }
  const R = Math.random;
  function burst(c, count, speed) { for (let k = 0; k < count; k++) { const a = R() * 6.283, up = 0.2 + R() * 0.9, s = speed * (0.35 + R() * 0.9); spawn(c.x, c.y, c.z, Math.cos(a) * s * (1 - up * 0.5), up * s * 1.15, Math.sin(a) * s * 0.6 + s * 0.25, 0.5 + R() * 0.9, 6.5, 2.6, 1.9 + R() * 0.6, 0.6 + R() * 0.6); } }

  // ---------- flames on the pillar tops: what a gift leaves behind
  const flames = pillars.map((p) => { const mk = (sx, sy, dy) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: 0x000000 })); s.position.set(p.x, p.top + dy, p.z + 0.1); s.scale.set(sx, sy, 1); scene.add(s); return s; };
    return { outer: mk(0.62, 1.05, 0.42), inner: mk(0.26, 0.5, 0.26), v: 0, ph: R() * 9 }; });

  // ---------- lightning. A bolt is a jagged line with forks; it first feels its way down, dim, then the full stroke runs along it and flickers out.
  const bolts = [], tmp = new THREE.Vector3(), white = new THREE.Color(0xfff4d6), state = { shake: 0, flashX: 0.5 };
  function jag(a, b, levels, amount) { let pts = [a.clone(), b.clone()]; for (let l = 0; l < levels; l++) { const out = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const m = pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5), d = pts[i].distanceTo(pts[i + 1]) * amount; m.x += (R() - 0.5) * d; m.y += (R() - 0.5) * d * 0.35; m.z += (R() - 0.5) * d * 0.5; out.push(m, pts[i + 1]); } pts = out; } return pts; }
  function addBolt(from, to, power, { leader = 0.11, onStrike = null } = {}) { const main = jag(from, to, 4, 0.42), forks = [], nf = Math.round(1 + power * 1.3);
    for (let k = 0; k < nf; k++) { const i = 3 + Math.floor(R() * (main.length - 7)), a = main[i], side = R() < 0.5 ? -1 : 1, len = (0.9 + R() * 1.6) * (0.7 + power * 0.25); forks.push({ at: i, pts: jag(a, new THREE.Vector3(a.x + side * len * (0.6 + R() * 0.5), a.y - len * (0.5 + R() * 0.7), a.z + (R() - 0.5) * 0.6), 3, 0.5) }); }
    bolts.push({ main, forks, age: 0, leader, power, life: leader + 0.26 + 0.1 * power, struck: false, onStrike, to: to.clone() }); }
  const top = (i) => i < 0 ? peak : tmp.set(pillars[i].x, pillars[i].top + 0.05, pillars[i].z).clone();
  function bolt(i, power = 1) { const to = top(i), from = new THREE.Vector3(to.x * 0.45 + (R() - 0.5) * 4, 13.5, to.z + 0.6);
    addBolt(from, to, power, { onStrike: () => { burst(to, Math.round(46 * power), 2.2 + power * 0.9); U.uFlash.value = Math.max(U.uFlash.value, Math.min(0.85, 0.3 * power)); state.shake = Math.max(state.shake, 0.035 * power); U.uFlick.value = 1; state.center = to.clone(); if (power >= 2) { U.uRing.value = 0.01; U.uRingI.value = 1; } } }); }
  // the light leaping from one pillar top to the next: a short bolt with a rise in the middle, struck at once
  function arc(i, j) { const a = top(i), b = top(j), mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 0.55 + R() * 0.3; const pts = jag(a, mid, 2, 0.5).concat(jag(mid, b, 2, 0.5).slice(1));
    bolts.push({ main: pts, forks: [], age: 0, leader: 0, power: 0.7, life: 0.2, struck: true, to: b }); burst(b, 14, 1.6); state.shake = Math.max(state.shake, 0.012); }

  // ---------- a figure in the sky (ZW-046): a constellation drawn by a point of lightning, with a star at every corner.
  // It stands above and behind the temple. progress 0..1 is how much has been drawn; glow is its brightness; wake() makes it flare.
  // Once awake it breathes: a slow ripple runs out through it from the middle. At the end it rises and lets its stars fall.
  const SKY = { cx: 0, cy: 13.6, z: -8.5, s: 5.6 }, fig = { f: null, progress: 0, glow: 0, flare: 0, pen: new THREE.Vector3(), drawing: false, scale: 1, awake: 0, rise: 0, rising: false };
  const sky3 = (p, out) => { let k = fig.scale; if (fig.awake > 0) k *= 1 + 0.03 * Math.min(1, fig.awake) * Math.sin(time * 3.2 - Math.hypot(p[0], p[1]) * 7); return out.set(SKY.cx + p[0] * SKY.s * k, SKY.cy + fig.rise + p[1] * SKY.s * k, SKY.z); };
  const mkStar = () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: 0x000000 })); sp.visible = false; scene.add(sp); return sp; };
  const starPool = Array.from({ length: 90 }, mkStar), eyePool = [mkStar(), mkStar()], gold = new THREE.Color(0xffd27a), A3 = new THREE.Vector3(), B3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function figure(name, tier = 1) { fig.f = prepare(name); fig.progress = 0; fig.glow = 0; fig.flare = 0; fig.scale = [1, 1.16, 1.34][tier - 1] || 1; fig.awake = 0; fig.rise = 0; fig.rising = false; }
  function ring(power = 1, at = null) { state.center = at || sky3([0, -0.1], new THREE.Vector3()); U.uRing.value = 0.01; U.uRingI.value = 1.2 * power; U.uFlash.value = Math.max(U.uFlash.value, 0.5 * power); state.shake = Math.max(state.shake, 0.07 * power); U.uFlick.value = 1; U.uFlickX.value = 0.5; fig.flare = Math.max(fig.flare, power); }
  function wake() { if (!fig.f) return; fig.awake = 0.001; ring(1.2); for (const st of fig.f.stars) if (R() < 0.6) burst(sky3([st.x, st.y], A3), 5, 2.2); burst(sky3([0, -0.4], A3), 90, 4.5); }
  const ascend = () => { fig.rising = true; };
  // meteors for the larger shows: streaks falling across the sky behind the figure
  const meteors = []; let meteorUntil = 0, meteorNext = 0; const shower = (seconds) => { meteorUntil = time + seconds; };
  // a web of lightning from one side of the sky to the other, for the largest
  function web() { for (let k = 0; k < 4; k++) { const y1 = 8.5 + R() * 9, y2 = 8.5 + R() * 9, flip = R() < 0.5 ? -1 : 1; addBolt(new THREE.Vector3(-15 * flip, y1, -9.5), new THREE.Vector3(15 * flip, y2, -9.5), 1.4, { leader: 0.04 + k * 0.05 }); } U.uFlick.value = 1; U.uFlash.value = Math.max(U.uFlash.value, 0.35); state.shake = Math.max(state.shake, 0.04); }
  // ---------- a film clip as the sky (ZW-046): a realistic animated clip played on a great screen far behind the temple, its edges
  // fading into the dark, so the temple stands in front of it. Loaded when first asked for.
  const FILM = { w: 54, y: 21.5, z: -24 }, films = {}, film = { cur: null, level: 0, want: 0 };
  function loadFilm(name, src) { if (films[name]) return films[name]; const v = document.createElement('video'); v.src = src; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    const tex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace;
    // It fills the picture as the sky, drawn first of all so the temple and the light stand in front of it. It is set a little high and
    // a little large, so the middle of the clip sits above the temple, and it fades into the dark towards the ground.
    const mat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: false, uniforms: { map: { value: tex }, uLevel: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 1.16 + vec2(0.0, 0.2), 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D map; uniform float uLevel; varying vec2 vUv; void main() { vec3 c = texture2D(map, vUv).rgb; float e = smoothstep(0.0, 0.3, vUv.y) * smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x); gl_FragColor = vec4(c * 0.86 * uLevel * e, 1.0); }' });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.visible = false; scene.add(mesh); return (films[name] = { v, mat, mesh }); }
  function playFilm(name, src) { const f = loadFilm(name, src); film.cur = f; film.want = 1; try { f.v.currentTime = 0; const p = f.v.play(); p?.catch?.(() => {}); } catch { /* it will show its first frame */ } state.filmAt = time; }
  // for a still: put the clip at a given second and wait until that frame is there
  const seekFilm = (seconds) => new Promise((done) => { const f = film.cur; if (!f) return done(); const go = () => { f.v.pause(); f.v.addEventListener('seeked', () => setTimeout(done, 120), { once: true }); f.v.currentTime = Math.min(seconds, (f.v.duration || 10) - 0.05); }; if (f.v.readyState >= 1) go(); else f.v.addEventListener('loadedmetadata', go, { once: true }); setTimeout(done, 15000); });
  let rainAcc = 0, flickAt = 0, time = 0;
  function update(dt, { cloud = 0, rain = 0, flames: burning = [], level = 1, camera, anticipation = 0, edge = null, sky: skyState = null, aurora = 0 }) { time += dt; U.uT.value += dt; U.uAspect.value = camera.aspect;
    U.uCloud.value += (cloud * level - U.uCloud.value) * Math.min(1, dt * 2.2); U.uFlick.value *= Math.exp(-dt * 9); U.uFlash.value *= Math.exp(-dt * 7); state.shake *= Math.exp(-dt * 7);
    if (U.uRingI.value > 0.002) { U.uRing.value += dt * 1.25; U.uRingI.value *= Math.exp(-dt * 2.6); } else U.uRingI.value = 0;
    if (state.center) { const c = state.center.clone().project(camera); U.uCenter.value.set(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5); }
    // while the storm gathers the cloud flickers from inside, here and there, more and more often
    if (anticipation > 0 && time > flickAt) { flickAt = time + 0.5 - 0.38 * anticipation + R() * 0.25; U.uFlick.value = 0.35 + 0.65 * R() * anticipation; U.uFlickX.value = 0.2 + R() * 0.6; }
    for (const b of bolts) { b.age += dt; if (!b.struck && b.age >= b.leader) { b.struck = true; const s = b.main[0].clone().project(camera); U.uFlickX.value = s.x * 0.5 + 0.5; b.onStrike?.(); } }
    for (let i = bolts.length - 1; i >= 0; i--) if (bolts[i].age > bolts[i].life) bolts.splice(i, 1);
    // the figure in the sky: the pen throws sparks as it draws; the stars come out as it passes; at the end the stars fall as rain
    if (film.cur) { const f = film.cur, left = (f.v.duration || 10) - f.v.currentTime; if (film.want && (f.v.ended || left < 0.9) && time - state.filmAt > 2) film.want = 0; film.level += (film.want - film.level) * Math.min(1, dt * (film.want ? 2.2 : 1.3)); f.mat.uniforms.uLevel.value = film.level * level; f.mesh.visible = film.level > 0.005; if (!film.want && film.level < 0.005) { f.v.pause(); film.cur = null; } }
    U.uAurora.value += (aurora * level - U.uAurora.value) * Math.min(1, dt * 0.9); if (fig.awake > 0) fig.awake += dt; if (fig.rising) fig.rise += dt * (0.4 + fig.rise * 0.9);
    if (time < meteorUntil && time > meteorNext) { meteorNext = time + 0.07 + R() * 0.16; const v = new THREE.Vector3(-7 - R() * 5, -5 - R() * 4, 0); meteors.push({ p: new THREE.Vector3(-4 + R() * 30, 17 + R() * 6, -10 - R() * 3), v, life: 1.5, span: 1.5 }); }
    for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.life -= dt; m.p.addScaledVector(m.v, dt); if (m.life <= 0) meteors.splice(i, 1); }
    fig.flare *= Math.exp(-dt * 1.6); if (!skyState) { fig.glow += (0 - fig.glow) * Math.min(1, dt * 3); if (fig.glow < 0.01) fig.f = null; }
    else if (fig.f) { fig.progress = skyState.progress; fig.glow += (skyState.glow - fig.glow) * Math.min(1, dt * 4); fig.drawing = fig.progress > 0.001 && fig.progress < 0.999;
      if (fig.drawing) { const g = fig.f.segs.find((q) => q.to >= fig.progress) || fig.f.segs.at(-1), u = Math.min(1, Math.max(0, (fig.progress - g.from) / Math.max(1e-6, g.to - g.from))); sky3([g.a[0] + (g.b[0] - g.a[0]) * u, g.a[1] + (g.b[1] - g.a[1]) * u], fig.pen); for (let k = 0; k < 2; k++) spawn(fig.pen.x, fig.pen.y, fig.pen.z, (R() - 0.5) * 2.2, (R() - 0.2) * 2, 0.5 + R(), 0.4 + R() * 0.5, 4.5, 2.8, 2.3, 1.3); }
      if (skyState.falling > 0) for (const st of fig.f.stars) if (R() < skyState.falling * dt * 5) { sky3([st.x, st.y], A3); spawn(A3.x, A3.y, A3.z, (R() - 0.5) * 0.6, -1 - R() * 2, 0, 2.6, 2.2, 2.4, 1.8, 0.6); } }
    starPool.forEach((sp, i) => { const st = fig.f && fig.f.stars[i]; if (!st || st.at > fig.progress || fig.glow < 0.01) { sp.visible = false; return; } sp.visible = true; sky3([st.x, st.y], sp.position); const tw = 0.7 + 0.3 * Math.sin(time * 5 + i * 2.3), k = fig.glow * level * tw * (1 + 2.2 * fig.flare); sp.material.color.setRGB(2.4 * k, 2.1 * k, 1.5 * k); sp.scale.setScalar((0.34 + 0.12 * tw + 0.25 * fig.flare) * fig.scale); });
    eyePool.forEach((sp, i) => { const e = fig.f && fig.f.eyes[i]; if (!e || fig.awake <= 0 || fig.glow < 0.01) { sp.visible = false; return; } sp.visible = true; sky3(e, sp.position); const k = fig.glow * level * Math.min(1, fig.awake * 3) * (1.6 + 2.5 * fig.flare + 0.3 * Math.sin(time * 6)); sp.material.color.setRGB(2.2 * k, 2.6 * k, 3.0 * k); sp.scale.setScalar(0.5 * fig.scale); });
    // gold rain, and sparks thrown off the edge of a name as it is written
    rainAcc += rain * dt * 150; while (rainAcc >= 1) { rainAcc--; spawn((R() - 0.5) * 17, 9.5 + R() * 1.5, -6.5 + R() * 5.5, (R() - 0.5) * 0.5, -(3.2 + R() * 3), 0, 2.6, 0.6, 2.2, 1.5 + R() * 0.5, 0.35 + R() * 0.35); }
    if (edge) for (let k = 0; k < 3; k++) spawn(edge.x, edge.y + (R() - 0.5) * 1.2, edge.z, (R() - 0.3) * 1.6, R() * 1.8, 0.6 + R(), 0.45 + R() * 0.4, 5, 2.8, 2.2, 1.2);
    for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; life[i] -= dt; if (life[i] <= 0) { pos[i * 3 + 1] = -999; continue; } vel[i * 3 + 1] -= grav[i] * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      const k = Math.min(1, life[i] / span[i] * 2.5) * (0.75 + 0.25 * Math.sin(time * 31 + i)) * level; col[i * 3] = tint[i * 3] * k; col[i * 3 + 1] = tint[i * 3 + 1] * k; col[i * 3 + 2] = tint[i * 3 + 2] * k; }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    flames.forEach((f, i) => { const left = burning[i] || 0, want = left > 0 ? (left < 12 ? 0.35 + 0.65 * left / 12 : 1) : 0; f.v += (want - f.v) * Math.min(1, dt * (want > f.v ? 6 : 1.5));
      const fl = 0.78 + 0.22 * Math.sin(time * 17 + f.ph) * Math.sin(time * 7.3 + f.ph * 2.1), k = f.v * level * fl; f.outer.visible = f.inner.visible = k > 0.01; f.outer.material.color.setRGB(2.4 * k, 1.05 * k, 0.16 * k); f.inner.material.color.setRGB(2.6 * k, 2.2 * k, 1.3 * k); f.outer.scale.set(0.62, 0.9 + 0.3 * fl, 1); }); }

  // drawn with the same beams as the lasers: a thin white-hot core and a wider, fainter sleeve
  function draw(rig, gain = 1) {
    if (fig.f && fig.glow > 0.01) { const I = gain * fig.glow * (1.5 + 3.5 * fig.flare + 0.25 * Math.sin(time * 2.2));
      for (const g of fig.f.segs) { if (g.from >= fig.progress) break; const u = Math.min(1, (fig.progress - g.from) / Math.max(1e-6, g.to - g.from)); sky3(g.a, A3); sky3([g.a[0] + (g.b[0] - g.a[0]) * u, g.a[1] + (g.b[1] - g.a[1]) * u], B3); tmp.copy(B3).sub(A3); const len = tmp.length(); if (len < 0.005) continue; tmp.multiplyScalar(1 / len);
        rig.beam(A3, tmp, len, gold, I * 1.4, 0.045, 0); rig.beam(A3, tmp, len, gold, I * 0.16, 0.2, 0); }
      // while it is being drawn, a shaft of light stands from the temple's peak up to it: the lightning that struck, going back to the sky
      if (fig.progress < 1) { const h = SKY.cy - peak.y - 1; rig.beam(peak, UP, h, gold, 1.6 * gain, 0.34, 0); rig.beam(peak, UP, h, white, 2.6 * gain, 0.06, 0); }
      // the point of lightning that does the drawing
      if (fig.drawing) { tmp.set(0, 1, 0); rig.beam(A3.copy(fig.pen).addScaledVector(tmp, -0.12), tmp, 0.24, white, 9 * gain, 0.09, 0); } }
    for (const m of meteors) { tmp.copy(m.v).normalize().negate(); const k = Math.min(1, m.life / m.span * 3) * Math.min(1, (m.span - m.life) * 6); rig.beam(m.p, tmp, 2.6, white, 2.6 * gain * k, 0.035, 0); rig.beam(m.p, tmp, 1.1, gold, 1.2 * gain * k, 0.12, 0); }
    for (const b of bolts) { const a = b.age; let I, shown = b.main.length;
      if (a < b.leader) { I = 0.22; shown = Math.max(2, Math.ceil(b.main.length * a / b.leader)); } else { const s = a - b.leader; I = s < 0.07 ? 1 : (Math.sin(s * 75) > -0.2 ? 0.6 : 0.1) * Math.max(0, 1 - s / (b.life - b.leader)); }
      I *= 6.5 * gain * (0.7 + 0.3 * b.power); if (I <= 0.01) continue; const w = 0.02 + 0.02 * b.power;
      const seg = (p, q, k, width) => { tmp.copy(q).sub(p); const len = tmp.length(); if (len < 0.01) return; tmp.multiplyScalar(1 / len); rig.beam(p, tmp, len, white, I * k, width, 0); };
      for (let i = 0; i < shown - 1; i++) { seg(b.main[i], b.main[i + 1], 1, w); if (a >= b.leader) seg(b.main[i], b.main[i + 1], 0.16, w * 5); }
      for (const f of b.forks) if (f.at < shown) for (let i = 0; i < f.pts.length - 1; i++) seg(f.pts[i], f.pts[i + 1], 0.55, w * 0.6); } }
  const stopFilm = () => { film.want = 0; };
  // the clip's big moment (the roar): the ring and the flash spread from the middle of the screen, and sparks fly from in front of it
  // kept gentle: the clip's own roar is the picture, and a strong flash would hide it
  function roar() { state.center = new THREE.Vector3(0, 13, -9); U.uRing.value = 0.06; U.uRingI.value = 0.55; U.uFlash.value = Math.max(U.uFlash.value, 0.12); state.shake = Math.max(state.shake, 0.12); burst(new THREE.Vector3(0, 8.6, -6.5), 140, 6); }
  return { bolt, arc, figure, wake, ring, web, ascend, shower, playFilm, stopFilm, seekFilm, roar, get filmLevel() { return film.level; }, update, draw, burst, sky: SKY, uniforms: U, get shake() { return state.shake; }, counts: () => ({ bolts: bolts.length }) };
}
