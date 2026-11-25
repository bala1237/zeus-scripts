// Zeus Lasers, phase 2 prototype (ZW-036): ONE projector, to settle whether the light itself looks real before anything else is built.
// It is an overlay: the page shows only light, to be laid over a camera picture in the streaming software.
//   ?bg=black (default; set the source to Add or Screen blending)   ?bg=clear (transparent page, for a transparent source)   ?bg=mock (a stand-in camera picture)
//   ?demo (run without music at 124 beats a minute)   ?shot (one still; ?t=seconds how far in)   ?gain= ?haze= ?glow=
// The light is drawn by beams.js; the beat comes from beat.js. Movement goes through speed limits: nothing jumps.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createBeamRenderer } from './beams.js';
import { createBeat } from './beat.js';

const q = new URLSearchParams(location.search), SHOT = q.has('shot'), $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: SHOT, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1; document.body.append(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 200); camera.position.set(0, 1.45, 5.2); camera.lookAt(0, 1.75, 0);
const rig = createBeamRenderer({ maxBeams: 32, maxSheets: 4 }); scene.add(rig.group);

// ---------- the projector: high and behind the performer, facing the camera. A small housing with a glowing aperture.
const P = { pos: new THREE.Vector3(0, 3.55, -3.4), yaw: 0, length: 26 };
const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0x050608 })); housing.position.copy(P.pos).add(new THREE.Vector3(0, 0, -0.16)); scene.add(housing);
const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const aperture = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); aperture.position.copy(P.pos); scene.add(aperture);

// ---------- output: glow only from what is brighter than white (the beams), tone mapping, then an alpha so the page can be laid over a camera
const composer = new EffectComposer(renderer), bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), Number(q.get('glow') ?? 0.45), 0.32, 1.2);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)) * 1.15, 0.0, 1.0)); }' }));   // light has no edge: how see-through a pixel is follows how bright it is

// ---------- movement: every value eases to its target under a speed limit, as a mirror with mass would
const eased = (v) => ({ v, vel: 0, to: v }), step = (e, dt, time = 0.45, max = 3) => { const w = 2 / time, x = w * dt, k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x); let ch = Math.max(-max * time, Math.min(max * time, e.v - e.to)); const tgt = e.v - ch, tmp = (e.vel + w * ch) * dt; e.vel = (e.vel - w * tmp) * k; e.v = tgt + (ch + tmp) * k; };
const M = { spread: eased(0.05), tilt: eased(-0.2), pan: eased(0), fan: eased(0), sheet: eased(0), sheetTilt: eased(-0.05), sheetSpread: eased(0.9) };
// one colour at a time, from a short list a lighting designer would use; it changes rarely and fades across
const COLOURS = [0x10ff60, 0x18c8ff, 0x2a54ff, 0xff2bd0, 0xff2a1e, 0xdfe8ff].map((h) => new THREE.Color(h)), col = COLOURS[0].clone();
const st = { t: 0, gain: Number(q.get('gain') ?? 1), demo: q.has('demo') };
const beat = createBeat({ bpm: 124 }), D = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Euler(), BEAMS = 9;
const aim = (out, ax, tilt, pan) => out.set(Math.sin(ax), 0, Math.cos(ax)).applyEuler(E.set(-tilt, pan, 0, 'YXZ'));
function update(dt) { const b = beat.state; beat.update(dt); st.t += dt; const beats = b.beats, act = b.act;
  // the cue sheet for the prototype: sixteen beats each. A fan that opens, a fan that sweeps, a sheet alone, then both.
  const cue = Math.floor(beats / 16) % 4, u = (beats % 16) / 16, ease = (x) => x * x * (3 - 2 * x);
  if (cue === 0) { M.fan.to = 1; M.sheet.to = 0; M.spread.to = 0.06 + 0.88 * ease(Math.min(1, u * 2)); M.tilt.to = -0.34 + 0.2 * u; M.pan.to = 0; }
  else if (cue === 1) { M.fan.to = 1; M.sheet.to = 0; M.spread.to = 0.22; M.tilt.to = -0.22; M.pan.to = 0.62 * Math.sin(u * Math.PI * 2); }
  else if (cue === 2) { M.fan.to = 0; M.sheet.to = 1; M.sheetSpread.to = 1.0; M.sheetTilt.to = 0.06 - 0.42 * ease(u); }
  else { M.fan.to = 1; M.sheet.to = 1; M.spread.to = 0.8; M.tilt.to = -0.4; M.pan.to = 0; M.sheetSpread.to = 1.0; M.sheetTilt.to = -0.03; }
  for (const k in M) step(M[k], dt, k === 'fan' || k === 'sheet' ? 0.7 : 0.4, 2.2);
  const next = COLOURS[Math.floor(beats / 64) % COLOURS.length]; col.lerp(next, Math.min(1, dt * 0.6));
  const kick = 0.72 + 0.28 * b.pulse, I = act * st.gain * kick;
  const together = 0.3 + 0.7 * Math.min(1, M.spread.v / 0.45);   // a closed fan is nine beams on top of each other, so each is dimmed to keep the total steady
  rig.begin();
  for (let i = 0; i < BEAMS; i++) { const f = i / (BEAMS - 1) - 0.5; aim(D, f * 2 * M.spread.v, M.tilt.v, M.pan.v); rig.beam(P.pos, D, P.length, col, I * M.fan.v * 1.7 * together); }
  aim(A, -M.sheetSpread.v, M.sheetTilt.v, 0); aim(B, M.sheetSpread.v, M.sheetTilt.v, 0); rig.sheet(P.pos, A, B, P.length, col, I * M.sheet.v * 3.2);
  rig.uniforms.uGain.value = 1; rig.end(st.t, camera, renderer.domElement.height);
  const on = act * Math.max(M.fan.v, M.sheet.v); aperture.material.color.copy(col).multiplyScalar(1.6 * on * kick); aperture.scale.setScalar(0.3 + 0.12 * on); }
const draw = () => composer.render();

// ---------- controls
let bgMode = q.get('bg') || 'black'; const setBg = () => { document.body.classList.toggle('clear', bgMode === 'clear'); document.body.classList.toggle('mock', bgMode === 'mock'); $('bg').textContent = `Background: ${bgMode === 'mock' ? 'stand-in camera' : bgMode}`; }; setBg();
$('bg').addEventListener('click', () => { bgMode = { black: 'clear', clear: 'mock', mock: 'black' }[bgMode]; setBg(); });
$('listen').addEventListener('click', () => { if (beat.state.mode === 'listen') beat.unlisten(); else beat.listen().catch((e) => { failed = 'could not listen: ' + e.message; }); }); let failed = '';
$('tap').addEventListener('pointerdown', () => beat.tap()); $('stop').addEventListener('click', () => beat.stop()); $('demo').addEventListener('click', () => { beat.state.bpm = 124; beat.tap(); });
for (const [id, f] of [['gain', (v) => { st.gain = v; }], ['haze', (v) => { rig.uniforms.uHaze.value = v; }], ['glow', (v) => { bloom.strength = v; }]]) { if (q.get(id)) $(id).value = q.get(id); $(id).addEventListener('input', (e) => f(Number(e.target.value))); f(Number($(id).value)); }
let idle = null, hidden = false; const wake = () => { $('ui').classList.remove('idle'); document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => { $('ui').classList.add('idle'); document.body.classList.add('idle'); }, 3500); };
addEventListener('pointermove', () => { if (!hidden) wake(); }); wake();
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); beat.tap(); } else if (e.key === 'h' || e.key === 'H') { hidden = !hidden; if (hidden) { clearTimeout(idle); $('ui').classList.add('idle'); document.body.classList.add('idle'); } else wake(); } });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
window.__laser = { st, beat, update, draw, M, rig };
if (SHOT) { $('ui').style.display = 'none'; beat.tap(); const n = Number(q.get('t') || 6); for (let t = 0; t < n; t += 1 / 60) update(1 / 60); draw(); window.ready = true; }
else { if (st.demo) beat.tap(); let last = performance.now(), frames = 0, acc = 0, worst = 0;
  renderer.setAnimationLoop(() => { const now = performance.now(), ms = now - last; last = now; update(Math.min(0.1, ms / 1000)); draw(); frames++; acc += ms; worst = Math.max(worst, ms);
    const b = beat.state; $('lamp').style.background = b.pulse > 0.5 && b.act > 0.2 ? '#ffd23f' : '#2a3040'; $('listen').classList.toggle('on', b.mode === 'listen'); $('listen').textContent = b.mode === 'listen' ? 'Stop listening' : 'Listen to the music';
    $('status').textContent = failed || (b.mode === 'off' ? 'still' : b.mode === 'tap' ? `running at ${b.bpm}` : b.act < 0.3 ? 'listening: no music' : `listening: ${b.bpm} beats a minute`);
    if (acc > 1000) { const mem = performance.memory ? ` · ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : ''; $('stats').textContent = `${Math.round(frames * 1000 / acc)} frames a second · slowest frame ${Math.round(worst)} ms${mem}`; frames = 0; acc = 0; worst = 0; } });
  window.ready = true; }
