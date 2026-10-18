import type { Params } from '../rig/params';

/**
 * Expressions are additive offsets from neutral, blended by weight. Several
 * can be active at once (e.g. 0.6 sarcastic + 0.4 skeptical) and lip sync
 * plays on top, so Bougie can smirk *while* talking.
 */
export type ExpressionId =
  | 'skeptical'
  | 'incredulous'
  | 'sarcastic'
  | 'smile'
  | 'surprise'
  | 'mischief'
  | 'deadpan';

export type Delta = Partial<Params>;

export const EXPRESSIONS: Record<ExpressionId, Delta> = {
  // One brow up, the other slightly down: "...seriously?"
  skeptical: {
    browLY: 0.95,
    browLAngle: -0.15,
    browRY: -0.3,
    browRAngle: -0.45,
    eyeLOpen: 0.1,
    eyeROpen: -0.2,
    eyeRSmile: 0.2,
    mouthForm: -0.1,
    mouthSmirk: 0.25,
  },
  // Both brows up, eyes open: "You're asking where I've been?"
  incredulous: {
    browLY: 0.75,
    browRY: 0.75,
    browLAngle: 0.35,
    browRAngle: 0.35,
    eyeLOpen: 0.12,
    eyeROpen: 0.12,
    mouthForm: -0.05,
  },
  // Half-lidded lopsided smile.
  sarcastic: {
    mouthSmirk: 0.85,
    mouthForm: 0.3,
    eyeLOpen: -0.22,
    eyeROpen: -0.28,
    eyeLSmile: 0.2,
    eyeRSmile: 0.2,
    browLY: 0.35,
    browRY: -0.1,
    browRAngle: -0.2,
    cheek: 0.25,
  },
  // Confident, warm.
  smile: {
    mouthForm: 0.85,
    mouthTeeth: 0.35,
    mouthWide: 0.25,
    eyeLSmile: 0.45,
    eyeRSmile: 0.45,
    browLY: 0.15,
    browRY: 0.15,
    cheek: 0.55,
  },
  surprise: {
    browLY: 1,
    browRY: 1,
    browLAngle: 0.5,
    browRAngle: 0.5,
    eyeLOpen: 0.25,
    eyeROpen: 0.25,
    mouthOpen: 0.35,
    mouthRound: 0.4,
    mouthForm: -0.1,
  },
  // Narrowed eyes, sly asymmetric grin, one brow cocked.
  mischief: {
    mouthForm: 0.6,
    mouthSmirk: -0.65,
    mouthTeeth: 0.4,
    eyeLOpen: -0.3,
    eyeROpen: -0.22,
    eyeLSmile: 0.55,
    eyeRSmile: 0.45,
    browLY: -0.2,
    browLAngle: -0.4,
    browRY: 0.45,
    browRAngle: -0.15,
    cheek: 0.6,
  },
  deadpan: {
    eyeLOpen: -0.35,
    eyeROpen: -0.35,
    browLY: -0.1,
    browRY: -0.1,
    mouthForm: -0.15,
  },
};

export const EXPRESSION_IDS = Object.keys(EXPRESSIONS) as ExpressionId[];

export function applyExpressions(base: Params, weights: Partial<Record<ExpressionId, number>>): void {
  for (const id of EXPRESSION_IDS) {
    const w = weights[id] ?? 0;
    if (w <= 0.0001) continue;
    const d = EXPRESSIONS[id];
    for (const k in d) {
      const key = k as keyof Params;
      base[key] += (d[key] as number) * w;
    }
  }
}
