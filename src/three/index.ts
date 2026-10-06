/**
 * three/ — interactive 3D viewers for the GOAT Hoopers 3D assets.
 *
 * The GLB assets live in `public/3d/` (built by the Blender pipeline in
 * `3d/`). These components load them with three.js, play ambient idle
 * loops, and fire juicy one-shot click animations via AnimationMixer.
 *
 * Everything here is client-side ("use client") — three.js never runs
 * during SSR. Components render a plain div on the server and hydrate
 * the canvas in an effect.
 */
export { GLBViewer } from "./GLBViewer";
export { HooperViewer } from "./HooperViewer";
export { PropViewer } from "./PropViewer";
export type { GLBViewerProps } from "./GLBViewer";
export type { HooperViewerProps } from "./HooperViewer";
export type { PropViewerProps, PropKind } from "./PropViewer";
