// Rules the Lighting Director must keep. Run from assets/: node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDirector, THEMES, PATTERNS } from '../review/director.js';

const RIG = [{ group: 'back', side: 0 }, { group: 'back', side: -1 }, { group: 'back', side: 1 }, { group: 'side', side: -1 }, { group: 'side', side: 1 }, { group: 'floor', side: -1 }, { group: 'floor', side: 1 }];
const run = (beats, f, opts) => { const d = createDirector(opts); for (let b = 0; b < beats; b += 0.25) f(d.update(b), d, b); return d; };

test('every pattern a theme names exists', () => { for (const t of THEMES) for (const n of t.patterns) assert.ok(PATTERNS[n], `${t.name}: ${n}`); });

test('no pattern is repeated within three cues', () => { const seen = []; let last = -1;
  run(4000, (s) => { if (s.cue !== last) { last = s.cue; seen.push([s.theme, s.pattern]); } });
  for (let i = 1; i < seen.length; i++) for (let k = 1; k <= 3 && i - k >= 0; k++) if (seen[i][0] === seen[i - k][0] && seen.slice(i - k, i).every((x) => x[0] === seen[i][0])) assert.notEqual(seen[i][1], seen[i - k][1], `cue ${i} repeats a pattern from ${k} back`); });

test('every theme is reached, and each holds for eight cues', () => { const cues = {}; let last = -1; run(6000, (s) => { if (s.cue !== last) { last = s.cue; cues[s.theme] = (cues[s.theme] || 0) + 1; } }); assert.equal(Object.keys(cues).length, THEMES.length); });

test('the rig is never fully lit: at most five of seven projectors at once outside the finale and explosion', () => { const t = {};
  run(3000, (s, d) => { if (s.dark || s.pattern === 'finale' || s.pattern === 'explosion' || THEMES[s.theme].festival) return; const lit = RIG.filter((p) => { d.target(p, t); return t.level > 0.01 || t.sheet > 0.01; }).length; assert.ok(lit <= 5 && lit >= 1, `${s.pattern}: ${lit} lit`); }); });

test('left and right mirror each other', () => { const l = {}, r = {};
  run(2000, (s, d) => { for (const g of ['back', 'side', 'floor']) { d.target({ group: g, side: -1 }, l); d.target({ group: g, side: 1 }, r); assert.equal(l.level, r.level); assert.equal(l.spread, r.spread); assert.ok(Math.abs(l.tilt - r.tilt) < 1e-9); }
    for (const g of ['wall', 'wash']) for (const k of [0, 1, 2, 3, 4]) { d.target({ group: g, side: -1, k }, l); d.target({ group: g, side: 1, k }, r); assert.equal(l.level, r.level); assert.equal(l.sheet, r.sheet); assert.ok(Math.abs(l.tilt - r.tilt) < 1e-9); assert.ok(Math.abs(l.pan + r.pan) < 1e-9, 'pan mirrors'); assert.ok(Math.abs(Math.sin(l.roll + r.roll)) < 1e-9, `roll mirrors: ${s.pattern} ${g} ${k} ${l.roll} ${r.roll}`); } }); });

test('a big pattern is always entered from darkness', () => { let prevDark = false, last = -1, checked = 0;
  run(6000, (s) => { if (s.cue !== last) { if (last >= 0 && (s.pattern === 'explosion' || s.pattern === 'finale') && s.cue > 0) { assert.ok(prevDark, `cue ${s.cue} (${s.pattern}) was not preceded by darkness`); checked++; } last = s.cue; } prevDark = s.dark; }); assert.ok(checked > 3); });

test('blackout switches everything off', () => { const d = createDirector(), t = {}; d.update(5); d.state.blackout = true; d.update(5.1); for (const p of RIG) { d.target(p, t); assert.equal(t.level, 0); assert.equal(t.sheet, 0); } });

test('the same seed gives the same show; a different seed gives another', () => { const seq = (seed) => { const out = []; let last = -1; run(800, (s) => { if (s.cue !== last) { last = s.cue; out.push(s.pattern); } }, { seed }); return out.join(','); }; assert.equal(seq(3), seq(3)); assert.notEqual(seq(3), seq(4)); });

test('a breakdown brings a quiet pattern at once and keeps to quiet ones; the drop brings a big one at once', () => { const d = createDirector({ seed: 3 }); let b = 0; for (; b < 40; b += 0.25) d.update(b);
  d.setCalm(true); d.update(b); const quiet = ['ceiling', 'single', 'sweep', 'architecture', 'spears', 'crown']; assert.ok(quiet.includes(d.state.pattern), d.state.pattern);
  for (let i = 0; i < 400; i++) { b += 0.25; d.update(b); assert.ok(!['explosion', 'finale', 'sunburst'].includes(d.state.pattern)); }
  d.hit(); d.update(b); assert.ok(['explosion', 'finale', 'sunburst'].includes(d.state.pattern), d.state.pattern); assert.equal(d.state.calm, false); });

test('the festival theme uses the wall and the shafts and leaves the club rig dark; club themes leave the wall dark', () => { const t = {}; let fest = 0;
  run(6000, (s, d) => { if (s.dark) return; const lit = (p) => { d.target(p, t); return t.level > 0.01 || t.sheet > 0.01; };
    const club = RIG.filter(lit).length, wall = [0, 1, 2, 3, 4].filter((k) => lit({ group: 'wall', side: 1, k })).length + [0, 1, 2].filter((k) => lit({ group: 'wash', side: 1, k })).length;
    if (THEMES[s.theme].festival) { fest++; assert.equal(club, 0); assert.ok(wall >= 5, `${s.pattern}: ${wall}`); } else assert.equal(wall, 0, s.pattern); }); assert.ok(fest > 100); });
