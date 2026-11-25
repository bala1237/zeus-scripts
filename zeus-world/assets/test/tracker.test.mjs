// The beat tracker on made-up music: a kick, a snare, hats and a pad, at known tempos, so the right answer is known.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBands, createTracker } from '../review/tracker.js';

const SR = 48000, HOP = 240, RATE = SR / HOP;
let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };

// parts: a list of { secs, bpm, kick, snare, hats, pad, silent, breakbeat }. Returns the tracker and the true beat times.
function play(parts, { gain = 0.5 } = {}) { const bands = makeBands(SR, HOP), tr = createTracker({ rate: RATE }), out = [0, 0, 0, 0], beats = []; let n = 0, t0 = 0.137, hp = 0, log = [];
  for (const p of parts) { const T = 60 / p.bpm, end = t0 + p.secs, first = beats.length; for (let t = t0; t < end - 1e-6; t += T) beats.push(t);
    for (; n / SR < end; n++) { const t = n / SR; let s = 0;
      if (!p.silent) { const b = (t - t0) / T, f = b - Math.floor(b), bar = Math.floor(b) % 4, tt = f * T, noise = rnd();
        const kickOn = p.breakbeat ? (bar === 0 || bar === 2) : p.kick !== false, k2 = p.breakbeat && bar === 2 ? ((b + 0.5) % 1) * T : 9;   // a breakbeat: kicks on one, three and the "and" of three
        if (kickOn && tt < 0.18) s += Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-tt * 40)) * tt) * Math.exp(-tt * 22);
        if (p.breakbeat && bar === 2 && f >= 0.5 && k2 < 0.18) s += Math.sin(2 * Math.PI * 58 * k2) * Math.exp(-k2 * 22);
        if (p.snare && (bar === 1 || bar === 3) && tt < 0.12) s += 0.5 * noise * Math.exp(-tt * 35) + 0.4 * Math.sin(2 * Math.PI * 190 * tt) * Math.exp(-tt * 30);
        if (p.hats) { const h = (((b + 0.5) % 1 + 1) % 1) * T; const hn = noise - hp; hp = noise; if (h < 0.05) s += 0.35 * hn * Math.exp(-h * 90); }
        if (p.pad) s += 0.12 * (1 + 0.3 * Math.sin(t * 0.9)) * (Math.sin(2 * Math.PI * 220.31 * t) + Math.sin(2 * Math.PI * 277.93 * t + 1) + Math.sin(2 * Math.PI * 331.77 * t + 2)) + 0.01 * noise; }
      if (bands(s * gain, out)) { tr.push(out[0], out[1], out[2], out[3], (n + 1) / SR); log.push({ t: (n + 1) / SR, section: tr.state.section, drops: tr.state.drops }); } }
    t0 = beats.length > first ? beats.at(-1) + T : end; }
  return { tr, beats, log, end: n / SR }; }

// how far the tracker's beat is from the nearest true beat, in milliseconds
function offBy({ tr, beats }) { const s = tr.state; let best = 9; for (const b of beats.slice(-40)) { const e = (b - s.anchor) / s.period, d = Math.abs(e - Math.round(e)) * s.period; best = Math.min(best, d); } return best * 1000; }

for (const bpm of [90, 100, 110, 124, 128, 140, 150])
  test(`four on the floor at ${bpm}: tempo within half a percent, beat within 20 ms`, () => { const r = play([{ secs: 14, bpm, hats: true, snare: true, pad: true }]), s = r.tr.state;
    assert.ok(s.locked, 'locked'); assert.ok(Math.abs(s.bpm / bpm - 1) < 0.005, `heard ${s.bpm.toFixed(2)}`); assert.ok(offBy(r) < 20, `off by ${offBy(r).toFixed(1)} ms`); });

test('drum and bass at 174 is read as 174 or as half of it, on the beat', () => { const r = play([{ secs: 14, bpm: 174, hats: true, snare: true }]), s = r.tr.state;
  assert.ok([1, 0.5].some((k) => Math.abs(s.bpm / (174 * k) - 1) < 0.006), `heard ${s.bpm.toFixed(2)}`); assert.ok(offBy(r) < 20, `off by ${offBy(r).toFixed(1)} ms`); });

test('a broken beat (no kick on every beat) still gives the tempo and the beat', () => { const r = play([{ secs: 16, bpm: 96, breakbeat: true, snare: true, hats: true }]), s = r.tr.state;
  assert.ok(Math.abs(s.bpm / 96 - 1) < 0.006, `heard ${s.bpm.toFixed(2)}`); assert.ok(offBy(r) < 25, `off by ${offBy(r).toFixed(1)} ms`); });

test('a quiet stream is followed as well as a loud one', () => { const r = play([{ secs: 14, bpm: 126, hats: true, pad: true }], { gain: 0.02 }), s = r.tr.state;
  assert.ok(Math.abs(s.bpm / 126 - 1) < 0.005, `heard ${s.bpm.toFixed(2)}`); assert.ok(offBy(r) < 20); });

test('the beat is held through a breakdown with no drums, and is still right when the kick returns', () => {
  const r = play([{ secs: 12, bpm: 126, hats: true, pad: true }, { secs: 60 / 126 * 16, bpm: 126, kick: false, pad: true }]), s = r.tr.state;
  assert.ok(s.locked && s.playing); assert.ok(Math.abs(s.bpm / 126 - 1) < 0.006, `heard ${s.bpm.toFixed(2)}`);
  const T = 60 / 126, next = r.beats.at(-1) + T, e = (next - s.anchor) / s.period; assert.ok(Math.abs(e - Math.round(e)) * s.period * 1000 < 35, 'carried the beat across sixteen beats without drums'); });

test('a breakdown is noticed, and the bass coming back counts as one drop', () => {
  const r = play([{ secs: 14, bpm: 124, hats: true, pad: true }, { secs: 8, bpm: 124, kick: false, hats: true, pad: true }, { secs: 6, bpm: 124, hats: true, pad: true }]);
  assert.ok(r.log.some((l) => l.t > 16 && l.t < 22 && l.section === 'breakdown'), 'breakdown seen'); assert.equal(r.tr.state.drops, 1); assert.equal(r.tr.state.section, 'groove');
  const at = r.log.find((l) => l.drops === 1).t; assert.ok(at - 22.137 < 0.6, `drop noticed ${(at - 22.137).toFixed(2)} s after the kick came back`); });

test('a change of song is followed within eight seconds', () => { const r = play([{ secs: 12, bpm: 122, hats: true }, { secs: 8, bpm: 134, hats: true, snare: true }]), s = r.tr.state;
  assert.ok(Math.abs(s.bpm / 134 - 1) < 0.01, `heard ${s.bpm.toFixed(2)}`); assert.ok(offBy(r) < 25, `off by ${offBy(r).toFixed(1)} ms`); });

test('silence is not music, and a pad alone gives no false beat lock', () => {
  const a = play([{ secs: 6, bpm: 120, silent: true }]); assert.equal(a.tr.state.playing, false); assert.equal(a.tr.state.locked, false);
  const b = play([{ secs: 10, bpm: 120, kick: false, pad: true }]); assert.equal(b.tr.state.playing, true); assert.equal(b.tr.state.locked, false); });

test('music stopping is noticed within a second and a half', () => { const r = play([{ secs: 8, bpm: 124, hats: true }, { secs: 1.5, bpm: 124, silent: true }]); assert.equal(r.tr.state.playing, false); });
