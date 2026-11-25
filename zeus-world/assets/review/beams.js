// Laser light in haze: beams and scanned sheets, drawn to look like light travelling through smoky air.
//   const rig = createBeamRenderer({ maxBeams: 64, maxSheets: 8 });   scene.add(rig.group);
//   each frame: rig.begin();  rig.beam(origin, dir, length, color, intensity, width, divergence);  rig.sheet(origin, dirA, dirB, length, color, intensity);
//               rig.end(time, camera, heightInPixels);
// A beam is a ribbon that turns to face the camera and is shaded per pixel: a tight core with a soft skirt, never thinner than a pixel,
// brighter where the haze is thick, brighter when it is seen nearly end-on and when it points towards the viewer, fading with distance.
// Brightness goes far above white on purpose: the page tone-maps at the end, so cores burn to white with their colour in the halo.
// Nothing is allocated per frame.
import * as THREE from 'three';

const NOISE = /* glsl */`
  float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  // haze: slow billows with finer wisps, drifting. 1.0 is average density.
  float haze(vec3 p, float t) { vec3 q = p * 0.55 + vec3(37.0 + t * 0.06, 19.0 - t * 0.025, 53.0 + t * 0.04); float n = 0.6 * n3(q) + 0.28 * n3(q * 2.6 + 11.0) + 0.12 * n3(q * 6.5 - 5.0); return 0.22 + 1.9 * n * n * 1.6; }`;

export function createBeamRenderer({ maxBeams = 64, maxSheets = 8 } = {}) {
  const U = { uTime: { value: 0 }, uPx: { value: 0.001 }, uGain: { value: 1 }, uHaze: { value: 1 }, uFade: { value: 0.012 } };   // uPx: metres per pixel at one metre from the camera
  const group = new THREE.Group(), common = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, uniforms: U, toneMapped: false };

  // ---------- beams: one quad each, stretched along the beam and turned towards the camera
  const SKIRT = 7.0, bg = new THREE.InstancedBufferGeometry(); { // divided along its length, because the width in pixels depends on how far each part is from the camera; with only two ends, a beam passing the lens became a wedge
    const N = 56, pos = [], idx = []; for (let i = 0; i <= N; i++) { const t = i / N; pos.push(-1, t, 0, 1, t, 0); } for (let i = 0; i < N; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); } bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setIndex(idx); }
  const bO = new Float32Array(maxBeams * 3), bD = new Float32Array(maxBeams * 3), bC = new Float32Array(maxBeams * 4), bP = new Float32Array(maxBeams * 3);
  const attr = (g, name, arr, n) => { const a = new THREE.InstancedBufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
  const aO = attr(bg, 'iO', bO, 3), aD = attr(bg, 'iD', bD, 3), aC = attr(bg, 'iC', bC, 4), aP = attr(bg, 'iP', bP, 3);
  const beams = new THREE.Mesh(bg, new THREE.ShaderMaterial({ ...common,
    vertexShader: /* glsl */`
      attribute vec3 iO, iD, iP; attribute vec4 iC; uniform float uPx; varying float vS, vT, vK, vCos, vLen; varying vec3 vW; varying vec4 vC;
      void main() { float t = position.y; vec3 p = iO + iD * iP.x * t, toCam = cameraPosition - p; float dist = length(toCam);
        vec3 side = cross(iD, toCam); side = length(side) > 1e-5 ? normalize(side) : vec3(1.0, 0.0, 0.0);
        // a beam passing right beside the lens would fill the picture, so it fades out as it reaches the camera (the smoothstep on dist)
        float w = iP.y + iP.z * iP.x * t, wUse = clamp(w, 0.6 * uPx * dist, 2.6 * uPx * dist);   // real half-width, but never under about a pixel nor over a few: on camera a beam stays a thin line however near it passes
        vK = min(w / wUse, 1.0) * smoothstep(1.8, 6.5, dist); vS = position.x; vT = t; vLen = iP.x; vC = iC; vCos = dot(iD, -toCam / dist); vW = p + side * position.x * wUse * ${SKIRT.toFixed(1)};
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fragmentShader: /* glsl */`
      precision highp float; uniform float uTime, uGain, uHaze, uFade; varying float vS, vT, vK, vCos, vLen; varying vec3 vW; varying vec4 vC; ${NOISE}
      void main() { float a = abs(vS) * ${SKIRT.toFixed(1)}, core = exp(-a * a * 1.3), skirt = 0.02 * exp(-a * 1.1) * (1.0 - smoothstep(0.6, 1.0, abs(vS)));
        float sinT = sqrt(max(1.0 - vCos * vCos, 0.0)), thick = min(1.0 / max(sinT, 0.3), 3.2);                 // looking along a beam, you look through more of it
        float toward = 1.0 + 1.1 * pow(max(-vCos, 0.0), 6.0);                                                    // haze throws light forwards: a beam aimed near you flares
        float d = vT * vLen, along = smoothstep(0.0, 0.25, d) * (1.0 - smoothstep(0.86, 1.0, vT)) * exp(-d * uFade);
        float h = mix(1.0, haze(vW, uTime), uHaze);
        float I = vC.a * uGain * along * h * thick * toward * (core + skirt) * vK;
        gl_FragColor = vec4(vC.rgb * I + vec3(1.0) * I * core * 0.22, 1.0); }` }));
  beams.frustumCulled = false; group.add(beams);

  // ---------- sheets: what a scanner draws when it sweeps a beam fast across an angle. A fan-shaped surface of light.
  const SEG = 40, sg = new THREE.InstancedBufferGeometry(); { const pos = [], idx = []; for (let i = 0; i <= SEG; i++) pos.push(i / SEG, 0, 0, i / SEG, 1, 0); for (let i = 0; i < SEG; i++) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); }
  const sO = new Float32Array(maxSheets * 3), sA = new Float32Array(maxSheets * 3), sB = new Float32Array(maxSheets * 3), sC = new Float32Array(maxSheets * 4), sL = new Float32Array(maxSheets);
  const tO = attr(sg, 'iO', sO, 3), tA = attr(sg, 'iA', sA, 3), tB = attr(sg, 'iB', sB, 3), tC = attr(sg, 'iC', sC, 4), tL = attr(sg, 'iL', sL, 1);
  const sheets = new THREE.Mesh(sg, new THREE.ShaderMaterial({ ...common,
    vertexShader: /* glsl */`
      attribute vec3 iO, iA, iB; attribute vec4 iC; attribute float iL; varying float vU, vT, vLen; varying vec3 vW, vN; varying vec4 vC;
      void main() { vec3 dir = normalize(mix(iA, iB, position.x)); vW = iO + dir * iL * position.y; vN = normalize(cross(iA, iB)); vU = position.x; vT = position.y; vLen = iL; vC = iC;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fragmentShader: /* glsl */`
      precision highp float; uniform float uTime, uGain, uHaze, uFade; varying float vU, vT, vLen; varying vec3 vW, vN; varying vec4 vC; ${NOISE}
      void main() { vec3 v = normalize(vW - cameraPosition); float edgeOn = min(1.0 / max(abs(dot(vN, v)), 0.16), 6.0);   // a sheet seen edge-on is a bright line; face-on it is a faint veil
        float d = vT * vLen, along = smoothstep(0.0, 0.3, d) * (1.0 - smoothstep(0.8, 1.0, vT)) * exp(-d * uFade);
        float h = mix(1.0, haze(vW, uTime), uHaze), rays = 0.82 + 0.36 * n3(vec3(vU * 70.0, d * 0.15, uTime * 0.2));                 // faint streaks along the scan
        float ends = 1.0 + 5.0 * (exp(-vU * 160.0) + exp(-(1.0 - vU) * 160.0));                                                        // the scanner dwells at each end of its sweep
        float I = vC.a * uGain * 0.0075 * along * h * h * rays * edgeOn * ends * smoothstep(1.0, 5.0, distance(vW, cameraPosition));
        gl_FragColor = vec4(vC.rgb * I, 1.0); }` }));
  sheets.frustumCulled = false; group.add(sheets);

  let nb = 0, ns = 0;
  const begin = () => { nb = 0; ns = 0; };
  // width is the half-width in metres at the aperture; divergence widens it with distance (radians)
  function beam(o, d, length, color, intensity, width = 0.006, divergence = 0.0012) { if (nb >= maxBeams || intensity <= 0.001) return; const i = nb++; bO[i * 3] = o.x; bO[i * 3 + 1] = o.y; bO[i * 3 + 2] = o.z; bD[i * 3] = d.x; bD[i * 3 + 1] = d.y; bD[i * 3 + 2] = d.z;
    bC[i * 4] = color.r; bC[i * 4 + 1] = color.g; bC[i * 4 + 2] = color.b; bC[i * 4 + 3] = intensity; bP[i * 3] = length; bP[i * 3 + 1] = width; bP[i * 3 + 2] = divergence; }
  function sheet(o, a, b, length, color, intensity) { if (ns >= maxSheets || intensity <= 0.001) return; const i = ns++; sO[i * 3] = o.x; sO[i * 3 + 1] = o.y; sO[i * 3 + 2] = o.z; sA[i * 3] = a.x; sA[i * 3 + 1] = a.y; sA[i * 3 + 2] = a.z; sB[i * 3] = b.x; sB[i * 3 + 1] = b.y; sB[i * 3 + 2] = b.z;
    sC[i * 4] = color.r; sC[i * 4 + 1] = color.g; sC[i * 4 + 2] = color.b; sC[i * 4 + 3] = intensity; sL[i] = length; }
  function end(time, camera, heightPx) { bg.instanceCount = nb; sg.instanceCount = ns; beams.visible = nb > 0; sheets.visible = ns > 0; for (const a of [aO, aD, aC, aP, tO, tA, tB, tC, tL]) a.needsUpdate = true;
    U.uTime.value = time; U.uPx.value = 2 * Math.tan(camera.fov * Math.PI / 360) / heightPx; }
  const dispose = () => { bg.dispose(); sg.dispose(); beams.material.dispose(); sheets.material.dispose(); };
  return { group, begin, beam, sheet, end, dispose, uniforms: U, counts: () => [nb, ns] };
}
