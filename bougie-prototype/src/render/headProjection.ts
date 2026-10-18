import { DEG } from '../rig/math';

export interface Pt {
  x: number;
  y: number;
}

/**
 * 2.5D head turn. Facial features are treated as points on the front of an
 * ellipsoid; turning and nodding rotate them in 3D and project back to 2D.
 * Features with more depth (nose, lips) travel further than the face outline
 * and the back of the hair travels the other way. This is the same idea as
 * Live2D's AngleX/AngleY keyforms, computed instead of hand-keyed.
 */
export class HeadProjection {
  private cosA = 1;
  private sinA = 0;
  private cosB = 1;
  private sinB = 0;

  constructor(
    public rx: number,
    public ry: number,
    public rz: number,
  ) {}

  /** yaw/pitch in degrees, matching Params.angleX / angleY. */
  set(yawDeg: number, pitchDeg: number) {
    const a = yawDeg * DEG;
    const b = pitchDeg * DEG;
    this.cosA = Math.cos(a);
    this.sinA = Math.sin(a);
    this.cosB = Math.cos(b);
    this.sinB = Math.sin(b);
  }

  /** Depth of the ellipsoid surface under (x, y). */
  surfaceZ(x: number, y: number): number {
    const u = 1 - (x / this.rx) ** 2 - (y / this.ry) ** 2;
    return this.rz * Math.sqrt(Math.max(0, u));
  }

  /** Project a point on the face. `bump` adds depth (nose tip, lips); `zScale` flattens toward the rim. */
  p(x: number, y: number, bump = 0, zScale = 1): Pt {
    const z = this.surfaceZ(x, y) * zScale + bump;
    return this.rotate(x, y, z);
  }

  /** Rotate an explicit 3D point (z toward the viewer). */
  rotate(x: number, y: number, z: number): Pt {
    const x1 = x * this.cosA + z * this.sinA;
    const z1 = -x * this.sinA + z * this.cosA;
    const y2 = y * this.cosB - z1 * this.sinB;
    return { x: x1, y: y2 };
  }
}

export const flat = (pts: Pt[]): number[] => {
  const out: number[] = [];
  for (const q of pts) out.push(q.x, q.y);
  return out;
};
