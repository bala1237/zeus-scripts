import type { Word } from './dialogue';

/**
 * Mouth poses for lip sync. Each viseme is a target for the mouth parameters
 * rather than a swapped drawing, so poses blend continuously (coarticulation)
 * instead of flapping between fixed mouth images.
 */
export interface MouthPose {
  open: number;
  wide: number;
  round: number;
  press: number;
  tuck: number;
  tongue: number;
  teeth: number;
}

const pose = (p: Partial<MouthPose>): MouthPose => ({
  open: 0,
  wide: 0,
  round: 0,
  press: 0,
  tuck: 0,
  tongue: 0,
  teeth: 0,
  ...p,
});

export const REST = pose({});

/** ARPAbet phoneme -> mouth pose. Grouped roughly by the Preston Blair / Disney viseme set. */
const PHONEME_POSE: Record<string, MouthPose> = {
  // open vowels
  AA: pose({ open: 0.85, wide: 0.25 }),
  AE: pose({ open: 0.7, wide: 0.55, teeth: 0.3 }),
  AH: pose({ open: 0.6, wide: 0.2 }),
  AO: pose({ open: 0.7, round: 0.55 }),
  // mid / front vowels
  EH: pose({ open: 0.45, wide: 0.6, teeth: 0.3 }),
  ER: pose({ open: 0.3, round: 0.45 }),
  IH: pose({ open: 0.32, wide: 0.6, teeth: 0.4 }),
  IY: pose({ open: 0.22, wide: 0.9, teeth: 0.6 }),
  // rounded
  UH: pose({ open: 0.3, round: 0.7 }),
  UW: pose({ open: 0.2, round: 1 }),
  OW: pose({ open: 0.5, round: 0.85 }),
  W: pose({ open: 0.12, round: 1 }),
  R: pose({ open: 0.2, round: 0.55 }),
  Y: pose({ open: 0.2, wide: 0.7, teeth: 0.4 }),
  // closed lips
  M: pose({ press: 1 }),
  B: pose({ press: 1 }),
  P: pose({ press: 1 }),
  // lip-teeth
  F: pose({ open: 0.08, tuck: 1, teeth: 0.8 }),
  V: pose({ open: 0.08, tuck: 1, teeth: 0.8 }),
  // tongue
  TH: pose({ open: 0.2, tongue: 1, teeth: 0.5 }),
  DH: pose({ open: 0.2, tongue: 1, teeth: 0.5 }),
  L: pose({ open: 0.35, tongue: 0.9 }),
  T: pose({ open: 0.2, tongue: 0.6, teeth: 0.6 }),
  D: pose({ open: 0.22, tongue: 0.6, teeth: 0.5 }),
  N: pose({ open: 0.2, tongue: 0.6, teeth: 0.4 }),
  // sibilants
  S: pose({ open: 0.1, wide: 0.6, teeth: 1 }),
  Z: pose({ open: 0.1, wide: 0.6, teeth: 1 }),
  SH: pose({ open: 0.15, round: 0.6, teeth: 0.9 }),
  ZH: pose({ open: 0.15, round: 0.6, teeth: 0.9 }),
  CH: pose({ open: 0.15, round: 0.5, teeth: 0.9 }),
  JH: pose({ open: 0.15, round: 0.5, teeth: 0.9 }),
  // back consonants: the jaw carries over from neighbours
  K: pose({ open: 0.3, teeth: 0.3 }),
  G: pose({ open: 0.3, teeth: 0.3 }),
  NG: pose({ open: 0.28, teeth: 0.3 }),
  HH: pose({ open: 0.4 }),
};

/** Diphthongs split into their two targets so the mouth actually travels. */
const DIPHTHONGS: Record<string, [string, string]> = {
  AY: ['AA', 'IY'],
  EY: ['EH', 'IY'],
  OY: ['AO', 'IY'],
  AW: ['AA', 'UW'],
};

/** Relative duration weight: vowels hold longer, stops are brief. */
const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'EH', 'ER', 'IH', 'IY', 'UH', 'UW', 'OW']);
const STOPS = new Set(['P', 'B', 'T', 'D', 'K', 'G']);
function weightOf(ph: string): number {
  if (VOWELS.has(ph)) return 1.7;
  if (STOPS.has(ph)) return 0.75;
  return 1;
}

interface Segment {
  ph: string;
  start: number;
  end: number;
  pose: MouthPose;
}

export class VisemeTrack {
  readonly segments: Segment[] = [];

  constructor(words: Word[]) {
    for (const w of words) {
      const phs: string[] = [];
      for (const p of w.phonemes) {
        const d = DIPHTHONGS[p];
        if (d) phs.push(...d);
        else phs.push(p);
      }
      const weights = phs.map(weightOf);
      const total = weights.reduce((a, b) => a + b, 0);
      let t = w.start;
      phs.forEach((ph, i) => {
        const dur = ((w.end - w.start) * weights[i]) / total;
        this.segments.push({ ph, start: t, end: t + dur, pose: PHONEME_POSE[ph] ?? REST });
        t += dur;
      });
    }
  }

  /**
   * Coarticulated mouth pose at time t: a Gaussian-weighted blend of nearby
   * phonemes, with lip closures (M/B/P) and F/V tucks taking priority so they
   * fully close even when they're short. Silence pulls toward rest.
   */
  sample(t: number): MouthPose {
    const out = pose({});
    let wsum = 0;
    let press = 0;
    let tuck = 0;
    for (const s of this.segments) {
      const mid = (s.start + s.end) / 2;
      const half = (s.end - s.start) / 2;
      const sigma = Math.max(0.035, half * 0.9);
      const d = t - mid;
      if (Math.abs(d) > sigma * 4) continue;
      const w = Math.exp(-(d * d) / (2 * sigma * sigma));
      wsum += w;
      out.open += s.pose.open * w;
      out.wide += s.pose.wide * w;
      out.round += s.pose.round * w;
      out.tongue += s.pose.tongue * w;
      out.teeth += s.pose.teeth * w;
      // Closures: peak strength inside the segment, quick falloff outside.
      const inside = t >= s.start - 0.02 && t <= s.end + 0.02 ? 1 : w * w;
      press = Math.max(press, s.pose.press * inside);
      tuck = Math.max(tuck, s.pose.tuck * inside);
    }
    // Blend toward rest where there's no speech (weight of "silence" = 1).
    const norm = wsum + Math.max(0, 1 - wsum);
    if (norm > 0) {
      out.open /= norm;
      out.wide /= norm;
      out.round /= norm;
      out.tongue /= norm;
      out.teeth /= norm;
    }
    out.press = press;
    out.tuck = tuck;
    out.open *= 1 - press * 0.95;
    return out;
  }

  /** Index of the word being spoken at t, or -1. */
  static wordAt(words: Word[], t: number): number {
    for (let i = 0; i < words.length; i++) if (t >= words[i].start && t < words[i].end) return i;
    return -1;
  }
}
