// Beat tracking: finds the tempo of the music and where each beat falls, and holds both through quiet parts.
// It has no browser code in it, so it is tested in node with made-up music (test/tracker.test.mjs).
//
//   const bands = makeBands(sampleRate, hop);   bands(sample, out) -> true each time a hop of samples is complete, with
//                                               out = [low, mid, high, all] loudness (mean square) over that hop
//   const tr = createTracker({ rate });         rate = hops a second (about 200)
//   tr.push(low, mid, high, all, t);            once per hop; t is the time the hop ended, in seconds
//   tr.state: bpm, period (seconds), anchor (the time of a beat), locked, conf, playing, low/mid/high (0 to 1),
//             section ('groove' or 'breakdown'), drops (a count that rises each time the bass comes back)
//
// How it works. Each band's loudness is turned into "how much did it just jump" (the onset strength). The tempo is the
// repeat distance at which the last six seconds of onset strength best match themselves; where the beats fall is the
// offset at which a row of evenly spaced ticks collects the most onset strength. Both are then held and corrected
// gently, so one odd bar does not throw them, and a part with no drums simply carries on at the tempo it had.

// Three filters (low: under 130 Hz, mid: round 1.2 kHz, high: over 5 kHz) and the plain signal, each averaged over a hop.
// Kept free of outside names: the page turns this function into text to run it on the audio thread.
export function makeBands(sr, hop) {
  const bq = (type, f, q) => { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al; let b0, b1, b2;
    if (type === 0) { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else if (type === 2) { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; };
  const f = [bq(0, 130, 0.707), bq(1, 1200, 0.6), bq(2, 5000, 0.707)], f2 = bq(0, 130, 0.707), acc = [0, 0, 0, 0]; let n = 0;   // the low band goes through its filter twice, to keep bass notes and pads out of it
  return (x, out) => {
    for (let i = 0; i < 3; i++) { const s = f[i], y = s.b0 * x + s.b1 * s.x1 + s.b2 * s.x2 - s.a1 * s.y1 - s.a2 * s.y2; s.x2 = s.x1; s.x1 = x; s.y2 = s.y1; s.y1 = y;
      if (i === 0) { const g = f2, z = g.b0 * y + g.b1 * g.x1 + g.b2 * g.x2 - g.a1 * g.y1 - g.a2 * g.y2; g.x2 = g.x1; g.x1 = y; g.y2 = g.y1; g.y1 = z; acc[0] += z * z; } else acc[i] += y * y; }
    acc[3] += x * x; if (++n < hop) return false;
    for (let i = 0; i < 4; i++) { out[i] = acc[i] / hop; acc[i] = 0; } n = 0; return true; };
}

const WEIGHT = [1, 0.5, 0.35];          // the bass counts most towards a beat, then the mids (snare), then the highs (hats)
const FLOOR = [0.03, 0.01, 0.002];      // a band weaker than this share of the whole music counts as empty
const MIN_BPM = 70, MAX_BPM = 180;      // tempos outside this are read as half or double

export function createTracker({ rate = 200 } = {}) {
  const N = 2048, on = new Float32Array(N), x = new Float32Array(1200), acf = new Float32Array(400);
  const pk = [1e-7, 1e-7, 1e-7], p1 = [0, 0, 0], p2 = [0, 0, 0], sm = [0], dt = 1 / rate;
  const st = { bpm: 0, period: 0, anchor: 0, locked: false, conf: 0, playing: false, low: 0, mid: 0, high: 0, level: 0, section: 'groove', drops: 0, t: 0 };
  const hist = [null, new Float32Array(8), new Float32Array(8)]; let hw = 0, pkAll = 1e-7, w = 0, count = 0, quiet = 9, since = 0, cand = 0, candN = 0, other = 0, otherN = 0, offN = 0, lowSlow = 0, lowLong = 0, lowFor = 0;

  function push(lo, mi, hi, all, t) { st.t = t; const E = [lo, mi, hi]; let o = 0;
    quiet = all > 1e-5 ? 0 : quiet + dt; st.playing = quiet < 1.2;
    pkAll = Math.max(pkAll * Math.exp(-dt / 12), all, 1e-7);
    // a band far quieter than the music as a whole counts as empty: otherwise the faint spill of a held note into the bass would be read at full scale
    for (let i = 0; i < 3; i++) { pk[i] = Math.max(pk[i] * Math.exp(-dt / 12), E[i], FLOOR[i] * pkAll);   // loudness is judged against the loudest of the last while, so a quiet stream is followed as well as a loud one
      // Bass: lightly smoothed, compared with the two steps before. Mids and highs: the average of the last 20 ms against the 20 ms before it,
      // because chords live there and their notes beat against each other 50 or more times a second, which must not read as hits.
      let d; if (i === 0) { sm[0] += (E[0] - sm[0]) * 0.45; const l = Math.log1p(60 * sm[0] / pk[0]); d = l - 0.5 * (p1[0] + p2[0]); p2[0] = p1[0]; p1[0] = l; }
      else { const h = hist[i]; h[hw] = E[i]; let a = 0, b = 0; for (let k = 0; k < 4; k++) { a += h[(hw - k + 8) % 8]; b += h[(hw - k + 4) % 8]; } d = Math.log1p(15 * a / pk[i]) - Math.log1p(15 * b / pk[i]); }
      if (d > 0) o += WEIGHT[i] * d; }
    hw = (hw + 1) % 8;
    if (quiet > 0.2) o = 0;
    on[w] = o; w = (w + 1) % N; count++;
    const lv = [Math.sqrt(lo / pk[0]), Math.sqrt(mi / pk[1]), Math.sqrt(hi / pk[2])], key = ['low', 'mid', 'high'];
    for (let i = 0; i < 3; i++) { const v = st.playing ? Math.min(1, lv[i]) : 0; st[key[i]] += (v - st[key[i]]) * (v > st[key[i]] ? 0.6 : 0.06); }
    st.level += ((st.playing ? Math.min(1, Math.sqrt(all) * 4) : 0) - st.level) * 0.05;
    // the bass dropping out is a breakdown; the bass coming back is a drop
    lowSlow += (Math.min(1, lv[0]) - lowSlow) * dt / 0.7; if (st.section === 'groove') lowLong += (lowSlow - lowLong) * dt / 15;
    if (!st.playing) { st.section = 'groove'; lowFor = 0; }
    else if (st.section === 'groove') { lowFor = lowSlow < 0.35 * lowLong && lowLong > 0.05 ? lowFor + dt : 0; if (lowFor > 1.5) st.section = 'breakdown'; }
    else if (lowSlow > 0.6 * lowLong) { st.section = 'groove'; st.drops++; lowFor = 0; }
    if (!st.playing) { if (quiet > 4) { st.locked = false; candN = 0; } return; }
    if (++since >= rate / 4 && count > rate * 3) { since = 0; evaluate(); } }

  const wrap = (e, T) => e - T * Math.round(e / T);
  function evaluate() { const M = Math.min(count, x.length, N); let mean = 0;
    for (let i = 0; i < M; i++) { const v = on[(w - M + i + N * 2) % N]; x[i] = v; mean += v; } mean /= M; for (let i = 0; i < M; i++) x[i] -= mean;
    let a0 = 0; for (let i = 0; i < M; i++) a0 += x[i] * x[i]; a0 /= M; if (a0 < 0.02) { st.conf = 0; return; }                // hardly any hits at all: nothing to learn from, carry on as we were
    const Lmin = Math.floor(rate * 60 / MAX_BPM), Lmax = Math.ceil(rate * 60 / MIN_BPM), top = Math.min(acf.length - 1, 2 * Lmax + 1, M - rate);
    for (let L = Lmin - 1; L <= top; L++) { let s = 0; for (let i = L; i < M; i++) s += x[i] * x[i - L]; acf[L] = s / (M - L) / a0; }
    // the best repeat distance: one that also repeats at twice the distance, leaning towards ordinary dance tempos
    // The leaning picks between candidates (half, double); the exact distance is then read from the plain match, so the leaning cannot pull it.
    const comb = (L) => acf[L] + 0.5 * (2 * L <= top ? acf[2 * L] : acf[L]), score = (L) => comb(L) * Math.exp(-0.5 * (Math.log2(60 * rate / L / 122) / 0.7) ** 2);
    let best = Lmin, bs = -9, avg = 0; for (let L = Lmin; L <= Lmax; L++) { const s = score(L); avg += acf[L]; if (s > bs) { bs = s; best = L; } } avg /= Lmax - Lmin + 1;
    while (best > Lmin && comb(best - 1) > comb(best)) best--; while (best < Lmax && comb(best + 1) > comb(best)) best++; bs = score(best);
    let Lf = best; if (best > Lmin && best < Lmax) { const l = comb(best - 1), r = comb(best + 1), den = l - 2 * comb(best) + r; if (den < 0) Lf = best + 0.5 * (l - r) / den; }
    const strength = acf[best] - avg; st.conf = Math.max(0, Math.min(1, strength * 2.5));     // it must stand out from the other distances, not merely be high
    if (strength < 0.1) return;                           // nothing rhythmic enough to learn from: carry on as we were
    const T = Lf / rate;
    if (!st.locked) { if (strength < 0.2) { candN = 0; return; }   // the first lock asks for more certainty than keeping one
      candN = Math.abs(T / cand - 1) < 0.03 ? candN + 1 : 1; cand = T; if (candN < 3) return; st.period = T; st.locked = true; otherN = 0; offN = 0; st.anchor = phase(T).tb; }
    else if (Math.abs(T / st.period - 1) < 0.04) { st.period += (T - st.period) * 0.3; otherN = 0; }
    else { const cur = Math.round(st.period * rate);       // a different tempo has to win clearly, and keep winning for a second
      otherN = Math.abs(T / other - 1) < 0.03 && bs > 1.15 * score(Math.min(Lmax, Math.max(Lmin, cur))) ? otherN + 1 : 1; other = T;
      if (otherN >= 4) { st.period = T; otherN = 0; offN = 0; st.anchor = phase(T).tb; } }
    const ph = phase(st.period), err = wrap(ph.tb - st.anchor, st.period);
    if (ph.conf > 1.6) { offN = Math.abs(err) > 0.22 * st.period ? offN + 1 : 0;
      if (offN >= 5) { st.anchor = ph.tb; offN = 0; } else st.anchor += err * 0.3; }
    st.anchor += st.period * Math.floor((st.t - st.anchor) / st.period); st.bpm = 60 / st.period; }

  // where the beats fall for a period T (seconds): the time of the latest beat, and how sure
  function phase(T) { const M = Math.min(count, x.length, N), Tf = T * rate, n = Math.ceil(Tf), sums = new Float32Array(n + 2); let best = 0, total = 0;
    for (let p = 0; p < n + 2; p++) { let s = 0; for (let k = 0; ; k++) { const i = M - 1 - p - Math.round(k * Tf); if (i < 0 || k * T > 6) break; s += x[i] * Math.exp(-k * T / 3); } sums[p] = s; if (p < n) { total += Math.max(0, s); if (s > sums[best]) best = p; } }
    let pf = best; const l = sums[(best - 1 + n) % n], r = sums[(best + 1) % n], den = l - 2 * sums[best] + r; if (den < 0) pf = best + 0.5 * (l - r) / den;
    return { tb: st.t - pf / rate, conf: sums[best] / (total / n + 1e-9) }; }

  return { state: st, push };
}
