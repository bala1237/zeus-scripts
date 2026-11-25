// Flow: ribbons of coloured silk and smoke that drift and twist for ever on black, after the owner's "liquid art" reference (ZW-037).
// One full-screen shader, drawn behind the lasers. Nothing in it repeats: the shapes come from slowly drifting noise.
//   const flow = createFlow();  scene.add(flow.mesh);
//   flow.update(dt, { level, speed, pulse, a, b, c });   level 0 hides it; a, b, c are THREE.Color; speed 1 is the calm pace
import * as THREE from 'three';

export function createFlow() {
  const U = { uT: { value: 0 }, uLevel: { value: 0 }, uPulse: { value: 0 }, uAspect: { value: 16 / 9 }, uA: { value: new THREE.Color(0x10ff60) }, uB: { value: new THREE.Color(0x18c8ff) }, uC: { value: new THREE.Color(0xff2bd0) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP; uniform float uAspect; void main() { vP = vec2(position.x * uAspect, position.y); gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      precision highp float; varying vec2 vP; uniform float uT, uLevel, uPulse; uniform vec3 uA, uB, uC;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
      // one ribbon: a band that winds across the picture, twists (so it narrows to an edge and opens again), and is made of fine strands
      vec3 ribbon(vec2 p, float id, float ang, vec3 c1, vec3 c2) {
        float t = uT, ca = cos(ang), sa = sin(ang); vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
        // the whole space is bent by slow noise, which is what makes it flow like liquid
        q += 0.34 * (vec2(fbm(q * 0.75 + vec2(t * 0.05, id * 7.0)), fbm(q * 0.75 + vec2(id * 3.0, -t * 0.045))) - 0.5);
        float x = q.x, mid = 0.30 * sin(x * 1.25 + t * 0.21 + id * 2.1) + 0.13 * sin(x * 2.9 - t * 0.16 + id);
        float twist = cos(x * 1.5 - t * 0.33 + id * 1.7), w = 0.035 + 0.20 * abs(twist) * (0.75 + 0.25 * sin(x * 0.7 + t * 0.11 + id * 4.0));
        float d = (q.y - mid) / w, ad = abs(d); if (ad > 1.6) return vec3(0.0);
        float body = smoothstep(1.0, 0.55, ad);
        // strands run along the ribbon and wander a little across it
        float wob = fbm(vec2(x * 2.2 + id * 9.0, t * 0.08 + d * 0.6)) * 5.0, strands = pow(0.5 + 0.5 * sin(d * 13.0 + wob), 3.0), fine = pow(0.5 + 0.5 * sin(d * 41.0 - wob * 2.3), 6.0);
        float edge = exp(-pow((ad - 0.93) / 0.07, 2.0)), sheen = pow(max(0.0, 1.0 - abs(d + 0.35 * twist)), 3.0);
        float smoke = smoothstep(1.6, 0.9, ad) * (1.0 - body) * fbm(q * 3.2 + vec2(-t * 0.13, id * 5.0)) * 0.5;
        float k = 0.5 + 0.5 * sin(x * 0.9 + t * 0.09 + id * 2.6); vec3 col = mix(c1, c2, k);
        // where the ribbon turns edge-on it is thin and bright; face-on it is wide and soft
        float I = body * (0.10 + 0.55 * strands + 0.5 * fine + 0.9 * sheen) + 1.5 * edge * (0.4 + 0.6 * strands) + smoke;
        I *= 0.55 + 0.75 * (1.0 - abs(twist));
        return col * I + vec3(1.0) * body * pow(sheen, 3.0) * 0.5; }
      void main() { vec2 p = vP * 1.05;
        vec3 c = ribbon(p, 1.0, 0.55, uA, uB) + ribbon(p, 2.0, -0.6, uC, uA) + ribbon(p * 1.25 + vec2(0.3, -0.1), 3.0, 0.05, uB, uC) * 0.7;
        c *= uLevel * (0.85 + 0.35 * uPulse); float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0); gl_FragColor = vec4(c, a); }` });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); mesh.frustumCulled = false; mesh.renderOrder = -10;
  function update(dt, { level = 1, speed = 1, pulse = 0, a, b, c, aspect }) { U.uT.value += dt * speed; U.uLevel.value = level; U.uPulse.value = pulse; if (aspect) U.uAspect.value = aspect;
    if (a) U.uA.value.lerp(a, Math.min(1, dt * 1.2)); if (b) U.uB.value.lerp(b, Math.min(1, dt * 1.2)); if (c) U.uC.value.lerp(c, Math.min(1, dt * 1.2)); mesh.visible = level > 0.002; }
  return { mesh, update, uniforms: U };
}
