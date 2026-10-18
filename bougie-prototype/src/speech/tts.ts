import { LINE_TEXT, WORDS } from './dialogue';

/**
 * Browser text-to-speech (Web Speech API) as a stand-in voice.
 *
 * Browsers expose word "boundary" events but no phoneme or viseme timing, so
 * the performance runs on the authored word timings and is re-synced to the
 * voice at every word boundary. With a recorded voice line, replace this with
 * an <audio> element plus aligned timings (see docs/NEXT_STEPS.md).
 */

/** Character offset of each word inside LINE_TEXT, for mapping boundary events. */
const WORD_CHAR_START: number[] = (() => {
  const out: number[] = [];
  let from = 0;
  for (const w of WORDS) {
    const idx = LINE_TEXT.indexOf(w.text, from);
    out.push(idx);
    from = idx + w.text.length;
  }
  return out;
})();

function wordIndexForChar(charIndex: number): number {
  let idx = 0;
  for (let i = 0; i < WORD_CHAR_START.length; i++) if (WORD_CHAR_START[i] <= charIndex) idx = i;
  return idx;
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
}

export function onVoicesChanged(cb: () => void): () => void {
  if (!ttsSupported()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', cb);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

export interface SpeechSync {
  /** True once the voice has actually started producing audio. */
  started: boolean;
  /** True if the voice has reported word boundaries (so we can lock to it). */
  hasBoundaries: boolean;
  /** Highest word index the voice has reached, -1 before the first word. */
  wordIndex: number;
  ended: boolean;
}

export class TtsVoice {
  sync: SpeechSync = { started: false, hasBoundaries: false, wordIndex: -1, ended: false };
  private utterance: SpeechSynthesisUtterance | null = null;

  speak(voiceURI: string | null) {
    this.cancel();
    this.sync = { started: false, hasBoundaries: false, wordIndex: -1, ended: false };
    if (!ttsSupported()) return;
    const u = new SpeechSynthesisUtterance(LINE_TEXT);
    const voice = listVoices().find((v) => v.voiceURI === voiceURI);
    if (voice) u.voice = voice;
    u.rate = 1.0;
    u.pitch = 1.08;
    const sync = this.sync;
    u.onstart = () => {
      sync.started = true;
    };
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      sync.started = true;
      sync.hasBoundaries = true;
      sync.wordIndex = Math.max(sync.wordIndex, wordIndexForChar(e.charIndex));
    };
    u.onend = () => {
      sync.ended = true;
    };
    u.onerror = () => {
      sync.ended = true;
    };
    this.utterance = u;
    window.speechSynthesis.speak(u);
  }

  cancel() {
    if (!ttsSupported()) return;
    if (this.utterance) {
      this.utterance.onend = null;
      this.utterance.onboundary = null;
      this.utterance = null;
    }
    window.speechSynthesis.cancel();
  }
}
