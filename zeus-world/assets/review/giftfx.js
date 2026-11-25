// The picture side of the gift moments (ZW-045): a storm over the temple, lightning that reaches down and strikes, the flash and the
// ring that spread from where it lands, sparks, gold rain, flames on the pillars, and a name forged in light. gifts.js is the script;
// this draws what it asks for.
//   const fx = createGiftFx({ scene, pillars: [{ x, z, top }], peak: Vector3, soft: a soft round texture });
//   fx.bolt(pillarIndex or -1 for the temple's peak, power);   fx.arc(fromPillar, toPillar);
//   fx.update(dt, { cloud, rain, flames, level, camera, anticipation });   fx.draw(rig, gain)  between rig.begin() and rig.end()
//   fx.shake  how hard the camera should be shaken this frame, in metres
//   makeNameMaterial(texture)  the material for a name: uReveal 0..1 writes it on from the left behind a white-hot edge, uBurn 0..1 burns it away
import * as THREE from 'three';

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
  const U = { uT: { value: 0 }, uCloud: { value: 0 }, uFlick: { value: 0 }, uFlickX: { value: 0.5 }, uFlash: { value: 0 }, uRing: { value: 0 }, uRingI: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.6) }, uAspect: { value: 16 / 9 } };
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT, uCloud, uFlick, uFlickX, uFlash, uRing, uRingI, uAspect; uniform vec2 uCenter; ${NOISE}
      void main() { vec2 uv = vUv, p = vec2(uv.x * uAspect, uv.y); vec3 col = vec3(0.0);
        if (uCloud > 0.002) { float mask = smoothstep(0.38, 0.98, uv.y), c = smoothstep(0.32, 0.82, fbm(p * vec2(1.5, 2.6) + vec2(uT * 0.045, -uT * 0.02))), c2 = fbm(p * 4.2 + vec2(-uT * 0.09, uT * 0.03));
          col += vec3(0.085, 0.06, 0.17) * c * mask * uCloud * (0.5 + 0.9 * c2);
          float d = uv.x - uFlickX; col += vec3(0.72, 0.68, 1.0) * uFlick * exp(-d * d * 7.0) * mask * (0.25 + 1.5 * c * c2) * uCloud; }
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

  let rainAcc = 0, flickAt = 0, time = 0;
  function update(dt, { cloud = 0, rain = 0, flames: burning = [], level = 1, camera, anticipation = 0, edge = null }) { time += dt; U.uT.value += dt; U.uAspect.value = camera.aspect;
    U.uCloud.value += (cloud * level - U.uCloud.value) * Math.min(1, dt * 2.2); U.uFlick.value *= Math.exp(-dt * 9); U.uFlash.value *= Math.exp(-dt * 7); state.shake *= Math.exp(-dt * 7);
    if (U.uRingI.value > 0.002) { U.uRing.value += dt * 1.25; U.uRingI.value *= Math.exp(-dt * 2.6); } else U.uRingI.value = 0;
    if (state.center) { const c = state.center.clone().project(camera); U.uCenter.value.set(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5); }
    // while the storm gathers the cloud flickers from inside, here and there, more and more often
    if (anticipation > 0 && time > flickAt) { flickAt = time + 0.5 - 0.38 * anticipation + R() * 0.25; U.uFlick.value = 0.35 + 0.65 * R() * anticipation; U.uFlickX.value = 0.2 + R() * 0.6; }
    for (const b of bolts) { b.age += dt; if (!b.struck && b.age >= b.leader) { b.struck = true; const s = b.main[0].clone().project(camera); U.uFlickX.value = s.x * 0.5 + 0.5; b.onStrike?.(); } }
    for (let i = bolts.length - 1; i >= 0; i--) if (bolts[i].age > bolts[i].life) bolts.splice(i, 1);
    // gold rain, and sparks thrown off the edge of a name as it is written
    rainAcc += rain * dt * 150; while (rainAcc >= 1) { rainAcc--; spawn((R() - 0.5) * 17, 9.5 + R() * 1.5, -6.5 + R() * 5.5, (R() - 0.5) * 0.5, -(3.2 + R() * 3), 0, 2.6, 0.6, 2.2, 1.5 + R() * 0.5, 0.35 + R() * 0.35); }
    if (edge) for (let k = 0; k < 3; k++) spawn(edge.x, edge.y + (R() - 0.5) * 1.2, edge.z, (R() - 0.3) * 1.6, R() * 1.8, 0.6 + R(), 0.45 + R() * 0.4, 5, 2.8, 2.2, 1.2);
    for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; life[i] -= dt; if (life[i] <= 0) { pos[i * 3 + 1] = -999; continue; } vel[i * 3 + 1] -= grav[i] * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      const k = Math.min(1, life[i] / span[i] * 2.5) * (0.75 + 0.25 * Math.sin(time * 31 + i)) * level; col[i * 3] = tint[i * 3] * k; col[i * 3 + 1] = tint[i * 3 + 1] * k; col[i * 3 + 2] = tint[i * 3 + 2] * k; }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    flames.forEach((f, i) => { const left = burning[i] || 0, want = left > 0 ? (left < 12 ? 0.35 + 0.65 * left / 12 : 1) : 0; f.v += (want - f.v) * Math.min(1, dt * (want > f.v ? 6 : 1.5));
      const fl = 0.78 + 0.22 * Math.sin(time * 17 + f.ph) * Math.sin(time * 7.3 + f.ph * 2.1), k = f.v * level * fl; f.outer.visible = f.inner.visible = k > 0.01; f.outer.material.color.setRGB(2.4 * k, 1.05 * k, 0.16 * k); f.inner.material.color.setRGB(2.6 * k, 2.2 * k, 1.3 * k); f.outer.scale.set(0.62, 0.9 + 0.3 * fl, 1); }); }

  // drawn with the same beams as the lasers: a thin white-hot core and a wider, fainter sleeve
  function draw(rig, gain = 1) { for (const b of bolts) { const a = b.age; let I, shown = b.main.length;
      if (a < b.leader) { I = 0.22; shown = Math.max(2, Math.ceil(b.main.length * a / b.leader)); } else { const s = a - b.leader; I = s < 0.07 ? 1 : (Math.sin(s * 75) > -0.2 ? 0.6 : 0.1) * Math.max(0, 1 - s / (b.life - b.leader)); }
      I *= 6.5 * gain * (0.7 + 0.3 * b.power); if (I <= 0.01) continue; const w = 0.02 + 0.02 * b.power;
      const seg = (p, q, k, width) => { tmp.copy(q).sub(p); const len = tmp.length(); if (len < 0.01) return; tmp.multiplyScalar(1 / len); rig.beam(p, tmp, len, white, I * k, width, 0); };
      for (let i = 0; i < shown - 1; i++) { seg(b.main[i], b.main[i + 1], 1, w); if (a >= b.leader) seg(b.main[i], b.main[i + 1], 0.16, w * 5); }
      for (const f of b.forks) if (f.at < shown) for (let i = 0; i < f.pts.length - 1; i++) seg(f.pts[i], f.pts[i + 1], 0.55, w * 0.6); } }
  return { bolt, arc, update, draw, burst, uniforms: U, get shake() { return state.shake; }, counts: () => ({ bolts: bolts.length }) };
}
