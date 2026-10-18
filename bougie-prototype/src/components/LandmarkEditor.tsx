import { useRef } from 'react';
import type { StageTransform } from './Stage';
import { LANDMARK_KEYS, LANDMARK_LABELS, type Box, type LandmarkKey, type Landmarks } from '../render/landmarks';

interface Props {
  landmarks: Landmarks;
  transform: StageTransform;
  onChange: (lm: Landmarks) => void;
}

const COLORS: Record<LandmarkKey, string> = {
  face: '#7cf2d0',
  eyeL: '#ffd166',
  eyeR: '#ffd166',
  browL: '#ef8bff',
  browR: '#ef8bff',
  mouth: '#ff7b7b',
};
const PIN_COLOR = '#8ab4ff';

type Target = LandmarkKey | 'neck' | number; // number = pin index
type Drag = { target: Target; part: 'center' | 'w' | 'h'; sx: number; sy: number; orig: Landmarks };

function boxOf(lm: Landmarks, t: Target): Box | null {
  if (t === 'neck') return null;
  if (typeof t === 'number') return lm.pins?.[t] ?? null;
  return lm[t];
}

/**
 * Drag handles over the flat image to mark where each feature is.
 * Centre handle moves a feature, the side handles set its half-width and
 * half-height along the head's (tilted) axes.
 */
export function LandmarkEditor({ landmarks, transform, onChange }: Props) {
  const drag = useRef<Drag | null>(null);
  const { scale, x: ox, y: oy } = transform;
  const tilt = landmarks.tilt ?? 0;
  const ct = Math.cos((tilt * Math.PI) / 180);
  const st = Math.sin((tilt * Math.PI) / 180);
  const toScreen = (x: number, y: number) => [ox + x * scale, oy + y * scale];

  const begin = (e: React.PointerEvent, target: Target, part: Drag['part']) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { target, part, sx: e.clientX, sy: e.clientY, orig: structuredClone(landmarks) };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / scale;
    const dy = (e.clientY - d.sy) / scale;
    const next = structuredClone(d.orig);
    if (d.target === 'neck') {
      next.neckY = d.orig.neckY + dy;
    } else {
      const b = boxOf(next, d.target)!;
      const o = boxOf(d.orig, d.target)!;
      // Project the drag onto the head's tilted axes for size handles.
      const along = dx * ct + dy * st;
      const across = -dx * st + dy * ct;
      if (d.part === 'center') {
        b.cx = o.cx + dx;
        b.cy = o.cy + dy;
      } else if (d.part === 'w') b.w = Math.max(2, o.w + along);
      else b.h = Math.max(1.5, o.h + across);
    }
    onChange(next);
  };
  const end = () => {
    drag.current = null;
  };

  const renderBox = (b: Box, target: Target, color: string, label: string, labelLeft: boolean) => {
    const [cx, cy] = toScreen(b.cx, b.cy);
    const rx = b.w * scale;
    const ry = b.h * scale;
    const key = String(target);
    return (
      <g key={key}>
        <g transform={`rotate(${tilt} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={1.5} />
          <rect x={cx + rx - 4} y={cy - 4} width={8} height={8} fill={color} className="handle" onPointerDown={(e) => begin(e, target, 'w')} />
          <rect x={cx - 4} y={cy + ry - 4} width={8} height={8} fill={color} className="handle" onPointerDown={(e) => begin(e, target, 'h')} />
          <text
            x={labelLeft ? cx - rx - 6 : cx + rx + 6}
            y={cy - ry - 3}
            textAnchor={labelLeft ? 'end' : 'start'}
            fill={color}
            fontSize={11}
          >
            {label}
          </text>
        </g>
        <circle cx={cx} cy={cy} r={5} fill={color} className="handle" onPointerDown={(e) => begin(e, target, 'center')} />
      </g>
    );
  };

  const f = landmarks.face;
  const [px, py] = toScreen(f.cx - (landmarks.neckY - f.cy) * st, f.cy + (landmarks.neckY - f.cy) * ct);

  return (
    <svg className="landmark-editor" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <line x1={px - 60} y1={py} x2={px + 60} y2={py} stroke={PIN_COLOR} strokeWidth={1.5} strokeDasharray="5 4" transform={`rotate(${tilt} ${px} ${py})`} />
      <circle cx={px} cy={py} r={6} fill={PIN_COLOR} className="handle" onPointerDown={(e) => begin(e, 'neck', 'center')} />
      <text x={px + 10} y={py + 16} fill={PIN_COLOR} fontSize={11}>
        neck pivot
      </text>
      {LANDMARK_KEYS.map((k) => renderBox(landmarks[k], k, COLORS[k], LANDMARK_LABELS[k], k.endsWith('R')))}
      {(landmarks.pins ?? []).map((b, i) => renderBox(b, i, PIN_COLOR, `Pin ${i + 1}`, false))}
    </svg>
  );
}
