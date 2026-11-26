// The open world (ZW-049): the page. The land is worldland.js; where the ground is and what grows there is worldgen.js;
// the built places are worldplaces.js; the camera's moves, the story and the flights are cinecam.js.
//   ?ui=0 no controls (a browser source)   ?debug=1 figures on screen   ?light=day|dusk   ?place=falls start at a place
//   ?shot&beat=4&u=0.5   one still of a story shot, part way through      ?shot&place=falls&at=3   one still of a place, 3 s in
//   ?shot&cam=x,y,z,tx,ty,tz&fov=40   one still from a chosen camera
// From outside (a remote, later TikFinity): window.worldGo('falls'), window.worldStory()
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createLand } from './worldland.js';
import { createTrees } from './worldtrees.js';
import { createPlaces } from './worldplaces.js';
import { createCine } from './cinecam.js';
import { heightAt, places, city, river, pathThrough, ROAD_PTS } from './worldgen.js';

const q = new URLSearchParams(location.search), $ = (id) => document.getElementById(id), SHOT = q.has('shot'); if (q.get('ui') === '0' || SHOT) document.body.classList.add('plain');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT, logarithmicDepthBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.prepend(renderer.domElement); renderer.domElement.style.filter = 'saturate(1.16) contrast(1.08)';
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.4, 40000), tickers = [];
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---------- light and air, the same recipe as the city's stream grade, with haze that deepens with distance
const LD = { day: { sun: 0xffe9c4, sunI: 3.4, dir: [-0.55, 0.62, 0.5], hemi: 0.5, env: 0.62, exp: 0.9, fog: 0xa9c8e6, rot: 2.2 }, dusk: { sun: 0xff8a45, sunI: 1.7, dir: [-0.86, 0.2, 0.43], hemi: 0.16, env: 0.48, exp: 0.82, fog: 0xd99a78, rot: 3.9 } }, light = q.get('light') === 'dusk' ? 'dusk' : 'day', L = LD[light];
renderer.toneMappingExposure = L.exp; scene.fog = new THREE.FogExp2(L.fog, 0.00013);
const hemi = new THREE.HemisphereLight(0xfff4e0, 0x7a6a48, L.hemi), sun = new THREE.DirectionalLight(L.sun, L.sunI), sunDir = new THREE.Vector3(...L.dir).normalize(); scene.add(hemi, sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.25; Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 900 }); sun.shadow.camera.updateProjectionMatrix();
// the shadows cover the ground round whatever the camera is looking at; they are moved in whole steps so that they do not crawl
const focus = new THREE.Vector3(); function aimSun() { const s = 340 / 4096 * 8; sun.target.position.set(Math.round(focus.x / s) * s, focus.y, Math.round(focus.z / s) * s); sun.position.copy(sun.target.position).addScaledVector(sunDir, 420); sun.target.updateMatrixWorld(); }
const tex = await new THREE.TextureLoader().loadAsync(`./sky/${light}.jpg`); tex.colorSpace = THREE.SRGBColorSpace;
const dome = new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); dome.scale.z = -1; dome.rotation.y = L.rot; dome.renderOrder = -2; dome.frustumCulled = false; scene.add(dome);
const env = await new RGBELoader().loadAsync(`./sky/${light}.hdr`); env.mapping = THREE.EquirectangularReflectionMapping; scene.environment = env; scene.environmentIntensity = L.env; scene.environmentRotation = new THREE.Euler(0, L.rot, 0);

const trees = await createTrees({ renderer, scene, tickers }), land = createLand({ scene, tickers, trees });
const built = await createPlaces({ scene, heightAt, places, onProgress: (a, b) => { $('load').textContent = `THE WORLD IS WAKING  ${Math.round(100 * a / b)}%`; } });
const cine = createCine({ heightAt, road: pathThrough(ROAD_PTS, 4), riverPath: river().map((p) => [p[0], p[3], p[1]]), places });

// ---------- the director: the story by itself, a place held for as long as wanted, and the flight between
// mode: 'story' | 'flight' | 'place'. The story's clock stops while the director is elsewhere and picks up at the start of the shot it left.
const dir = { mode: 'story', key: null, clock: 0, storyAt: 0, from: null, to: null, sec: 0, then: null, pose: null, title: null };
const showTitle = (t) => { const k = t ? t.join('|') : ''; if (k === dir.title) return; dir.title = k; $('title').classList.toggle('on', !!t); if (t) { $('titleN').textContent = t[0]; $('titleS').textContent = t[1] || ''; } };
function fly(to, then) { dir.from = dir.pose || to; dir.to = to; dir.sec = cine.flightSeconds(dir.from, to); dir.clock = 0; dir.mode = 'flight'; dir.then = then; showTitle(null); }
function go(key) { if (!cine.places[key]) return; dir.key = key; fly(cine.place(key, 0), () => { dir.mode = 'place'; dir.clock = 0; }); mark(); }
function backToStory() { if (dir.mode === 'story') return; const b = cine.beats[cine.story(dir.storyAt).beat]; dir.storyAt = b.t0; dir.key = null; fly(cine.story(dir.storyAt), () => { dir.mode = 'story'; }); mark(); }
function mark() { if (document.body.classList.contains('plain')) return; $('story').classList.toggle('on', !dir.key); for (const b of $('places').children) b.classList.toggle('on', b.dataset.k === dir.key); }
for (const [k, p] of Object.entries(cine.places)) { const b = document.createElement('button'); b.textContent = p.name[0]; b.dataset.k = k; b.style.marginRight = '6px'; b.title = p.name[1] || p.name[0]; b.addEventListener('click', () => go(k)); $('places').append(b); }
$('story').addEventListener('click', backToStory); addEventListener('keydown', (e) => { const keys = Object.keys(cine.places), n = Number(e.key); if (e.key === '0' || e.key.toLowerCase() === 's') backToStory(); else if (n >= 1 && n <= keys.length) go(keys[n - 1]); else if (e.key.toLowerCase() === 'h' && q.get('ui') !== '0') document.body.classList.toggle('plain'); });
window.worldGo = go; window.worldStory = backToStory;
// what comes after the present shot, so that the land there can be made ready before the cut
function upcoming() { if (dir.mode === 'flight') return dir.to; if (dir.mode === 'story') { const p = cine.story(dir.storyAt), b = cine.beats[p.beat]; return dir.storyAt - b.t0 > b.sec - 5 ? cine.story(b.t0 + b.sec + 0.01) : null; } return null; }

// ---------- turning a pose into the camera, with the hand-held life added
const V = new THREE.Vector3(), T = new THREE.Vector3(), ahead = new THREE.Vector3();
function apply(pose, t) { const k = pose.shake || 0; camera.position.set(pose.p[0] + k * 0.018 * Math.sin(t * 1.9), pose.p[1] + k * (0.022 * Math.sin(t * 2.6 + 1) + 0.01 * Math.sin(t * 5.3)), pose.p[2] + k * 0.018 * Math.sin(t * 1.5 + 2)); T.set(...pose.t);
  if (camera.fov !== pose.fov) { camera.fov = pose.fov; camera.updateProjectionMatrix(); } camera.up.set(0, 1, 0); camera.lookAt(T);
  // the breath and tremor of a held camera: tiny turns, slow and quicker together, less through a long lens
  const a = k * 0.0045 * (pose.fov / 40); camera.rotateX(a * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1 + 1))); camera.rotateY(a * (Math.sin(t * 1.1 + 2) + 0.5 * Math.sin(t * 2.7))); camera.rotateZ((pose.roll || 0) + a * 0.5 * Math.sin(t * 0.9));
  $('curtain').style.opacity = String(pose.fade || 0); showTitle(pose.title || null);
  // the shadows follow the ground in front of the camera
  camera.getWorldDirection(ahead); const reach = Math.min(130, Math.max(20, V.copy(T).sub(camera.position).length())); focus.copy(camera.position).addScaledVector(ahead, reach); focus.y = heightAt(focus.x, focus.z); }
let lastT = 0;
function step(t) { const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t; dir.clock += dt;
  if (dir.mode === 'story') { dir.storyAt += dt; dir.pose = cine.story(dir.storyAt); }
  else if (dir.mode === 'place') dir.pose = cine.place(dir.key, dir.clock);
  else { const u = Math.min(1, dir.clock / dir.sec); dir.pose = cine.flight(dir.from, dir.to, u); if (u >= 1) { const f = dir.then; dir.then = null; f && f(); } }
  apply(dir.pose, t); }
function frame(t) { for (const f of tickers) f(t); dome.position.copy(camera.position); aimSun(); const nx = upcoming(); land.update(camera.position, false, nx ? { x: nx.p[0], y: nx.p[1], z: nx.p[2] } : null); trees.update(camera.position); renderer.render(scene, camera);
  if (q.get('debug') === '1') { const s = land.stats(), i = renderer.info.render; $('dbg').style.display = 'block'; $('dbg').textContent = `${dir.mode}${dir.key ? ' ' + dir.key : ''}  shot ${dir.pose?.beat ?? '-'}  squares ${s.squares}/${s.wanted}  trees ${s.trees} (${s.inFull} full, ${s.inFar} close)  calls ${i.calls}  triangles ${(i.triangles / 1e6).toFixed(2)}M  fps ${fps.toFixed(0)}`; } }
let fps = 0;
window.__world = { renderer, scene, camera, land, built, cine, dir, tickers, heightAt, places, city, go, backToStory };

if (SHOT) { // one still: a story shot, a place, or a chosen camera
  let pose; if (q.get('cam')) { const c = q.get('cam').split(',').map(Number); pose = { p: c.slice(0, 3), t: c.slice(3, 6), fov: Number(q.get('fov')) || 40, roll: 0, shake: 0 }; }
  else if (q.get('place')) pose = cine.place(q.get('place'), Number(q.get('at') || 3)); else { const b = cine.beats[Number(q.get('beat') || 0)]; pose = cine.story(b.t0 + b.sec * Number(q.get('u') ?? 0.5)); }
  pose.fade = 0; if (!q.has('title')) pose.title = null; apply(pose, 3); land.update(camera.position, true); const t0 = performance.now(); await new Promise((ok) => { const w = () => (land.settled() || performance.now() - t0 > 240000 ? ok() : setTimeout(w, 200)); w(); });
  for (const f of tickers) f(6); dome.position.copy(camera.position); aimSun(); trees.update(camera.position); renderer.render(scene, camera); renderer.render(scene, camera); $('load').style.transition = 'none'; $('load').classList.add('gone');
  window.__stats = { ...land.stats(), built: built.triangles, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, seconds: (performance.now() - t0) / 1000 }; window.ready = true; }
else { // the land under the first shot is made ready before the story starts, so that it opens on a finished picture
  dir.pose = cine.story(0); if (q.get('place') && cine.places[q.get('place')]) { dir.key = q.get('place'); dir.mode = 'place'; dir.pose = cine.place(dir.key, 0); } apply(dir.pose, 0); mark();
  const clock = new THREE.Clock(); let started = false, frames = 0, acc = 0, prev = 0;
  renderer.setAnimationLoop(() => { const t = clock.getElapsedTime(); frames++; acc += t - prev; prev = t; if (acc > 0.5) { fps = frames / acc; frames = 0; acc = 0; }
    if (!started) { for (const f of tickers) f(t); land.update(camera.position); trees.update(camera.position); dome.position.copy(camera.position); aimSun(); renderer.render(scene, camera); if (land.settled() || t > 25) { started = true; lastT = t; $('load').classList.add('gone'); } return; }
    step(t); frame(t); if (!document.body.classList.contains('plain')) $('status').textContent = dir.mode === 'flight' ? 'flying…' : dir.mode === 'place' ? cine.places[dir.key].name[0] : 'the story'; });
  window.ready = true; }
