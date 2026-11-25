// The Lighting Director: decides what the whole rig does, as a lighting designer would. No drawing happens here.
// It runs cues of a fixed number of beats. For each cue it picks a pattern from the current theme, never one used in the last
// three cues, and tells every projector where to point, how wide to open, and how bright to be. Colour is one main colour per
// theme with one accent used sparingly. Some cues end with a beat of darkness, because a big moment lands harder after black.
//   const dir = createDirector({ seed });   dir.update(beats)  ->  { theme, pattern, cue, u, dark, accent }
//   dir.target(projector, state)  ->  { pan, tilt, spread, roll, level, sheet, cone, spin, accent, time }
// A projector is { group: 'back' | 'side' | 'floor', side: -1 | 0 | 1 }. Angles are radians relative to the projector's own facing.
// The festival rig adds { group: 'wall', side, k: 0..4 from the middle outwards } and { group: 'wash', side, k: 0 centre, 1 and 2 outer }.
// Positive tilt is up. For left and right to mirror, pan and roll must change sign with side (an upright fan is roll 1.5708 either way).

export const THEMES = [
  // the festival look, after the Transmission Prague show the owner loves: a wall of projectors throwing wide fans, with magenta shafts through them
  { name: 'Olympus', main: 0x12ff48, accent: 0xff2bd0, cue: 16, patterns: ['oracle', 'cathedral', 'chase', 'crown', 'corners', 'wavewall', 'colonnade', 'spears', 'strobe', 'sunburst'], camera: 'calm', festival: true, budget: 110 },
  { name: 'Emerald', main: 0x10ff60, accent: 0xdfffe8, cue: 16, patterns: ['fan', 'ceiling', 'sweep', 'single', 'opposing', 'explosion'], camera: 'calm' },
  { name: 'Ice', main: 0x18c8ff, accent: 0xffffff, cue: 16, patterns: ['tunnel', 'ceiling', 'cage', 'single', 'architecture', 'fan'], camera: 'calm' },
  { name: 'Inferno', main: 0xff2a1e, accent: 0xffa01e, cue: 8, patterns: ['opposing', 'explosion', 'sweep', 'fan', 'cage', 'finale'], camera: 'lively' },
  { name: 'Ultraviolet', main: 0xa02bff, accent: 0xff2bd0, cue: 16, patterns: ['architecture', 'tunnel', 'opposing', 'ceiling', 'single', 'finale'], camera: 'lively' },
  { name: 'Monochrome', main: 0xdfe8ff, accent: 0xdfe8ff, cue: 32, patterns: ['single', 'sweep', 'cage', 'ceiling', 'architecture', 'fan'], camera: 'still' },
  { name: 'Solar', main: 0xffb21e, accent: 0xfff2c0, cue: 16, patterns: ['fan', 'explosion', 'tunnel', 'sweep', 'opposing', 'finale'], camera: 'calm' },
];

const ease = (x) => x * x * (3 - 2 * x), wave = (u, n = 1) => Math.sin(u * Math.PI * 2 * n), off = { level: 0, sheet: 0 };
// Each pattern: (projector, u = 0..1 through the cue, v = a variation number 0..1 fixed for the cue) -> targets. Missing values keep their defaults.
export const PATTERNS = {
  // every back projector opens a level fan together
  fan: (p, u, v) => p.group === 'back' ? { level: 0.42, spread: 0.08 + (0.55 + 0.3 * v) * ease(Math.min(1, u * 1.6)), tilt: -0.42 + 0.14 * u + p.side * p.side * 0.2, pan: -p.side * 0.12 } : off,
  // flat sheets of light from the back, tipping slowly down over the room
  ceiling: (p, u, v) => p.group === 'back' ? { sheet: 1, level: 0, sheetSpread: 0.95, tilt: 0.16 - (0.5 + 0.1 * v) * ease(u) + p.side * p.side * 0.07 } : off,
  // the two sides fire across at each other; the centre stays dark
  opposing: (p, u, v) => p.group === 'side' ? { level: 1, spread: 0.3 + 0.25 * v, tilt: 0.1 + 0.28 * wave(u), pan: 0.2 * wave(u, 0.5), roll: 0.5 } : off,
  // beams arranged round a cone and turning: looking into it is looking down a tunnel
  tunnel: (p, u, v) => p.group === 'back' && p.side === 0 ? { level: 1, cone: 1, spread: 0.2 + 0.16 * ease(u), tilt: -0.24, spin: 0.5 + 0.5 * v } : p.group === 'back' ? { level: 0.55, cone: 1, spread: 0.1, tilt: -0.24, pan: -p.side * 0.2, spin: -0.7 } : off,
  // upright fans from the floor and the back: bars of light all round
  cage: (p, u, v) => p.group === 'floor' ? { level: 1, roll: 1.5708, spread: 0.3 + 0.1 * wave(u), tilt: 0.05, pan: -p.side * (0.12 + 0.1 * v) } : p.group === 'back' && p.side !== 0 ? { level: 0.8, roll: 1.5708, spread: 0.26, tilt: -0.3, pan: -p.side * 0.3 } : off,
  // tight bundles from every back projector, swinging across together
  sweep: (p, u, v) => p.group === 'back' ? { level: 1, spread: 0.07, tilt: -0.12 + 0.1 * p.side * p.side, pan: (0.5 + 0.2 * v) * wave(u, v > 0.5 ? 1 : 0.5) } : off,
  // almost everything off: one beam, moving slowly
  single: (p, u, v) => p.group === 'back' && p.side === 0 ? { level: 1.3, spread: 0.0, tilt: 0.02 + 0.2 * ease(u), pan: (v > 0.5 ? 1 : -1) * (0.5 - 0.35 * ease(u)), time: 0.9 } : off,   // it passes over the camera's shoulder, never straight into the lens
  // ---- the building as the show (ZW-041): every laser off, and the temple's pillars lit one by one. What is lit comes from building() below.
  oracle: () => off, chase: () => off, corners: () => off, strobe: () => off, colonnade: () => off,
  // ---- the festival rig
  // the picture from the reference: every wall projector throws a tall fan leaning outwards, and magenta shafts rise through the middle and from the sides
  // lean tips a fan sideways in its own plane. With the projector tilted well up and roll 0, the fan stands open towards the audience like a hand fan.
  cathedral: (p, u, v) => p.group === 'wall' ? { level: 1, spread: 0.36 + 0.05 * wave(u + p.k * 0.13), tilt: 1.02 - 0.05 * p.k + 0.04 * wave(u, 0.5), lean: p.side * (p.k === 0 ? -0.12 : 0.16 + 0.15 * p.k), time: 0.7 }
    : p.group === 'wash' ? (p.k === 0 ? { sheet: 1, sheetSpread: 0.075, tilt: 1.12, lean: p.side * (0.06 + 0.04 * wave(u)), accent: true, time: 0.8 } : { sheet: 0.8, sheetSpread: 0.05, tilt: 0.75, lean: -p.side * (0.95 - 0.3 * (p.k - 1) + 0.08 * wave(u, 0.5)), accent: true, time: 0.8 }) : off,
  // level fans in tiers, one above another, opening and closing slowly like breathing
  crown: (p, u, v) => p.group === 'wall' ? { level: 1, spread: 0.5 + 0.22 * wave(u, 0.5 + Math.round(v)), tilt: 0.14 + 0.12 * p.k, pan: p.side * 0.16, roll: p.side * 0.12 * p.k, time: 0.8 } : off,
  // upright fans swinging from side to side one after another, a wave running along the wall
  wavewall: (p, u, v) => p.group === 'wall' ? { level: 1, spread: 0.2, tilt: 1.0, lean: p.side * (0.1 + 0.5 * Math.sin(u * Math.PI * 4 - p.k * 0.9) * (v > 0.5 ? 1 : -1)), time: 0.35 }
    : p.group === 'wash' && p.k > 0 ? { sheet: 0.6, sheetSpread: 0.045, tilt: 0.75, lean: -p.side * 0.8, accent: true, time: 0.8 } : off,
  // each projector a tight spear of light, spread like the rays of a rising sun, slowly fanning wider
  spears: (p, u, v) => p.group === 'wall' ? { level: 1.2, spread: 0.02 + 0.05 * ease(u), tilt: 1.0 - 0.06 * p.k, lean: p.side * (0.1 + 0.24 * p.k) * (0.55 + 0.45 * ease(u)), time: 0.9 }
    : p.group === 'wash' && p.k === 0 ? { sheet: 0.9, sheetSpread: 0.06, tilt: 1.12, lean: p.side * 0.05, accent: true, time: 0.8 } : off,
  // the whole wall at full width, every fan turning about its own axis, with all the shafts
  sunburst: (p, u, v) => p.group === 'wall' ? { level: 1, spread: u < 0.03 ? 0.05 : 0.6, tilt: 0.98 - 0.05 * p.k, lean: p.side * (0.12 + 0.14 * p.k), roll: p.side * 1.2 * u, accent: p.k === 4, time: 0.18 }
    : p.group === 'wash' ? { sheet: 1, sheetSpread: p.k === 0 ? 0.09 : 0.06, tilt: p.k === 0 ? 1.1 : 0.75, lean: p.k === 0 ? p.side * 0.08 : -p.side * 0.85, accent: true, time: 0.18 } : off,
  // everything opens at once, fast
  explosion: (p, u, v) => p.group === 'wall' || p.group === 'wash' ? off : p.group === 'floor' ? { level: 1, spread: 0.5, tilt: 0.25, roll: 0.3 * p.side, time: 0.16 } : { level: 1, spread: u < 0.04 ? 0.05 : 0.85, tilt: -0.34, pan: -p.side * 0.1, accent: p.side !== 0, time: 0.16 },
  // upright fans that turn slowly about their own axis, like a structure rotating
  architecture: (p, u, v) => p.group === 'back' ? { level: 1, spread: 0.36, tilt: -0.28, roll: 1.5708 * (u * (v > 0.5 ? 1 : -1) + p.side * 0.33), time: 0.6 } : off,
  // the full rig: fans below a ceiling of light, with the accent colour on the outer projectors
  finale: (p, u, v) => p.group === 'wall' || p.group === 'wash' ? off : p.group === 'back' ? { level: 1, sheet: p.side === 0 ? 0.8 : 0, sheetSpread: 0.95, spread: 0.7, tilt: -0.4 + 0.1 * wave(u), accent: p.side !== 0 } : p.group === 'side' ? { level: 0.8, spread: 0.3, tilt: 0.12, roll: 0.5 } : { level: 0.7, roll: 1.5708, spread: 0.3 },
};
const DEFAULTS = { lean: 0, pan: 0, tilt: -0.25, spread: 0.1, roll: 0, level: 0, sheet: 0, sheetSpread: 0.9, cone: 0, spin: 0, accent: false, time: 0.42 };
const BIG = new Set(['explosion', 'finale', 'sunburst']);

// The building cues (ZW-041), after the opening of the Transmission video. The lasers are dark and the stage building is the show.
// The building is a temple of six pillars in the middle with three free-standing pillars either side: twelve pillars, counted from the left
// (0-2 left group, 3-8 temple, 9-11 right group). building(pattern, beats, n, out) fills out[0..n-1] with each pillar's light (0 or 1),
// out[n] with the temple's roof and steps, out[n+1] with the rows of warm bulbs round it, and out[n+2] with the colour (0 amber, 1 red-pink, 2 gold).
//   oracle     the video's opening: short flashes with black between them, jumping between the whole stage, the temple alone, the side
//              pillars alone, one pillar each side (stepping inwards, so it seems to move), and a single corner; the colour changes as it goes
//   chase      one pillar lit, running left to right and back, a step every half beat: the light seems to travel
//   corners    the pillar at one corner blinks fast, then the other corner, then each corner's pair; everything else black
//   colonnade  pillars come on one after another from one side until all are lit, go out the same way, then from the other side
//   strobe     the whole stage and its bulbs blink, twice a beat. Not faster: rapid full-picture flashing is a risk for photosensitive viewers
export const BUILDING = new Set(['oracle', 'chase', 'corners', 'strobe', 'colonnade']);
// A all, T temple, F both side groups, 0 1 2 one pillar each side (outermost first), L and R a single corner, - black. One letter per half beat.
const ORACLE = 'A-TF-T-A' + '0-1-2T--' + 'FTFT-A--' + 'L-R-LRA-' + 'T--F--T-' + '2-1-0-A-' + 'TFTF0120' + 'A---A-T-';
export function building(pattern, beats, n, out = []) { for (let i = 0; i <= n + 2; i++) out[i] = 0; const fr = (x) => x - Math.floor(x), half = Math.floor(beats * 2), side = Math.floor(n / 4);
  const temple = () => { for (let i = side; i < n - side; i++) out[i] = 1; out[n] = 1; }, flanks = () => { for (let i = 0; i < side; i++) out[i] = out[n - 1 - i] = 1; };
  if (pattern === 'oracle') { const c = ORACLE[half % ORACLE.length]; out[n + 2] = Math.floor(half / 5) % 3; if (c === '-' || fr(beats * 2) > 0.5) return out;
    if (c === 'A') { temple(); flanks(); out[n + 1] = 1; } else if (c === 'T') temple(); else if (c === 'F') flanks(); else if (c === 'L') out[0] = 1; else if (c === 'R') out[n - 1] = 1; else { const k = Number(c); out[k] = out[n - 1 - k] = 1; } }
  else if (pattern === 'chase') { const s = half % (2 * n - 2); out[s < n ? s : 2 * n - 2 - s] = 1; }
  else if (pattern === 'corners') { const seg = Math.floor(beats / 2) % 4; out[n + 2] = 1; if (fr(beats / 2) < 0.75 && fr(beats * 4) < 0.5) { if (seg === 0) out[0] = 1; else if (seg === 1) out[n - 1] = 1; else if (seg === 2) out[0] = out[1] = 1; else out[n - 1] = out[n - 2] = 1; } }
  else if (pattern === 'colonnade') { const s = half % (4 * n), h = s % (2 * n), lit = h < n ? h + 1 : 2 * n - 1 - h, fromRight = s >= 2 * n; for (let i = 0; i < lit; i++) out[fromRight ? n - 1 - i : i] = 1; if (lit === n) out[n] = 1; }
  else if (pattern === 'strobe') { out[n + 2] = Math.floor(beats / 4) % 3; if (fr(beats * 2) < 0.4) { temple(); flanks(); out[n + 1] = 1; } }
  return out; }

const QUIET = new Set(['ceiling', 'single', 'sweep', 'architecture', 'spears', 'crown', 'corners', 'colonnade']);
export function createDirector({ seed = 7 } = {}) {
  let a = seed; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const st = { theme: 0, auto: true, pattern: 'fan', cue: -1, cueStart: 0, u: 0, v: 0.5, dark: false, blackout: false, history: [], themeCues: 0, coming: null, calm: false, force: null };
  function choose(calm = false) { const t = THEMES[st.theme], recent = st.history.slice(-3); calm = calm || st.calm;
    if (st.calm) { const quiet = t.patterns.filter((n) => QUIET.has(n) && n !== st.pattern); if (quiet.length) return quiet[Math.floor(rnd() * quiet.length)]; }   // in a breakdown: the still, spare patterns
    let from = t.patterns.filter((n) => !recent.includes(n) && !(calm && BIG.has(n))); if (!from.length) from = t.patterns.filter((n) => !(calm && BIG.has(n))); return from[Math.floor(rnd() * from.length)]; }
  // beats: the running count from the beat clock. Returns the state for this frame.
  // The pattern after this one is chosen as each cue starts, so the director knows in time whether to go dark before it.
  function update(beats) { const cue = Math.floor(beats / THEMES[st.theme].cue);
    if (cue !== st.cue) { let fresh = st.cue < 0 || st.coming === null; st.themeCues++;
      if (st.auto && st.themeCues > 8) { st.theme = (st.theme + 1) % THEMES.length; st.themeCues = 1; st.history = []; fresh = true; }   // a theme holds for eight cues, then the next one takes over
      const len = THEMES[st.theme].cue; st.cue = Math.floor(beats / len); st.cueStart = st.cue * len;
      st.pattern = st.force || (fresh ? choose(true) : st.coming); st.force = null;   // a theme never opens on its biggest moment
      st.history.push(st.pattern); if (st.history.length > 8) st.history.shift(); st.v = rnd(); st.coming = choose(); }
    const len = THEMES[st.theme].cue; st.u = Math.min(1, Math.max(0, (beats - st.cueStart) / len));
    // the last beat before a big pattern goes dark, so that it lands
    st.dark = st.blackout || (BIG.has(st.coming) && !(st.auto && st.themeCues >= 8) && beats - st.cueStart >= len - 1);
    return st; }
  function target(p, out = {}) { Object.assign(out, DEFAULTS, PATTERNS[st.pattern](p, st.u, st.v)); if (st.dark) { out.level = 0; out.sheet = 0; out.time = 0.12; } return out; }
  const setTheme = (i) => { st.theme = ((i % THEMES.length) + THEMES.length) % THEMES.length; st.themeCues = 0; st.history = []; st.cue = -1; st.coming = null; };
  // move on to another pattern now
  // the drop: the theme's biggest pattern, now
  const hit = () => { const t = THEMES[st.theme]; st.calm = false; st.force = t.patterns.find((n) => n === 'explosion') || t.patterns.find((n) => BIG.has(n)) || 'explosion'; st.cue = -2; };
  // a breakdown: move to a quiet pattern now and stay with quiet ones until the drop
  const setCalm = (on) => { if (on === st.calm) return; st.calm = on; if (on) { st.coming = null; st.cue = -2; } };
  return { state: st, update, target, setTheme, nextLook: () => { st.cue = -2; }, hit, setCalm, themes: THEMES };
}
