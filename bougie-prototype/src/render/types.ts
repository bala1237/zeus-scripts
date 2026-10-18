import type { Container } from 'pixi.js';
import type { Params } from '../rig/params';

/** Anything that can turn a parameter set into pixels. */
export interface CharacterRenderer {
  readonly view: Container;
  update(p: Params, dt: number): void;
  destroy?(): void;
}
