// Ambient motion for the city scene: cloth in the breeze, swaying trees, chimney smoke, fountain spray, boats, drifting sky.
import * as THREE from 'three';

export function createAmbient({ scene, tickers, placed, sway, seaY = 0.4 }) {
  const rnd = (() => { let a = 4242; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const time = { value: 0 };
  scene.updateMatrixWorld(true);

  // cloth: banners, flags and awnings ripple. Done in the vertex shader, in world space, so every model's cloth moves alike.
  const seen = new Set();
  scene.traverse((o) => { const m = o.isMesh && o.material; if (!m || !m.name?.startsWith('cloth_') || seen.has(m)) return; seen.add(m);
    m.onBeforeCompile = (sh) => { sh.uniforms.uTime = time;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <project_vertex>', `
        vec4 wp = modelMatrix * vec4( transformed, 1.0 );
        vec3 wn = normalize( mat3( modelMatrix ) * objectNormal ); if ( dot( wn, vec3( 0.37, 0.11, 0.92 ) ) < 0.0 ) wn = -wn;
        wp.xyz += wn * ( sin( uTime * 2.3 + wp.y * 2.6 + wp.x * 1.3 + wp.z * 1.1 ) * 0.014 + sin( uTime * 3.7 + wp.y * 5.0 - wp.x * 2.1 ) * 0.006 );
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;`); };
    m.needsUpdate = true; });

  // trees lean a little with the wind, each on its own beat
  const trees = sway.map((o) => ({ o, ph: rnd() * 6.28, k: 0.7 + rnd() * 0.6 }));

  // soft particles for smoke and spray
  const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pool = (n, color) => Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); return { s, age: 1, life: 0 }; });

  // smoke from chimneys, the forge, the kiln and the bathhouse (positions given in each model's own space)
  const CHIMNEYS = { biz_bakery_t1: [3.75, 3.55, -1.1], biz_forge_t1: [-1.2, 4.7, -1.3], biz_pottery_t1: [3.9, 2.75, -0.4], home_cottage_t1: [2.2, 4.7, -0.9], home_cottage_t2: [2.2, 4.7, -0.9], civic_bathhouse: [4.8, 6.05, -3.0] };
  const emitters = []; for (const [n, p] of Object.entries(CHIMNEYS)) for (const o of placed[n] || []) emitters.push({ p: o.localToWorld(new THREE.Vector3(...p)), next: rnd() });
  const smoke = pool(emitters.length * 9, 0xb8b4ae);
  function puff(e) { const q = smoke.find((x) => x.age >= x.life); if (!q) return; Object.assign(q, { age: 0, life: 3.5 + rnd() * 2, x: e.p.x, y: e.p.y, z: e.p.z, dx: 0.35 + rnd() * 0.3, dz: (rnd() - 0.5) * 0.3, size: 0.5 + rnd() * 0.3 }); q.s.visible = true; }

  // fountain: jets rise from the top bowl and fall into the basin, with drips off the middle bowl
  const drops = pool(70, 0xdff2ff), fountains = (placed['civic_fountain-plaza'] || []).map((o) => o.position.clone());
  function drop(c) { const q = drops.find((x) => x.age >= x.life); if (!q) return; const a = rnd() * 6.28, top = rnd() < 0.55, v = top ? 0.5 + rnd() * 0.35 : 0.25 + rnd() * 0.2;
    Object.assign(q, { age: 0, life: top ? 1.05 : 0.6, x: c.x + (top ? 0 : Math.cos(a) * 0.95), y: top ? 2.6 : 1.6, z: c.z + (top ? 0 : Math.sin(a) * 0.95), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: top ? 2.6 + rnd() * 0.6 : 0.2, size: 0.16 + rnd() * 0.1 }); q.s.visible = true; }

  // boats: the trireme rides at anchor, a small sailing boat crosses the bay
  const ships = (placed.landmark_trireme || []).map((o) => ({ o, y: o.position.y }));
  const boat = new THREE.Group(); { const wood = new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 0.8 }), hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 5, 1, 1, 6), wood), p = hull.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i) / 2.5, k = 1 - Math.abs(z) ** 2.2 * 0.92; p.setX(i, p.getX(i) * k * (p.getY(i) < 0 ? 0.6 : 1)); p.setY(i, p.getY(i) + Math.abs(z) ** 3 * 0.35); } hull.geometry.computeVertexNormals(); hull.position.y = 0.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), wood); mast.position.y = 2.4;
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6, 6, 1), new THREE.MeshStandardMaterial({ color: 0xf2e8d0, roughness: 0.9, side: THREE.DoubleSide })); { const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.35 * Math.cos(sp.getX(i) / 1.3 * Math.PI / 2)); sail.geometry.computeVertexNormals(); } sail.position.y = 2.9;
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshStandardMaterial({ color: 0xa8322d, side: THREE.DoubleSide })); stripe.position.set(0, 2.9, 0.37);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.9, 5), wood); yard.rotation.z = Math.PI / 2; yard.position.y = 4.2;
    boat.add(hull, mast, sail, stripe, yard); boat.traverse((m) => { m.castShadow = false; }); scene.add(boat); }

  const bg = scene.backgroundRotation;
  let last = null;
  tickers.push((t) => { const dt = last === null ? 0.016 : Math.min(0.1, t - last); last = t; time.value = t;
    for (const x of trees) { x.o.rotation.x = Math.sin(t * 0.9 * x.k + x.ph) * 0.012; x.o.rotation.z = Math.sin(t * 0.7 * x.k + x.ph * 1.7) * 0.014 + 0.004; }
    for (const e of emitters) { e.next -= dt; if (e.next <= 0) { e.next = 0.45 + rnd() * 0.3; puff(e); } }
    for (const q of smoke) { if (q.age >= q.life) { q.s.visible = false; continue; } q.age += dt; const k = q.age / q.life; q.s.position.set(q.x + q.dx * q.age * (0.5 + k), q.y + q.age * 0.75, q.z + q.dz * q.age); q.s.scale.setScalar(q.size * (1 + k * 3.2)); q.s.material.opacity = 0.42 * Math.sin(Math.min(1, k * 6) * Math.PI / 2) * (1 - k); }
    for (const c of fountains) for (let i = 0; i < 2; i++) if (rnd() < dt * 22) drop(c);
    for (const q of drops) { if (q.age >= q.life) { q.s.visible = false; continue; } q.age += dt; const a = q.age; q.s.position.set(q.x + q.vx * a, q.y + q.vy * a - 4.9 * a * a, q.z + q.vz * a); q.s.scale.setScalar(q.size); q.s.material.opacity = 0.75 * (1 - (a / q.life) ** 3); }
    for (const s of ships) { s.o.position.y = s.y + Math.sin(t * 0.8) * 0.12; s.o.rotation.z = Math.sin(t * 0.6) * 0.02; s.o.rotation.x = Math.sin(t * 0.47 + 1) * 0.012; }
    { const u = (t * 0.012) % 1, f = u < 0.5 ? u * 2 : 2 - u * 2, z = -70 + f * 150, dir = u < 0.5 ? 1 : -1; boat.position.set(104 + Math.sin(f * Math.PI) * 14, seaY + Math.sin(t * 1.3) * 0.07, z); boat.rotation.set(Math.sin(t * 1.1) * 0.03, dir > 0 ? 0 : Math.PI, Math.sin(t * 0.9) * 0.05); }
    if (bg) bg.y += dt * 0.0025;   // clouds drift
  });
  return { emitters: emitters.length, cloth: seen.size, trees: trees.length };
}
