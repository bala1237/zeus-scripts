import { easeInOutSine } from '../rig/math';
import type { ExpressionId } from './expressions';

/**
 * The 14.5 s acted performance, authored as keyframed channels on the same
 * clock as the word timings in speech/dialogue.ts.
 *
 *   0.0  neutral idle, looking at camera
 *   1.4  "Zeus," -> left brow shoots up (skeptical), head draws back
 *   2.0  "seriously?" -> sarcastic smirk, head tilt
 *   2.8  pause: eye roll up and across
 *   3.2  "You're asking where I've been?" -> incredulous brows, head pushes forward
 *   5.0  "I've been right here" -> confident nod on "right here"
 *   6.2  "keeping your crazy citizens" -> side glance, eyes widen on "crazy"
 *   7.9  "under control." -> settles, smug smile
 *   9.0  "Somebody has to run this place" -> sarcastic, head tilt
 *  10.6  "while you're gone." -> slow lidded look, smirk grows
 *  11.6  mischievous smile with a sly side glance
 *  13.3  ease back to neutral idle
 */

type Key = [time: number, value: number];

export type Channel =
  | ExpressionId
  | 'angleX'
  | 'angleY'
  | 'angleZ'
  | 'bodyAngleX'
  /** Directed gaze; blended over idle saccades by gazeWeight. */
  | 'gazeX'
  | 'gazeY'
  | 'gazeWeight';

export const TRACKS: Partial<Record<Channel, Key[]>> = {
  skeptical: [
    [0, 0],
    [1.3, 0],
    [1.55, 1],
    [2.1, 0.8],
    [2.7, 0.3],
    [3.1, 0],
  ],
  sarcastic: [
    [0, 0],
    [1.9, 0],
    [2.35, 0.85],
    [3.1, 0.5],
    [3.4, 0],
    [8.9, 0],
    [9.4, 0.7],
    [10.6, 0.8],
    [11.4, 1],
    [11.9, 0.3],
    [12.4, 0],
  ],
  deadpan: [
    [0, 0],
    [2.75, 0],
    [2.95, 0.5],
    [3.25, 0],
  ],
  incredulous: [
    [0, 0],
    [3.15, 0],
    [3.45, 0.9],
    [4.3, 1],
    [4.75, 0.2],
    [5.05, 0],
    [6.55, 0],
    [6.75, 0.55],
    [7.15, 0.1],
    [7.4, 0],
  ],
  smile: [
    [0, 0],
    [5.0, 0],
    [5.4, 0.45],
    [6.0, 0.5],
    [6.4, 0.2],
    [7.7, 0.15],
    [8.3, 0.75],
    [8.9, 0.55],
    [9.3, 0],
  ],
  mischief: [
    [0, 0],
    [11.4, 0],
    [11.9, 1],
    [13.0, 1],
    [13.9, 0],
  ],
  angleX: [
    [0, 0],
    [1.3, 0],
    [1.6, -4],
    [2.4, 6],
    [3.0, 9],
    [3.5, 2],
    [4.4, -3],
    [5.2, 0],
    [6.2, 3],
    [6.8, 12],
    [7.6, 8],
    [8.4, 0],
    [9.4, -6],
    [10.6, -4],
    [11.3, 2],
    [12.0, 10],
    [12.8, 4],
    [13.6, 0],
  ],
  angleY: [
    [0, 0],
    [1.3, 0],
    [1.6, 6],
    [2.2, 3],
    [2.9, 4],
    [3.4, -2],
    [4.0, -4],
    [4.6, 1],
    [5.4, 0],
    [5.6, -7],
    [5.95, 1],
    [6.3, -1],
    [8.0, 0],
    [8.4, -4],
    [9.0, 0],
    [10.8, -2],
    [11.6, -5],
    [12.5, -3],
    [13.6, 0],
  ],
  angleZ: [
    [0, 0],
    [1.3, 0],
    [1.7, -3],
    [2.4, 7],
    [3.1, 5],
    [3.6, 0],
    [4.4, -3],
    [5.2, 0],
    [7.0, 2],
    [8.5, -2],
    [9.6, 8],
    [10.8, 6],
    [11.6, -2],
    [12.2, -9],
    [13.0, -6],
    [13.8, 0],
  ],
  bodyAngleX: [
    [0, 0],
    [1.6, -2],
    [3.0, 3],
    [4.4, -2],
    [6.8, 4],
    [8.4, 0],
    [9.6, -3],
    [12.0, 4],
    [13.8, 0],
  ],
  // Eye roll during the "seriously?" pause, glance off at "crazy citizens",
  // sly side look in the mischievous beat.
  gazeX: [
    [0, 0],
    [2.6, 0],
    [2.78, 0.35],
    [2.95, 0.1],
    [3.1, -0.45],
    [3.3, 0],
    [6.6, 0],
    [6.85, 0.8],
    [7.4, 0.75],
    [7.65, 0],
    [12.0, 0],
    [12.25, -0.75],
    [12.85, -0.7],
    [13.05, 0],
  ],
  gazeY: [
    [0, 0],
    [2.6, 0],
    [2.78, 0.75],
    [2.95, 0.95],
    [3.1, 0.6],
    [3.3, 0],
    [6.6, 0],
    [6.85, 0.1],
    [7.65, 0],
  ],
  gazeWeight: [
    [0, 0],
    [2.55, 0],
    [2.65, 1],
    [3.3, 1],
    [3.45, 0],
    [6.55, 0],
    [6.65, 1],
    [7.6, 1],
    [7.75, 0],
    [11.95, 0],
    [12.05, 1],
    [13.0, 1],
    [13.2, 0],
  ],
};

/** Times (s) where the performance asks for a deliberate blink; the second value is its duration scale. */
export const SCRIPTED_BLINKS: [number, number][] = [
  [1.32, 1],
  [3.32, 1],
  [5.0, 1],
  [7.8, 1],
  [11.15, 2.2],
  [13.35, 1],
];

export function sampleTrack(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t >= t0 && t < t1) {
      const u = easeInOutSine((t - t0) / (t1 - t0));
      return v0 + (v1 - v0) * u;
    }
  }
  return last[1];
}

export function sampleChannel(ch: Channel, t: number): number {
  const keys = TRACKS[ch];
  return keys ? sampleTrack(keys, t) : 0;
}
