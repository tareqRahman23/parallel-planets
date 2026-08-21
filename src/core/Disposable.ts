import * as THREE from 'three';

export interface IDisposable {
  dispose(): void;
}

export function disposeHierarchy(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    } else if ((obj as THREE.Light).isLight) {
      const light = obj as THREE.Light;
      if (light.dispose) {
        light.dispose();
      }
    }
  });
}
