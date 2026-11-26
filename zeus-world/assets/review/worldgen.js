// The land of the open world (ZW-049): how high the ground is at any point, where the river runs, where forest grows.
// Pure arithmetic, no drawing, so that it can be tested and so that the same land comes out every time.
// Units are metres, y is up. In the world x runs east and z runs south, the sea lies to the EAST (as it does beside the city) and the mountains to the west.
// The arithmetic below was written with the sea to the south; the two axes are swapped at the door (see the last lines), so inside this file read 'south' as the world's east.
// The land has a designed heart (the city on its plain, the river from the waterfall to the sea, the valley, the forest, the hills)
// and beyond it goes on for ever: the same rules make hills, forest and far ranges wherever the camera goes.

// ---------- noise: the same every time for the same place
const hash = (x, z) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function noise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), u = fade(x - xi), v = fade(z - zi); return mix(mix(hash(xi, zi), hash(xi + 1, zi), u), mix(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); }
// several sizes of noise laid over each other: 0 to 1
export function fbm(x, z, octaves = 4) { let s = 0, a = 0.5, n = 0; for (let i = 0; i < octaves; i++) { s += a * noise(x, z); n += a; x = x * 2.03 + 17.1; z = z * 2.03 - 9.7; a *= 0.5; } return s / n; }
// ridges: sharp crests, for mountains
const ridged = (x, z, octaves = 4) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < octaves; i++) { const r = 1 - Math.abs(2 * noise(x, z) - 1); s += a * r * r; n += a; x = x * 2.07 + 31.3; z = z * 2.07 + 11.9; a *= 0.5; } return s / n; };

// ---------- the designed heart
export const SEA = 0;
// the city stands on a level plain a little above the sea; its middle is the origin of the world
const CITY = { x: 0, z: 0, r: 150, y: 4 };
// The river: from the high valley in the north, over the falls, down through the forest and the farmland, past the city, to the sea.
// Each point is [x, z, half the width of the water]. It is smoothed into a curve below.
const RIVER_PTS = [[620, -4300, 7], [540, -3900, 7], [470, -3520, 8], [455, -3360, 9], [440, -3180, 10], [520, -2860, 10], [380, -2520, 11], [140, -2240, 12], [-120, -1980, 12], [-330, -1640, 13],
  [-300, -1280, 13], [-90, -980, 14], [150, -760, 14], [360, -520, 15], [470, -240, 17], [480, -60, 20], [472, 60, 30], [470, 190, 55], [470, 420, 90]];
// where the river goes over the cliff: the falls are between these two z values
const FALLS = { x: 455, z: -3360, top: 0, foot: 0, drop: 0 };
function catmull(p, i, t) { const a = p[Math.max(0, i - 1)], b = p[i], c = p[Math.min(p.length - 1, i + 1)], d = p[Math.min(p.length - 1, i + 2)], t2 = t * t, t3 = t2 * t;
  return [0, 1, 2].map((k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)); }
const RIVER = []; for (let i = 0; i < RIVER_PTS.length - 1; i++) for (let k = 0; k < 6; k++) RIVER.push(catmull(RIVER_PTS, i, k / 6)); RIVER.push(RIVER_PTS.at(-1));
// how far a point is from the river's middle line, how wide the water is there, and how far along the river that is (0 at the source)
const RB = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const p of RIVER) { RB.x0 = Math.min(RB.x0, p[0]); RB.x1 = Math.max(RB.x1, p[0]); RB.z0 = Math.min(RB.z0, p[1]); RB.z1 = Math.max(RB.z1, p[1]); }
const FAR_RIVER = { d: 1e9, w: 10, along: 0 };
function riverAt(x, z) { if (x < RB.x0 - 460 || x > RB.x1 + 460 || z < RB.z0 - 460 || z > RB.z1 + 460) return FAR_RIVER; let best = 1e9, w = 10, along = 0, run = 0;
  for (let i = 0; i < RIVER.length - 1; i++) { const a = RIVER[i], b = RIVER[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L2), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz), L = Math.sqrt(L2);
    if (d < best) { best = d; w = a[2] + (b[2] - a[2]) * t; along = run + L * t; } run += L; }
  return { d: best, w, along }; }

// ---------- the height of the ground
// Without the river and the city: sea in the south, a coastal plain, rolling hills, a high step in the north (the cliff of the falls), mountains behind it.
function rawHeight(x, z) {
  const hills = (fbm(x / 520, z / 520, 4) - 0.5) * 2, fine = (fbm(x / 90 + 40, z / 90 - 12, 3) - 0.5) * 2;
  // the land rises gently from the coast northwards
  const wild = smooth(160, 1500, Math.abs(x)), coast = -70 + wild * (520 * (fbm(x / 1400 + 7, 3.3, 3) - 0.5) + 110 * (fbm(x / 260 - 5, 8.1, 2) - 0.5)), inland = coast - z;
  let h = smooth(-260, 420, inland) * 16 - smooth(-900, -120, inland) * -1 * 0 + smooth(200, 3600, inland) * 46;
  h += hills * (10 + 34 * smooth(300, 2600, inland)) + fine * (1.2 + 3.2 * smooth(200, 1800, inland));
  // below the coast the ground goes down into the sea
  h -= (1 - smooth(-520, 60, inland)) * 26;
  // the cliff of the falls: a step of high ground across the north, its edge wandering
  const edge = -3340 + 260 * (fbm(x / 700 + 2.2, 5.5, 3) - 0.5), step = smooth(edge + 34, edge - 22, z);
  h += step * (150 + 50 * (fbm(x / 400, 1.7, 2) - 0.5));
  // the mountains: ridges that grow the further north one goes, and far ranges all round the endless land
  const north = smooth(-3700, -7200, z), far = smooth(5200, 9000, Math.hypot(x, z + 800)) * smooth(0.42, 0.7, fbm(x / 5200 + 9, z / 5200 - 4, 2));
  const m = Math.max(north, far * 0.8); if (m > 0) h += m * (240 + 1250 * ridged(x / 2100 + 3.1, z / 2100 + 8.4, 5) * (0.55 + 0.45 * m));
  return h; }
// The ground as it is: the raw land, with the river's bed and valley cut into it and the city's plain levelled.
function height(x, z) { let h = rawHeight(x, z);
  const r = riverAt(x, z);
  if (r.d < 420) { // the level of the water at this point of the river: it follows the land down and never rises going downstream
    const bed = waterLevelAlong(r.along), bank = r.w + 3, valley = smooth(bank + 260 + 0.25 * Math.max(0, h - bed), bank, r.d);
    h = mix(h, Math.min(h, bed + 1.2 + 0.035 * r.d), valley * 0.85); if (r.d < bank) h = Math.min(h, bed - 0.4 - 2.2 * smooth(bank, 0, r.d)); }
  const dc = Math.hypot(x - CITY.x, z - CITY.z); if (dc < CITY.r + 260) h = mix(h, CITY.y, smooth(CITY.r + 260, CITY.r + 20, dc) * (r.d < r.w + 3 ? 0 : 1) * smooth(100, 66, z));
  if (!levelling) { const v = PLACES.village, dv = Math.hypot(x - v.x, z - v.z); if (dv < 150) { if (villageY === null) { levelling = true; villageY = height(v.x, v.z); levelling = false; } h = mix(h, villageY, smooth(150, 82, dv) * (r.d < r.w + 8 ? 0 : 1)); } }
  return h; }
let villageY = null, levelling = false;
// The river's water level along its length, worked out once: start from the raw land at each point and never let it rise downstream.
let LEVELS = null;
function levels() { if (LEVELS) return LEVELS; const out = []; let run = 0, lvl = Infinity;
  for (let i = 0; i < RIVER.length; i++) { const p = RIVER[i]; if (i) run += Math.hypot(p[0] - RIVER[i - 1][0], p[1] - RIVER[i - 1][1]); lvl = Math.max(SEA + 0.05, Math.min(lvl, rawHeight(p[0], p[1]) - 2.5)); out.push([run, lvl, p[0], p[1]]); }
  // the falls: the steepest drop between two neighbouring points
  let k = 1; for (let i = 1; i < out.length; i++) if (out[i - 1][1] - out[i][1] > out[k - 1][1] - out[k][1]) k = i;
  Object.assign(FALLS, { x: (out[k - 1][2] + out[k][2]) / 2, z: (out[k - 1][3] + out[k][3]) / 2, top: out[k - 1][1], foot: out[k][1], drop: out[k - 1][1] - out[k][1], along: (out[k - 1][0] + out[k][0]) / 2 });
  return (LEVELS = out); }
function waterLevelAlong(along) { const L = levels(); for (let i = 1; i < L.length; i++) if (along <= L[i][0]) { const t = (along - L[i - 1][0]) / (L[i][0] - L[i - 1][0] || 1); return mix(L[i - 1][1], L[i][1], t); } return L.at(-1)[1]; }
// which way the ground faces, from the heights around a point: [x, y, z], length 1
function normal(x, z, e = 2) { const dx = height(x - e, z) - height(x + e, z), dz = height(x, z - e) - height(x, z + e), l = Math.hypot(dx, 2 * e, dz); return [dx / l, 2 * e / l, dz / l]; }

// ---------- what grows and what the ground is made of
// forest: 0 none, 1 thick. Thick on the middle slopes and in patches of the plain; none on the city's plain, in water, on cliffs, on high rock.
function forest(x, z, h = height(x, z)) { if (h < SEA + 1.5 || h > 520) return 0; const n = normal(x, z, 3); if (n[1] < 0.78) return 0;
  const r = riverAt(x, z); if (r.d < r.w + 6) return 0; const dc = Math.hypot(x - CITY.x, z - CITY.z); if (dc < CITY.r + 70) return 0;
  const patch = smooth(0.44, 0.62, fbm(x / 640 + 21, z / 640 + 3, 3)), belt = smooth(-600, -1500, z) * (1 - smooth(-3100, -3300, z)), high = smooth(-3350, -3900, z) * 0.7;
  let f = Math.max(patch * 0.85, belt * (0.45 + 0.55 * patch), high * patch);
  // the farmland round the city and the village is open
  f *= smooth(CITY.r + 80, CITY.r + 520, dc); for (const p of Object.values(PLACES)) if (p.clear) f *= smooth(p.clear * 0.6, p.clear * 1.25, Math.hypot(x - p.x, z - p.z));
  return clamp(f) * smooth(420, 300, h); }
// ground colour as red, green, blue (0 to 1): sand by the sea, grass, dry grass on hills, forest floor, rock on steep and high ground, snow on the peaks
function ground(x, z, h, n, f) { const g = [0.36, 0.5, 0.2], dry = [0.56, 0.54, 0.28], floor = [0.2, 0.31, 0.13], sand = [0.78, 0.71, 0.5], rock = [0.47, 0.44, 0.4], snow = [0.93, 0.95, 0.98], mud = [0.36, 0.32, 0.22];
  const v = fbm(x / 60 + 3, z / 60 + 9, 3), big = fbm(x / 700 - 3, z / 700 + 14, 2); let c = g.map((a, i) => mix(a, dry[i], smooth(0.35, 0.75, big) * 0.8 + (v - 0.5) * 0.5));
  const fl = fbm(x / 23 + 71, z / 23 + 13, 2); if (fl > 0.66 && f < 0.3) { const k = smooth(0.66, 0.78, fl) * 0.35; c = [mix(c[0], 0.74, k), mix(c[1], 0.66, k), mix(c[2], 0.3, k)]; }
  { const dc = Math.hypot(x - CITY.x, z - CITY.z), dv = Math.hypot(x - PLACES.village.x, z - PLACES.village.z), farm = Math.max(smooth(CITY.r - 30, CITY.r + 30, dc) * smooth(CITY.r + 560, CITY.r + 380, dc), smooth(70, 110, dv) * smooth(330, 230, dv)) * smooth(0.25, 0.1, f) * smooth(60, 30, h) * smooth(2.5, 4, h);
    if (farm > 0.01) { const a = 0.5, u = (x * Math.cos(a) + z * Math.sin(a)) / 58, w = (-x * Math.sin(a) + z * Math.cos(a)) / 34, iu = Math.floor(u), iw = Math.floor(w), k = hash(iu * 3 + 11, iw * 5 - 7), fu = u - iu, fw = w - iw, edge = Math.min(fu, 1 - fu) * 58 < 1.3 || Math.min(fw, 1 - fw) * 34 < 1.3;
      const crop = k < 0.3 ? [0.8, 0.69, 0.34] : k < 0.55 ? [0.44, 0.58, 0.22] : k < 0.72 ? [0.47, 0.37, 0.25] : k < 0.88 ? [0.63, 0.63, 0.3] : [0.33, 0.5, 0.2], rows = 0.93 + 0.07 * Math.sin(fw * 34 * 2.4);
      c = c.map((q, i) => mix(q, edge ? 0.2 + 0.1 * (i === 1) : crop[i] * rows, farm * (k < 0.94 ? 0.92 : 0))); } }
  c = c.map((a, i) => mix(a, floor[i], f * 0.8)); const r = riverAt(x, z);
  c = c.map((a, i) => mix(a, mud[i], smooth(r.w + 10, r.w + 1, r.d) * 0.8)); c = c.map((a, i) => mix(a, sand[i], smooth(2.6, 0.6, h) * (r.d < r.w + 30 && h > 1 ? 0.3 : 1)));
  const steep = smooth(0.84, 0.6, n[1]), band = 0.5 + 0.5 * Math.sin(h * 0.42 + 5 * fbm(x / 130, z / 130, 2)), cleft = fbm(x / 9 + 2, z / 9 - 7, 2), warm = fbm(x / 240 + 31, z / 240 + 5, 2);
  const rk = rock.map((a, i) => a * (0.66 + 0.3 * band + 0.24 * v) * (cleft < 0.36 ? 0.7 : 1) * (i === 0 ? 0.96 + 0.2 * warm : i === 2 ? 1.02 - 0.16 * warm : 1)); c = c.map((a, i) => mix(a, rk[i], Math.max(steep, smooth(380, 620, h))));
  c = c.map((a, i) => mix(a, snow[i], smooth(900, 1150, h + 160 * (v - 0.5)) * smooth(0.45, 0.75, n[1]))); return c; }

// ---------- the places of the designed heart. clear: forest is kept this far away. More are added as the world is built.
const PLACES = {
  city: { x: CITY.x, z: CITY.z, name: 'Olympus', kind: 'city' },
  gate: { x: 0, z: -72, name: 'The West Gate', kind: 'gate' },
  village: { x: -205, z: -1570, name: 'Riverbend', kind: 'village', clear: 150 },
  camp: { x: -1500, z: -2300, name: 'The Foresters’ Camp', kind: 'camp', clear: 60 },
  ford: { x: -148, z: -1045, name: 'The Old Ford', kind: 'ford', clear: 50 },
  crest: { x: 40, z: -640, name: 'First Sight Hill', kind: 'view', clear: 70 },
  falls: { x: 455, z: -3360, name: 'The Falls of Zeus', kind: 'falls' },
};
// ---------- the door: everything the world uses, in the world's own directions (sea to the east)
const W = { CITY: { x: CITY.z, z: CITY.x, r: CITY.r, y: CITY.y }, PLACES: Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, { ...p, x: p.z, z: p.x }])) };
export const WORLD = W, places = W.PLACES, city = W.CITY;
export const heightAt = (x, z) => height(z, x), riverNear = (x, z) => riverAt(z, x);
// The road: a worn track from the village, over the ford and the hill, to the city's west gate. Points [x, z] in the world.
// The village and the city are on opposite banks, so the road crosses the river once, at the ford, and nowhere else.
export const ROAD_PTS = [[-1560, -210], [-1420, -180], [-1270, -160], [-1130, -130], [-1040, -150], [-950, -180], [-830, -110], [-720, -20], [-640, 40], [-520, 30], [-380, 12], [-230, 4], [-72, 0]];
const ROAD = []; for (let i = 0; i < ROAD_PTS.length - 1; i++) for (let k = 0; k < 8; k++) { const p = catmull(ROAD_PTS.map((q) => [q[0], q[1], 0]), i, k / 8); ROAD.push([p[0], p[1]]); } ROAD.push(ROAD_PTS.at(-1));
const QB = { x0: Math.min(...ROAD.map((p) => p[0])) - 12, x1: Math.max(...ROAD.map((p) => p[0])) + 12, z0: Math.min(...ROAD.map((p) => p[1])) - 12, z1: Math.max(...ROAD.map((p) => p[1])) + 12 };
export function roadNear(x, z) { if (x < QB.x0 || x > QB.x1 || z < QB.z0 || z > QB.z1) return 1e9; let best = 1e9; for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if (d < best) best = d; } return best; }
export const forestAt = (x, z, h) => forest(z, x, h) * smooth(3, 9, roadNear(x, z));
export const groundAt = (x, z, h, n, f) => { const c = ground(z, x, h, [n[2], n[1], n[0]], f), k = smooth(3.2, 1.2, roadNear(x, z)) * 0.85; return k ? [mix(c[0], 0.56, k), mix(c[1], 0.46, k), mix(c[2], 0.31, k)] : c; };
export const normalAt = (x, z, e) => { const n = normal(z, x, e); return [n[2], n[1], n[0]]; };
// the river as the world sees it: [x, z, half width, water level, distance from the source]
export function river() { const L = levels(); return RIVER.map((p, i) => [p[1], p[0], p[2], L[i][1], L[i][0]]); }
export function falls() { levels(); return { ...FALLS, x: FALLS.z, z: FALLS.x }; }
// A path over the land through points [x, z], following the ground: [x, y, z] every `step` metres. For roads and for the newcomer's journey.
export function pathThrough(points, step = 4) { const out = []; for (let i = 0; i < points.length - 1; i++) { const n = Math.max(1, Math.round(Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]) / step)); for (let k = 0; k < n; k++) { const p = catmull(points.map((q) => [q[0], q[1], 0]), i, k / n); out.push([p[0], heightAt(p[0], p[1]), p[1]]); } } const e = points.at(-1); out.push([e[0], heightAt(e[0], e[1]), e[1]]); return out; }
