// The open world's light, sky and weather (ZW-051, phase 5): day, dusk, night, dawn with mist in the valley, and a storm.
//   const air = await createAir({ scene, renderer, tickers, lamps, mistAt, start: 'day' });
//   await air.set('night');   air.follow(cameraPosition, focus);   air.sun is the light that casts the shadows
// Four sky pictures (public/sky): day, dusk, a starry night and an overcast for the storm. The dusk sky, turned round, is also the dawn over the sea.
// Lamps and fires are told to this file as points ({ x, y, z, kind: 'lamp' | 'fire' | 'door' }); it draws a glow at each, a pool of
// light on the ground under it, and moves a few real lights to the ones nearest what the camera is looking at.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const AIR = {
  day: { name: 'Day', sky: 'day', tint: 0xffffff, sun: 0xffe9c4, sunI: 3.4, dir: [-0.55, 0.62, 0.5], hemi: 0.5, env: 0.62, exp: 0.9, fog: 0xa9c8e6, den: 0.00013, rot: 2.2, glow: 0, stars: 0, dim: 1 },
  dusk: { name: 'Dusk', sky: 'dusk', tint: 0xffffff, sun: 0xff8a45, sunI: 1.7, dir: [-0.86, 0.2, 0.43], hemi: 0.16, env: 0.48, exp: 0.82, fog: 0xd99a78, den: 0.00013, rot: 3.9, glow: 0.75, stars: 0, dim: 0.8 },
  night: { name: 'Night', sky: 'night', tint: 0x5a668e, sun: 0x7f9cf5, sunI: 0.85, dir: [0.35, 0.7, -0.5], hemi: 0.26, sky2: 0x5f7fe0, gnd: 0x0c1220, grade: 'saturate(0.82) contrast(1.1)', env: 0.05, exp: 1.0, fog: 0x0d1526, den: 0.00016, rot: 3.9, glow: 1, stars: 1, moon: 1, dim: 0.22 },
  dawn: { name: 'Dawn', sky: 'dusk', tint: 0xfff2ee, sun: 0xffc9a4, sunI: 2.1, dir: [0.9, 0.17, 0.3], hemi: 0.24, env: 0.5, exp: 0.86, fog: 0xe6cfc6, den: 0.0002, rot: 3.9 + 2.356, glow: 0.4, stars: 0, mist: 1, dim: 0.9 },
  storm: { name: 'Storm', sky: 'storm', tint: 0x868e99, sun: 0xb9c4d4, sunI: 0.7, dir: [-0.4, 0.75, 0.4], hemi: 0.3, sky2: 0xcfd8e6, gnd: 0x4a4f52, grade: 'saturate(0.72) contrast(1.08)', env: 0.3, exp: 0.74, fog: 0x565f6b, den: 0.0004, rot: 2.2, glow: 0.55, stars: 0, rain: 1, dim: 0.55 },
};

const soft = (stops, S = 128) => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [at, col] of stops) r.addColorStop(at, col); g.fillStyle = r; g.fillRect(0, 0, S, S); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

export async function createAir({ scene, renderer, tickers, lamps = [], mistAt = [], start = 'day' }) {
  const skies = {}, sky = (n) => (skies[n] ||= Promise.all([new THREE.TextureLoader().loadAsync(`./sky/${n}.jpg`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; return t; }), new RGBELoader().loadAsync(`./sky/${n}.hdr`).then((e) => { e.mapping = THREE.EquirectangularReflectionMapping; return e; })]));
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x7a6a48, 0.5), sun = new THREE.DirectionalLight(0xffffff, 1), sunDir = new THREE.Vector3(0, 1, 0); scene.add(hemi, sun, sun.target); scene.fog = new THREE.FogExp2(0xa9c8e6, 0.00013);
  sun.castShadow = true; sun.shadow.autoUpdate = false; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.25; Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 900 }); sun.shadow.camera.updateProjectionMatrix();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); dome.scale.z = -1; dome.renderOrder = -3; dome.frustumCulled = false; scene.add(dome);
  const follow = new THREE.Group(); scene.add(follow); // everything that stays round the camera: stars, moon, rain

  // ---------- stars and the moon
  const N = 2600, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) { const a = rnd() * 6.2832, y = 0.02 + 0.98 * rnd(), r = Math.sqrt(1 - y * y), b = 0.35 + 0.65 * rnd() ** 3, w = rnd(); sp.set([Math.cos(a) * r * 26000, y * 26000, Math.sin(a) * r * 26000], i * 3); sc.set([b * (0.85 + 0.15 * w), b * 0.92, b * (1 - 0.2 * w)], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false, map: soft([[0, '#fff'], [0.5, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']], 32), blending: THREE.AdditiveBlending })); stars.renderOrder = -2; stars.frustumCulled = false; follow.add(stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft([[0, '#ffffff'], [0.2, '#f4f6ff'], [0.24, 'rgba(190,205,255,0.35)'], [1, 'rgba(150,170,255,0)']], 256), fog: false, depthWrite: false, toneMapped: false, transparent: true })); moon.scale.setScalar(5200); moon.renderOrder = -1; moon.userData.air = true; follow.add(moon);

  // ---------- lamps and fires: a glow, a pool of light on the ground, and a few real lights that go where the camera looks
  const warm = new THREE.Color(0xffa64d), glowTex = soft([[0, 'rgba(255,240,200,1)'], [0.18, 'rgba(255,180,90,0.75)'], [0.5, 'rgba(255,120,40,0.18)'], [1, 'rgba(255,90,20,0)']]);
  const gp = new Float32Array(lamps.length * 3); lamps.forEach((l, i) => gp.set([l.x, l.y, l.z], i * 3)); const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  const glows = new THREE.Points(gg, new THREE.PointsMaterial({ size: 6.5, sizeAttenuation: true, map: glowTex, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false })); glows.frustumCulled = false; glows.renderOrder = 4; scene.add(glows);
  const poolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), pools = new THREE.InstancedMesh(poolGeo, new THREE.MeshBasicMaterial({ map: soft([[0, 'rgba(255,170,90,0.9)'], [0.35, 'rgba(255,140,60,0.4)'], [1, 'rgba(255,120,40,0)']]), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), Math.max(1, lamps.length));
  { const m = new THREE.Matrix4(); lamps.forEach((l, i) => { const r = l.kind === 'fire' ? 16 : l.kind === 'door' ? 9 : 12; m.makeScale(r, 1, r).setPosition(l.x, l.ground + 0.14, l.z); pools.setMatrixAt(i, m); }); pools.count = lamps.length; pools.frustumCulled = false; pools.renderOrder = 2; scene.add(pools); }
  const REAL = 5, real = []; for (let i = 0; i < REAL; i++) { const p = new THREE.PointLight(warm, 0, 30, 1.7); p.userData.at = -1; scene.add(p); real.push(p); }
  // flames at the fires: three licks each, drawn once
  const flameTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(32, 96, 2, 32, 80, 60); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,190,70,0.9)'); r.addColorStop(0.65, 'rgba(255,90,20,0.35)'); r.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(60, 60, 62, 100, 32, 126); g.bezierCurveTo(2, 100, 4, 60, 32, 2); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const flames = []; lamps.forEach((l, i) => { if (l.kind !== 'fire') return; for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, opacity: 0 })); s.center.set(0.5, 0.1); s.userData.air = true; s.renderOrder = 4; scene.add(s); flames.push({ s, l, k, ph: i * 1.7 + k * 2.1 }); } });

  // ---------- mist lying in the valley at dawn
  const puff = soft([[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]), mist = mistAt.map((p, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0, color: 0xfff1e6 })); s.userData.air = true; s.renderOrder = 3; s.visible = false; scene.add(s); return { s, p, a: i * 2.399, sc: 150 + (i * 53 % 120) }; });

  // ---------- rain: streaks in a box that travels with the camera, and lightning over the mountains
  const RN = 7000, BOX = 90, TALL = 60, rp = new Float32Array(RN * 6), re = new Float32Array(RN * 2); for (let i = 0; i < RN; i++) { const x = rnd() * BOX, y = rnd() * TALL, z = rnd() * BOX; rp.set([x, y, z, x, y, z], i * 6); re[i * 2 + 1] = 1; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('tip', new THREE.BufferAttribute(re, 1));
  const rainU = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uA: { value: 0 } };
  const rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: rainU,
    vertexShader: `attribute float tip; uniform float uT; uniform vec3 uCam; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y - uT * 34.0, ${TALL}.0); p.x += uT * 6.0; vec3 w = vec3(mod(p.x - uCam.x, ${BOX}.0) - ${BOX / 2}.0 + uCam.x, p.y - ${TALL * 0.4}.0 + uCam.y, mod(p.z - uCam.z, ${BOX}.0) - ${BOX / 2}.0 + uCam.z); w += tip * vec3(0.36, 2.2, 0.0); vA = 1.0 - tip * 0.7; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
    fragmentShader: `uniform float uA; varying float vA; void main(){ gl_FragColor = vec4(0.82, 0.87, 0.95, 0.46 * uA * vA); }` })); rain.frustumCulled = false; rain.renderOrder = 5; rain.visible = false; scene.add(rain);
  const boltC = document.createElement('canvas'); boltC.width = 256; boltC.height = 512; const boltT = new THREE.CanvasTexture(boltC); boltT.colorSpace = THREE.SRGBColorSpace;
  const bolt = new THREE.Sprite(new THREE.SpriteMaterial({ map: boltT, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 })); bolt.center.set(0.5, 0); bolt.userData.air = true; bolt.renderOrder = 1; scene.add(bolt);
  function drawBolt() { const g = boltC.getContext('2d'); g.clearRect(0, 0, 256, 512); const line = (x, y, y1, w, fork) => { g.beginPath(); g.moveTo(x, y); while (y < y1) { y += 14 + Math.random() * 22; x += (Math.random() - 0.5) * 34; g.lineTo(x, y); if (fork && Math.random() < 0.22) { g.stroke(); line(x, y, Math.min(512, y + 80 + Math.random() * 120), w * 0.5, false); g.beginPath(); g.moveTo(x, y); } } g.lineWidth = w; g.stroke(); }; for (const [w, col, blur] of [[9, 'rgba(150,180,255,0.35)', 14], [2.6, '#ffffff', 4]]) { g.strokeStyle = col; g.shadowColor = '#bcd0ff'; g.shadowBlur = blur; g.lineCap = 'round'; const s0 = Math.random; let sd = (Math.random() * 1e9) | 0; Math.random = () => (sd = (sd * 16807 + 1) % 2147483647) / 2147483647; const keep = sd; line(128, 0, 512, w, true); Math.random = s0; void keep; } boltT.needsUpdate = true; }

  let now = AIR[start] ? start : 'day', L = AIR[now], strike = { at: 6, t: -9 }, tNow = 0; const cam = new THREE.Vector3(), foc = new THREE.Vector3(), tintC = new THREE.Color();
  async function set(name) { if (!AIR[name]) return false; const A = AIR[name], [jpg, hdr] = await sky(A.sky); now = name; L = A;
    dome.material.map = jpg; dome.material.color.set(A.tint); dome.material.needsUpdate = true; dome.rotation.y = A.rot; scene.environment = hdr; scene.environmentIntensity = A.env; scene.environmentRotation = new THREE.Euler(0, A.rot, 0);
    renderer.toneMappingExposure = A.exp; scene.fog.color.set(A.fog); scene.fog.density = A.den; hemi.intensity = A.hemi; hemi.color.set(A.sky2 || 0xfff4e0); hemi.groundColor.set(A.gnd || 0x7a6a48); renderer.domElement.style.filter = A.grade || 'saturate(1.16) contrast(1.08)'; sun.color.set(A.sun); sun.intensity = A.sunI; sunDir.set(...A.dir).normalize();
    stars.material.opacity = A.stars; stars.visible = A.stars > 0; moon.visible = !!A.moon; moon.position.copy(sunDir).multiplyScalar(24000);
    glows.material.opacity = A.glow; glows.visible = pools.visible = A.glow > 0; pools.material.opacity = 0.8 * A.glow; for (const f of flames) f.s.visible = A.glow > 0; for (const p of real) p.visible = A.glow > 0;
    for (const m of mist) m.s.visible = !!A.mist; rain.visible = !!A.rain; rainU.uA.value = A.rain || 0; bolt.material.opacity = 0;
    // things in the scene that are not lit by the lights (the white water, the puffs of mist at the falls) are dimmed to suit
    scene.traverse((o) => { const m = o.material; if (!m || o.userData.air) return; if (m.uniforms?.uFog) { m.uniforms.uFog.value.set(A.fog); if (m.uniforms.uDen) m.uniforms.uDen.value = A.den; if (m.uniforms.uDim) m.uniforms.uDim.value = A.dim; } if (o.isSprite) { o.userData.col ||= m.color.clone(); m.color.copy(o.userData.col).multiplyScalar(A.dim); } });
    return true; }
  await set(now);

  tickers.push((t) => { tNow = t; const g = L.glow; if (g > 0) {
      for (const f of flames) { const w = 0.75 + 0.25 * Math.sin(t * 9 + f.ph) + 0.12 * Math.sin(t * 23 + f.ph * 3), h = (f.l.size || 1) * (1.5 + 0.5 * f.k) * w; f.s.position.set(f.l.x + 0.22 * Math.sin(f.ph + t * 2.1 + f.k * 2), f.l.y - 0.35, f.l.z + 0.22 * Math.cos(f.ph * 1.3 + t * 1.7 + f.k)); f.s.scale.set(h * 0.55, h, 1); f.s.material.opacity = Math.min(1, g * 1.3) * (0.75 + 0.25 * w); }
      // the real lights: each stays on its lamp until that lamp is far from what the camera looks at, and is dim by then, so nothing pops
      const near = lamps.map((l, i) => [i, (l.x - foc.x) ** 2 + (l.z - foc.z) ** 2 - (l.kind === 'fire' ? 900 : 0)]).sort((a, b) => a[1] - b[1]).slice(0, REAL).map((a) => a[0]);
      for (const p of real) if (!near.includes(p.userData.at)) { const free = near.find((i) => !real.some((r) => r.userData.at === i)); if (free != null) { p.userData.at = free; const l = lamps[free]; p.position.set(l.x, l.y + 0.3, l.z); } }
      for (const p of real) { const l = lamps[p.userData.at]; if (!l) { p.intensity = 0; continue; } const d = Math.hypot(l.x - foc.x, l.z - foc.z), k = Math.max(0, Math.min(1, 1.25 - d / 130)), fl = l.kind === 'fire' ? 0.8 + 0.2 * Math.sin(t * 9 + p.userData.at) + 0.1 * Math.sin(t * 21) : 1; p.intensity = g * k * fl * (l.kind === 'fire' ? 170 : 90); } }
    if (L.mist) for (const m of mist) { const x = m.p[0] + 30 * Math.sin(t * 0.03 + m.a), z = m.p[2] + 30 * Math.cos(t * 0.025 + m.a * 1.7), d = Math.hypot(x - cam.x, m.p[1] - cam.y, z - cam.z); m.s.position.set(x, m.p[1] + 7, z); m.s.scale.set(m.sc * 1.6, m.sc * 0.42, 1); m.s.material.opacity = 0.75 * Math.max(0, Math.min(1, (d - 60) / 160)); }
    if (L.rain) { rainU.uT.value = t; rainU.uCam.value.copy(cam);
      if (t > strike.at) { strike.t = t; strike.at = t + 5 + Math.random() * 9; drawBolt(); const a = Math.atan2(foc.x - cam.x, foc.z - cam.z) + (Math.random() - 0.5) * 1.5, r = 3500 + Math.random() * 3500; bolt.position.set(cam.x + Math.sin(a) * r, Math.max(0, cam.y - 300), cam.z + Math.cos(a) * r); const h = 2600 + Math.random() * 900; bolt.scale.set(h * 0.5, h, 1); }
      const u = t - strike.t, e = u < 0 ? 0 : Math.max(0, 1 - u / 0.12) + (u > 0.16 ? Math.max(0, 1 - (u - 0.16) / 0.3) * 0.75 : 0); bolt.material.opacity = Math.min(1, e * 1.4); hemi.intensity = L.hemi + 2.2 * e; dome.material.color.set(L.tint).lerp(tintC.set(0xdfe6ff), Math.min(1, e * 0.8)); } });

  return { sun, hemi, dome, AIR, set, get now() { return now; },
    // called every frame: the sky and what travels with the camera follow it, and the shadows cover the ground round `focus`, moved in whole steps so that they do not crawl
    follow(camPos, focus) { cam.copy(camPos); foc.copy(focus); dome.position.copy(camPos); follow.position.copy(camPos); const s = 340 / 4096 * 8; sun.target.position.set(Math.round(focus.x / s) * s, focus.y, Math.round(focus.z / s) * s); sun.position.copy(sun.target.position).addScaledVector(sunDir, 420); sun.target.updateMatrixWorld(); },
    strike() { strike.at = tNow; } };
}
