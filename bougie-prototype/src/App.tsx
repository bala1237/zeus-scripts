import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animator, type AnimatorStatus } from './anim/animator';
import { EXPRESSION_IDS, type ExpressionId } from './anim/expressions';
import { Stage, type FlatSource, type RigMode, type StageTransform } from './components/Stage';
import { LandmarkEditor } from './components/LandmarkEditor';
import { PERFORMANCE_DURATION, WORDS } from './speech/dialogue';
import { listVoices, onVoicesChanged, ttsSupported } from './speech/tts';
import {
  clearStoredLandmarks,
  guessLandmarks,
  loadStoredLandmarks,
  storeLandmarks,
  type Landmarks,
} from './render/landmarks';
import './App.css';

const EXPRESSION_LABELS: Record<ExpressionId, string> = {
  skeptical: 'Skeptical brow',
  incredulous: 'Incredulous',
  sarcastic: 'Sarcastic smile',
  smile: 'Smile',
  surprise: 'Surprise',
  mischief: 'Mischievous',
  deadpan: 'Deadpan',
};

/** Beats shown on the timeline. */
const BEATS: [number, string][] = [
  [0, 'neutral'],
  [1.4, 'brow up'],
  [2.0, 'sarcastic'],
  [2.75, 'eye roll'],
  [3.2, 'incredulous'],
  [5.0, 'confident'],
  [6.7, 'side glance'],
  [9.0, 'sarcastic'],
  [11.6, 'mischief'],
  [13.4, 'idle'],
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Flat sources shipped in public/. Each is <name>.png plus <name>.landmarks.json.
 * Drop new art in public/ and add it here, or use "Load image…" in the app.
 */
const SOURCES: { name: string; label: string }[] = [
  { name: 'bougie', label: 'Bougie: hero portrait (reference sheet)' },
  { name: 'bougie-front', label: 'Bougie: front view (reference sheet, low-res)' },
  { name: 'sample-flat', label: 'Stand-in rig, flattened (for comparison)' },
];

async function loadFlatSource(name: string): Promise<FlatSource | null> {
  try {
    const image = await loadImage(`${import.meta.env.BASE_URL}${name}.png`);
    const lm =
      loadStoredLandmarks(name) ??
      (await fetchJson<Landmarks>(`${import.meta.env.BASE_URL}${name}.landmarks.json`)) ??
      guessLandmarks(image.naturalWidth, image.naturalHeight);
    return { name, image, landmarks: lm };
  } catch {
    return null;
  }
}

export default function App() {
  const animator = useMemo(() => new Animator(), []);
  const [status, setStatus] = useState<AnimatorStatus>(animator.status);
  const [mode, setMode] = useState<RigMode>('flat');
  const [flat, setFlat] = useState<FlatSource | null>(null);
  const [editing, setEditing] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [transform, setTransform] = useState<StageTransform | null>(null);
  const [voiceOn, setVoiceOn] = useState(ttsSupported());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [expression, setExpression] = useState<ExpressionId | null>(null);
  const [followPointer, setFollowPointer] = useState(true);

  const [sourceName, setSourceName] = useState(SOURCES[0].name);
  useEffect(() => {
    if (!SOURCES.some((x) => x.name === sourceName)) return; // an uploaded image
    let cancelled = false;
    loadFlatSource(sourceName).then((f) => {
      if (cancelled) return;
      setFlat(f);
      if (!f) setMode('layered');
    });
    return () => {
      cancelled = true;
    };
  }, [sourceName]);

  useEffect(() => {
    const refresh = () => {
      const v = listVoices();
      setVoices(v);
      setVoiceURI((cur) => cur ?? v.find((x) => x.localService)?.voiceURI ?? v[0]?.voiceURI ?? null);
    };
    refresh();
    return onVoicesChanged(refresh);
  }, []);

  useEffect(() => () => animator.dispose(), [animator]);

  const play = () => {
    setExpression(null);
    setEditing(false);
    animator.play({ voice: voiceOn, voiceURI });
  };
  const reset = () => {
    setExpression(null);
    animator.reset();
    setStatus(animator.status);
  };
  const pickExpression = (id: ExpressionId | null) => {
    setExpression(id);
    animator.setManualExpression(id);
  };

  const updateLandmarks = useCallback(
    (lm: Landmarks) => {
      setFlat((f) => {
        if (!f) return f;
        storeLandmarks(f.name, lm);
        return { ...f, landmarks: lm };
      });
    },
    [setFlat],
  );

  const onUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const image = await loadImage(url);
    const name = file.name.replace(/\.[^.]+$/, '');
    const landmarks = loadStoredLandmarks(name) ?? guessLandmarks(image.naturalWidth, image.naturalHeight);
    setSourceName(name);
    setFlat({ name, image, landmarks });
    setMode('flat');
    setEditing(!loadStoredLandmarks(name));
  };

  const onImportLandmarks = async (file: File) => {
    const lm = JSON.parse(await file.text()) as Landmarks;
    updateLandmarks(lm);
  };

  const exportLandmarks = () => {
    if (!flat) return;
    const blob = new Blob([JSON.stringify(flat.landmarks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${flat.name}.landmarks.json`;
    a.click();
  };

  const playing = status.state === 'playing';
  const progress = Math.min(1, status.time / PERFORMANCE_DURATION);

  return (
    <div className="app">
      <header>
        <h1>Bougie</h1>
        <span className="subtitle">Zeus World · 2D character animation prototype</span>
      </header>

      <main>
        <section className="stage-wrap">
          <div className="stage-box">
            <Stage
              animator={animator}
              mode={mode}
              flat={flat}
              frozen={editing && mode === 'flat'}
              showMesh={showMesh}
              followPointer={followPointer}
              onStatus={setStatus}
              onTransform={setTransform}
            />
            {editing && mode === 'flat' && flat && transform && (
              <LandmarkEditor landmarks={flat.landmarks} transform={transform} onChange={updateLandmarks} />
            )}
          </div>
          <div className="captions" aria-live="polite">
            {WORDS.map((w, i) => (
              <span key={i} className={i === status.wordIndex ? 'word active' : i < status.wordIndex || (status.wordIndex < 0 && status.time > w.end && playing) ? 'word said' : 'word'}>
                {w.text}{' '}
              </span>
            ))}
          </div>
        </section>

        <aside className="panel">
          <div className="transport">
            <button className="primary" onClick={play} disabled={editing}>
              {playing ? '↻ Replay' : '▶ Play'}
            </button>
            <button onClick={reset}>■ Reset</button>
          </div>

          <div className="timeline" title="Performance timeline">
            <div className="bar">
              <div className="fill" style={{ width: `${progress * 100}%` }} />
              {BEATS.map(([t, label]) => (
                <div key={t} className="beat" style={{ left: `${(t / PERFORMANCE_DURATION) * 100}%` }} title={label} />
              ))}
            </div>
            <div className="time">
              {status.time.toFixed(1)}s / {PERFORMANCE_DURATION.toFixed(1)}s
              {playing && voiceOn && <span className={`voice-state ${status.voice}`}>voice: {status.voice}</span>}
            </div>
          </div>

          <fieldset>
            <legend>Voice</legend>
            {ttsSupported() ? (
              <>
                <label className="row">
                  <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
                  Speak the line (browser TTS stand-in)
                </label>
                <select value={voiceURI ?? ''} onChange={(e) => setVoiceURI(e.target.value)} disabled={!voiceOn || !voices.length}>
                  {voices.length === 0 && <option value="">No English voices found</option>}
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} {v.localService ? '' : '(online)'}
                    </option>
                  ))}
                </select>
                <p className="hint">Lips follow authored phoneme timing, re-synced to the voice at every word. Local voices sync best.</p>
              </>
            ) : (
              <p className="hint">This browser has no speech synthesis; the performance runs silently.</p>
            )}
          </fieldset>

          <fieldset>
            <legend>Live expression (real-time)</legend>
            <div className="chips">
              <button className={expression === null ? 'chip on' : 'chip'} onClick={() => pickExpression(null)} disabled={playing}>
                Neutral
              </button>
              {EXPRESSION_IDS.map((id) => (
                <button key={id} className={expression === id ? 'chip on' : 'chip'} onClick={() => pickExpression(id)} disabled={playing}>
                  {EXPRESSION_LABELS[id]}
                </button>
              ))}
            </div>
            <label className="row">
              <input type="checkbox" checked={followPointer} onChange={(e) => setFollowPointer(e.target.checked)} />
              Eyes and head follow the pointer when idle
            </label>
          </fieldset>

          <fieldset>
            <legend>Character source</legend>
            <label className="row">
              <input type="radio" name="mode" checked={mode === 'flat'} onChange={() => setMode('flat')} disabled={!flat} />
              Painted art + mesh warp
            </label>
            <label className="row">
              <input type="radio" name="mode" checked={mode === 'layered'} onChange={() => setMode('layered')} />
              Layered vector rig (stand-in, shows the target part structure)
            </label>
            {mode === 'flat' && (
              <div className="flat-tools">
                <select value={sourceName} onChange={(e) => setSourceName(e.target.value)}>
                  {SOURCES.map((x) => (
                    <option key={x.name} value={x.name}>
                      {x.label}
                    </option>
                  ))}
                  {!SOURCES.some((x) => x.name === sourceName) && <option value={sourceName}>{sourceName} (uploaded)</option>}
                </select>
                <label className="file">
                  Load reference image…
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </label>
                <button onClick={() => setEditing((v) => !v)} className={editing ? 'on' : ''}>
                  {editing ? '✓ Done marking features' : 'Mark features (landmarks)'}
                </button>
                {editing && flat && (
                  <div className="editor-tools">
                    <label className="row">
                      Head tilt in art
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        step={0.5}
                        value={flat.landmarks.tilt ?? 0}
                        onChange={(e) => updateLandmarks({ ...flat.landmarks, tilt: Number(e.target.value) })}
                      />
                      <span>{(flat.landmarks.tilt ?? 0).toFixed(1)}°</span>
                    </label>
                    <div className="row-buttons">
                      <button
                        onClick={() => {
                          const f = flat.landmarks.face;
                          updateLandmarks({ ...flat.landmarks, pins: [...(flat.landmarks.pins ?? []), { cx: f.cx + f.w, cy: f.cy + f.h, w: f.w * 0.3, h: f.w * 0.3 }] });
                        }}
                      >
                        + Pin (hand, prop)
                      </button>
                      <button
                        disabled={!flat.landmarks.pins?.length}
                        onClick={() => updateLandmarks({ ...flat.landmarks, pins: (flat.landmarks.pins ?? []).slice(0, -1) })}
                      >
                        − Pin
                      </button>
                    </div>
                  </div>
                )}
                <label className="row">
                  <input type="checkbox" checked={showMesh} onChange={(e) => setShowMesh(e.target.checked)} />
                  Show deformation mesh
                </label>
                <div className="row-buttons">
                  <button onClick={exportLandmarks}>Export landmarks</button>
                  <label className="file small">
                    Import…
                    <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && onImportLandmarks(e.target.files[0])} />
                  </label>
                  <button
                    onClick={() => {
                      if (!flat) return;
                      clearStoredLandmarks(flat.name);
                      loadFlatSource(flat.name).then((f) => f && setFlat(f));
                    }}
                  >
                    Revert
                  </button>
                </div>
                <p className="hint">
                  Everything moves the painting's own pixels except the inside of an opened mouth, which the art never
                  shows and is painted in. See docs/ARTWORK_ASSESSMENT.md.
                </p>
              </div>
            )}
          </fieldset>
        </aside>
      </main>
    </div>
  );
}
