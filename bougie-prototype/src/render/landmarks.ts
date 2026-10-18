/**
 * Feature locations on a flattened character image.
 *
 * Centres (cx, cy) are image pixels. Half-sizes (w, h) are measured along
 * the head's own axes, which are rotated by `tilt` when the head is tilted
 * in the painting. Edited in the app's landmark editor and saved as
 * <image>.landmarks.json.
 */
export interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface Landmarks {
  imageWidth: number;
  imageHeight: number;
  /** Head roll in the painting, degrees clockwise (eye line slope). */
  tilt?: number;
  /** Face ellipse (skin area, not hair). */
  face: Box;
  /** Chin/neck junction, as an image y below the face centre: the head rotates around it. */
  neckY: number;
  /** Character's left eye (viewer's right). */
  eyeL: Box;
  eyeR: Box;
  browL: Box;
  browR: Box;
  /** Centre sits on the seam where the lips part (below visible upper teeth, if any). */
  mouth: Box;
  /**
   * How far the centre of the lip seam sits below the mouth corners, in px
   * along the head axis (positive for a smile). The mesh bends to follow it.
   */
  mouthCurve?: number;
  /** Regions that must not move with the face, e.g. a hand resting on the chin. */
  pins?: Box[];
  /** Scale jaw drop (lower it when something supports the chin). Default 1. */
  jawScale?: number;
  /** Scale head turn/nod parallax (lower it for 3/4 views). Default 1. */
  turnScale?: number;
  /** Paint upper teeth inside the opened mouth. Set false when the art already shows them. Default true. */
  paintTeeth?: boolean;
  /** Optional colour overrides as #rrggbb. */
  mouthColor?: string;
}

export const LANDMARK_KEYS = ['face', 'eyeL', 'eyeR', 'browL', 'browR', 'mouth'] as const;
export type LandmarkKey = (typeof LANDMARK_KEYS)[number];

export const LANDMARK_LABELS: Record<LandmarkKey, string> = {
  face: 'Face',
  eyeL: 'Eye (char. left)',
  eyeR: 'Eye (char. right)',
  browL: 'Brow (char. left)',
  browR: 'Brow (char. right)',
  mouth: 'Mouth seam',
};

/** A reasonable first guess for a front-facing portrait, to be refined in the editor. */
export function guessLandmarks(w: number, h: number): Landmarks {
  const fx = w / 2;
  const fy = h * 0.4;
  const fr = Math.min(w, h) * 0.2;
  return {
    imageWidth: w,
    imageHeight: h,
    tilt: 0,
    face: { cx: fx, cy: fy, w: fr, h: fr * 1.25 },
    neckY: fy + fr * 1.35,
    eyeL: { cx: fx + fr * 0.42, cy: fy - fr * 0.08, w: fr * 0.24, h: fr * 0.12 },
    eyeR: { cx: fx - fr * 0.42, cy: fy - fr * 0.08, w: fr * 0.24, h: fr * 0.12 },
    browL: { cx: fx + fr * 0.44, cy: fy - fr * 0.36, w: fr * 0.3, h: fr * 0.07 },
    browR: { cx: fx - fr * 0.44, cy: fy - fr * 0.36, w: fr * 0.3, h: fr * 0.07 },
    mouth: { cx: fx, cy: fy + fr * 0.62, w: fr * 0.3, h: fr * 0.1 },
    pins: [],
  };
}

const storageKey = (name: string) => `bougie.landmarks.${name}`;

export function loadStoredLandmarks(name: string): Landmarks | null {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? (JSON.parse(raw) as Landmarks) : null;
  } catch {
    return null;
  }
}

export function storeLandmarks(name: string, lm: Landmarks) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(lm));
  } catch {
    // Storage unavailable (private window): landmarks just won't persist.
  }
}

export function clearStoredLandmarks(name: string) {
  try {
    localStorage.removeItem(storageKey(name));
  } catch {
    // ignore
  }
}
