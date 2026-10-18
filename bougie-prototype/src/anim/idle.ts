import { Noise1D, mulberry32 } from '../rig/math';

/**
 * "Alive" behaviour that runs underneath everything else: blinking, eye
 * saccades, breathing and a slow head wander. Without this layer a character
 * reads as a puppet the moment it stops talking.
 */
export class IdleLayer {
  private rand = mulberry32(7);
  private noise = new Noise1D(3);
  private time = 0;

  // Blink state
  private nextBlinkAt = 1.8;
  private blinkStart = -10;
  private blinkScale = 1;
  private queuedDouble = false;

  // Saccades
  private nextSaccadeAt = 0.8;
  gazeX = 0;
  gazeY = 0;

  reset() {
    this.rand = mulberry32(7);
    this.time = 0;
    this.nextBlinkAt = 1.8;
    this.blinkStart = -10;
    this.queuedDouble = false;
    this.nextSaccadeAt = 0.8;
    this.gazeX = 0;
    this.gazeY = 0;
  }

  /** Trigger a blink now; scale > 1 makes it slower (a deliberate, lidded blink). */
  blink(scale = 1) {
    if (this.time - this.blinkStart < 0.25 * this.blinkScale) return;
    this.blinkStart = this.time;
    this.blinkScale = scale;
    this.nextBlinkAt = this.time + 2 + this.rand() * 3.5;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;

    if (t >= this.nextBlinkAt) {
      this.blink(1);
      if (this.rand() < 0.18) this.queuedDouble = true;
    }
    if (this.queuedDouble && t - this.blinkStart > 0.32) {
      this.queuedDouble = false;
      this.blink(0.9);
    }

    if (t >= this.nextSaccadeAt) {
      // Mostly small fixational shifts around the viewer's face, occasionally a bigger look-away.
      const big = this.rand() < 0.15;
      const r = big ? 0.55 : 0.18;
      const nx = (this.rand() * 2 - 1) * r;
      const ny = (this.rand() * 2 - 1) * r * 0.6;
      if (big && this.rand() < 0.5) this.blink(1);
      this.gazeX = nx;
      this.gazeY = ny;
      this.nextSaccadeAt = t + (big ? 0.6 + this.rand() * 0.6 : 0.5 + this.rand() * 2.2);
      if (big) this.nextSaccadeAt = Math.min(this.nextSaccadeAt, t + 0.9); // return quickly
    }
  }

  /** Eyelid closure 0..1 from the current blink: fast close, short hold, slower open. */
  get blinkClosure(): number {
    const s = this.blinkScale;
    const dt = this.time - this.blinkStart;
    const close = 0.07 * s;
    const hold = 0.035 * s;
    const open = 0.14 * s;
    if (dt < 0) return 0;
    if (dt < close) return dt / close;
    if (dt < close + hold) return 1;
    if (dt < close + hold + open) {
      const u = (dt - close - hold) / open;
      return 1 - u * u * (3 - 2 * u);
    }
    return 0;
  }

  get breath(): number {
    return (Math.sin(this.time * Math.PI * 2 * 0.24) + 1) / 2;
  }

  /** Slow head wander in degrees. */
  get headX(): number {
    return this.noise.fbm(this.time * 0.35) * 3.2;
  }
  get headY(): number {
    return this.noise.fbm(this.time * 0.3 + 40) * 2.2 + (this.breath - 0.5) * 0.8;
  }
  get headZ(): number {
    return this.noise.fbm(this.time * 0.25 + 90) * 2.4;
  }
  get bodyX(): number {
    return this.noise.fbm(this.time * 0.2 + 130) * 1.5;
  }
  /** Small brow drift so the face never freezes. */
  get browDrift(): number {
    return this.noise.sample(this.time * 0.4 + 200) * 0.06;
  }
}
