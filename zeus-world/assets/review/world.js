// The open world (ZW-049): the page. The land is worldland.js; where the ground is and what grows there is worldgen.js;
// the built places are worldplaces.js; the camera's moves, the story and the flights are cinecam.js.
//   ?ui=0 no controls (a browser source)   ?debug=1 figures on screen   ?light=day|dusk|night|dawn|storm   ?place=falls start at a place
//   ?sharp=2 draw at the screen's full sharpness (heavier; the default is 1.25)   ?fps=30 frames a second at most (60 by default; 0 = no cap)
//   ?shot&beat=4&u=0.5   one still of a story shot, part way through      ?shot&place=falls&at=3   one still of a place, 3 s in
//   ?shot&cam=x,y,z,tx,ty,tz&fov=40   one still from a chosen camera
// From outside (a remote, later TikFinity): window.worldGo('falls'), window.worldStory()
import * as THREE from 'three';
import { createLand } from './worldland.js';
import { createTrees } from './worldtrees.js';
import { createPlaces } from './worldplaces.js';
import { createCine } from './cinecam.js';
import { createAir, AIR } from './worldair.js';
import { createAnimals } from './worldanimals.js';
import { createLife } from './worldlife.js';
import { createPeople } from './worldpeople.js';
import { connectObs } from './obsremote.js';
import { heightAt, places, city, river, pathThrough, ROAD_PTS } from './worldgen.js';

const q = new URLSearchParams(location.search), $ = (id) => document.getElementById(id), SHOT = q.has('shot'); if (q.get('ui') === '0' || SHOT) document.body.classList.add('plain');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT, reversedDepthBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, Number(q.get('sharp')) || 1.25)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.prepend(renderer.domElement); renderer.domElement.style.filter = 'saturate(1.16) contrast(1.08)';
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 40000), tickers = [];
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---------- light, sky and weather are worldair.js; it is made once the places are known, since the lamps belong to them
const focus = new THREE.Vector3(), light = AIR[q.get('light')] ? q.get('light') : 'day';

const trees = await createTrees({ renderer, scene, tickers }), land = createLand({ scene, tickers, trees }); await land.ready;
const roadPath = pathThrough(ROAD_PTS, 4), camps = [0.2, 0.6, 0.86].map((f) => { const a = roadPath[Math.floor(roadPath.length * f)], b = roadPath[Math.floor(roadPath.length * f) + 1], dx = b[0] - a[0], dz = b[b.length - 1] - a[a.length - 1], n = Math.hypot(dx, dz) || 1; return [a[0] - dz / n * 11, a[a.length - 1] + dx / n * 11]; });
const roadside = [0.42, 0.73].map((f) => { const i = Math.floor(roadPath.length * f), p = roadPath[i], n = roadPath[i + 1], dx = n[0] - p[0], dz = n[2] - p[2], l = Math.hypot(dx, dz) || 1; return [p[0] + dz / l * 8, p[2] - dx / l * 8, Math.atan2(-dz / l, dx / l)]; });
const built = await createPlaces({ scene, heightAt, places, camps, roadside, river: river(), onProgress: (a, b) => { $('load').textContent = `THE WORLD IS WAKING  ${Math.round(100 * a / b)}%`; } });
const cine = createCine({ heightAt, road: roadPath, riverPath: river().map((p) => [p[0], p[3], p[1]]), places });
const rv = river(), air = await createAir({ scene, renderer, tickers, lamps: built.lamps, mistAt: rv.filter((p, i) => i % Math.max(1, Math.floor(rv.length / 70)) === 0).map((p) => [p[0], p[3], p[1]]), start: light }), sun = air.sun, dome = air.dome, aimSun = () => air.follow(camera.position, focus);
const animals = q.get('animals') === '0' ? null : await createAnimals({ scene, heightAt, spots: built.spots, tickers });
const life = q.get('life') === '0' ? null : await createLife({ scene, built, places, heightAt, tickers });
await air.set(light); // again, so that what was made after the light (smoke) takes its colours
const people = q.get('people') === '0' ? null : await createPeople({ scene, heightAt, places, spots: built.spots, road: roadPath, hero: { man: 'char_citizen_man', woman: 'char_citizen_woman', elder: 'char_citizen_elder' }[q.get('hero')] });

// ---------- the director: the story by itself, a place held for as long as wanted, and the flight between
// mode: 'story' | 'flight' | 'place'. The story's clock stops while the director is elsewhere and picks up at the start of the shot it left.
const dir = { mode: 'story', key: null, clock: 0, storyAt: 0, from: null, to: null, sec: 0, then: null, pose: null, title: null };
const showTitle = (t) => { const k = t ? t.join('|') : ''; if (k === dir.title) return; dir.title = k; $('title').classList.toggle('on', !!t); if (t) { $('titleN').textContent = t[0]; $('titleS').textContent = t[1] || ''; } };
function fly(to, then) { dir.from = dir.pose || to; dir.to = to; dir.sec = cine.flightSeconds(dir.from, to); dir.clock = 0; dir.mode = 'flight'; dir.then = then; showTitle(null); }
function go(key) { if (!cine.places[key]) return; dir.key = key; fly(cine.place(key, 0), () => { dir.mode = 'place'; dir.clock = 0; }); mark(); }
function backToStory() { if (dir.mode === 'story') return; const b = cine.beats[cine.story(dir.storyAt).beat]; dir.storyAt = b.t0; dir.key = null; fly(cine.story(dir.storyAt), () => { dir.mode = 'story'; }); mark(); }
function mark() { if (document.body.classList.contains('plain')) return; $('story').classList.toggle('on', !dir.key); for (const b of $('places').children) b.classList.toggle('on', b.dataset.k === dir.key); }
for (const [k, p] of Object.entries(cine.places)) { const b = document.createElement('button'); b.textContent = p.name[0]; b.dataset.k = k; b.style.marginRight = '6px'; b.title = p.name[1] || p.name[0]; b.addEventListener('click', () => { go(k); tell({ cmd: 'go', key: k }); }); $('places').append(b); }
$('story').addEventListener('click', () => { backToStory(); tell({ cmd: 'story' }); }); addEventListener('keydown', (e) => { const keys = Object.keys(cine.places), n = Number(e.key); if (e.key === '0' || e.key.toLowerCase() === 's') backToStory(); else if (n >= 1 && n <= keys.length) go(keys[n - 1]); else if (e.key.toLowerCase() === 'h' && q.get('ui') !== '0') document.body.classList.toggle('plain'); });
// the light and the weather: day, dusk, night, dawn, storm
function setAir(k) { if (!AIR[k]) return; air.set(k).then(() => { if (document.body.classList.contains('plain')) return; for (const b of $('airs').children) b.classList.toggle('on', b.dataset.k === k); }); }
for (const [k, a] of Object.entries(AIR)) { const b = document.createElement('button'); b.textContent = a.name; b.dataset.k = k; b.style.marginRight = '6px'; b.classList.toggle('on', k === light); b.addEventListener('click', () => { setAir(k); tell({ cmd: 'air', key: k }); }); $('airs').append(b); }
$('bolt').addEventListener('click', () => { air.strike(); tell({ cmd: 'bolt' }); });
window.worldGo = go; window.worldStory = backToStory; window.worldLight = setAir;
// ---------- the remote (phase 4). A page without controls (a browser source in OBS) does what it is told: by OBS itself (an event OBS
// hands to every browser source) or by another tab of the same browser. The page with controls is the remote: once connected to OBS on
// this computer, Story and the place buttons steer the world in OBS as well as here.
const chan = 'BroadcastChannel' in window ? new BroadcastChannel('zeus-world') : null, obey = (m) => { if (!m || typeof m !== 'object') return; if (m.cmd === 'go') go(m.key); else if (m.cmd === 'story') backToStory(); else if (m.cmd === 'air') setAir(m.key); else if (m.cmd === 'bolt') air.strike(); };
addEventListener('zeusWorld', (e) => obey(e.detail)); if (chan && q.get('ui') === '0') chan.onmessage = (e) => obey(e.data);
let obs = null; const tell = (m) => { if (q.get('ui') === '0' || SHOT) return; chan?.postMessage(m); if (obs) obs.emit('zeusWorld', m).then(() => { $('obsStatus').textContent = m.cmd === 'go' ? `OBS: flying to ${cine.places[m.key].name[0]}` : m.cmd === 'air' ? `OBS: ${AIR[m.key].name.toLowerCase()}` : m.cmd === 'bolt' ? 'OBS: lightning' : 'OBS: back to the story'; }).catch((e) => { $('obsStatus').textContent = 'OBS: ' + e.message; }); };
if (!document.body.classList.contains('plain')) { const keep = { get: () => { try { return localStorage.getItem('world-obspass'); } catch { return null; } }, set: (v) => { try { localStorage.setItem('world-obspass', v); } catch { /* private window */ } } }; $('obsPass').value = keep.get() || '';
  const connect = async () => { $('obsStatus').textContent = 'connecting'; try { obs = await connectObs({ password: $('obsPass').value, port: Number(q.get('obsport')) || 4455, onClose: () => { obs = null; $('obsStatus').textContent = 'connection to OBS closed'; } }); keep.set($('obsPass').value); const src = await obs.findBrowserSource('world.html').catch(() => null); $('obsStatus').textContent = src ? `connected · source "${src.name}": the buttons steer OBS too` : 'connected, but OBS has no browser source with world.html in its address'; } catch (e) { obs = null; $('obsStatus').textContent = e.message; } };
  $('obsConnect').addEventListener('click', connect); if (keep.get() != null && q.get('obs') !== '0') connect(); }
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
  apply(dir.pose, t); people?.subject(dir.mode === 'story' ? dir.pose.subject || null : null); people?.update(t, dt, camera.position); }
let frameNo = 0;
function frame(t) { for (const f of tickers) f(t); frameNo++; aimSun(); sun.shadow.needsUpdate = true; const nx = upcoming(); land.update(camera.position, false, nx ? { x: nx.p[0], y: nx.p[1], z: nx.p[2] } : null); trees.update(camera.position); animals?.update(camera.position); built.update(camera.position, focus); renderer.render(scene, camera);
  if (q.get('debug') === '1') { const s = land.stats(), i = renderer.info.render; $('dbg').style.display = 'block'; $('dbg').textContent = `${dir.mode}${dir.key ? ' ' + dir.key : ''}  shot ${dir.pose?.beat ?? '-'}  squares ${s.squares}/${s.wanted}  trees ${s.trees} (${s.inFull} full, ${s.inFar} close)  calls ${i.calls}  triangles ${(i.triangles / 1e6).toFixed(2)}M  fps ${fps.toFixed(0)}`; } }
let fps = 0;
window.__world = { air, renderer, scene, camera, land, built, cine, dir, people, tickers, heightAt, places, city, go, backToStory };

if (SHOT) { // one still: a story shot, a place, or a chosen camera
  let pose; if (q.get('cam')) { const c = q.get('cam').split(',').map(Number); pose = { p: c.slice(0, 3), t: c.slice(3, 6), fov: Number(q.get('fov')) || 40, roll: 0, shake: 0 }; }
  else if (q.get('place')) pose = cine.place(q.get('place'), Number(q.get('at') || 3)); else { const b = cine.beats[Number(q.get('beat') || 0)]; pose = cine.story(b.t0 + b.sec * Number(q.get('u') ?? 0.5)); }
  pose.fade = 0; if (!q.has('title')) pose.title = null; apply(pose, 3); people?.subject(pose.subject || null); people?.update(3, 0.016, camera.position); animals?.update(camera.position, true); built.update(camera.position, focus); land.update(camera.position, true); const t0 = performance.now(); await new Promise((ok) => { const w = () => (land.settled() || performance.now() - t0 > 240000 ? ok() : setTimeout(w, 200)); w(); });
  aimSun(); for (const f of tickers) f(6); aimSun(); sun.shadow.needsUpdate = true; trees.update(camera.position); renderer.render(scene, camera); sun.shadow.needsUpdate = true; renderer.render(scene, camera); $('load').style.transition = 'none'; $('load').classList.add('gone');
  window.__stats = { ...land.stats(), built: built.triangles, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, seconds: (performance.now() - t0) / 1000 }; window.ready = true; }
else { // the land under the first shot is made ready before the story starts, so that it opens on a finished picture
  dir.pose = cine.story(0); if (q.get('place') && cine.places[q.get('place')]) { dir.key = q.get('place'); dir.mode = 'place'; dir.pose = cine.place(dir.key, 0); } apply(dir.pose, 0); mark();
  const clock = new THREE.Clock(); let warm = 0, started = false, frames = 0, acc = 0, prev = 0;
  // the picture is drawn at most CAP times a second (60 unless ?fps= says otherwise; 0 for no cap): an even 60 looks better than a rate that
  // swings, and what a fast screen would spend above it is left for OBS
  const CAP = q.has('fps') ? Number(q.get('fps')) : 60; let lastFrame = 0;
  renderer.setAnimationLoop(() => { const now = performance.now(); if (CAP > 0 && now - lastFrame < 1000 / CAP - 1.5) return; lastFrame = now; const t = clock.getElapsedTime(); frames++; acc += t - prev; prev = t; if (acc > 0.5) { fps = frames / acc; frames = 0; acc = 0; }
    if (!started) { for (const f of tickers) f(t); land.integrate(1e9); land.update(camera.position); if (warm === 1) { trees.warm(camera.position); warm = 2; } else trees.update(camera.position); aimSun(); sun.shadow.needsUpdate = true; renderer.render(scene, camera); if (warm === 0 && (land.settled() || t > 25)) { warm = 1; return; } if (warm === 2) { warm = 3; return; } if (warm === 3) { started = true; lastT = t; $('load').classList.add('gone'); renderer.compileAsync(scene, camera).catch(() => {}); } return; }
    step(t); frame(t); if (!document.body.classList.contains('plain')) $('status').textContent = dir.mode === 'flight' ? 'flying…' : dir.mode === 'place' ? cine.places[dir.key].name[0] : 'the story'; });
  window.ready = true; }
