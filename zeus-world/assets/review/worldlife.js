// What moves in the open world besides people and animals (ZW-054, item 1): the mill wheel turns, boats ride the water, cloth
// stirs in the wind, smoke rises from the huts and the fires, gulls wheel over the harbour and the city's shore.
//   const life = await createLife({ scene, built, places, heightAt, tickers });
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export async function createLife({ scene, built, places, heightAt, tickers }) {
  const time = { value: 0 }, spots = built.spots, UP = new THREE.Vector3(0, 1, 0);

  // ---------- cloth: banners, awnings and sails ripple. Done in the vertex shader, in the world's own space, so all cloth moves alike.
  // The models are drawn in batches, so the place of each copy (instanceMatrix) comes into it.
  const seen = new Set(); built.root.traverse((o) => { const m = o.isMesh && o.material; if (!m || !m.name?.startsWith('cloth_') || seen.has(m)) return; seen.add(m);
    m.onBeforeCompile = (sh) => { sh.uniforms.uTime = time; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      mat4 wm = modelMatrix;
      #ifdef USE_INSTANCING
        wm = modelMatrix * instanceMatrix;
      #endif
      vec4 wp = wm * vec4( transformed, 1.0 ); vec3 wn = normalize( mat3( wm ) * objectNormal ); if ( dot( wn, vec3( 0.37, 0.11, 0.92 ) ) < 0.0 ) wn = -wn;
      wp.xyz += wn * ( sin( uTime * 2.1 + wp.y * 2.4 + wp.x * 1.3 + wp.z * 1.1 ) * 0.03 + sin( uTime * 3.5 + wp.y * 4.6 - wp.x * 2.1 ) * 0.012 );
      vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;`); }; m.needsUpdate = true; });

  // ---------- boats ride the water: each rises, rolls and pitches a little on its own beat
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), boats = built.batchesOf('country_boat_fishing');
  tickers.push((t) => { for (const g of boats) { const ims = g.near ? g.full : g.far; g.list.forEach(([x, y, z, ry, s], i) => { const ph = x * 0.37 + z * 0.21; E.set(0.022 * Math.sin(t * 0.9 + ph), ry, 0.04 * Math.sin(t * 1.25 + ph * 1.7), 'YXZ'); M.compose(P.set(x, y + 0.05 * Math.sin(t * 1.1 + ph), z), Q.setFromEuler(E), S.setScalar(s)); for (const im of ims) im.setMatrixAt(i, M); }); for (const im of ims) im.instanceMatrix.needsUpdate = true; } });

  // ---------- the mill wheel: its own model, hung where the mill's frame expects it, turning with the stream
  if (spots.mill) { const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const g = await loader.loadAsync('./models/country_mill-wheel.glb').catch(() => null);
    if (g) { const m = spots.mill, hang = new THREE.Group(), wheel = g.scene; wheel.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); wheel.position.y = -2.0; const axle = new THREE.Group(); axle.add(wheel); hang.add(axle);
      hang.position.copy(P.set(2.59, 1.99, 0.4).applyAxisAngle(UP, m.ry)).add(new THREE.Vector3(m.x, m.y, m.z)); hang.rotation.y = m.ry; scene.add(hang); tickers.push((t) => { axle.rotation.x = -t * 0.55; }); } }

  // ---------- smoke: one cloud of points for every hearth. Each puff's place is worked out in the shader from its hearth and its age.
  const hearths = [...spots.huts.map((h) => [h.x, heightAt(h.x, h.z) + 3.95, h.z, 1]), ...built.lamps.filter((l) => l.kind === 'fire' && l.size).map((l) => [l.x, l.y + 0.6, l.z, 0.8])];
  if (hearths.length) { const PER = 16, n = hearths.length * PER, pos = new Float32Array(n * 3), seed = new Float32Array(n * 2); hearths.forEach((h, i) => { for (let k = 0; k < PER; k++) { pos.set(h.slice(0, 3), (i * PER + k) * 3); seed.set([(k + (i * 0.37) % 1) / PER, h[3] * (0.8 + 0.4 * ((k * 7 + i * 3) % 5) / 5)], (i * PER + k) * 2); } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 2));
    const smoke = new THREE.Points(geo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: time, uScale: { value: 900 }, uDim: { value: 1 }, uFog: { value: new THREE.Color(0xa9c8e6) }, uDen: { value: 0.00013 } },
      vertexShader: `attribute vec2 seed; uniform float uT; uniform float uScale; varying float vA; varying float vD; void main(){ float age = fract(uT * 0.07 + seed.x); vec3 p = position; float h = age * 14.0 * seed.y; p.y += h; p.x += h * 0.32 + sin(uT * 0.6 + seed.x * 40.0) * (0.15 + age * 0.9); p.z += cos(uT * 0.5 + seed.x * 31.0) * (0.15 + age * 0.8); vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vD = -mv.z; gl_PointSize = uScale * (0.9 + 3.2 * age) * seed.y / max(1.0, -mv.z); vA = smoothstep(0.0, 0.08, age) * (1.0 - age) * 0.85; }`,
      fragmentShader: `uniform float uDim; uniform vec3 uFog; uniform float uDen; varying float vA; varying float vD; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = vA * smoothstep(1.0, 0.25, r); if (a < 0.004) discard; float f = 1.0 - exp(-uDen * uDen * vD * vD); gl_FragColor = vec4(mix(vec3(0.78, 0.76, 0.74) * uDim, uFog, f), a); }` }));
    smoke.frustumCulled = false; smoke.renderOrder = 3; scene.add(smoke); }

  // ---------- gulls: small white birds that circle over the water, wings beating. One instanced draw.
  const homes = []; if (spots.harbour) for (let i = 0; i < 14; i++) homes.push([spots.harbour.x + 30, spots.harbour.z, 20 + i * 5, 12 + (i * 7) % 22]); for (let i = 0; i < 10; i++) homes.push([112, 4, 18 + i * 6, 14 + (i * 5) % 18]); if (spots.jetty) for (let i = 0; i < 4; i++) homes.push([spots.jetty.x, spots.jetty.z - 8, 10 + i * 5, 8 + i * 3 + (heightAt(spots.jetty.x, spots.jetty.z) || 0)]);
  { const g = new THREE.BufferGeometry(), v = [0, 0, 0.16, -0.62, 0, 0, 0, 0, -0.14, 0, 0, 0.16, 0, 0, -0.14, 0.62, 0, 0, 0, 0.02, 0.2, -0.05, 0, -0.2, 0.05, 0, -0.2]; g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.setAttribute('tip', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 0, 1, 0, 0, 0]), 1)); g.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide }); mat.onBeforeCompile = (sh) => { sh.uniforms.uTime = time; sh.vertexShader = 'uniform float uTime; attribute float tip;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed.y += tip * 0.3 * sin( uTime * 7.0 + instanceMatrix[3][0] * 0.7 + instanceMatrix[3][2] );`); };
    const im = new THREE.InstancedMesh(g, mat, homes.length); im.frustumCulled = false; scene.add(im);
    tickers.push((t) => { time.value = t; homes.forEach(([x, z, r, h], i) => { const w = (i % 2 ? -1 : 1) * 7 / r, a = i * 1.9 + t * w; E.set(0, -a + (w > 0 ? Math.PI : 0), (w > 0 ? -1 : 1) * 0.35, 'YXZ'); M.compose(P.set(x + Math.cos(a) * r, h + 3 * Math.sin(t * 0.3 + i), z + Math.sin(a) * r * 0.8), Q.setFromEuler(E), S.setScalar(1.1)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; }); }
  return { hearths: hearths.length, gulls: homes.length, boats: boats.reduce((n, g) => n + g.list.length, 0) };
}
