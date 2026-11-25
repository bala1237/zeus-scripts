// The Lighting Director: decides what the whole rig does, as a lighting designer would. No drawing happens here.
// It runs cues of a fixed number of beats. For each cue it picks a pattern from the current theme, never one used in the last
// three cues, and tells every projector where to point, how wide to open, and how bright to be. Colour is one main colour per
// theme with one accent used sparingly. Some cues end with a beat of darkness, because a big moment lands harder after black.
//   const dir = createDirector({ seed });   dir.update(beats)  ->  { theme, pattern, cue, u, dark, accent }
//   dir.target(projector, state)  ->  { pan, tilt, spread, roll, level, sheet, cone, spin, accent, time }
// A projector is { group: 'back' | 'side' | 'floor', side: -1 | 0 | 1 }. Angles are radians relative to the projector's own facing.

export const THEMES = [
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
  // everything opens at once, fast
  explosion: (p, u, v) => p.group === 'floor' ? { level: 1, spread: 0.5, tilt: 0.25, roll: 0.3 * p.side, time: 0.16 } : { level: 1, spread: u < 0.04 ? 0.05 : 0.85, tilt: -0.34, pan: -p.side * 0.1, accent: p.side !== 0, time: 0.16 },
  // upright fans that turn slowly about their own axis, like a structure rotating
  architecture: (p, u, v) => p.group === 'back' ? { level: 1, spread: 0.36, tilt: -0.28, roll: 1.5708 * (u * (v > 0.5 ? 1 : -1) + p.side * 0.33), time: 0.6 } : off,
  // the full rig: fans below a ceiling of light, with the accent colour on the outer projectors
  finale: (p, u, v) => p.group === 'back' ? { level: 1, sheet: p.side === 0 ? 0.8 : 0, sheetSpread: 0.95, spread: 0.7, tilt: -0.4 + 0.1 * wave(u), accent: p.side !== 0 } : p.group === 'side' ? { level: 0.8, spread: 0.3, tilt: 0.12, roll: 0.5 } : { level: 0.7, roll: 1.5708, spread: 0.3 },
};
const DEFAULTS = { pan: 0, tilt: -0.25, spread: 0.1, roll: 0, level: 0, sheet: 0, sheetSpread: 0.9, cone: 0, spin: 0, accent: false, time: 0.42 };
const BIG = new Set(['explosion', 'finale']);

export function createDirector({ seed = 7 } = {}) {
  let a = seed; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const st = { theme: 0, auto: true, pattern: 'fan', cue: -1, cueStart: 0, u: 0, v: 0.5, dark: false, blackout: false, history: [], themeCues: 0, coming: null };
  function choose(calm = false) { const t = THEMES[st.theme], recent = st.history.slice(-3); let from = t.patterns.filter((n) => !recent.includes(n) && !(calm && BIG.has(n))); if (!from.length) from = t.patterns.filter((n) => !(calm && BIG.has(n))); return from[Math.floor(rnd() * from.length)]; }
  // beats: the running count from the beat clock. Returns the state for this frame.
  // The pattern after this one is chosen as each cue starts, so the director knows in time whether to go dark before it.
  function update(beats) { const cue = Math.floor(beats / THEMES[st.theme].cue);
    if (cue !== st.cue) { let fresh = st.cue < 0 || st.coming === null; st.themeCues++;
      if (st.auto && st.themeCues > 8) { st.theme = (st.theme + 1) % THEMES.length; st.themeCues = 1; st.history = []; fresh = true; }   // a theme holds for eight cues, then the next one takes over
      const len = THEMES[st.theme].cue; st.cue = Math.floor(beats / len); st.cueStart = st.cue * len;
      st.pattern = fresh ? choose(true) : st.coming;   // a theme never opens on its biggest moment
      st.history.push(st.pattern); if (st.history.length > 8) st.history.shift(); st.v = rnd(); st.coming = choose(); }
    const len = THEMES[st.theme].cue; st.u = Math.min(1, Math.max(0, (beats - st.cueStart) / len));
    // the last beat before a big pattern goes dark, so that it lands
    st.dark = st.blackout || (BIG.has(st.coming) && !(st.auto && st.themeCues >= 8) && beats - st.cueStart >= len - 1);
    return st; }
  function target(p, out = {}) { Object.assign(out, DEFAULTS, PATTERNS[st.pattern](p, st.u, st.v)); if (st.dark) { out.level = 0; out.sheet = 0; out.time = 0.12; } return out; }
  const setTheme = (i) => { st.theme = ((i % THEMES.length) + THEMES.length) % THEMES.length; st.themeCues = 0; st.history = []; st.cue = -1; st.coming = null; };
  // move on to another pattern now
  return { state: st, update, target, setTheme, nextLook: () => { st.cue = -2; }, themes: THEMES };
}
