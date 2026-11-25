import test from 'node:test';
import assert from 'node:assert/strict';
import { createGifts, GIFT_BEATS, FLAME_SECONDS, AWAKEN, LEGEND, giftBeats, legendWake } from '../review/gifts.js';
import { stageGift, FAMILIES, DRAWN, FILMS } from '../review/giftcatalog.js';
import { prepare, FIGURES } from '../review/constellations.js';

// run the clock in steps of a twentieth of a beat (two beats a second), reporting what plays at each step
function run(g, beats, each = () => {}) { let b = g.clock || 0; for (let i = 0; i < beats * 20; i++) { const prev = b; b += 0.05; const onBeat = Math.floor(b + 1e-9) !== Math.floor(prev + 1e-9), onBar = onBeat && Math.floor(b + 1e-9) % 4 === 0; each(g.update(0.05, 0.025, onBeat, onBar), b); } g.clock = b; }
const lit = (g) => g.state.flames.filter((f) => f > 0).length;

test('gifts wait their turn, each plays for its full length, and none overlaps another', () => { const g = createGifts(), seen = []; g.add({ size: 'small', name: 'Ana' }); g.add({ size: 'medium', name: 'Ben' }); g.add({ size: 'small', name: 'Cy' }); let last = null;
  run(g, 30, (a, b) => { if (a && a !== last) seen.push([a.name, a.size, Math.round(b)]); last = a || last; });
  assert.deepEqual(seen.map((s) => s[0]), ['Ana', 'Ben', 'Cy']); assert.ok(seen[1][2] - seen[0][2] >= GIFT_BEATS.small); assert.ok(seen[2][2] - seen[1][2] >= GIFT_BEATS.medium); assert.equal(g.state.active, null); assert.equal(g.state.queue.length, 0); });

test('a gift starts on a beat, and a big one on a bar of four', () => { const g = createGifts(); let b0 = null; g.add({ size: 'big', name: 'Zed' });
  run(g, 10, (a, b) => { if (a && b0 === null) b0 = b; }); assert.ok(Math.abs(b0 % 4) < 0.06 || Math.abs(b0 % 4 - 4) < 0.06, `started at beat ${b0}`); });

test('small: one bolt on one pillar, and a flame left burning there', () => { const g = createGifts(), o = [], pillars = new Set(); g.add({ size: 'small', name: 'A' });
  run(g, 6, (a) => { if (!a) return; g.lights(o); o.slice(0, 12).forEach((v, i) => { if (v) pillars.add(i); }); assert.equal(o[12], 0); });
  const bolts = g.state.fx.filter((f) => f.type === 'bolt'); assert.equal(bolts.length, 1); assert.deepEqual([...pillars], [bolts[0].pillar]); assert.equal(lit(g), 1); assert.ok(g.state.flames[bolts[0].pillar] > 0); assert.ok(g.state.fx.some((f) => f.type === 'name')); });

test('medium: a bolt on the end pillar, then the light leaps pillar to pillar along the whole row, and three flames stay', () => { const g = createGifts(), o = []; let most = 0, all = false; g.add({ size: 'medium', name: 'B' });
  run(g, 10, (a) => { if (!a) return; g.lights(o); const c = o.slice(0, 12).filter((v) => v > 0).length; if (a.t < 4.5) { assert.ok(c >= most, 'pillars stay lit as the light passes'); most = c; } else if (c === 12) all = true; });
  const arcs = g.state.fx.filter((f) => f.type === 'arc'); assert.equal(arcs.length, 11); assert.deepEqual(arcs.map((x) => x.from), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); assert.deepEqual(arcs.map((x) => x.to), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(g.state.fx[0].type, 'bolt'); assert.equal(g.state.fx[0].pillar, 0); assert.ok(all); assert.equal(lit(g), 3); });

test('big: two beats of black, then the bolt on the peak, the pillars catching from the middle outwards, the name forged, two more strikes', () => { const g = createGifts(), o = []; let darkFirst = true, order = [], full = false; g.add({ size: 'big', name: 'C' });
  run(g, 22, (a) => { if (!a) return; g.lights(o); const on = o.slice(0, 12).map((v, i) => v > 0 ? i : -1).filter((i) => i >= 0); if (a.t < 1.95 && on.length) darkFirst = false; for (const i of on) if (!order.includes(i)) order.push(i); if (on.length === 12 && o[12] && o[13]) full = true; });
  assert.ok(darkFirst && full); assert.ok(order.indexOf(5) < order.indexOf(0) && order.indexOf(6) < order.indexOf(11), `caught in the order ${order}`);
  const fx = g.state.fx.map((f) => f.type + (f.pillar ?? '')); assert.deepEqual(fx, ['bolt-1', 'forge', 'bolt1', 'bolt10']); });

test('small gifts add up: when all twelve flames burn the temple answers by itself, then the flames start again; a flame left alone burns out', () => { const g = createGifts(); let awaken = false;
  for (let i = 0; i < 12; i++) g.add({ size: 'small', name: 'S' + i }); run(g, 12 * 5 + 2); assert.equal(lit(g), 12, 'twelve small gifts light twelve different pillars'); assert.equal(g.state.awakenings, 1);
  run(g, 24, (a) => { if (a && a.awaken && a.name === AWAKEN && a.size === 'big') awaken = true; }); assert.ok(awaken); assert.equal(lit(g), 0); assert.equal(g.state.awakenings, 1);
  const h = createGifts(); h.add({ size: 'small', name: 'x' }); run(h, 6); assert.equal(lit(h), 1); run(h, FLAME_SECONDS * 2 + 4); assert.equal(lit(h), 0); });

test('a name is trimmed and kept short; an unknown size is treated as small', () => { const g = createGifts(); g.add({ size: 'huge', name: '   A   very long name indeed for a sign   ' }); assert.equal(g.state.queue[0].size, 'small'); assert.equal(g.state.queue[0].name, 'A very long name i'); });

test('the largest gifts: sized by coins, a known gift gets its family\'s figure, and one not drawn yet falls back to the big moment', () => {
  assert.deepEqual(stageGift('Rose', 1), { size: 'small', figure: null }); assert.equal(stageGift('Galaxy', 1000).size, 'big'); assert.equal(stageGift('x', 150).size, 'medium');
  assert.deepEqual(stageGift('Lion', 29999), { size: 'legend', figure: 'lion', tier: 2, label: 'Lion', film: FILMS.lion }); assert.equal(stageGift('leon and lion', 34000).tier, 3); assert.equal(stageGift('Wolf', 5500).tier, 1);
  const other = stageGift('TikTok Universe', 44999); assert.equal(other.size, 'big'); assert.equal(other.family, 'cosmos'); assert.equal(stageGift('Something New', 9000).size, 'big');
  const all = Object.values(FAMILIES).flat(); assert.equal(new Set(all.map((n) => n.toLowerCase())).size, new Set(all).size - 1, 'no gift is in two families (one name is listed in two spellings)'); for (const f of DRAWN) assert.ok(FIGURES[f], f); });

test('a figure is prepared as segments that cover the whole drawing in order, and the legend script draws it after the bolt and wakes it before the name', () => {
  const f = prepare('lion'); assert.ok(f.segs.length > 40); assert.equal(f.segs[0].from, 0); assert.ok(Math.abs(f.segs.at(-1).to - 1) < 1e-9); for (let i = 1; i < f.segs.length; i++) assert.ok(f.segs[i].from >= f.segs[i - 1].from); for (const g of f.segs) for (const p of [g.a, g.b]) assert.ok(Math.abs(p[0]) <= 1.01 && Math.abs(p[1]) <= 1.01);
  const g = createGifts(); g.add({ size: 'legend', name: 'Leo', figure: 'lion' }); run(g, 30); assert.deepEqual(g.state.fx.map((e) => e.type), ['bolt', 'draw', 'wake', 'forge', 'bolt', 'bolt', 'ascend']); assert.equal(g.state.fx[1].figure, 'lion');
  const h = createGifts(); h.add({ size: 'legend', name: 'x' }); assert.equal(h.state.queue[0].size, 'big', 'a legend with no figure is a big gift'); });

test('the bigger the gift the bigger the show: each tier runs longer and asks the sky and the pillars for more', () => { const shows = [1, 2, 3].map((tier) => { const g = createGifts(); let beats = 0; g.add({ size: 'legend', name: 'x', figure: 'lion', tier }); run(g, 60, (a) => { if (a) beats += 0.05; }); const count = (t) => g.state.fx.filter((e) => e.type === t).length; return { beats: Math.round(beats), bolts: count('bolt'), rings: count('ring'), webs: count('web'), meteors: count('meteors'), ended: count('ascend') }; });
  assert.deepEqual(shows.map((x) => x.beats), [LEGEND[1].beats, LEGEND[2].beats, LEGEND[3].beats]); assert.ok(shows[0].beats < shows[1].beats && shows[1].beats < shows[2].beats);
  assert.deepEqual(shows.map((x) => x.bolts), [3, 7, 13]); assert.deepEqual(shows.map((x) => x.meteors), [0, 1, 1]); assert.deepEqual(shows.map((x) => x.rings), [0, 0, 2]); assert.deepEqual(shows.map((x) => x.webs), [0, 0, 3]); assert.ok(shows.every((x) => x.ended === 1)); });

test('a gift whose figure is a film: the clip starts after the strike, the stage wakes on the clip\'s big moment, and the show ends just after the clip', () => { const g = createGifts(), film = { src: 'x.webm', roar: 6, seconds: 10 }; g.add({ size: 'legend', name: 'Leo', figure: 'lion', tier: 3, film }); let len = 0, wokeAt = null, filmAt = null;
  run(g, 40, (a) => { if (!a) return; len = a.t; for (const e of g.state.fx.splice(0)) { if (e.type === 'film') filmAt = a.t; if (e.type === 'wake') wokeAt = a.t; assert.notEqual(e.type, 'draw', 'no drawing in the sky when there is a film'); } });
  assert.ok(Math.abs(filmAt - 2.5) < 0.06); assert.ok(Math.abs(wokeAt - 14.5) < 0.06, `woke at ${wokeAt}`); assert.equal(legendWake({ film, tier: 3 }), 14.5); assert.equal(giftBeats({ size: 'legend', film, tier: 3 }), 26); assert.ok(len > 25.5 && len <= 26.1); });

