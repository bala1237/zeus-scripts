import test from 'node:test';
import assert from 'node:assert/strict';
import { roomCue, createRoomShow, PIECES } from '../review/roomcues.js';

test('room cues: glow lights everything; the chase is one piece travelling across and back; the strobe is no faster than twice a beat', () => { const o = [];
  roomCue('glow', 3.3, o); assert.deepEqual(o, [1, 1, 1, 1, 1, 1, 1]);
  const seq = []; for (let b = 0; b < 6; b += 0.05) { roomCue('chase', b, o); const lit = o.slice(0, PIECES).map((v, i) => v ? i : -1).filter((i) => i >= 0); assert.equal(lit.length, 1); assert.equal(o[PIECES], 0); if (seq.at(-1) !== lit[0]) seq.push(lit[0]); } assert.deepEqual(seq.slice(0, 11), [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]);
  let flashes = 0, was = 0; for (let b = 0; b < 8; b += 0.005) { roomCue('strobe', b, o); if (o[0] && !was) flashes++; was = o[0]; } assert.equal(flashes, 16); });

test('the oracle cue is mostly black and shows the middle alone, the sides alone, pairs and single pieces', () => { const o = [], kinds = new Set(); let lit = 0, total = 0;
  for (let b = 0; b < 32; b += 0.01) { roomCue('oracle', b, o); total++; const key = o.slice(0, PIECES).join(''); if (key !== '000000') { lit++; kinds.add(key); } }
  assert.ok(lit / total < 0.4); for (const k of ['111111', '001100', '110011', '100010', '010001', '100000', '000010', '000100', '001000']) assert.ok(kinds.has(k), k); });

test('the room show: the plain lit room about half the time, no flashing cue twice running, lasers only when allowed, calm in a breakdown', () => {
  const run = (opts) => { const s = createRoomShow({ seed: 9 }), seen = []; for (let b = 0; b < 16 * 400; b += 16) { const st = s.update(b, opts); seen.push(st.lasers ? 'lasers' : st.pattern); } return seen; };
  const a = run({ lasersAllowed: false }); assert.ok(!a.includes('lasers')); const glow = a.filter((p) => p === 'glow').length / a.length; assert.ok(glow > 0.35 && glow < 0.7, `glow ${glow.toFixed(2)}`);
  for (let i = 1; i < a.length; i++) if (a[i] !== 'glow') assert.equal(a[i - 1], 'glow', 'a flashing cue is always followed and preceded by the lit room');
  const l = run({ lasersAllowed: true }); assert.ok(l.includes('lasers')); for (const p of ['chase', 'oracle', 'fill', 'strobe']) assert.ok(l.includes(p), p);
  const s = createRoomShow(); s.setCalm(true); for (let b = 0; b < 16 * 50; b += 16) assert.equal(s.update(b, { lasersAllowed: true }).pattern, 'glow'); assert.equal(s.state.lasers, false); });
