/**
 * The rig's parameter model.
 *
 * Every renderer (the layered vector rig, the flat-image mesh warp, and a
 * future Live2D Cubism model) is driven by this one flat set of numbers.
 * The names mirror Live2D's standard parameter IDs (ParamAngleX, ParamEyeLOpen,
 * ParamMouthOpenY, ...) so the animation layers written here can drive a
 * Cubism model later without being rewritten. See LIVE2D_PARAM_MAP.
 */
export interface Params {
  /** Head turn left/right, degrees. + = character turns to their left (viewer's right). */
  angleX: number;
  /** Head nod, degrees. + = look up. */
  angleY: number;
  /** Head tilt, degrees. + = tilt clockwise. */
  angleZ: number;
  /** Upper-body sway, degrees. */
  bodyAngleX: number;
  /** Breath cycle 0..1. */
  breath: number;

  /** Eyelid openness 0 (closed) .. 1 (open) .. 1.25 (wide). */
  eyeLOpen: number;
  eyeROpen: number;
  /** Lower lid push from smiling / squinting 0..1. */
  eyeLSmile: number;
  eyeRSmile: number;
  /** Gaze, -1..1 on each axis. + X = character looks to viewer's right. + Y = up. */
  eyeBallX: number;
  eyeBallY: number;

  /** Brow height -1 (furrowed down) .. 1 (raised). */
  browLY: number;
  browRY: number;
  /** Brow angle -1 (angry: inner end down) .. 1 (worried: inner end up). */
  browLAngle: number;
  browRAngle: number;

  /** Jaw / mouth open 0..1. */
  mouthOpen: number;
  /** Mouth corners -1 (frown) .. 1 (smile). */
  mouthForm: number;
  /** Lip spread 0 (neutral) .. 1 (wide, "ee"). */
  mouthWide: number;
  /** Lip rounding 0 .. 1 ("oo"). */
  mouthRound: number;
  /** Lips pressed together (M/B/P) 0..1. Overrides open. */
  mouthPress: number;
  /** Lower lip tucked under the top teeth (F/V) 0..1. */
  mouthTuck: number;
  /** Tongue tip raised (L/T/D/N/TH) 0..1. */
  mouthTongue: number;
  /** Teeth visibility (S/Z, grins) 0..1. */
  mouthTeeth: number;
  /** One-sided smile (smirk) -1 (character's right side) .. 1 (character's left side). */
  mouthSmirk: number;

  /** Cheek raise / blush 0..1. */
  cheek: number;
}

export type ParamId = keyof Params;

export const DEFAULT_PARAMS: Params = {
  angleX: 0,
  angleY: 0,
  angleZ: 0,
  bodyAngleX: 0,
  breath: 0,
  eyeLOpen: 1,
  eyeROpen: 1,
  eyeLSmile: 0,
  eyeRSmile: 0,
  eyeBallX: 0,
  eyeBallY: 0,
  browLY: 0,
  browRY: 0,
  browLAngle: 0,
  browRAngle: 0,
  mouthOpen: 0,
  mouthForm: 0,
  mouthWide: 0,
  mouthRound: 0,
  mouthPress: 0,
  mouthTuck: 0,
  mouthTongue: 0,
  mouthTeeth: 0,
  mouthSmirk: 0,
  cheek: 0,
};

export const PARAM_IDS = Object.keys(DEFAULT_PARAMS) as ParamId[];

/** Mapping to the Live2D Cubism standard parameter IDs (custom ones prefixed "Param"). */
export const LIVE2D_PARAM_MAP: Record<ParamId, string> = {
  angleX: 'ParamAngleX',
  angleY: 'ParamAngleY',
  angleZ: 'ParamAngleZ',
  bodyAngleX: 'ParamBodyAngleX',
  breath: 'ParamBreath',
  eyeLOpen: 'ParamEyeLOpen',
  eyeROpen: 'ParamEyeROpen',
  eyeLSmile: 'ParamEyeLSmile',
  eyeRSmile: 'ParamEyeRSmile',
  eyeBallX: 'ParamEyeBallX',
  eyeBallY: 'ParamEyeBallY',
  browLY: 'ParamBrowLY',
  browRY: 'ParamBrowRY',
  browLAngle: 'ParamBrowLAngle',
  browRAngle: 'ParamBrowRAngle',
  mouthOpen: 'ParamMouthOpenY',
  mouthForm: 'ParamMouthForm',
  mouthWide: 'ParamMouthWide',
  mouthRound: 'ParamMouthRound',
  mouthPress: 'ParamMouthPress',
  mouthTuck: 'ParamMouthTuck',
  mouthTongue: 'ParamTongue',
  mouthTeeth: 'ParamTeeth',
  mouthSmirk: 'ParamMouthSmirk',
  cheek: 'ParamCheek',
};

export function cloneParams(p: Params): Params {
  return { ...p };
}
