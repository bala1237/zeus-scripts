// Gift moments (ZW-045): what the stage does when someone sends a gift. No drawing happens here, and nothing here knows about TikTok:
// a gift is handed in by add(), from a test button today and from TikFinity later.
//   const gifts = createGifts();   gifts.add({ size: 'small' | 'medium' | 'big', name });
//   gifts.update(dBeats, onBeat, onBar)  ->  the gift now playing, or null.   dBeats: beats gone by since the last call;
//                                            onBeat / onBar: whether a beat / a bar of four began on this call
//   gifts.lights(n, out)  fills out[0..n-1] with each pillar's light, out[n] the temple's roof and steps, out[n+1] the bulbs
//   gifts.state: active { size, name, t (beats into the moment), pillar }, queue, strikes (a count that rises each time lightning should fall)
// Gifts wait their turn and start on the beat (the big one on the bar), so no gift cuts another short and each lands in time.
//   small   4 beats   lightning strikes one pillar, which blinks and dies away; the sender's name on the booth
//   medium  8 beats   a run of light along all the pillars and back, then two flashes of the whole row
//   big    16 beats   a beat of black, then lightning on three pillars, every pillar and bulb lit, and the big pattern of the lasers
export const GIFT_BEATS = { small: 4, medium: 8, big: 16 };
export function createGifts() { const st = { active: null, queue: [], strikes: 0, served: 0 }; let lastWhole = -1;
  const add = ({ size = 'small', name = '' } = {}) => { if (!GIFT_BEATS[size]) size = 'small'; st.queue.push({ size, name: String(name).replace(/\s+/g, ' ').trim().slice(0, 18) }); return st.queue.length; };
  function update(dBeats, onBeat, onBar) { const a = st.active;
    if (a) { a.t += dBeats; if (a.t >= GIFT_BEATS[a.size]) { st.active = null; lastWhole = -1; } else { const w = Math.floor(a.t);
      // lightning: at the start of a small gift; for a big one after its beat of black and then every four beats
      if (w !== lastWhole) { lastWhole = w; if (a.size === 'small' ? w === 0 : a.size === 'big' && w >= 1 && (w - 1) % 4 === 0) st.strikes++; } } }
    if (!st.active && st.queue.length && (st.queue[0].size === 'big' ? onBar : onBeat)) { const g = st.queue.shift(); st.active = { ...g, t: 0, pillar: (st.served * 5 + 2) % 12 }; st.served++; lastWhole = -1; if (g.size === 'small') { st.strikes++; lastWhole = 0; } }
    return st.active; }
  function lights(n, out = []) { for (let i = 0; i <= n + 1; i++) out[i] = 0; const a = st.active; if (!a) return out; const t = a.t, fr = t - Math.floor(t);
    if (a.size === 'small') { if (t < 2 && (t < 0.5 || (t * 4) % 1 < 0.5)) out[a.pillar % n] = 1; }
    else if (a.size === 'medium') { const s = Math.floor(t * 4), run = 2 * n - 2; if (s <= run) out[s < n ? s : run - s] = 1; else if (t >= 6 && fr < 0.5) { for (let i = 0; i < n; i++) out[i] = 1; out[n] = 1; } }
    else if (t >= 1) { for (let i = 0; i < n; i++) out[i] = 1; out[n] = 1; out[n + 1] = fr < 0.5 ? 1 : 0.35; }
    return out; }
  return { state: st, add, update, lights };
}
