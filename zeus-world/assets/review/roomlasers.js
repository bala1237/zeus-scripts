// The laser light for Andie's Place (ZW-042): the club rig from the laser page, in her purple and gold, drawn on a see-through
// canvas laid over the room. Loaded only when lasers are switched on, so the room-only mode costs nothing extra.
//   const lasers = await createRoomLasers(parent);   lasers.update(dt, beatState, level);   lasers.hit();
// The rig code is a trimmed copy of what laser.js does for its seven club projectors; if that changes, change this too.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createBeamRenderer } from './beams.js';
import { createDirector, THEMES } from './director.js';

export function createRoomLasers(parent, { width = 1920, height = 1080, shot = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: shot, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(width, height, false); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; parent.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(52, width / height, 0.05, 200); camera.position.set(0, 1.45, 5.2); camera.lookAt(0, 1.9, -1);
  const rig = createBeamRenderer({ maxBeams: 64, maxSheets: 8 }); scene.add(rig.group);
  const RIG = [
    { group: 'back', side: 0, pos: [0, 3.6, -3.6], yaw: 0, n: 9 }, { group: 'back', side: -1, pos: [-3.3, 3.35, -3.2], yaw: 0.16, n: 9 }, { group: 'back', side: 1, pos: [3.3, 3.35, -3.2], yaw: -0.16, n: 9 },
    { group: 'side', side: -1, pos: [-5.4, 2.1, -0.6], yaw: 1.25, n: 7 }, { group: 'side', side: 1, pos: [5.4, 2.1, -0.6], yaw: -1.25, n: 7 },
    { group: 'floor', side: -1, pos: [-2.5, 0.2, -2.6], yaw: 0.1, pitch: 1.0, n: 5 }, { group: 'floor', side: 1, pos: [2.5, 0.2, -2.6], yaw: -0.1, pitch: 1.0, n: 5 }];
  const eased = (v) => ({ v, vel: 0, to: v }), step = (e, dt, time, max = 2.6) => { const w = 2 / time, x = w * dt, k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), ch = Math.max(-max * time, Math.min(max * time, e.v - e.to)), tgt = e.v - ch, tmp = (e.vel + w * ch) * dt; e.vel = (e.vel - w * tmp) * k; e.v = tgt + (ch + tmp) * k; };
  const KEYS = ['pan', 'tilt', 'spread', 'roll', 'level', 'sheet', 'sheetSpread', 'cone', 'lean'];
  for (const p of RIG) { p.P = new THREE.Vector3(...p.pos); p.pitch = p.pitch || 0; p.e = Object.fromEntries(KEYS.map((k) => [k, eased(k === 'tilt' ? -0.25 : k === 'sheetSpread' ? 0.9 : k === 'spread' ? 0.1 : 0)])); p.spin = 0; p.mix = eased(0); p.t = {}; }
  const composer = new EffectComposer(renderer), bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.45, 0.32, 1.2); composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)) * 1.15, 0.0, 1.0)); }' }));
  const dir = createDirector({ seed: 23 }), mogul = THEMES.findIndex((t) => t.only === 'andie'); dir.setTheme(mogul); dir.state.auto = false;
  const theme = THEMES[mogul], main = new THREE.Color(theme.main), accent = new THREE.Color(theme.accent), C = new THREE.Color(), D = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Euler();
  const aim = (out, p, ax, coneA, phi) => { const e = p.e, cx = Math.sin(ax) * Math.cos(e.roll.v), cy = Math.sin(ax) * Math.sin(e.roll.v), k = e.cone.v;
    out.set(cx * (1 - k) + Math.sin(coneA) * Math.cos(phi) * k, cy * (1 - k) + Math.sin(coneA) * Math.sin(phi) * k, Math.cos(ax) * (1 - k) + Math.cos(coneA) * k).normalize().applyEuler(E.set(-(p.pitch + e.tilt.v), p.yaw + e.pan.v, 0, 'YXZ')); return out; };
  let t = 0, shown = false;
  // level 0 to 1 is how much of the laser light is let through; at 0 nothing is drawn at all
  function update(dt, b, level, pattern) { t += dt; const d = dir.update(b.beats); if (pattern) d.pattern = pattern; const act = level, kick = 0.74 + 0.26 * b.pulse;
    if (act < 0.01) { if (shown) { renderer.clear(); shown = false; } return; }
    let load = 0; for (const p of RIG) load += Math.max(0, p.e.level.v) * (p.e.spread.v < 0.1 && p.e.cone.v < 0.5 ? 3 : p.n) + 5 * Math.max(0, p.e.sheet.v); const budget = Math.min(1.25, Math.pow(13 / Math.max(load, 1), 0.55));
    rig.begin();
    for (const p of RIG) { const tg = dir.target(p, p.t), e = p.e; for (const k of KEYS) { e[k].to = tg[k]; step(e[k], dt, k === 'level' || k === 'sheet' ? Math.min(tg.time, 0.3) : tg.time); } p.mix.to = tg.accent ? 1 : 0; step(p.mix, dt, 0.5); p.spin += tg.spin * dt * 1.4;
      // gold is used freely here, on the side projectors, because gold is half of her look
      const col = C.copy(main).lerp(accent, Math.max(p.mix.v, p.group === 'side' ? 1 : 0)), lvl = Math.max(0, e.level.v), sh = Math.max(0, e.sheet.v), I = act * kick * budget;
      const narrow = e.spread.v < 0.1 && e.cone.v < 0.5, together = e.cone.v > 0.5 ? 1 : narrow ? 0.75 : 0.3 + 0.7 * Math.min(1, e.spread.v / 0.45), n = narrow ? (e.spread.v < 0.004 ? 1 : 3) : p.n;
      if (lvl > 0.01) for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) - 0.5 : 0; aim(D, p, f * 2 * e.spread.v + e.lean.v, e.spread.v, i / n * Math.PI * 2 + p.spin); rig.beam(p.P, D, 26, col, I * lvl * 1.7 * together); }
      if (sh > 0.01) { const keep = e.cone.v; e.cone.v = 0; aim(A, p, e.lean.v - e.sheetSpread.v, 0, 0); aim(B, p, e.lean.v + e.sheetSpread.v, 0, 0); e.cone.v = keep; rig.sheet(p.P, A, B, 26, col, I * sh * 5.5); } }
    rig.end(t, camera, height); composer.render(); shown = true; }
  return { update, hit: () => dir.hit(), setCalm: (on) => dir.setCalm(on), dir, rig, canvas: renderer.domElement };
}
