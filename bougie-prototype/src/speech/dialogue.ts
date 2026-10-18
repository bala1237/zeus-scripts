/**
 * Bougie's line, with authored word timing and ARPAbet phonemes.
 *
 * The timing is a performance choice (pauses for the eye-roll, emphasis on
 * "Zeus" and "crazy"), the same way an animator works from a recorded take.
 * When a recorded voice line exists, these timings should come from a forced
 * aligner (Montreal Forced Aligner, Rhubarb Lip Sync, Azure/Polly viseme events)
 * instead; nothing else in the pipeline changes.
 */
export interface Word {
  text: string;
  start: number;
  end: number;
  /** ARPAbet phonemes, stress digits removed. */
  phonemes: string[];
}

/** The display text, punctuation included. */
export const LINE_TEXT =
  "Zeus, seriously? You're asking where I've been? I've been right here keeping your crazy citizens under control. Somebody has to run this place while you're gone.";

/** [display text, start, end, phonemes] */
const RAW: [string, number, number, string][] = [
  ['Zeus,', 1.4, 1.85, 'Z UW S'],
  ['seriously?', 2.0, 2.75, 'S IH R IY AH L IY'],
  ["You're", 3.2, 3.38, 'Y UH R'],
  ['asking', 3.38, 3.72, 'AE S K IH NG'],
  ['where', 3.72, 3.95, 'W EH R'],
  ["I've", 3.95, 4.15, 'AY V'],
  ['been?', 4.15, 4.55, 'B IH N'],
  ["I've", 5.05, 5.22, 'AY V'],
  ['been', 5.22, 5.42, 'B IH N'],
  ['right', 5.42, 5.7, 'R AY T'],
  ['here', 5.7, 6.05, 'HH IY R'],
  ['keeping', 6.17, 6.5, 'K IY P IH NG'],
  ['your', 6.5, 6.66, 'Y AO R'],
  ['crazy', 6.66, 7.1, 'K R EY Z IY'],
  ['citizens', 7.1, 7.65, 'S IH T IH Z AH N Z'],
  ['under', 7.65, 7.92, 'AH N D ER'],
  ['control.', 7.92, 8.5, 'K AH N T R OW L'],
  ['Somebody', 9.05, 9.5, 'S AH M B AA D IY'],
  ['has', 9.5, 9.68, 'HH AE Z'],
  ['to', 9.68, 9.8, 'T UW'],
  ['run', 9.8, 10.05, 'R AH N'],
  ['this', 10.05, 10.25, 'DH IH S'],
  ['place', 10.25, 10.62, 'P L EY S'],
  ['while', 10.62, 10.88, 'W AY L'],
  ["you're", 10.88, 11.05, 'Y UH R'],
  ['gone.', 11.05, 11.6, 'G AO N'],
];

export const WORDS: Word[] = RAW.map(([text, start, end, ph]) => ({
  text,
  start,
  end,
  phonemes: ph.split(' '),
}));

/** Total length of the performance including the mischievous button and return to idle. */
export const PERFORMANCE_DURATION = 14.5;
