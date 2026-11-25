// Gift moments (ZW-045): what the stage does when someone sends a gift. No drawing happens here, and nothing here knows about TikTok:
// a gift is handed in by add(), from a test button today and from TikFinity later. This file is the script of each moment; giftfx.js draws it.
//   const gifts = createGifts(12);   gifts.add({ size: 'small' | 'medium' | 'big', name });
//   gifts.update(dBeats, dSeconds, onBeat, onBar)  ->  the gift now playing, or null
//   gifts.lights(out)        out[0..n-1] each pillar's light, out[n] the temple's roof and steps, out[n+1] the bulbs
//   gifts.state.fx           things for the picture to do, in order, each once: the drawing code takes them off the list
//                            { type: 'bolt', pillar (-1 is the temple's peak), power } | { type: 'arc', from, to } | { type: 'forge' } | { type: 'name' }
//   gifts.state.flames       seconds each pillar's flame has left to burn (0 is out)
//
// The idea. A gift is a small piece of theatre with a wait and a pay-off, and it leaves something behind.
//   small   4 beats   lightning reaches down and strikes one pillar; a flame is lit on its top and stays
//   medium  8 beats   lightning strikes the end pillar and leaps from pillar to pillar along the whole row; three flames stay
//   big    16 beats   two beats of black while a storm gathers, then a great bolt on the temple's peak; the pillars catch from the
//                     middle outwards; the name is forged across the temple front; gold rains; two more strikes; then it burns away
// Flames burn for two and a half minutes. They are what small gifts add up to: when all twelve are alight at once, the temple
// answers on its own with the big moment ("OLYMPUS AWAKENS") and the flames start again. So every gift, however small, moves it on.
export const GIFT_BEATS = { small: 4, medium: 8, big: 16, legend: 24 }, FLAME_SECONDS = 150, AWAKEN = 'OLYMPUS AWAKENS';
const ORDER = [2, 9, 5, 7, 0, 11, 4, 6, 1, 10, 3, 8];   // which pillar a flame goes to next: spread about, never a neat row
export function createGifts(n = 12) { const st = { active: null, queue: [], served: 0, flames: new Array(n).fill(0), fx: [], awakenings: 0 };
  const add = ({ size = 'small', name = '', figure = null } = {}) => { if (!GIFT_BEATS[size]) size = 'small'; if (size === 'legend' && !figure) size = 'big'; st.queue.push({ size, figure, name: String(name).replace(/\s+/g, ' ').trim().slice(0, 18) }); return st.queue.length; };
  const unlit = (skip = []) => ORDER.find((i) => i < n && st.flames[i] <= 0 && !skip.includes(i)) ?? ORDER.find((i) => i < n && !skip.includes(i));
  function update(dBeats, dSeconds, onBeat, onBar) { const a = st.active;
    if (!(a && (a.size === 'big' || a.size === 'legend'))) for (let i = 0; i < n; i++) st.flames[i] = Math.max(0, st.flames[i] - dSeconds);   // the flames hold still while the big moment plays
    if (a) { const was = a.t; a.t += dBeats; const at = (x) => was < x && a.t >= x;
      if (a.size === 'small') { if (at(0.25)) { st.fx.push({ type: 'bolt', pillar: a.pillar, power: 1 }, { type: 'name' }); st.flames[a.pillar] = FLAME_SECONDS; } }
      else if (a.size === 'medium') { const first = a.dir > 0 ? 0 : n - 1; if (at(0.5)) st.fx.push({ type: 'bolt', pillar: first, power: 1.5 });
        for (let k = 1; k < n; k++) if (at(0.5 + k / 3)) st.fx.push({ type: 'arc', from: first + a.dir * (k - 1), to: first + a.dir * k });
        if (at(4.5)) { st.fx.push({ type: 'name' }); for (const i of a.keep) st.flames[i] = FLAME_SECONDS; } }
      // the largest gifts: the storm and the bolt as for a big one, then the lightning climbs back into the sky and draws the gift's
      // figure there as a constellation (beats 2.5 to 7), which wakes (7), and the name is forged beneath it
      else if (a.size === 'legend') { if (at(2)) st.fx.push({ type: 'bolt', pillar: -1, power: 3 }); if (at(2.5)) st.fx.push({ type: 'draw', figure: a.figure }); if (at(7)) st.fx.push({ type: 'wake' }); if (at(8)) st.fx.push({ type: 'forge' }); if (at(13)) st.fx.push({ type: 'bolt', pillar: 1, power: 1.3 }); if (at(17)) st.fx.push({ type: 'bolt', pillar: n - 2, power: 1.3 }); }
      else { if (at(2)) st.fx.push({ type: 'bolt', pillar: -1, power: 3 }); if (at(3)) st.fx.push({ type: 'forge' }); if (at(6)) st.fx.push({ type: 'bolt', pillar: 1, power: 1.3 }); if (at(10)) st.fx.push({ type: 'bolt', pillar: n - 2, power: 1.3 }); }
      if (a.t >= GIFT_BEATS[a.size]) { if (a.awaken) st.flames.fill(0); st.active = null; } }
    // every flame alight and nothing playing or waiting: the temple answers by itself
    if (!st.active && !st.queue.length && st.flames.every((f) => f > 0)) { st.queue.push({ size: 'big', name: AWAKEN, awaken: true }); st.awakenings++; }
    if (!st.active && st.queue.length && (st.queue[0].size === 'big' || st.queue[0].size === 'legend' ? onBar : onBeat)) { const g = st.queue.shift(), p = unlit(), p2 = unlit([p]), p3 = unlit([p, p2]);
      st.active = { ...g, t: 0, pillar: p, keep: [p, p2, p3], dir: st.served % 2 ? -1 : 1 }; st.served++; }
    return st.active; }
  function lights(out = []) { for (let i = 0; i <= n + 1; i++) out[i] = 0; const a = st.active; if (!a) return out; const t = a.t, fr = t - Math.floor(t), len = GIFT_BEATS[a.size], fade = Math.min(1, (len - t) * 2);
    if (a.size === 'small') { if (t >= 0.25 && t < 2.5) out[a.pillar] = t < 0.9 ? 1 : (t * 4) % 1 < 0.6 ? 0.9 : 0.3; }
    else if (a.size === 'medium') { const first = a.dir > 0 ? 0 : n - 1;
      if (t >= 4.5) { for (let i = 0; i < n; i++) out[i] = (fr < 0.5 ? 1 : 0.6) * fade; out[n] = 0.7 * fade; }
      else if (t >= 0.5) { const head = Math.min(n - 1, Math.floor((t - 0.5) * 3)); for (let k = 0; k <= head; k++) out[first + a.dir * k] = k === head ? 1 : 0.55; } }
    else if (t >= 2.25) { const mid = (n - 1) / 2; for (let i = 0; i < n; i++) if (t >= 2.25 + Math.abs(i - mid) / mid) out[i] = (fr < 0.5 ? 1 : 0.75) * fade;   // the bolt is sent at beat 2 and lands a quarter of a beat later; then the pillars catch from the middle outwards, over one beat
      if (t >= 2.5) out[n] = fade; if (t >= 2.75) out[n + 1] = (fr < 0.5 ? 1 : 0.4) * fade; }
    return out; }
  return { state: st, add, update, lights, n };
}
