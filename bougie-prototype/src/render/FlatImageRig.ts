import { BlurFilter, Container, Graphics, Mesh, MeshGeometry, Texture } from 'pixi.js';
import type { Params } from '../rig/params';
import { DEG, clamp, lerp, smoothstep } from '../rig/math';
import type { Box, Landmarks } from './landmarks';
import type { CharacterRenderer } from './types';

/**
 * Animates a single flattened painting by deforming a dense triangle mesh
 * laid over it, driven by the same parameters as the layered rig.
 *
 * What a mesh warp can do with one flat picture, using only its own pixels:
 *   - head turn / nod / tilt (2.5D parallax), breathing, body sway
 *   - brow raise, lower and angle
 *   - blinks: the painted upper-lid skin is slid down over the eye and the
 *     eye (lashes included) is folded into the lid line
 *   - squints and smile changes, small gaze shifts (the iris is dragged)
 *   - jaw drop: chin and lower lip move down
 *
 * What it cannot do, because those pixels were never painted:
 *   - the inside of a mouth opened wider than in the art (painted overlay here)
 *   - the far side of the face, ears or hair revealed by a large turn
 *   - real eye rotation (the iris smears if pushed far)
 *   - anything behind a hand, hair strand or accessory touching the face
 *
 * All feature maths runs in the head's own frame (rotated by the painting's
 * head tilt), so brows lift along the face, not the screen.
 */
export class FlatImageRig implements CharacterRenderer {
  readonly view = new Container();
  private mesh: Mesh<MeshGeometry>;
  private base: Float32Array;
  /** Per vertex: 1 if it belongs to the lower lip / jaw side of the seam. */
  private lowerFlags: Uint8Array;
  private overlay = new Graphics();
  private debugG = new Graphics();
  private mouthColor: number;
  private cosT: number;
  private sinT: number;
  /** Feature boxes with centres converted into the head frame. */
  private A: Record<'face' | 'eyeL' | 'eyeR' | 'browL' | 'browR' | 'mouth', Box>;
  private pinsA: Box[];
  private pivotA: { x: number; y: number };

  constructor(
    texture: Texture,
    private lm: Landmarks,
    private debug = false,
  ) {
    const t = (lm.tilt ?? 0) * DEG;
    this.cosT = Math.cos(t);
    this.sinT = Math.sin(t);
    const conv = (b: Box): Box => {
      const [x, y] = this.toA(b.cx, b.cy);
      return { cx: x, cy: y, w: b.w, h: b.h };
    };
    this.A = {
      face: conv(lm.face),
      eyeL: conv(lm.eyeL),
      eyeR: conv(lm.eyeR),
      browL: conv(lm.browL),
      browR: conv(lm.browR),
      mouth: conv(lm.mouth),
    };
    this.pinsA = (lm.pins ?? []).map(conv);
    this.pivotA = { x: this.A.face.cx, y: this.A.face.cy + (lm.neckY - lm.face.cy) };

    const { geometry, lowerFlags } = this.buildGrid(texture.width, texture.height);
    this.lowerFlags = lowerFlags;
    this.mesh = new Mesh({ geometry, texture });
    this.base = new Float32Array(geometry.positions);
    // The rotated grid overhangs the picture; clip to the picture itself.
    const clip = new Graphics().rect(0, 0, lm.imageWidth, lm.imageHeight).fill(0xffffff);
    this.mesh.mask = clip;
    // Soften the painted mouth interior so it sits in painterly art.
    this.overlay.filters = [new BlurFilter({ strength: Math.max(1, lm.mouth.h * 0.18), quality: 2 })];
    this.view.addChild(clip, this.mesh, this.overlay, this.debugG);
    this.mouthColor = lm.mouthColor ? parseInt(lm.mouthColor.replace('#', ''), 16) : 0x47181a;
  }

  // ------------------------------------------------------------ frames
  /** Image -> head frame (undo the painting's head tilt around the face centre). */
  private toA(x: number, y: number): [number, number] {
    const f = this.lm.face;
    const dx = x - f.cx;
    const dy = y - f.cy;
    return [f.cx + dx * this.cosT + dy * this.sinT, f.cy - dx * this.sinT + dy * this.cosT];
  }

  /** Head frame -> image. */
  private fromA(x: number, y: number): [number, number] {
    const f = this.lm.face;
    const dx = x - f.cx;
    const dy = y - f.cy;
    return [f.cx + dx * this.cosT - dy * this.sinT, f.cy + dx * this.sinT + dy * this.cosT];
  }

  /** Seam offset from a straight line at head-frame x: the lip line's smile curve. */
  private seamOffset(x: number): number {
    const m = this.A.mouth;
    const nx = (x - m.cx) / m.w;
    return -(this.lm.mouthCurve ?? 0) * Math.min(nx * nx, 1.69);
  }

  /**
   * Grid laid out in the head frame, with extra rows exactly on the lid lines
   * and on both sides of the lip seam so those can fold and split cleanly.
   */
  private buildGrid(w: number, h: number): { geometry: MeshGeometry; lowerFlags: Uint8Array } {
    const corners = [this.toA(0, 0), this.toA(w, 0), this.toA(0, h), this.toA(w, h)];
    const minX = Math.min(...corners.map((c) => c[0]));
    const maxX = Math.max(...corners.map((c) => c[0]));
    const minY = Math.min(...corners.map((c) => c[1]));
    const maxY = Math.max(...corners.map((c) => c[1]));
    const step = clamp(Math.min(this.A.eyeL.h, this.A.eyeR.h) * 0.5, 2.5, Math.max(w, h) / 120);

    const special: number[] = [];
    for (const e of [this.A.eyeL, this.A.eyeR]) {
      special.push(e.cy - e.h * 2.6, e.cy - e.h, e.cy, e.cy + e.h * 0.55, e.cy + e.h);
    }
    special.push(this.A.mouth.cy - 0.5, this.A.mouth.cy + 0.5);
    const ys: number[] = [];
    for (let y = minY; y <= maxY + step; y += step) {
      if (special.every((s) => Math.abs(s - y) > step * 0.3)) ys.push(y);
    }
    ys.push(...special);
    ys.sort((a, b) => a - b);
    const xs: number[] = [];
    for (let x = minX; x <= maxX + step; x += step) xs.push(x);

    const cols = xs.length;
    const rows = ys.length;
    const positions = new Float32Array(cols * rows * 2);
    const uvs = new Float32Array(cols * rows * 2);
    const lowerFlags = new Uint8Array(cols * rows);
    const m = this.A.mouth;
    let k = 0;
    for (let r = 0; r < rows; r++) {
      // Rows near the mouth bend to follow the curved lip seam.
      const bend = Math.exp(-(((ys[r] - m.cy) / (m.h * 4)) ** 2));
      for (let c = 0; c < cols; c++) {
        lowerFlags[k / 2] = ys[r] > m.cy ? 1 : 0;
        const [x, y] = this.fromA(xs[c], ys[r] + this.seamOffset(xs[c]) * bend);
        positions[k] = x;
        positions[k + 1] = y;
        uvs[k] = x / w;
        uvs[k + 1] = y / h;
        k += 2;
      }
    }
    // Keep only cells that touch the picture.
    const inside = (i: number) => {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      return x > -step * 2 && x < w + step * 2 && y > -step * 2 && y < h + step * 2;
    };
    const idx: number[] = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c;
        const b = a + 1;
        const d = a + cols;
        const e = d + 1;
        if (inside(a) || inside(b) || inside(d) || inside(e)) idx.push(a, b, d, b, e, d);
      }
    }
    return { geometry: new MeshGeometry({ positions, uvs, indices: new Uint32Array(idx) }), lowerFlags };
  }

  // ------------------------------------------------------------ deformation
  /** Feature-level displacement in the head frame. */
  private local(x: number, y: number, p: Params, lowerJaw: boolean): [number, number] {
    const A = this.A;
    let dx = 0;
    let dy = 0;

    // Brows: raise / lower with angle, smooth falloff into the forehead.
    for (const [b, raise, angle, eye] of [
      [A.browL, p.browLY, p.browLAngle, A.eyeL],
      [A.browR, p.browRY, p.browRAngle, A.eyeR],
    ] as [Box, number, number, Box][]) {
      const f = gauss2(x, y, b.cx, b.cy, b.w * 1.15, b.h * 3.2);
      if (f < 1e-3) continue;
      // -1 at the inner end (toward the nose), +1 at the outer end.
      const towardOuter = Math.sign(b.cx - A.face.cx) || 1;
      const along = clamp(((x - b.cx) / b.w) * towardOuter, -1, 1);
      const unit = Math.max(b.h * 2.2, eye.h * 0.9);
      const lift = (raise >= 0 ? raise : raise * 0.6) * unit;
      const tilt = angle * unit * 0.5 * -along;
      dy -= (lift + tilt) * f;
    }

    // Eyes.
    for (const [e, open, smile] of [
      [A.eyeL, p.eyeLOpen, p.eyeLSmile],
      [A.eyeR, p.eyeROpen, p.eyeRSmile],
    ] as [Box, number, number][]) {
      const hx = 1 - smoothstep((Math.abs(x - e.cx) - e.w * 0.85) / (e.w * 0.6));
      if (hx > 0) {
        dy += this.lidShift(y, e, open) * hx;
        // Squint: lower lid and cheek push up.
        const below = gauss2(x, y, e.cx, e.cy + e.h * 1.3, e.w * 0.9, e.h * 1.2);
        dy -= smile * e.h * 0.45 * below;
      }
      // Gaze drags the iris; small amounts only, it's the painted eye being moved.
      const inEye = gauss2(x, y, e.cx, e.cy, e.w * 0.5, e.h * 0.75);
      dx += p.eyeBallX * e.w * 0.16 * inEye;
      dy -= p.eyeBallY * e.h * 0.2 * inEye;
    }

    // Mouth, in coordinates where the curved seam is straightened out.
    const m = A.mouth;
    const nx = (x - m.cx) / m.w;
    y = y - this.seamOffset(x);
    const fm = gauss2(x, y, m.cx, m.cy, m.w * 1.4, m.h * 3);
    dx += (x - m.cx) * (p.mouthWide * 0.12 - p.mouthRound * 0.25) * fm;
    for (const s of [-1, 1]) {
      const fc = gauss2(x, y, m.cx + s * m.w, m.cy, m.w * 0.45, m.h * 2.4);
      // mouthSmirk + lifts the character's left corner (viewer's right, +x in the head frame).
      const sk = s > 0 ? Math.max(0, p.mouthSmirk) : Math.max(0, -p.mouthSmirk);
      dy -= (p.mouthForm * 0.8 + sk) * m.h * fc;
      dx += s * (Math.max(0, p.mouthForm) * 0.06 + sk * 0.08) * m.w * fc;
    }
    const open = this.jawOpen(p);
    const press = clamp(p.mouthPress, 0, 1);
    if (open > 0.001 || press > 0.001) {
      const f = A.face;
      const chinY = f.cy + f.h;
      const width = clamp(1 - Math.abs((x - f.cx) / (f.w * 0.95)) ** 2, 0, 1);
      const drop = open * m.h * 3.4;
      if (lowerJaw) {
        const fall = 1 - smoothstep((y - chinY) / (f.h * 0.35));
        const lip = Math.max(0, 1 - nx * nx) ** 0.6;
        const nearSeam = 1 - smoothstep((y - m.cy) / (m.h * 3));
        dy += drop * width * fall * lerp(1, lip, nearSeam);
        // Lips pressed: the lower lip rolls up a touch.
        dy -= press * m.h * 0.35 * gauss2(x, y, m.cx, m.cy + m.h, m.w, m.h * 1.5);
      } else {
        const up = gauss2(x, y, m.cx, m.cy - m.h * 0.5, m.w * 0.9, m.h * 1.6);
        dy -= open * m.h * 0.5 * up * Math.max(0, 1 - nx * nx);
        dy += press * m.h * 0.35 * gauss2(x, y, m.cx, m.cy - m.h, m.w, m.h * 1.5);
      }
    }
    return [dx, dy];
  }

  private jawOpen(p: Params): number {
    return clamp(p.mouthOpen, 0, 1) * (1 - p.mouthPress) * (this.lm.jawScale ?? 1);
  }

  /**
   * Vertical lid displacement for a point in an eye's column.
   * Closing: the band of lid skin above the eye stretches down to the closed
   * lid line, and the eye opening (lashes included) is folded into the strip
   * between that line and the lower lid. Opening wide does the reverse.
   */
  private lidShift(y: number, e: Box, open: number): number {
    const top = e.cy - e.h;
    const bottom = e.cy + e.h;
    const a = e.cy - e.h * 2.6;
    const closedLine = e.cy + e.h * 0.55;
    const c = clamp(1 - open, 0, 1);
    const wide = clamp(open - 1, 0, 0.4);
    const edge = lerp(top, closedLine, c) - wide * e.h * 0.9;
    if (y <= a || y >= bottom) return 0;
    if (y <= top) return a + ((y - a) * (edge - a)) / (top - a) - y;
    return edge + ((y - top) * (bottom - edge)) / (bottom - top) - y;
  }

  private pinWeight(x: number, y: number): number {
    let w = 1;
    for (const b of this.pinsA) {
      const r = Math.hypot((x - b.cx) / b.w, (y - b.cy) / b.h);
      w *= smoothstep((r - 0.85) / 0.45);
    }
    return w;
  }

  /** Full warp of one image-space point. */
  private warp(x: number, y: number, p: Params, lowerJaw?: boolean): [number, number] {
    const lm = this.lm;
    const f = this.A.face;
    const [ax, ay] = this.toA(x, y);
    const jaw = lowerJaw ?? ay > this.A.mouth.cy + this.seamOffset(ax);
    const [ldx, ldy] = this.local(ax, ay, p, jaw);
    let hx = ax + ldx;
    let hy = ay + ldy;

    // How much this point belongs to the head (vs. the body below the neck).
    const headW = 1 - smoothstep((ay - (this.pivotA.y - f.h * 0.15)) / (f.h * 0.45));
    if (headW > 0) {
      const lx = (ax - f.cx) / (f.w * 1.15);
      const ly = (ay - f.cy) / (f.h * 1.1);
      const zz = 1 - lx * lx - ly * ly;
      // Face surface bulges toward the viewer; hair beyond it sits at the back.
      const z = zz > 0 ? Math.sqrt(zz) * f.w * 0.9 : -Math.min(1, Math.sqrt(-zz)) * f.w * 0.25;
      const ts = lm.turnScale ?? 1;
      const a = clamp(p.angleX * ts, -14, 14) * DEG;
      const b = clamp(p.angleY * ts, -12, 12) * DEG;
      hx += z * Math.sin(a) * headW;
      hy -= z * Math.sin(b) * headW;
      // Roll about the neck.
      const r = (p.angleZ + p.bodyAngleX * 0.3) * DEG * headW;
      const cr = Math.cos(r);
      const sr = Math.sin(r);
      const px = this.pivotA.x;
      const py = this.pivotA.y;
      const rx = px + (hx - px) * cr - (hy - py) * sr;
      const ry = py + (hx - px) * sr + (hy - py) * cr;
      hx = rx;
      hy = ry;
    }
    let [ix, iy] = this.fromA(hx, hy);

    // Body: breathing lift and a gentle sway pivoting at the bottom of the frame.
    const sway = p.bodyAngleX * DEG * 0.4;
    ix += Math.sin(sway) * (lm.imageHeight - y) * 0.3;
    iy -= p.breath * Math.max(1.5, lm.imageHeight * 0.004);

    // Pins hold still; the picture border stays put so its edges never skew.
    const m = Math.min(lm.imageWidth, lm.imageHeight) * 0.06;
    const edge = smoothstep(Math.min(x, lm.imageWidth - x, y, lm.imageHeight - y) / m);
    const k = edge * this.pinWeight(ax, ay);
    return [x + (ix - x) * k, y + (iy - y) * k];
  }

  // ------------------------------------------------------------ frame update
  update(p: Params) {
    const pos = this.mesh.geometry.positions;
    const base = this.base;
    for (let i = 0; i < base.length; i += 2) {
      const [x, y] = this.warp(base[i], base[i + 1], p, this.lowerFlags[i / 2] === 1);
      pos[i] = x;
      pos[i + 1] = y;
    }
    this.mesh.geometry.getBuffer('aPosition').update();
    this.drawOverlays(p);
  }

  private drawOverlays(p: Params) {
    const g = this.overlay;
    g.clear();
    this.debugG.clear();

    // Mouth interior between the separated lips: the only painted-in part.
    const m = this.A.mouth;
    if (this.jawOpen(p) > 0.03) {
      const N = 16;
      const up: number[] = [];
      const lo: number[] = [];
      const hw = m.w * 0.9;
      for (let i = 0; i <= N; i++) {
        const ax = m.cx - hw + 2 * hw * u(i, N);
        const sy = m.cy + this.seamOffset(ax);
        const [x0, y0] = this.fromA(ax, sy - 0.5);
        const [x1, y1] = this.fromA(ax, sy + 0.5);
        const [ux, uy] = this.warp(x0, y0, p, false);
        const [bx, by] = this.warp(x1, y1, p, true);
        up.push(ux, uy);
        lo.push(bx, by);
      }
      const shape = [...up];
      for (let i = lo.length - 2; i >= 0; i -= 2) shape.push(lo[i], lo[i + 1]);
      g.poly(shape, true).fill(this.mouthColor);
      const mid = N;
      const ux = up[mid];
      const uy = up[mid + 1];
      const bx = lo[mid];
      const by = lo[mid + 1];
      const gap = Math.hypot(bx - ux, by - uy);
      // Tongue low in the mouth, lifting for L/T/D/N/TH.
      if (gap > m.h * 0.6) {
        const t = 0.25 + p.mouthTongue * 0.35;
        g.ellipse(lerp(bx, ux, t), lerp(by, uy, t), m.w * 0.42, gap * 0.22).fill({ color: 0xa8505a, alpha: 0.85 });
      }
      if (this.lm.paintTeeth ?? true) {
        const th = Math.min(gap * 0.4, m.h * (0.6 + p.mouthTeeth * 0.3));
        g.ellipse(ux, uy + th * 0.5, m.w * 0.55, th * 0.6).fill({ color: 0xeee6dc, alpha: 0.92 });
      }
    }

    if (this.debug) {
      const d = this.debugG;
      const w = this.mesh.geometry.positions;
      for (let i = 0; i < w.length; i += 2 * 5) d.circle(w[i], w[i + 1], 0.8).fill({ color: 0x00ffcc, alpha: 0.5 });
    }
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}

const u = (i: number, n: number) => i / n;

function gauss2(x: number, y: number, cx: number, cy: number, sx: number, sy: number) {
  const a = (x - cx) / sx;
  const b = (y - cy) / sy;
  const d = a * a + b * b;
  return d > 9 ? 0 : Math.exp(-d);
}
