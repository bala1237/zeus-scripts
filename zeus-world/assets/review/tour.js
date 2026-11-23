// The cinematic city tour: the city filmed like a documentary instead of turned round on a stand.
// Each place gets a visit of three shots (a flight in, a move through at street level, a close detail) under a title,
// and between places the camera follows a citizen through the streets. Shots are held, moved slowly, then cut.
//   const film = createTour({ camera, controls, tickers, walkers, setLabel });   film.update(t) each frame while the tour is on;  film.stop()
// A shot is { a: [position, target], b: [position, target], s: seconds, fov, hand } and the camera eases from a to b.
// fov is the lens (wide about 44, normal 34, long about 22); hand adds a slight hand-held sway for shots at street level.
import * as THREE from 'three';

export const PLACES = [
  { name: 'Zeus World', sub: 'The city from above', shots: [
    { a: [[96, 92, 150], [4, 0, -4]], b: [[60, 70, 158], [2, 0, -6]], s: 11, fov: 34 } ] },
  { name: 'The Agora', sub: 'Market square and fountain', shots: [
    { a: [[44, 36, 58], [0, 1, 0]], b: [[19, 13, 27], [0, 1.5, 0]], s: 9, fov: 40 },
    { a: [[-13, 1.8, 3.6], [-4, 1.5, 7.6]], b: [[5, 1.8, 3.6], [13, 1.5, 7.6]], s: 10, fov: 36, hand: 1 },
    { a: [[5.2, 2.1, 5.4], [0, 1.9, 0]], b: [[3.4, 2.5, 6.4], [0, 2.0, 0]], s: 7, fov: 24 } ] },
  { name: 'Temple of Zeus', sub: 'The sacred way', shots: [
    { a: [[0.6, 1.7, -11], [0, 6, -47]], b: [[0.6, 8.5, -20], [0, 8, -47]], s: 10, fov: 36 },
    { a: [[10, 1.3, -32], [0, 9, -46]], b: [[5.5, 1.3, -34.5], [0, 9.5, -46]], s: 8, fov: 42, hand: 1 },
    { a: [[1.3, 2.0, -24.8], [0, 3.0, -34]], b: [[0.4, 2.0, -25.9], [0, 3.2, -34]], s: 7, fov: 30 } ] },
  { name: 'The Main Street', sub: 'Shops, lamps and the south gate', shots: [
    { a: [[0, 24, 86], [0, 3, 40]], b: [[0, 11, 51], [0, 3, 18]], s: 9, fov: 40 },
    { a: [[0.7, 1.7, 31], [0, 1.9, 16]], b: [[-0.7, 1.7, 15], [0, 2.2, 0]], s: 11, fov: 38, hand: 1 },
    { a: [[1.6, 1.9, 27.2], [-7.5, 2.3, 23.1]], b: [[0.4, 1.9, 24.6], [-7.5, 2.3, 23.1]], s: 7, fov: 34, hand: 1 } ] },
  { name: 'The Harbour', sub: 'Quay, lighthouse and trireme', shots: [
    { a: [[112, 30, 62], [80, 2, 10]], b: [[97, 12, 31], [80, 3, 6]], s: 9, fov: 38 },
    { a: [[62, 1.8, -18], [78, 2.6, -4]], b: [[62, 1.8, 1], [84, 3.4, 4]], s: 10, fov: 36, hand: 1 },
    { a: [[57, 13, 53], [66, 15, 40]], b: [[59, 18, 50], [66, 17, 40]], s: 7, fov: 26 } ] },
  { name: 'The River', sub: 'Homes and gardens of the citizens', shots: [
    { a: [[-52, 9, 35], [-30, 1, 35]], b: [[-22, 6, 35], [0, 3, 35]], s: 10, fov: 38 },
    { a: [[-47, 2.0, 38.3], [-41, 3, 47]], b: [[-33, 2.0, 38.3], [-27, 3, 47]], s: 10, fov: 44, hand: 1 },
    { a: [[-35.5, 2.2, 11.6], [-30, 0.5, 16]], b: [[-33.8, 2.2, 12.4], [-30, 0.5, 16]], s: 7, fov: 32, hand: 1 } ] },
  { name: 'The Civic Quarter', sub: 'Council hall, theatre and library', shots: [
    { a: [[21, 3, -7], [22, 5, -26]], b: [[15, 14, -5], [22, 5, -26]], s: 9, fov: 38 },
    { a: [[50, 10.5, 8.5], [38, 1.5, -6]], b: [[47.5, 8, 4.5], [38, 1.5, -6]], s: 8, fov: 40 },
    { a: [[-15.5, 2, -13.5], [-22, 4.5, -26]], b: [[-19, 2, -12.8], [-22, 4.5, -26]], s: 7, fov: 30, hand: 1 } ] },
];

export function createTour({ camera, controls, tickers, walkers = () => [], setLabel = () => {}, pace = 1, homeFov = 34 }) {
  const st = { on: false, place: 0, shot: -1, t0: 0, follow: null, phase: 'shot', fade: 0, fadeTo: 0 };
  const P = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), ease = (k) => k * k * (3 - 2 * k);
  // a title in the corner for each place, and a black curtain for the cut from one place to the next
  const css = (el, s) => { el.style.cssText = s; document.body.append(el); return el; };
  const title = css(document.createElement('div'), 'position:fixed;left:5vw;bottom:15vh;color:#fff;pointer-events:none;opacity:0;transition:opacity 1.2s;text-shadow:0 2px 14px rgba(0,0,0,.75);font-family:Georgia,"Times New Roman",serif');
  title.innerHTML = '<div class="n" style="font-size:clamp(26px,4.4vw,54px);letter-spacing:.06em;font-variant:small-caps"></div><div style="height:2px;width:72px;background:#e2a92e;margin:8px 0"></div><div class="s" style="font:500 clamp(13px,1.5vw,19px) system-ui;letter-spacing:.04em"></div>';
  const curtain = css(document.createElement('div'), 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none');
  // the viewer's controls stop the camera going below what it looks at and from coming closer than 4 m; a film camera needs both
  const limits = { polar: controls.maxPolarAngle, near: controls.minDistance }, free = (on) => { controls.maxPolarAngle = on ? Math.PI : limits.polar; controls.minDistance = on ? 0.5 : limits.near; };
  const lens = (fov) => { if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); } };
  function frame(shot, u, t) { const k = ease(u); P.set(...shot.a[0]).lerp(A.set(...shot.b[0]), k); T.set(...shot.a[1]).lerp(B.set(...shot.b[1]), k);
    if (shot.hand) { T.x += Math.sin(t * 0.9) * 0.05 + Math.sin(t * 2.3) * 0.02; T.y += Math.sin(t * 1.3 + 1) * 0.04; P.y += Math.sin(t * 1.7) * 0.015; }
    camera.position.copy(P); controls.target.copy(T); lens(shot.fov || homeFov); }
  // between places: walk behind a citizen. The one nearest the next place who is actually walking.
  function pick(next) { const c = next.shots[next.shots.length > 1 ? 1 : 0].a[0]; let best = null, bd = Infinity;
    for (const w of walkers()) { if (w.builder || w.pause > 0 || w.cheer > 0) continue; const d = Math.hypot(w.w.position.x - c[0], w.w.position.z - c[2]); if (d < bd) { bd = d; best = w; } } return best; }
  function follow(w, dt, first) { const p = w.w.position, dx = Math.sin(w.yaw), dz = Math.cos(w.yaw);
    A.set(p.x - dx * 4.3 - dz * 0.9, p.y + 2.25, p.z - dz * 4.3 + dx * 0.9); B.set(p.x + dx * 2.5, p.y + 1.45, p.z + dz * 2.5);
    const k = first ? 1 : Math.min(1, dt * 1.6); camera.position.lerp(A, k); controls.target.lerp(B, k); lens(38); }
  function show(place) { title.querySelector('.n').textContent = place.name; title.querySelector('.s').textContent = place.sub; title.style.opacity = 1; setLabel(place.name); setTimeout(() => { title.style.opacity = 0; }, 5200); }
  let last = null;
  function update(t) { const dt = last === null ? 0.016 : Math.max(0, Math.min(0.1, t - last)); last = t;
    if (!st.on) { free(true); st.on = true; st.place = 0; st.shot = 0; st.t0 = t; st.phase = 'shot'; st.fade = 1; st.fadeTo = 0; show(PLACES[0]); }
    controls.autoRotate = false; st.fade += Math.sign(st.fadeTo - st.fade) * Math.min(Math.abs(st.fadeTo - st.fade), dt / 0.45); curtain.style.opacity = st.fade;
    const place = PLACES[st.place], e = t - st.t0;
    if (st.phase === 'shot') { const shot = place.shots[st.shot], len = shot.s * pace; frame(shot, Math.min(1, e / len), t);
      if (e >= len) { if (st.shot + 1 < place.shots.length) { st.shot++; st.t0 = t; }   // a cut within the place
        else { const next = PLACES[(st.place + 1) % PLACES.length]; st.follow = st.place === 0 ? null : pick(next); st.phase = st.follow ? 'follow' : 'leave'; st.t0 = t; st.first = true; if (!st.follow) st.fadeTo = 1; } } }
    else if (st.phase === 'follow') { follow(st.follow, dt, st.first); st.first = false; if (e > 9 * pace - 0.5) st.fadeTo = 1; if (e > 9 * pace) { st.phase = 'leave'; st.t0 = t - 1; } }
    else if (st.phase === 'leave') { if (st.fade >= 1 || e > 1) { st.place = (st.place + 1) % PLACES.length; st.shot = 0; st.phase = 'shot'; st.t0 = t; st.fadeTo = 0; show(PLACES[st.place]); frame(PLACES[st.place].shots[0], 0, t); } }
  }
  function stop() { if (!st.on) return; free(false); st.on = false; last = null; title.style.opacity = 0; curtain.style.opacity = 0; st.fade = 0; lens(homeFov); }
  // one shot at a given point, for stills: pose('The Agora', 1, 0.5)
  function pose(name, i = 0, u = 0.5) { free(true); const place = PLACES.find((p) => p.name.toLowerCase().includes(String(name).toLowerCase())) || PLACES[0]; frame(place.shots[Math.min(i, place.shots.length - 1)], u, 3); show(place); title.style.transition = 'none'; return place; }
  return { update, stop, pose, state: st };
}
