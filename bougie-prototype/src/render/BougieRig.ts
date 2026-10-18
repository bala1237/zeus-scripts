import { BlurFilter, Container, Graphics } from 'pixi.js';
import type { Params } from '../rig/params';
import { DEG, clamp, lerp } from '../rig/math';
import { HeadProjection, flat, type Pt } from './headProjection';
import type { CharacterRenderer } from './types';

/**
 * Layered, fully articulated stand-in for Bougie.
 *
 * Every animatable feature is its own layer, drawn from the parameter set
 * each frame. This is the structure the real Bougie artwork needs to be
 * separated into (see docs/ARTWORK_ASSESSMENT.md); once it is, the drawn
 * shapes here are replaced by textured meshes cut from that art.
 *
 * Colours live in PALETTE so the stand-in can be matched to the reference.
 */
export const PALETTE = {
  background: 0x1b1530,
  skin: 0xc98a68,
  skinShadow: 0xa86c4f,
  skinLight: 0xe0a585,
  blush: 0xe0667a,
  hair: 0x271820,
  hairLight: 0x4a2f3a,
  sclera: 0xf7f0ea,
  iris: 0x7a4a22,
  irisDark: 0x3b2210,
  pupil: 0x120a08,
  lash: 0x1a0f12,
  brow: 0x2a1a1c,
  lip: 0x9a3e50,
  lipDark: 0x6e2636,
  lipLight: 0xc0687a,
  mouth: 0x3a1218,
  teeth: 0xf4efe6,
  tongue: 0xc95a68,
  gold: 0xe2b34a,
  goldDark: 0xa87a22,
  top: 0x3c2a6e,
  topDark: 0x2a1d52,
};

const EYE = { x: 50, y: -8, w: 27, up: 17, lo: 9 };
const BROW_Y = -46;
const MOUTH_Y = 80;

export class BougieRig implements CharacterRenderer {
  readonly view = new Container();
  private body = new Container();
  private head = new Container();
  private proj = new HeadProjection(132, 162, 122);

  private gBody = new Graphics();
  private gHairBack = new Graphics();
  private gNeck = new Graphics();
  private gEars = new Graphics();
  private gFace = new Graphics();
  private gFaceShade = new Graphics();
  private gFaceMask = new Graphics();
  private gFeatures = new Graphics();
  private eyes: { mask: Graphics; inner: Graphics; over: Graphics }[] = [];
  private gMouthInner = new Graphics();
  private gMouthMask = new Graphics();
  private gLips = new Graphics();
  private gBrows = new Graphics();
  private gHairFront = new Graphics();

  // Secondary motion: earrings swing as a damped pendulum driven by head motion.
  private earAngle = [0, 0];
  private earVel = [0, 0];
  private lastHead = { x: 0, z: 0 };

  constructor() {
    this.view.addChild(this.gHairBack, this.body, this.head);
    this.body.addChild(this.gNeck, this.gBody);
    this.head.addChild(this.gEars, this.gFace, this.gFaceMask, this.gFaceShade, this.gFeatures);
    this.gFaceShade.mask = this.gFaceMask;
    this.gFaceShade.filters = [new BlurFilter({ strength: 18, quality: 3 })];
    for (let i = 0; i < 2; i++) {
      const eye = { mask: new Graphics(), inner: new Graphics(), over: new Graphics() };
      this.head.addChild(eye.mask, eye.inner, eye.over);
      eye.inner.mask = eye.mask;
      this.eyes.push(eye);
    }
    this.head.addChild(this.gMouthMask, this.gMouthInner, this.gLips, this.gBrows, this.gHairFront);
    this.gMouthInner.mask = this.gMouthMask;
    // Head rotates (roll) around the top of the neck.
    this.head.pivot.set(0, 120);
    this.head.position.set(0, 120);
  }

  update(p: Params, dt: number) {
    const pr = this.proj;
    pr.set(p.angleX, p.angleY);

    // Body: sway and breathing. The head inherits a little body sway.
    this.body.rotation = p.bodyAngleX * DEG * 0.5;
    this.body.position.y = -p.breath * 3;
    this.head.rotation = p.angleZ * DEG + p.bodyAngleX * DEG * 0.3;
    this.head.position.set(p.angleX * 0.6 + p.bodyAngleX * 1.2, 120 - p.breath * 3 - p.angleY * 0.4);
    this.gHairBack.rotation = this.head.rotation * 0.9;
    this.gHairBack.pivot.copyFrom(this.head.pivot);
    this.gHairBack.position.copyFrom(this.head.position);

    this.drawBody(p);
    this.drawHairBack(p);
    this.updateEarrings(p, dt);
    this.drawEars();
    this.drawFace(p);
    this.drawNoseAndCheeks(p);
    this.drawEye(0, -1, p.eyeROpen, p.eyeRSmile, p);
    this.drawEye(1, 1, p.eyeLOpen, p.eyeLSmile, p);
    this.drawMouth(p);
    this.drawBrows(p);
    this.drawHairFront(p);
  }

  // ---------------------------------------------------------------- body
  private drawBody(p: Params) {
    const g = this.gBody;
    g.clear();
    const lift = p.breath * 4;
    // Shoulders and a draped top with a gold-trimmed neckline.
    g.moveTo(-60, 200)
      .bezierCurveTo(-140, 215 - lift, -215, 240 - lift, -240, 330)
      .lineTo(-260, 560)
      .lineTo(260, 560)
      .lineTo(240, 330)
      .bezierCurveTo(215, 240 - lift, 140, 215 - lift, 60, 200)
      .closePath()
      .fill(PALETTE.top);
    g.moveTo(-60, 200).quadraticCurveTo(0, 320, 60, 200).closePath().fill(PALETTE.skin);
    g.moveTo(-200, 260 - lift)
      .quadraticCurveTo(-40, 300, 0, 330)
      .stroke({ width: 10, color: PALETTE.gold, cap: 'round' });
    g.moveTo(0, 330).quadraticCurveTo(70, 290, 120, 230 - lift).stroke({ width: 10, color: PALETTE.gold, cap: 'round' });
    g.moveTo(0, 330).quadraticCurveTo(70, 400, 200, 560).stroke({ width: 3, color: PALETTE.topDark, alpha: 0.6 });
    // Shoulder brooch.
    g.circle(-170, 268 - lift, 17).fill(PALETTE.gold).stroke({ width: 3, color: PALETTE.goldDark });
    g.circle(-170, 268 - lift, 7).fill(PALETTE.top);
    // Neck (in body space so the head can tilt over it).
    const n = this.gNeck;
    n.clear();
    n.moveTo(-44, 90).lineTo(-50, 230).quadraticCurveTo(0, 250, 50, 230).lineTo(44, 90).closePath().fill(PALETTE.skin);
    n.ellipse(p.angleX * 0.8, 128 + p.mouthOpen * 8, 50, 26).fill({ color: PALETTE.skinShadow, alpha: 0.75 });
  }

  // ---------------------------------------------------------------- hair
  private drawHairBack(p: Params) {
    const g = this.gHairBack;
    const pr = this.proj;
    g.clear();
    // Back volume sits behind the skull: negative depth makes it counter-shift on turns.
    const c = pr.rotate(0, -20, -70);
    g.ellipse(c.x, c.y, 150, 168).fill(PALETTE.hair);
    // High bun with a gold laurel band.
    const bun = pr.rotate(14, -178, -10);
    const sway = p.angleZ * 0.4;
    g.circle(bun.x + sway, bun.y, 60).fill(PALETTE.hair);
    g.moveTo(bun.x - 40 + sway, bun.y - 20)
      .quadraticCurveTo(bun.x + sway, bun.y - 58, bun.x + 38 + sway, bun.y - 26)
      .stroke({ width: 5, color: PALETTE.hairLight, cap: 'round', alpha: 0.8 });
    const band = pr.rotate(10, -128, 20);
    g.ellipse(band.x, band.y, 50, 12).fill(PALETTE.gold).stroke({ width: 2, color: PALETTE.goldDark });
    for (let i = -3; i <= 3; i++) {
      const lx = band.x + i * 13;
      const ly = band.y - 9 - Math.abs(i) * -1.5;
      g.ellipse(lx, ly, 5, 10).fill(PALETTE.gold);
    }
  }

  private drawHairFront(p: Params) {
    const g = this.gHairFront;
    const pr = this.proj;
    g.clear();
    // Hair cap: outer silhouette over the skull, inner edge is the hairline.
    const outer: Pt[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = lerp(-105, 105, i / 20) * DEG;
      outer.push(pr.p(Math.sin(a) * 134, -Math.cos(a) * 166 + 8, 0, 0.15));
    }
    const inner: Pt[] = [];
    const hairline: [number, number][] = [
      [118, 12],
      [112, -40],
      [92, -82],
      [50, -104],
      [0, -110],
      [-50, -104],
      [-92, -82],
      [-112, -40],
      [-118, 12],
    ];
    for (const [x, y] of hairline) inner.push(pr.p(x, y, 4, 0.8));
    g.poly(flat([...outer, ...inner]), true).fill(PALETTE.hair);

    // Side-swept fringe: starts at a side part, sweeps over the forehead and
    // tucks behind the character's right temple. Its top edge overlaps the cap.
    const b = (x: number, y: number) => pr.p(x, y, 10, 0.9);
    const f0 = b(44, -150);
    const f1 = b(-30, -150);
    const f2 = b(-110, -120);
    const f3 = b(-124, -40);
    const f4 = b(-112, -30);
    const f5 = b(-96, -62);
    const f6 = b(-50, -86);
    const f7 = b(10, -92);
    const f8 = b(48, -104);
    g.moveTo(f0.x, f0.y)
      .bezierCurveTo(f1.x, f1.y, f2.x, f2.y, f3.x, f3.y)
      .quadraticCurveTo(f4.x - 4, f4.y + 6, f4.x, f4.y)
      .bezierCurveTo(f5.x, f5.y, f6.x, f6.y, f7.x, f7.y)
      .quadraticCurveTo(f8.x - 10, f8.y - 6, f8.x, f8.y)
      .closePath()
      .fill(PALETTE.hair);
    const h0 = b(30, -128);
    const h1 = b(-50, -112);
    const h2 = b(-104, -58);
    g.moveTo(h0.x, h0.y).quadraticCurveTo(h1.x, h1.y, h2.x, h2.y).stroke({ width: 4, color: PALETTE.hairLight, cap: 'round', alpha: 0.7 });
    const k0 = b(10, -118);
    const k1 = b(-60, -100);
    const k2 = b(-96, -70);
    g.moveTo(k0.x, k0.y).quadraticCurveTo(k1.x, k1.y, k2.x, k2.y).stroke({ width: 2.5, color: PALETTE.hairLight, cap: 'round', alpha: 0.45 });
    // Sideburn wisps react a little to the head nod.
    const w = pr.p(-120, 20, 0, 0.2);
    g.moveTo(w.x, w.y - 30).quadraticCurveTo(w.x - 10, w.y + 10 + p.angleY * 0.3, w.x - 2, w.y + 30).stroke({ width: 5, color: PALETTE.hair, cap: 'round' });
  }

  // ---------------------------------------------------------------- ears + earrings
  private updateEarrings(p: Params, dt: number) {
    const vx = (p.angleX - this.lastHead.x) / Math.max(dt, 1e-3);
    const vz = (p.angleZ - this.lastHead.z) / Math.max(dt, 1e-3);
    this.lastHead = { x: p.angleX, z: p.angleZ };
    for (let i = 0; i < 2; i++) {
      // Gravity keeps the hoop pointing down while the head rolls; head velocity kicks it.
      const target = -p.angleZ * DEG;
      const acc = -60 * (this.earAngle[i] - target) - 4.5 * this.earVel[i] - (vx * 0.02 + vz * 0.05);
      this.earVel[i] += acc * dt;
      this.earAngle[i] += this.earVel[i] * dt;
      this.earAngle[i] = clamp(this.earAngle[i], -1.2, 1.2);
    }
  }

  private drawEars() {
    const g = this.gEars;
    const pr = this.proj;
    g.clear();
    for (const s of [-1, 1]) {
      const e = pr.rotate(s * 122, 8, -10);
      g.ellipse(e.x, e.y, 16, 28).fill(PALETTE.skin);
      g.ellipse(e.x + s * 3, e.y, 8, 16).fill({ color: PALETTE.skinShadow, alpha: 0.6 });
      const lobe = pr.rotate(s * 124, 34, -10);
      const a = this.earAngle[s < 0 ? 0 : 1];
      const len = 26;
      const cx = lobe.x + Math.sin(a) * len;
      const cy = lobe.y + Math.cos(a) * len;
      g.circle(cx, cy, 20).stroke({ width: 4, color: PALETTE.gold });
      g.circle(lobe.x, lobe.y + 2, 4).fill(PALETTE.gold);
    }
  }

  // ---------------------------------------------------------------- face
  private faceOutline(p: Params): Pt[] {
    const pts: Pt[] = [];
    const jaw = p.mouthOpen * 16;
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      let x = Math.sin(t) * 120;
      let y = -Math.cos(t) * 142;
      if (y > 0) {
        y *= 1.08;
        x *= 1 - 0.3 * (y / 153) ** 2;
        const k = clamp((y - 60) / 90, 0, 1);
        y += jaw * k * k;
      }
      pts.push(this.proj.p(x, y, 0, 0.35));
    }
    return pts;
  }

  private drawFace(p: Params) {
    const outline = flat(this.faceOutline(p));
    this.gFace.clear().poly(outline, true).fill(PALETTE.skin);
    this.gFaceMask.clear().poly(outline, true).fill(0xffffff);
    const g = this.gFaceShade;
    const pr = this.proj;
    g.clear();
    // Key light from the upper left: shadow along the right cheek and under the jaw.
    const side = pr.p(140, 20, 0, 0.3);
    g.ellipse(side.x, side.y, 60, 190).fill({ color: PALETTE.skinShadow, alpha: 0.4 });
    const jaw = pr.p(0, 175 + p.mouthOpen * 14, 0, 0.3);
    g.ellipse(jaw.x, jaw.y, 120, 40).fill({ color: PALETTE.skinShadow, alpha: 0.35 });
    const lit = pr.p(-45, -55, 0, 0.6);
    g.ellipse(lit.x, lit.y, 55, 40).fill({ color: PALETTE.skinLight, alpha: 0.3 });
  }

  private drawNoseAndCheeks(p: Params) {
    const g = this.gFeatures;
    const pr = this.proj;
    g.clear();
    // Cheeks: blush and lift with smiles.
    const lift = p.cheek * 6;
    for (const s of [-1, 1]) {
      const c = pr.p(s * 72, 44 - lift, 0, 1);
      g.ellipse(c.x, c.y, 28, 15).fill({ color: PALETTE.blush, alpha: 0.12 + p.cheek * 0.22 });
    }
    // Nose: bridge shadow on the far side and a soft underside.
    const n0 = pr.p(9, -2, 10);
    const n1 = pr.p(14, 28, 24);
    g.moveTo(n0.x, n0.y).quadraticCurveTo(n1.x + 2, n1.y - 10, n1.x, n1.y).stroke({ width: 3, color: PALETTE.skinShadow, alpha: 0.55, cap: 'round' });
    const b0 = pr.p(-15, 38, 22);
    const b1 = pr.p(0, 47, 30);
    const b2 = pr.p(15, 38, 22);
    g.moveTo(b0.x, b0.y).quadraticCurveTo(b1.x, b1.y + 4, b2.x, b2.y).stroke({ width: 3, color: PALETTE.skinShadow, cap: 'round' });
    for (const s of [-1, 1]) {
      const nn = pr.p(s * 8, 41, 26);
      g.ellipse(nn.x, nn.y, 3.5, 2).fill({ color: PALETTE.lipDark, alpha: 0.6 });
    }
    const tip = pr.p(-3, 30, 32);
    g.ellipse(tip.x, tip.y, 5, 3).fill({ color: PALETTE.skinLight, alpha: 0.6 });
    // Beauty mark under the character's left eye.
    const mark = pr.p(66, 20, 2);
    g.circle(mark.x, mark.y, 2.4).fill(PALETTE.lash);
  }

  // ---------------------------------------------------------------- eyes
  /** s = +1 for the character's left eye (viewer's right), -1 for their right. */
  private drawEye(idx: number, s: number, open: number, smile: number, p: Params) {
    const pr = this.proj;
    const { mask, inner, over } = this.eyes[idx];
    mask.clear();
    inner.clear();
    over.clear();

    const cx = s * EYE.x;
    const cy = EYE.y - p.cheek * 2;
    const inX = cx - s * EYE.w;
    const outX = cx + s * EYE.w;
    const inY = cy + 2;
    const outY = cy - 4;
    const N = 16;
    const o = clamp(open, 0, 1.3);
    const sm = clamp(smile, 0, 1);
    const upper: Pt[] = [];
    const lower: Pt[] = [];
    const crease: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const bx = lerp(inX, outX, u);
      const by = lerp(inY, outY, u);
      const shapeU = Math.sin(Math.PI * Math.pow(u, 0.8));
      const shapeL = Math.sin(Math.PI * u);
      // Closed lid sags into a gentle downward arc.
      let yu = by - EYE.up * o * shapeU + (1 - Math.min(o, 1)) * 4 * shapeL;
      const yl = by + EYE.lo * (1 - sm * 0.7) * shapeL - sm * 3 * shapeL;
      if (yu > yl) yu = yl;
      upper.push(pr.p(bx, yu, 6));
      lower.push(pr.p(bx, yl, 6));
      crease.push(pr.p(bx, by - (EYE.up + 8 + Math.max(0, o - 1) * 8) * shapeU - 1, 6));
    }
    const aperture = upper.reduce((m, q, i) => Math.max(m, lower[i].y - q.y), 0);

    // Lid crease.
    over.poly(flat(crease), false).stroke({ width: 2, color: PALETTE.skinShadow, alpha: 0.55, cap: 'round' });

    if (aperture > 1.2) {
      const shape = flat([...upper, ...[...lower].reverse()]);
      mask.poly(shape, true).fill(0xffffff);
      inner.poly(shape, true).fill(PALETTE.sclera);
      // Iris follows gaze; constrained to the eye opening by the mask.
      const ic = pr.p(cx + p.eyeBallX * EYE.w * 0.45, cy - 2 - p.eyeBallY * 7, 10);
      inner.circle(ic.x, ic.y, 13).fill(PALETTE.iris);
      inner.circle(ic.x, ic.y, 13).stroke({ width: 2, color: PALETTE.irisDark });
      inner.circle(ic.x, ic.y, 5.5 + (1 - Math.min(o, 1)) * 0.5).fill(PALETTE.pupil);
      inner.circle(ic.x - 4.5, ic.y - 4.5, 3.2).fill({ color: 0xffffff, alpha: 0.95 });
      inner.circle(ic.x + 4, ic.y + 4, 1.4).fill({ color: 0xffffff, alpha: 0.7 });
      // Shadow cast by the upper lid.
      inner.poly(flat(upper), false).stroke({ width: 7, color: PALETTE.lash, alpha: 0.22 });
      // Lower lash line.
      over.poly(flat(lower), false).stroke({ width: 1.6, color: PALETTE.lash, alpha: 0.45, cap: 'round' });
    }

    // Upper lash line with a winged outer corner; it stays visible when closed.
    over.poly(flat(upper), false).stroke({ width: 4.2, color: PALETTE.lash, cap: 'round', join: 'round' });
    const end = upper[N];
    const prev = upper[N - 3];
    const wing = { x: end.x + (end.x - prev.x) * 0.9 + s * 2, y: end.y + (end.y - prev.y) * 0.6 - 5 };
    over.moveTo(prev.x, prev.y).quadraticCurveTo(end.x, end.y, wing.x, wing.y).stroke({ width: 3.2, color: PALETTE.lash, cap: 'round' });
    if (aperture <= 1.2) {
      // Lashes point down on a closed lid.
      for (let i = 4; i <= N - 2; i += 3) {
        const q = upper[i];
        over.moveTo(q.x, q.y).lineTo(q.x + s * 2, q.y + 5).stroke({ width: 1.5, color: PALETTE.lash, cap: 'round' });
      }
    }
  }

  // ---------------------------------------------------------------- brows
  private drawBrows(p: Params) {
    const g = this.gBrows;
    const pr = this.proj;
    g.clear();
    for (const s of [-1, 1]) {
      const raise = s > 0 ? p.browLY : p.browRY;
      const angle = s > 0 ? p.browLAngle : p.browRAngle;
      const up = raise >= 0 ? raise * 15 : raise * 8;
      const cx = s * 52;
      const by = BROW_Y - up;
      const inner = { x: cx - s * 32, y: by + 5 - angle * 9 };
      const peak = { x: cx + s * 6, y: by - 7 - Math.max(0, raise) * 3 + angle * 2 };
      const outer = { x: cx + s * 36, y: by + 6 + angle * 4 };
      const N = 12;
      const top: Pt[] = [];
      const bot: Pt[] = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        // Quadratic through inner -> peak -> outer.
        const x = (1 - u) * (1 - u) * inner.x + 2 * (1 - u) * u * (2 * peak.x - (inner.x + outer.x) / 2) + u * u * outer.x;
        const y = (1 - u) * (1 - u) * inner.y + 2 * (1 - u) * u * (2 * peak.y - (inner.y + outer.y) / 2) + u * u * outer.y;
        const th = lerp(10, 2.5, Math.pow(u, 1.2));
        top.push(pr.p(x, y - th / 2, 8));
        bot.push(pr.p(x, y + th / 2, 8));
      }
      g.poly(flat([...top, ...bot.reverse()]), true).fill(PALETTE.brow);
    }
    // Furrow lines when brows pull down and in.
    const furrow = clamp(-(p.browLAngle + p.browRAngle) / 2 - 0.2, 0, 1);
    if (furrow > 0.02) {
      for (const s of [-1, 1]) {
        const a = pr.p(s * 8, BROW_Y + 2, 8);
        const b = pr.p(s * 5, BROW_Y + 18, 8);
        g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1.6, color: PALETTE.skinShadow, alpha: furrow * 0.8, cap: 'round' });
      }
    }
  }

  // ---------------------------------------------------------------- mouth
  private drawMouth(p: Params) {
    const pr = this.proj;
    const g = this.gLips;
    const gi = this.gMouthInner;
    const gm = this.gMouthMask;
    g.clear();
    gi.clear();
    gm.clear();

    const press = clamp(p.mouthPress, 0, 1);
    const tuck = clamp(p.mouthTuck, 0, 1);
    const round = clamp(p.mouthRound, 0, 1);
    const form = clamp(p.mouthForm, -1, 1);
    const smirkL = Math.max(0, p.mouthSmirk);
    const smirkR = Math.max(0, -p.mouthSmirk);
    const gap = clamp(p.mouthOpen, 0, 1) * 44 * (1 - press);
    const halfW = 35 * (1 + p.mouthWide * 0.22 - round * 0.4 + Math.max(0, form) * 0.12 - press * 0.04);
    const my = MOUTH_Y + p.mouthOpen * 4;

    // Corners: + x is the character's left. Smirk lifts one side and pulls it out.
    const cornerY = (s: number) => {
      const sk = s > 0 ? smirkL : smirkR;
      const other = s > 0 ? smirkR : smirkL;
      return my - form * 9 - sk * 11 + other * 2 + gap * 0.15;
    };
    const cornerX = (s: number) => s * (halfW + (s > 0 ? smirkL : smirkR) * 5);
    const N = 18;
    const exp = lerp(1, 0.45, round);
    const upIn: Pt[] = [];
    const loIn: Pt[] = [];
    const upOut: Pt[] = [];
    const loOut: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; // 0 = character's right corner (viewer's left)
      const x = lerp(cornerX(-1), cornerX(1), u);
      const baseY = lerp(cornerY(-1), cornerY(1), u);
      const prof = Math.pow(Math.sin(Math.PI * u), exp);
      // Smiles curve the lip line up at the corners (U shape), frowns the reverse.
      const curve = (1 - prof) * 0 + prof * Math.max(0, form) * 4;
      const yUpIn = baseY - gap * 0.22 * prof + curve * 0.2;
      const yLoIn = baseY + gap * 0.78 * prof + curve - tuck * 3 * prof;
      // Cupid's bow on the upper lip.
      const bow = Math.exp(-((u - 0.4) ** 2) / 0.006) + Math.exp(-((u - 0.6) ** 2) / 0.006) - 0.6 * Math.exp(-((u - 0.5) ** 2) / 0.003);
      const upperThick = (8 - press * 2.5 + round * 2) * Math.pow(Math.sin(Math.PI * u), 0.6) + bow * 2;
      const lowerThick = (11 - press * 3 - tuck * 6 + round * 2) * Math.pow(Math.sin(Math.PI * u), 0.7);
      upIn.push(pr.p(x, yUpIn, 16));
      loIn.push(pr.p(x, yLoIn, 16));
      upOut.push(pr.p(x, yUpIn - upperThick, 16));
      loOut.push(pr.p(x, yLoIn + lowerThick, 16));
    }

    // Interior: cavity, teeth and tongue, clipped to the opening.
    if (gap > 0.6) {
      const opening = flat([...upIn, ...[...loIn].reverse()]);
      gm.poly(opening, true).fill(0xffffff);
      gi.poly(opening, true).fill(PALETTE.mouth);
      const top = upIn[N / 2];
      const bot = loIn[N / 2];
      // Tongue sits low in the mouth and rises toward the teeth for L/T/D/N/TH.
      const tongueY = bot.y + 4 - clamp(p.mouthTongue, 0, 1) * gap * 0.55;
      gi.ellipse(bot.x, tongueY, halfW * 0.6, 10 + p.mouthTongue * 4).fill(PALETTE.tongue);
      gi.ellipse(bot.x, tongueY - 4, halfW * 0.08, 5).fill({ color: PALETTE.lipDark, alpha: 0.35 });
      if (gap > 18) gi.roundRect(bot.x - halfW * 0.6, bot.y - 5, halfW * 1.2, 8, 3).fill({ color: PALETTE.teeth, alpha: 0.9 });
      const teethH = 6 + clamp(p.mouthTeeth, 0, 1) * 5;
      gi.roundRect(top.x - halfW * 0.75, top.y - 6, halfW * 1.5, teethH + 6, 4).fill(PALETTE.teeth);
      gi.moveTo(top.x, top.y - 2).lineTo(top.x, top.y + teethH - 1).stroke({ width: 1, color: 0xd8cfc2, alpha: 0.8 });
    }

    // Lips.
    g.poly(flat([...upOut, ...[...upIn].reverse()]), true).fill(PALETTE.lip);
    g.poly(flat([...loIn, ...[...loOut].reverse()]), true).fill(PALETTE.lip);
    const hl = pr.p(-6, loIn[N / 2].y + 0, 18);
    g.ellipse(hl.x, (loIn[N / 2].y + loOut[N / 2].y) / 2 - 1, halfW * 0.35, 2.5).fill({ color: PALETTE.lipLight, alpha: 0.7 });
    // F/V: upper teeth resting on the lower lip.
    if (tuck > 0.05) {
      const c = upIn[N / 2];
      g.roundRect(c.x - halfW * 0.5, c.y - 1, halfW, 5 * tuck, 2).fill(PALETTE.teeth);
    }
    // Lip line where they meet.
    const seam = gap > 0.6 ? null : upIn.map((q, i) => ({ x: q.x, y: (q.y + loIn[i].y) / 2 }));
    if (seam) g.poly(flat(seam), false).stroke({ width: 2.2 + press, color: PALETTE.lipDark, cap: 'round', join: 'round' });
    // Corner creases for smiles and smirks.
    for (const s of [-1, 1]) {
      const k = clamp(Math.max(0, form) * 0.8 + (s > 0 ? smirkL : smirkR), 0, 1);
      if (k < 0.08) continue;
      const c = s > 0 ? upIn[N] : upIn[0];
      g.moveTo(c.x + s * 3, c.y - 6)
        .quadraticCurveTo(c.x + s * 9, c.y, c.x + s * 4, c.y + 8)
        .stroke({ width: 2, color: PALETTE.skinShadow, alpha: k * 0.8, cap: 'round' });
    }
  }
}
