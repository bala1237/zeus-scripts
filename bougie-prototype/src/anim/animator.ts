import { DEFAULT_PARAMS, PARAM_IDS, type ParamId, type Params } from '../rig/params';
import { Spring, clamp } from '../rig/math';
import { WORDS, PERFORMANCE_DURATION } from '../speech/dialogue';
import { VisemeTrack } from '../speech/visemes';
import { TtsVoice } from '../speech/tts';
import { EXPRESSION_IDS, applyExpressions, type ExpressionId } from './expressions';
import { IdleLayer } from './idle';
import { SCRIPTED_BLINKS, sampleChannel } from './performance';

/** Per-parameter smoothing time (s). Short for blinks and lips, longer for the head. */
const SMOOTH: Partial<Record<ParamId, number>> = {
  angleX: 0.16,
  angleY: 0.14,
  angleZ: 0.18,
  bodyAngleX: 0.3,
  breath: 0.05,
  eyeLOpen: 0.07,
  eyeROpen: 0.07,
  eyeLSmile: 0.08,
  eyeRSmile: 0.08,
  eyeBallX: 0.035,
  eyeBallY: 0.035,
  browLY: 0.08,
  browRY: 0.08,
  browLAngle: 0.09,
  browRAngle: 0.09,
  mouthOpen: 0.04,
  mouthWide: 0.05,
  mouthRound: 0.05,
  mouthPress: 0.025,
  mouthTuck: 0.03,
  mouthTongue: 0.04,
  mouthTeeth: 0.05,
  mouthForm: 0.1,
  mouthSmirk: 0.1,
  cheek: 0.15,
};

const RANGES: Partial<Record<ParamId, [number, number]>> = {
  eyeLOpen: [0, 1.3],
  eyeROpen: [0, 1.3],
  eyeLSmile: [0, 1],
  eyeRSmile: [0, 1],
  eyeBallX: [-1, 1],
  eyeBallY: [-1, 1],
  browLY: [-1, 1.1],
  browRY: [-1, 1.1],
  browLAngle: [-1, 1],
  browRAngle: [-1, 1],
  mouthOpen: [0, 1],
  mouthForm: [-1, 1],
  mouthWide: [0, 1],
  mouthRound: [0, 1],
  mouthPress: [0, 1],
  mouthTuck: [0, 1],
  mouthTongue: [0, 1],
  mouthTeeth: [0, 1],
  mouthSmirk: [-1, 1],
  cheek: [0, 1],
};

export type PlayState = 'idle' | 'playing';

export interface AnimatorStatus {
  state: PlayState;
  time: number;
  wordIndex: number;
  voice: 'off' | 'waiting' | 'synced' | 'free' | 'unavailable';
}

export class Animator {
  readonly params: Params = { ...DEFAULT_PARAMS };
  private springs = new Map<ParamId, Spring>();
  private idle = new IdleLayer();
  private visemes = new VisemeTrack(WORDS);
  private tts = new TtsVoice();

  state: PlayState = 'idle';
  time = 0;
  private useVoice = false;
  private voiceURI: string | null = null;
  private speechRequested = false;
  private speechWait = 0;
  private nextScriptedBlink = 0;

  /** Expression chosen live from the UI (real-time path). */
  private manualExpression: ExpressionId | null = null;
  private manualWeights = new Map<ExpressionId, Spring>();
  /** Pointer position in -1..1 or null when the pointer is outside the stage. */
  private pointer: { x: number; y: number } | null = null;
  private pointerWeight = new Spring(0, 0.4);

  constructor() {
    for (const id of PARAM_IDS) this.springs.set(id, new Spring(DEFAULT_PARAMS[id], SMOOTH[id] ?? 0.08));
    for (const id of EXPRESSION_IDS) this.manualWeights.set(id, new Spring(0, 0.18));
  }

  play(opts: { voice: boolean; voiceURI: string | null }) {
    this.stopVoice();
    this.state = 'playing';
    this.time = 0;
    this.useVoice = opts.voice;
    this.voiceURI = opts.voiceURI;
    this.speechRequested = false;
    this.speechWait = 0;
    this.nextScriptedBlink = 0;
    this.manualExpression = null;
  }

  /** Stop and return to the start of the performance in neutral idle. */
  reset() {
    this.stopVoice();
    this.state = 'idle';
    this.time = 0;
    this.manualExpression = null;
    this.idle.reset();
    for (const id of PARAM_IDS) this.springs.get(id)!.reset(DEFAULT_PARAMS[id]);
    for (const s of this.manualWeights.values()) s.reset(0);
    Object.assign(this.params, DEFAULT_PARAMS);
  }

  setManualExpression(id: ExpressionId | null) {
    this.manualExpression = id;
  }

  setPointer(p: { x: number; y: number } | null) {
    this.pointer = p;
  }

  dispose() {
    this.stopVoice();
  }

  private stopVoice() {
    this.tts.cancel();
  }

  get status(): AnimatorStatus {
    let voice: AnimatorStatus['voice'] = 'off';
    if (this.useVoice && this.state === 'playing') {
      const s = this.tts.sync;
      if (s.ended && !s.started) voice = 'unavailable';
      else voice = !s.started ? 'waiting' : s.hasBoundaries ? 'synced' : 'free';
    }
    return {
      state: this.state,
      time: this.time,
      wordIndex: this.state === 'playing' ? VisemeTrack.wordAt(WORDS, this.time) : -1,
      voice,
    };
  }

  /** Advance the performance clock, slaving it to the voice when one is speaking. */
  private advanceClock(dt: number) {
    let next = this.time + dt;
    if (this.useVoice) {
      const first = WORDS[0].start;
      // Request speech slightly early to absorb synthesis start-up latency.
      if (!this.speechRequested && next >= first - 0.25) {
        this.tts.speak(this.voiceURI);
        this.speechRequested = true;
      }
      const s = this.tts.sync;
      if (this.speechRequested && !s.started && !s.ended) {
        this.speechWait += dt;
        // Hold on the first word until audio actually starts (give up after 1.5 s).
        if (this.speechWait < 1.5) next = Math.min(next, first);
      }
      if (s.hasBoundaries && !s.ended && s.wordIndex >= 0) {
        const i = s.wordIndex;
        // Voice is ahead of us: jump to the word it's saying (springs hide the jump).
        if (next < WORDS[i].start) next = WORDS[i].start;
        // Voice is behind us: don't start the next word until the voice does.
        if (i + 1 < WORDS.length) next = Math.min(next, WORDS[i + 1].start - 0.001);
      }
    }
    this.time = next;
  }

  update(dt: number): Params {
    // Cap only real stalls (tab switches); slow machines still play in real time.
    dt = Math.min(dt, 0.1);
    this.idle.update(dt);

    if (this.state === 'playing') {
      this.advanceClock(dt);
      while (this.nextScriptedBlink < SCRIPTED_BLINKS.length && this.time >= SCRIPTED_BLINKS[this.nextScriptedBlink][0]) {
        this.idle.blink(SCRIPTED_BLINKS[this.nextScriptedBlink][1]);
        this.nextScriptedBlink++;
      }
      if (this.time >= PERFORMANCE_DURATION) {
        this.state = 'idle';
        this.time = PERFORMANCE_DURATION;
      }
    }
    const playing = this.state === 'playing';
    const t = this.time;

    const p: Params = { ...DEFAULT_PARAMS };

    // Expressions: performance weights plus whatever the UI has selected live.
    const weights: Partial<Record<ExpressionId, number>> = {};
    for (const id of EXPRESSION_IDS) {
      const manual = this.manualWeights.get(id)!.update(this.manualExpression === id && !playing ? 1 : 0, dt);
      weights[id] = clamp((playing ? sampleChannel(id, t) : 0) + manual, 0, 1.2);
    }
    applyExpressions(p, weights);

    // Head: idle wander + acted motion.
    p.angleX += this.idle.headX + (playing ? sampleChannel('angleX', t) : 0);
    p.angleY += this.idle.headY + (playing ? sampleChannel('angleY', t) : 0);
    p.angleZ += this.idle.headZ + (playing ? sampleChannel('angleZ', t) : 0);
    p.bodyAngleX += this.idle.bodyX + (playing ? sampleChannel('bodyAngleX', t) : 0);
    p.breath = this.idle.breath;
    const drift = this.idle.browDrift;
    p.browLY += drift;
    p.browRY += drift * 0.8;

    // Gaze: idle saccades, overridden by directed looks or the pointer.
    let gx = this.idle.gazeX;
    let gy = this.idle.gazeY;
    const pw = this.pointerWeight.update(this.pointer && !playing ? 1 : 0, dt);
    if (this.pointer && pw > 0.001) {
      gx += (this.pointer.x - gx) * pw;
      gy += (this.pointer.y - gy) * pw;
      // The head follows the eyes a little, like a real look.
      p.angleX += this.pointer.x * 10 * pw;
      p.angleY += this.pointer.y * 6 * pw;
    }
    if (playing) {
      const w = sampleChannel('gazeWeight', t);
      gx += (sampleChannel('gazeX', t) - gx) * w;
      gy += (sampleChannel('gazeY', t) - gy) * w;
    }
    p.eyeBallX = gx;
    p.eyeBallY = gy;

    // Lip sync on top of the expression mouth.
    if (playing) {
      const m = this.visemes.sample(t);
      p.mouthOpen += m.open;
      p.mouthWide += m.wide * (1 - m.round);
      p.mouthRound += m.round;
      p.mouthPress = Math.max(p.mouthPress, m.press);
      p.mouthTuck = Math.max(p.mouthTuck, m.tuck);
      p.mouthTongue += m.tongue;
      p.mouthTeeth += m.teeth;
      // Rounding pulls the smile in; jaw motion nudges the head.
      p.mouthForm *= 1 - m.round * 0.5;
      p.angleY -= m.open * 1.6;
    }

    for (const id of PARAM_IDS) {
      const r = RANGES[id];
      const target = r ? clamp(p[id], r[0], r[1]) : p[id];
      this.params[id] = this.springs.get(id)!.update(target, dt);
    }

    // Blink multiplies whatever lid pose the expression set. Applied after
    // smoothing so a 70 ms close isn't softened into a half-blink.
    const closure = this.idle.blinkClosure;
    this.params.eyeLOpen *= 1 - closure;
    this.params.eyeROpen *= 1 - closure;
    return this.params;
  }
}
