// The beat: a clock at a tempo, set by tapping in time or by listening to the music.
//   const beat = createBeat({ onChange });   beat.update(dt) every frame;   beat.tap();   await beat.listen();   beat.unlisten();
//   beat.state: bpm, beats (a running count, fractions included), pulse (1 on each beat, fading), energy (how loud, 0 to 1), listening
export function createBeat({ bpm = 120, onChange = () => {} } = {}) {
  const st = { bpm, beats: 0, pulse: 0, energy: 0.7, listening: false, testBpm: 128 };
  const taps = []; let audio = null, lastOnset = 0, avg = 0, onsets = [], lastBeat = -1;
  function tap(now = performance.now() / 1000) { if (taps.length && (now - taps.at(-1) > 2.5 || now < taps.at(-1))) taps.length = 0;   // a pause starts a fresh count
    taps.push(now); while (taps.length > 6) taps.shift(); if (taps.length >= 3) { const d = (taps.at(-1) - taps[0]) / (taps.length - 1); st.bpm = Math.round(Math.min(200, Math.max(50, 60 / d))); } st.beats = Math.ceil(st.beats); st.pulse = 1; onChange(st); }
  // Listening: Chrome is asked to share a tab or the screen "with audio"; if that is refused it falls back to the default sound input.
  // source 'test' feeds a made-up kick drum at state.testBpm, to check the detector without any music.
  async function listen(source = 'share') { const ctx = new (window.AudioContext || window.webkitAudioContext)(), an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.5; let stream = null;
    if (source === 'test') { const osc = ctx.createOscillator(), g = ctx.createGain(); osc.frequency.value = 62; g.gain.value = 0; osc.connect(g); g.connect(an); osc.start(); const gap = 60 / st.testBpm, t0 = ctx.currentTime + 0.3; for (let i = 0; i < 200; i++) { g.gain.setValueAtTime(1, t0 + i * gap); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * gap + 0.16); } }
    else { const plain = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: plain }); if (!stream.getAudioTracks().length) { stream.getTracks().forEach((t) => t.stop()); stream = null; } else stream.getVideoTracks().forEach((t) => t.stop()); } catch { stream = null; }
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: plain });
      ctx.createMediaStreamSource(stream).connect(an); }
    if (ctx.state === 'suspended') await ctx.resume(); audio = { ctx, an, data: new Uint8Array(an.frequencyBinCount), stream }; st.listening = true; onsets = []; avg = 0; onChange(st); }
  function unlisten() { if (!audio) return; audio.stream?.getTracks().forEach((t) => t.stop()); audio.ctx.close(); audio = null; st.listening = false; onChange(st); }
  // bass and all are the loudness of the low notes and of everything, 0 to 1. A beat is the bass jumping well above its recent average.
  function level(bass, all, now, dt) { st.energy += (Math.min(1, all * 2.6) - st.energy) * Math.min(1, dt * 4); avg += (bass - avg) * Math.min(1, dt * 1.6);
    if (bass > avg * 1.3 + 0.05 && bass > 0.18 && now - lastOnset > 0.27) { const gap = now - lastOnset; lastOnset = now; st.pulse = 1;
      if (gap < 2) { let g = gap; while (g < 60 / 165) g *= 2; while (g > 60 / 75) g /= 2; onsets.push(g); if (onsets.length > 12) onsets.shift(); if (onsets.length >= 4) { const m = [...onsets].sort((a, b) => a - b)[onsets.length >> 1], v = Math.round(60 / m); if (v !== st.bpm) { st.bpm = v; onChange(st); } } }
      st.beats = Math.round(st.beats); } }
  // returns true on the frame a new beat starts
  function update(dt) { if (audio) { const { an, data } = audio; an.getByteFrequencyData(data); let bass = 0, all = 0; for (let i = 1; i <= 5; i++) bass += data[i]; bass /= 5 * 255; for (let i = 1; i < 120; i++) all += data[i]; all /= 119 * 255; level(bass, all, performance.now() / 1000, dt); }
    else st.energy += (0.8 - st.energy) * Math.min(1, dt);
    st.beats += dt * st.bpm / 60; st.pulse *= Math.exp(-dt * 5.5); const b = Math.floor(st.beats); if (b !== lastBeat) { lastBeat = b; if (!audio) st.pulse = 1; return true; } return false; }
  const nudge = (d) => { st.bpm = Math.min(200, Math.max(50, st.bpm + d)); onChange(st); };
  return { state: st, tap, listen, unlisten, level, update, nudge };
}
