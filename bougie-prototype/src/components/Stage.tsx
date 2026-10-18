import { useEffect, useRef } from 'react';
import { Application, Container, Texture } from 'pixi.js';
import { Animator, type AnimatorStatus } from '../anim/animator';
import { DEFAULT_PARAMS } from '../rig/params';
import { BougieRig, PALETTE } from '../render/BougieRig';
import { FlatImageRig } from '../render/FlatImageRig';
import type { Landmarks } from '../render/landmarks';
import type { CharacterRenderer } from '../render/types';

export type RigMode = 'layered' | 'flat';

export interface FlatSource {
  name: string;
  image: HTMLImageElement;
  landmarks: Landmarks;
}

/** Screen transform of the character's design space, for overlays like the landmark editor. */
export interface StageTransform {
  scale: number;
  x: number;
  y: number;
}

interface Props {
  animator: Animator;
  mode: RigMode;
  flat: FlatSource | null;
  /** Freeze in the neutral pose (used while editing landmarks). */
  frozen: boolean;
  showMesh: boolean;
  followPointer: boolean;
  onStatus: (s: AnimatorStatus) => void;
  onTransform?: (t: StageTransform) => void;
}

const textureCache = new WeakMap<HTMLImageElement, Texture>();
function textureFor(img: HTMLImageElement): Texture {
  let t = textureCache.get(img);
  if (!t) {
    t = Texture.from(img);
    textureCache.set(img, t);
  }
  return t;
}

const LAYERED_SIZE = { w: 720, h: 860, ox: 360, oy: 330 };

export function Stage({ animator, mode, flat, frozen, showMesh, followPointer, onStatus, onTransform }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const rootRef = useRef<Container | null>(null);
  const rendererRef = useRef<CharacterRenderer | null>(null);
  const sizeRef = useRef(LAYERED_SIZE);
  // Latest props for the ticker without re-subscribing.
  const live = useRef({ frozen, onStatus, onTransform, followPointer });
  live.current = { frozen, onStatus, onTransform, followPointer };

  // Create the Pixi application once.
  useEffect(() => {
    const host = hostRef.current!;
    const app = new Application();
    let cancelled = false;
    let statusClock = 0;
    let lastT = '';
    (async () => {
      await app.init({
        resizeTo: host,
        background: PALETTE.background,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);
      appRef.current = app;
      const root = new Container();
      app.stage.addChild(root);
      rootRef.current = root;
      (window as unknown as { __bougie: unknown }).__bougie = { app, animator, root };

      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const r = rendererRef.current;
        // Fit the character into the canvas.
        const W = app.screen.width;
        const H = app.screen.height;
        const s = sizeRef.current;
        const scale = Math.min(W / s.w, H / s.h) * 0.98;
        root.scale.set(scale);
        root.position.set(W / 2 - (s.w / 2 - s.ox) * scale, H / 2 - (s.h / 2 - s.oy) * scale);
        const tf = { scale, x: root.position.x - s.ox * scale, y: root.position.y - s.oy * scale };
        const key = `${tf.scale.toFixed(4)},${tf.x.toFixed(1)},${tf.y.toFixed(1)}`;
        if (key !== lastT) {
          lastT = key;
          live.current.onTransform?.(tf);
        }
        if (!r) return;
        if (live.current.frozen) {
          r.update(DEFAULT_PARAMS, dt);
          return;
        }
        const params = animator.update(dt);
        r.update(params, dt);
        statusClock += dt;
        if (statusClock > 0.05) {
          statusClock = 0;
          live.current.onStatus(animator.status);
        }
      });
    })();
    return () => {
      cancelled = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [animator]);

  // Swap renderers when the mode or flat source changes.
  useEffect(() => {
    let raf = 0;
    const attach = () => {
      const root = rootRef.current;
      if (!root) {
        raf = requestAnimationFrame(attach);
        return;
      }
      if (rendererRef.current) {
        root.removeChild(rendererRef.current.view);
        rendererRef.current.view.destroy({ children: true });
        rendererRef.current = null;
      }
      if (mode === 'flat' && flat) {
        const tex = textureFor(flat.image);
        const r = new FlatImageRig(tex, flat.landmarks, showMesh);
        sizeRef.current = { w: flat.image.naturalWidth, h: flat.image.naturalHeight, ox: 0, oy: 0 };
        rendererRef.current = r;
        root.addChild(r.view);
      } else {
        const r = new BougieRig();
        sizeRef.current = LAYERED_SIZE;
        rendererRef.current = r;
        root.addChild(r.view);
      }
    };
    attach();
    return () => cancelAnimationFrame(raf);
  }, [mode, flat, showMesh]);

  // Pointer -> gaze (real-time interaction hook).
  useEffect(() => {
    const host = hostRef.current!;
    const move = (e: PointerEvent) => {
      if (!live.current.followPointer) return animator.setPointer(null);
      const rect = host.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      animator.setPointer({ x: Math.max(-1, Math.min(1, x * 1.3)), y: Math.max(-1, Math.min(1, y * 1.3 + 0.2)) });
    };
    const leave = () => animator.setPointer(null);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [animator]);

  useEffect(() => {
    if (!followPointer) animator.setPointer(null);
  }, [followPointer, animator]);

  return <div className="stage" ref={hostRef} />;
}
