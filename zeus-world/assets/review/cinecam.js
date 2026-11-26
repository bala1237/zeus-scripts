// The camera of the open world (ZW-049): a small library of the ways a film camera moves, the newcomer's story told with them,
// and the short flight that carries the picture from one place to another.
//   const cine = createCine({ heightAt, road, riverPath, places });
//   const pose = cine.story(seconds)        -> { p: [x, y, z], t: [x, y, z], fov, roll, shake, title, cut, beat }
//   const pose = cine.place('falls', seconds)   the shots that belong to one place, round and round
//   const pose = cine.flight(fromPose, toPose, u)   u from 0 to 1
// Nothing here draws or knows about three.js: a pose is numbers, so the whole of it can be checked without a picture.
// Every pose is kept above the ground. The page adds the hand-held shake and turns the numbers into a camera.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t, ease = (k) => k * k * (3 - 2 * k), easeOut = (k) => 1 - (1 - k) ** 3;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], lerp = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function createCine({ heightAt, road, riverPath, places }) {
  // a line through the land, measured, so that a point any distance along it can be asked for
  const measured = (pts) => { const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2])); const total = len.at(-1);
    const at = (s) => { s = clamp(s, 0, total); let i = 1; while (i < pts.length - 1 && len[i] < s) i++; const t = (s - len[i - 1]) / (len[i] - len[i - 1] || 1), p = lerp(pts[i - 1], pts[i], t), a = pts[Math.max(0, i - 3)], b = pts[Math.min(pts.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return { p, d: [(b[0] - a[0]) / l, 0, (b[2] - a[2]) / l] }; };
    const nearest = (x, z) => { let best = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - x, pts[i][2] - z); if (d < bd) { bd = d; best = i; } } return len[best]; };
    return { at, total, nearest }; };
  const R = measured(road), V = measured(riverPath);
  const up = (p, h) => [p[0], heightAt(p[0], p[2]) + h, p[2]], side = (d) => [-d[2], 0, d[0]];
  // for the fast flights: the height of the ground evened out over a stretch, so that the camera does not drop into every ditch
  const even = (p, d, h) => [p[0], (Math.max(0, heightAt(p[0], p[2])) + Math.max(0, heightAt(p[0] + d[0] * 14, p[2] + d[2] * 14)) + Math.max(0, heightAt(p[0] - d[0] * 14, p[2] - d[2] * 14)) + Math.max(0, heightAt(p[0] + d[0] * 30, p[2] + d[2] * 30))) / 4 + h, p[2]];
  // never below the ground, and never skimming it closer than `min`
  const clear = (p, min = 1.5) => { const g = Math.max(heightAt(p[0], p[2]), 0) + min; return p[1] < g ? [p[0], g, p[2]] : p; };

  // ---------- the shots. Each takes where it is (a point and the way the land runs there), how far through it is (u, 0 to 1), and its own settings.
  const SHOTS = {
    // DRONE: high and behind, coming down and forward over the land. The opening of a chapter.
    drone: (a, u, o = {}) => { const k = ease(u), back = mix(o.back0 ?? 260, o.back1 ?? 70, k), h = mix(o.h0 ?? 150, o.h1 ?? 48, k), q = add(a.p, a.d, -back), p = [q[0], heightAt(a.p[0], a.p[2]) + h, q[2]], t = up(add(a.p, a.d, o.ahead ?? 160), o.th ?? 6); return { p, t, fov: mix(o.fov0 ?? 42, o.fov1 ?? 36, k), roll: 0, shake: 0.15 }; },
    // ORBIT: a slow circle round a place, looking in.
    orbit: (a, u, o = {}) => { const ang = (o.from ?? 0) + (o.sweep ?? 0.9) * ease(u), r = mix(o.r0 ?? o.r ?? 120, o.r1 ?? o.r ?? 120, u), c = up(a.p, 0), p = [c[0] + Math.cos(ang) * r, c[1] + mix(o.h0 ?? o.h ?? 55, o.h1 ?? o.h ?? 55, ease(u)), c[2] + Math.sin(ang) * r]; return { p, t: [c[0], c[1] + (o.th ?? 8), c[2]], fov: o.fov ?? 34, roll: 0, shake: 0.12 }; },
    // CRANE: starts low, rises, and what lay hidden beyond comes into view. The reveal.
    crane: (a, u, o = {}) => { const k = ease(u), s = side(a.d), base = add(add(a.p, a.d, -(o.back ?? 14) - 10 * k), s, o.side ?? 5), p = up(base, mix(o.h0 ?? 1.4, o.h1 ?? 30, k)), t = up(add(a.p, a.d, mix(o.near ?? 40, o.far ?? 420, k)), mix(2, o.th ?? 14, k)); return { p, t, fov: mix(o.fov0 ?? 40, o.fov1 ?? 32, k), roll: 0, shake: 0.2 }; },
    // TRACK: at walking height along the road, a little to one side, as if carried. Hand-held.
    track: (a, u, o = {}) => { const s0 = a.s + (o.from ?? -10), q = R.at(s0 + (o.dist ?? 22) * u), sd = side(q.d), p = up(add(q.p, sd, o.side ?? 2.2), o.h ?? 1.7), t = up(add(q.p, q.d, o.ahead ?? 26), o.th ?? 1.9); return { p, t, fov: o.fov ?? 44, roll: 0, shake: 1 }; },
    // FPV: fast and low along the road, rising and falling with the land and leaning into the bends, like a racing drone.
    fpv: (a, u, o = {}) => { const k = (o.easeIn ?? true) ? mix(u, ease(u), 0.6) : u, s = a.s + (o.from ?? 0) + (o.dist ?? 380) * k, q = R.at(s), q2 = R.at(s + 26), q3 = R.at(s + 70), h = mix(o.h0 ?? 9, o.h1 ?? 5, ease(u)) + 2.2 * Math.sin(u * 9.4), p = even(q.p, q.d, h), t = even(q3.p, q3.d, h * 0.55 + 1), turn = q.d[0] * q2.d[2] - q.d[2] * q2.d[0]; return { p, t, fov: o.fov ?? 64, roll: clamp(-turn * 2.6, -0.5, 0.5), shake: 0.5 }; },
    // SKIM: the same flight, but along the river, close over the water.
    skim: (a, u, o = {}) => { const s0 = o.s0 ?? V.nearest(a.p[0], a.p[2]), k = mix(u, ease(u), 0.5), s = s0 + (o.from ?? -160) + (o.dist ?? 320) * k, q = V.at(s), q2 = V.at(s + 30), q3 = V.at(s + 80), h = mix(o.h0 ?? 3.2, o.h1 ?? 6, u), p = [q.p[0], q.p[1] + h, q.p[2]], t = [q3.p[0], q3.p[1] + h * 0.5 + 1 + (o.tilt ?? 0) * u, q3.p[2]], turn = q.d[0] * q2.d[2] - q.d[2] * q2.d[0]; return { p, t, fov: o.fov ?? 60, roll: clamp(-turn * 2.2, -0.45, 0.45), shake: 0.4 }; },
    // TOP: straight down from high above, drifting, the land as a map.
    top: (a, u, o = {}) => { const k = ease(u), c = add(a.p, a.d, mix(-(o.drift ?? 50), o.drift ?? 50, k)), h = mix(o.h0 ?? 190, o.h1 ?? 150, k), g = heightAt(a.p[0], a.p[2]), p = [c[0], g + h, c[2]], t = [c[0] + a.d[0] * 0.5, g, c[2] + a.d[2] * 0.5]; return { p, t, fov: o.fov ?? 30, roll: (o.turn ?? 0.35) * (k - 0.5), shake: 0.05 }; },
    // LONG: from far off through a long lens, hardly moving. The land stacks up and looks immense.
    long: (a, u, o = {}) => { const k = ease(u), from = o.from ?? [a.p[0] - a.d[0] * 700, 0, a.p[2] - a.d[2] * 700], sd = side(a.d), p = up(add(from, sd, mix(-8, 8, k)), o.h ?? 26), t = up(a.p, o.th ?? 18); return { p, t, fov: mix(o.fov0 ?? 15, o.fov1 ?? 13, k), roll: 0, shake: 0.35 }; },
    // HAND: standing still at eye level, looking, breathing. A person's view.
    hand: (a, u, o = {}) => { const k = ease(u), sd = side(a.d), p = up(add(add(a.p, a.d, mix(-3, 1.5, k)), sd, o.side ?? -1.2), o.h ?? 1.65), t = o.at ? up(o.at, o.th ?? 10) : up(add(a.p, a.d, 200), o.th ?? 8); return { p, t, fov: o.fov ?? 36, roll: 0, shake: 1.4 }; },
    // RISE: straight up from the ground into the sky, turning. The end of a chapter.
    rise: (a, u, o = {}) => { const k = ease(u), ang = (o.from ?? 0) + (o.sweep ?? 0.7) * k, r = mix(o.r0 ?? 30, o.r1 ?? 150, k), c = up(a.p, 0), p = [c[0] + Math.cos(ang) * r, c[1] + mix(o.h0 ?? 6, o.h1 ?? 210, k), c[2] + Math.sin(ang) * r]; return { p, t: [c[0], c[1] + mix(4, o.th ?? 10, k), c[2]], fov: mix(38, o.fov1 ?? 44, k), roll: 0, shake: 0.1 }; },
  };
  const anchor = (x, z, toward) => { const s = R.nearest(x, z), q = R.at(s); let d = q.d; if (toward) { const l = Math.hypot(toward[0] - x, toward[1] - z) || 1; d = [(toward[0] - x) / l, 0, (toward[1] - z) / l]; } return { p: [x, heightAt(x, z), z], d, s }; };
  const onRoad = (s) => { const q = R.at(s); return { p: q.p, d: q.d, s }; };
  const shoot = (b, u) => { const pose = SHOTS[b.shot](b.a, clamp(u), b.o); pose.p = clear(pose.p, b.min ?? 1.5); return pose; };

  // ---------- the story: a newcomer's road from the village to the city, told in chapters. Each line is one shot.
  // s is how far along the road the shot stands (in metres from the village); the road is about 1.7 km.
  const P = places, T = R.total, F = P.falls, fallsA = { p: [F.x + 150, 0, F.z + 150], d: [-0.7, 0, -0.7], s: 0 }, vill = anchor(P.village.x, P.village.z), cityA = { p: [P.city.x, 0, P.city.z], d: [1, 0, 0], s: T };
  const STORY = [
    { title: ['Riverbend', 'where the road begins'], shot: 'drone', a: vill, sec: 10, o: { back0: 300, back1: 90, h0: 170, h1: 46, ahead: 60 }, fade: true },
    { shot: 'hand', a: onRoad(14), sec: 6, o: { at: [P.village.x, 0, P.village.z], th: 3, fov: 40 } },
    { shot: 'track', a: onRoad(60), sec: 7, o: { dist: 14, side: -2.4 } },
    { shot: 'fpv', a: onRoad(90), sec: 8, o: { dist: 330, h0: 12, h1: 6 } },
    { title: ['The Old Ford', 'the river comes down from the Falls of Zeus'], shot: 'top', a: anchor(P.ford.x, P.ford.z), sec: 8, o: { h0: 210, h1: 130 }, fade: true },
    { shot: 'skim', a: anchor(P.ford.x, P.ford.z), sec: 8, o: { from: -420, dist: 400 } },
    { shot: 'long', a: fallsA, sec: 7, o: { from: [P.ford.x - 320, 0, P.ford.z + 120], h: 30, th: 60, fov0: 11, fov1: 9.5 } },
    { shot: 'track', a: onRoad(R.nearest(P.ford.x, P.ford.z) + 70), sec: 7, o: { dist: 15, side: 2.6, ahead: 40 } },
    { title: ['First Sight Hill', ''], shot: 'crane', a: onRoad(R.nearest(P.crest.x, P.crest.z) - 6), sec: 11, o: { h0: 1.3, h1: 34, near: 30, far: 560, th: 16 }, fade: true },
    { shot: 'long', a: cityA, sec: 7, o: { from: [P.crest.x, 0, P.crest.z], h: 8, th: 14, fov0: 13, fov1: 10 } },
    { shot: 'fpv', a: onRoad(R.nearest(P.crest.x, P.crest.z) + 30), sec: 9, o: { dist: 470, h0: 16, h1: 5 } },
    { title: ['Olympus', 'the city by the sea'], shot: 'track', a: onRoad(T - 60), sec: 7, o: { dist: 18, side: -2.8, ahead: 60, th: 6 }, fade: true },
    { shot: 'orbit', a: cityA, sec: 11, o: { r: 260, h0: 60, h1: 110, from: 2.6, sweep: 1.1, th: 12 } },
    { shot: 'rise', a: cityA, sec: 10, o: { r0: 200, r1: 430, h0: 90, h1: 380, from: 3.6, sweep: 0.8, th: 0 } },
  ];
  let total = 0; for (const b of STORY) { b.t0 = total; total += b.sec; }
  // the pose of the story at a given second. cut is true on the first frame of a shot; fade is 0 to 1, the black between chapters.
  function story(seconds) { const t = ((seconds % total) + total) % total; let i = STORY.findIndex((b) => t < b.t0 + b.sec); if (i < 0) i = 0; const b = STORY[i], u = (t - b.t0) / b.sec, pose = shoot(b, u), n = STORY[(i + 1) % STORY.length];
    pose.beat = i; pose.u = u; pose.title = b.title && t - b.t0 > 1 && t - b.t0 < 6.5 ? b.title : null; pose.fade = Math.max(b.fade ? 1 - clamp((t - b.t0) / 0.7) : 0, n.fade ? clamp((t - b.t0 - b.sec + 0.6) / 0.6) : 0); return pose; }

  // ---------- the places the director can go to. Each has a few shots that play round and round until told otherwise.
  const anc = (p, toward) => anchor(p.x, p.z, toward);
  const PLACE = {
    village: { name: ['Riverbend', 'the village on the river'], shots: [{ shot: 'orbit', a: vill, sec: 12, o: { r: 110, h: 34, sweep: 1.0, th: 3 } }, { shot: 'hand', a: onRoad(20), sec: 8, o: { at: [P.village.x, 0, P.village.z], th: 3 } }, { shot: 'rise', a: vill, sec: 10, o: { r0: 40, r1: 160, h1: 130 } }] },
    ford: { name: ['The Old Ford', ''], shots: [{ shot: 'skim', a: anc(P.ford), sec: 9, o: { from: -300, dist: 320 } }, { shot: 'orbit', a: anc(P.ford), sec: 11, o: { r: 90, h: 26, sweep: 0.9, th: 2 } }, { shot: 'top', a: anc(P.ford), sec: 9, o: {} }] },
    crest: { name: ['First Sight Hill', 'the first sight of the city'], shots: [{ shot: 'crane', a: onRoad(R.nearest(P.crest.x, P.crest.z) - 6), sec: 11, o: { h1: 34, far: 560, th: 16 } }, { shot: 'long', a: cityA, sec: 8, o: { from: [P.crest.x, 0, P.crest.z], h: 8, th: 14, fov0: 13, fov1: 10 } }] },
    falls: { name: ['The Falls of Zeus', 'where the river leaves the high country'], shots: [{ shot: 'orbit', a: { p: [F.x, 0, F.z], d: [1, 0, 0], s: 0 }, sec: 13, o: { r0: 330, r1: 230, h0: 20, h1: 70, from: 0.25, sweep: 0.75, th: -30, fov: 38 }, min: 6 },
      { shot: 'skim', a: { p: [F.x, 0, F.z], d: [1, 0, 0], s: 0 }, sec: 9, o: { from: 520, dist: -470, h0: 5, h1: 12, tilt: 46, fov: 58 } }, { shot: 'rise', a: { p: [F.x + 90, 0, F.z + 20], d: [1, 0, 0], s: 0 }, sec: 11, o: { r0: 60, r1: 260, h0: 8, h1: 260, from: 0.2, sweep: 0.6, th: 30 } }] },
    city: { name: ['Olympus', 'the city by the sea'], shots: [{ shot: 'orbit', a: cityA, sec: 14, o: { r: 250, h0: 55, h1: 100, from: 2.4, sweep: 1.2, th: 12 } }, { shot: 'track', a: onRoad(T - 60), sec: 8, o: { dist: 18, side: -2.8, ahead: 60, th: 6 } }, { shot: 'rise', a: cityA, sec: 11, o: { r0: 180, r1: 420, h0: 80, h1: 360, from: 3.6, sweep: 0.8, th: 0 } }] },
    coast: { name: ['The Coast', 'the sea road north'], shots: [{ shot: 'orbit', a: { p: [150, 0, -900], d: [0, 0, 1], s: 0 }, sec: 13, o: { r: 300, h0: 30, h1: 80, from: 3.4, sweep: 0.8, th: 0 } }, { shot: 'long', a: cityA, sec: 9, o: { from: [120, 0, -1400], h: 40, th: 20, fov0: 12, fov1: 10 } }] },
    mountains: { name: ['The High Country', 'beyond the falls, the mountains'], shots: [{ shot: 'orbit', a: { p: [-5200, 0, 600], d: [1, 0, 0], s: 0 }, sec: 14, o: { r: 900, h0: 420, h1: 520, from: 0.3, sweep: 0.7, th: 200, fov: 40 }, min: 30 }, { shot: 'long', a: { p: [-6400, 0, 0], d: [1, 0, 0], s: 0 }, sec: 9, o: { from: [-3600, 0, 500], h: 60, th: 500, fov0: 16, fov1: 13 } }] },
  };
  function place(key, seconds) { const pl = PLACE[key]; if (!pl) return null; const all = pl.shots.reduce((s, b) => s + b.sec, 0), t = ((seconds % all) + all) % all; let acc = 0, b = pl.shots[0]; for (const x of pl.shots) { if (t < acc + x.sec) { b = x; break; } acc += x.sec; }
    const pose = shoot(b, (t - acc) / b.sec); pose.title = seconds > 0.6 && seconds < 6.5 ? pl.name : null; pose.fade = 0; pose.beat = pl.shots.indexOf(b); return pose; }

  // ---------- the flight between two views: lift, cross the land at height so that its distance is felt, lean into the turn, and come down.
  function flight(a, b, u) { const k = ease(u), d = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]), lift = clamp(d * 0.16, 30, 420), arc = Math.sin(Math.PI * k), p = lerp(a.p, b.p, k); p[1] += lift * arc;
    // look where the flight is going while it is under way, and settle on the new view at the end
    const k2 = ease(clamp(u + 0.08)), q = lerp(a.p, b.p, k2), ahead = [q[0] + (b.p[0] - a.p[0]) * 0.12, q[1] + lift * Math.sin(Math.PI * k2) - lift * 0.5 - 20, q[2] + (b.p[2] - a.p[2]) * 0.12], w = ease(clamp((u - 0.55) / 0.45)), w0 = 1 - ease(clamp(u / 0.3));
    const t = lerp(lerp(ahead, a.t, w0), b.t, w), cross = (a.t[0] - a.p[0]) * (b.p[2] - a.p[2]) - (a.t[2] - a.p[2]) * (b.p[0] - a.p[0]);
    return { p: clear(p, 8), t, fov: mix(mix(a.fov, b.fov, k), 58, arc * 0.8), roll: Math.sign(cross || 1) * 0.3 * Math.sin(Math.PI * clamp(u * 1.25)) * clamp(d / 600), shake: 0.3, fade: 0, title: null }; }
  const flightSeconds = (a, b) => clamp(4.5 + Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]) / 900, 5, 8.5);
  return { story, place, flight, flightSeconds, storyLength: total, beats: STORY, places: PLACE, SHOTS, road: R, river: V };
}
