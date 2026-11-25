// The beat: follows the music the page is allowed to hear, or a tempo tapped in by hand. With no music it stays still.
//   const beat = createBeat({ onChange });   beat.update(dt) every frame (returns true when a beat lands);
//   beat.tap();   await beat.listen();   beat.unlisten();   beat.stop();   beat.setOffset(seconds);
//   beat.state: mode ('off', 'tap' or 'listen'), bpm, beats (a running count), pulse (1 on each beat, fading),
//               act (0 still to 1 playing, eased), level (loudness now, 0 to 1), low/mid/high, energy, heard (seconds since the last beat),
//               locked (the tempo and beat have been found), section ('groove' or 'breakdown'), drops (rises when the bass comes back)
// The listening itself is in tracker.js.
import { makeBands, createTracker } from './tracker.js';

// The loudness of the bass, mids and highs is measured on the audio thread, 200 times a second, each reading stamped with its own
// time. So what the tracker hears does not depend on how fast the picture is being drawn.
const WORKLET = `const makeBands = ${makeBands.toString()};
registerProcessor('zeus-bands', class extends AudioWorkletProcessor {
  constructor() { super(); this.hop = Math.round(sampleRate / 200); this.bands = makeBands(sampleRate, this.hop); this.out = [0, 0, 0, 0]; this.buf = []; }
  process(inputs) { const ch = inputs[0]; if (!ch || !ch.length) return true; const L = ch[0], R = ch[1] || L;
    for (let i = 0; i < L.length; i++) if (this.bands((L[i] + R[i]) * 0.5, this.out)) this.buf.push(this.out[0], this.out[1], this.out[2], this.out[3], (currentFrame + i + 1) / sampleRate);
    if (this.buf.length >= 20) { this.port.postMessage(this.buf); this.buf = []; } return true; } });`;

export function createBeat({ bpm = 120, onChange = () => {} } = {}) {
  let saved = 0; try { saved = Number(localStorage.getItem('zeus-beat-offset')) || 0; } catch { saved = 0; }
  const st = { mode: 'off', bpm, tempo: bpm, beats: 0, pulse: 0, act: 0, level: 0, bass: 0, low: 0, mid: 0, high: 0, energy: 0.8, heard: 99, locked: false, conf: 0, section: 'groove', drops: 0, offset: saved, testBpm: 128, testGain: 1 };
  const taps = []; let audio = null, lastBeat = -1, wasLocked = false;
  function tap(now = performance.now() / 1000) { if (taps.length && (now - taps[taps.length - 1] > 2.5 || now < taps[taps.length - 1])) taps.length = 0;   // a pause starts a fresh count
    taps.push(now); while (taps.length > 6) taps.shift(); if (taps.length >= 3) { const d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); st.bpm = Math.round(Math.min(200, Math.max(50, 60 / d))); st.tempo = st.bpm; }
    if (st.mode === 'off') st.mode = 'tap'; st.beats = Math.ceil(st.beats); st.pulse = 1; onChange(st); }
  // Listening: Chrome is asked to share a tab or the screen "with audio"; if that is refused it falls back to the default sound input.
  // source 'test' feeds a made-up kick drum at state.testBpm, to check the listening without any music.
  async function listen(source = 'share') { const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }); let stream = null;
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })); try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    const node = new AudioWorkletNode(ctx, 'zeus-bands', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }), mute = ctx.createGain(); mute.gain.value = 0; node.connect(mute); mute.connect(ctx.destination);   // it has to lead somewhere to be run; the mute keeps it silent
    const tracker = createTracker({ rate: ctx.sampleRate / Math.round(ctx.sampleRate / 200) }), a = { ctx, node, tracker, stream: null, last: performance.now() };
    node.port.onmessage = (e) => { const v = e.data; for (let i = 0; i < v.length; i += 5) tracker.push(v[i], v[i + 1], v[i + 2], v[i + 3], v[i + 4]); a.last = performance.now(); };
    if (source === 'test') { const osc = ctx.createOscillator(), g = ctx.createGain(); osc.frequency.value = 62; g.gain.value = 0; osc.connect(g); g.connect(node); osc.start(); const gap = 60 / st.testBpm, t0 = ctx.currentTime + 0.3; for (let i = 0; i < 400; i++) { g.gain.setValueAtTime(st.testGain, t0 + i * gap); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * gap + 0.16); } }
    else { const plain = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: plain }); if (!stream.getAudioTracks().length) { stream.getTracks().forEach((t) => t.stop()); stream = null; } else stream.getVideoTracks().forEach((t) => t.stop()); } catch { stream = null; }
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: plain });
      ctx.createMediaStreamSource(stream).connect(node); a.stream = stream; }
    if (ctx.state === 'suspended') await ctx.resume(); audio = a; st.mode = 'listen'; st.locked = false; wasLocked = false; onChange(st); }
  function unlisten() { if (audio) { audio.stream?.getTracks().forEach((t) => t.stop()); audio.ctx.close(); audio = null; } st.mode = 'off'; st.locked = false; onChange(st); }
  const stop = () => { if (audio) unlisten(); else { st.mode = 'off'; onChange(st); } };
  // Listening. The tracker says how long a beat is and when one falls. The page's own count of beats runs at that tempo and is eased
  // onto the tracker's beat, so a correction never shows as a jump. state.offset (seconds) moves the lights later (or, negative, earlier).
  function follow(dt) { const ts = audio.tracker.state, playing = ts.playing && performance.now() - audio.last < 500, now = audio.ctx.currentTime;
    st.level = ts.level; st.bass = st.low = ts.low; st.mid = ts.mid; st.high = ts.high; st.section = ts.section; st.drops = ts.drops; st.conf = ts.conf; st.locked = ts.locked && playing;
    st.energy += (Math.min(1, 0.3 + 0.45 * ts.low + 0.6 * ts.level) - st.energy) * Math.min(1, dt * 3);
    if (!playing) { wasLocked = false; return 0; }
    if (!ts.locked) return dt * st.tempo / 60;
    st.tempo = ts.bpm; const r = Math.round(ts.bpm); if (r !== st.bpm) { st.bpm = r; onChange(st); }
    let adv = dt / ts.period; const want = (now - st.offset - ts.anchor) / ts.period, e = want - (st.beats + adv), err = e - Math.round(e);
    adv += wasLocked ? err * Math.min(1, dt * 6) : err; wasLocked = true; return Math.max(0, adv); }
  // returns true on the frame a new beat starts. Nothing advances while there is no music.
  function update(dt) { let adv = 0;
    if (audio) adv = follow(dt); else if (st.mode === 'tap') { adv = dt * st.bpm / 60; st.energy += (0.8 - st.energy) * Math.min(1, dt); st.level = 0; st.locked = true; }
    const playing = adv > 0 || (st.mode === 'tap');
    st.heard += dt; st.act += ((playing ? 1 : 0) - st.act) * Math.min(1, dt * (playing ? 4 : 2.2)); st.pulse *= Math.exp(-dt * 6);
    if (!playing) return false; st.beats += adv; const b = Math.floor(st.beats); if (b !== lastBeat) { lastBeat = b; st.pulse = 1; st.heard = 0; return true; } return false; }
  const nudge = (d) => { st.bpm = Math.min(200, Math.max(50, st.bpm + d)); st.tempo = st.bpm; onChange(st); };
  const setOffset = (sec) => { st.offset = Math.max(-0.3, Math.min(0.3, sec)); try { localStorage.setItem('zeus-beat-offset', String(st.offset)); } catch { /* private window */ } };
  return { state: st, tap, listen, unlisten, stop, update, nudge, setOffset };
}
