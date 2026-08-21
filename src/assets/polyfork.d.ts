declare module '*.mjs' {
  import type * as THREE from 'three';

  export function createAsset(options?: Record<string, unknown>): THREE.Group;
}
