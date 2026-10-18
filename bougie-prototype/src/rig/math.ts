export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
export const DEG = Math.PI / 180;

/**
 * Critically damped spring (Unity's SmoothDamp formulation).
 * Gives organic ease-in/ease-out toward a moving target without overshoot,
 * which is what keeps expression changes from snapping.
 */
export class Spring {
  value: number;
  velocity = 0;
  constructor(initial: number, public smoothTime: number) {
    this.value = initial;
  }
  update(target: number, dt: number, smoothTime = this.smoothTime): number {
    const st = Math.max(0.0001, smoothTime);
    const omega = 2 / st;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = this.value - target;
    const temp = (this.velocity + omega * change) * dt;
    this.velocity = (this.velocity - omega * temp) * exp;
    this.value = target + (change + temp) * exp;
    return this.value;
  }
  reset(v: number) {
    this.value = v;
    this.velocity = 0;
  }
}

/** Smooth 1D value noise in roughly -1..1, used for organic idle drift. */
export class Noise1D {
  private table: number[] = [];
  constructor(seed = 1) {
    let s = seed * 9301 + 49297;
    for (let i = 0; i < 256; i++) {
      s = (s * 9301 + 49297) % 233280;
      this.table.push((s / 233280) * 2 - 1);
    }
  }
  sample(t: number): number {
    const i = Math.floor(t);
    const f = t - i;
    const a = this.table[i & 255];
    const b = this.table[(i + 1) & 255];
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  }
  /** Two octaves for a less regular wander. */
  fbm(t: number): number {
    return this.sample(t) * 0.7 + this.sample(t * 2.3 + 17) * 0.3;
  }
}

/** Seedable PRNG so Reset reproduces the same blink/saccade pattern. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
