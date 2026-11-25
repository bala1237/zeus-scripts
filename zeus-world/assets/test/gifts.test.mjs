import test from 'node:test';
import assert from 'node:assert/strict';
import { createGifts, GIFT_BEATS } from '../review/gifts.js';

// run the clock in steps of a twentieth of a beat, reporting what plays at each step
function run(g, beats, each) { let b = 0; for (let i = 0; i < beats * 20; i++) { const prev = b; b += 0.05; const onBeat = Math.floor(b + 1e-9) !== Math.floor(prev + 1e-9), onBar = onBeat && Math.floor(b + 1e-9) % 4 === 0; each(g.update(0.05, onBeat, onBar), b); } }

test('gifts wait their turn, each plays for its full length, and none overlaps another', () => { const g = createGifts(), seen = []; g.add({ size: 'small', name: 'Ana' }); g.add({ size: 'medium', name: 'Ben' }); g.add({ size: 'small', name: 'Cy' }); let last = null;
  run(g, 30, (a, b) => { if (a && a !== last) seen.push([a.name, a.size, Math.round(b)]); last = a || last; });
  assert.deepEqual(seen.map((s) => s[0]), ['Ana', 'Ben', 'Cy']); assert.ok(seen[1][2] - seen[0][2] >= GIFT_BEATS.small); assert.ok(seen[2][2] - seen[1][2] >= GIFT_BEATS.medium); assert.equal(g.state.active, null); assert.equal(g.state.queue.length, 0); });

test('a gift starts on a beat, and a big one on a bar of four', () => { const g = createGifts(); let b0 = null; g.add({ size: 'big', name: 'Zed' });
  run(g, 10, (a, b) => { if (a && b0 === null) b0 = b; }); assert.ok(Math.abs(b0 % 4) < 0.06 || Math.abs(b0 % 4 - 4) < 0.06, `started at beat ${b0}`); });

test('small: lightning once, one pillar only. medium: the run visits every pillar there and back, then the whole row flashes. big: a beat of black, then everything, with lightning more than once', () => { const n = 12, o = [];
  let g = createGifts(); g.add({ size: 'small', name: 'A' }); const pillarsLit = new Set(); run(g, 6, (a) => { if (!a) return; g.lights(n, o); o.slice(0, n).forEach((v, i) => { if (v) pillarsLit.add(i); }); assert.equal(o[n], 0); }); assert.equal(pillarsLit.size, 1); assert.equal(g.state.strikes, 1);
  g = createGifts(); g.add({ size: 'medium', name: 'B' }); const seq = []; let all = false; run(g, 10, (a) => { if (!a) return; g.lights(n, o); const lit = o.slice(0, n).map((v, i) => v ? i : -1).filter((i) => i >= 0); if (lit.length === 1 && seq.at(-1) !== lit[0]) seq.push(lit[0]); if (lit.length === n) all = true; });
  assert.deepEqual(seq.slice(0, 23), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]); assert.ok(all);
  g = createGifts(); g.add({ size: 'big', name: 'C' }); let darkFirst = true, full = false; run(g, 22, (a) => { if (!a) return; g.lights(n, o); const c = o.slice(0, n).reduce((x, v) => x + v, 0); if (a.t < 0.95 && c) darkFirst = false; if (c === n && o[n] && o[n + 1]) full = true; }); assert.ok(darkFirst && full); assert.ok(g.state.strikes >= 3, `${g.state.strikes} strikes`); });

test('a name is trimmed and kept short; an unknown size is treated as small', () => { const g = createGifts(); g.add({ size: 'huge', name: '   A   very long name indeed for a sign   ' }); assert.equal(g.state.queue[0].size, 'small'); assert.equal(g.state.queue[0].name, 'A very long name i'); });
