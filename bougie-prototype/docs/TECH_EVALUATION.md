# Technology evaluation

Goal: believable, cinematic 2D character animation of Bougie in a browser,
driven in real time (expressions, gaze, lip sync), without faking it with video.

## Options

### Live2D Cubism
The industry standard for exactly this kind of animation (VTubers, gacha and visual-novel characters).
- **How it works:** a layered PSD is imported into Cubism Editor, each part gets a mesh, and
  artists set keyforms on parameters (ParamAngleX, ParamEyeLOpen, ParamMouthOpenY…). Physics
  for hair and accessories is built in. The web SDK (TypeScript/WebGL) plays the model and
  takes parameter values at runtime.
- **Strengths:** highest quality ceiling, mature tooling, physics, a well-known parameter
  standard, and plenty of trained riggers.
- **Limits for us today:** it **requires layered art**, so it can't do anything with the current flat
  sheet. Rigging is manual work in the Editor (days per character for a good rig). The
  SDK and Editor are proprietary: the Editor is paid (with a free tier), and shipping the SDK
  commercially is free below a revenue threshold for small businesses but needs a paid release
  license above it, so check the current terms. React integration is DIY, and community Pixi bindings
  (e.g. pixi-live2d-display) lag behind current Pixi versions.

### PixiJS (WebGL/WebGPU 2D renderer)
- **What it is:** a renderer, not an animation system. It draws sprites, vector graphics and
  **deformable triangle meshes** fast, works with React, and is MIT-licensed.
- **Strengths:** full control, no proprietary format, runs anywhere, and Live2D models can later
  render inside the same Pixi stage.
- **Limits:** we write the rig, deformers and tooling ourselves.

### Mesh-based (deformation) animation
- **What it is:** the technique behind both Live2D and Spine. Pixels are mapped onto a mesh, and
  vertices are moved by deformers driven by parameters.
- It is the only technique that can animate the **flat** art we have, because it moves the
  painting's own pixels.

## Decision

**PixiJS + a custom parameter-driven mesh rig (this prototype), with Live2D-compatible
parameter names.**

- It animates the flat Bougie art **today**, which Live2D cannot.
- The parameter model (`src/rig/params.ts`) maps 1:1 to Live2D's standard IDs
  (`LIVE2D_PARAM_MAP`). Everything above the renderer (idle behaviour, expressions,
  the acted performance, lip sync, voice sync) is renderer-agnostic and would drive a
  Cubism model unchanged.
- Two renderers already share that interface: the flat-art mesh warp and a fully
  layered vector rig, which shows the target part structure.

**Recommended path:** keep this architecture. Once a layered PSD exists, rig it in
Cubism Editor and add a `Live2DRenderer` implementing `CharacterRenderer`. That's the
fastest route to a cinematic rig with hair and accessory physics. The alternative is
extending the in-house mesh rig to textured layers, if avoiding Live2D licensing matters more
than rigging speed.

## Architecture in this repo

```
  Performance timeline ─┐   (anim/performance.ts: authored keyframes, 14.5 s)
  Expressions ──────────┤   (anim/expressions.ts: additive, blendable)
  Idle layer ───────────┤   (anim/idle.ts: blinks, saccades, breathing, head wander)
  Lip sync ─────────────┤   (speech/: phonemes → visemes with coarticulation)
  Pointer / live input ─┘
            │  Animator (anim/animator.ts): blends layers, per-parameter springs
            ▼
       Params (rig/params.ts, Live2D-compatible)
            │
   ┌────────┴─────────┬──────────────────────┐
   ▼                  ▼                      ▼
 FlatImageRig     BougieRig            (future) Live2DRenderer
 mesh warp of     layered vector       Cubism model from
 painted art      stand-in             layered PSD
```
