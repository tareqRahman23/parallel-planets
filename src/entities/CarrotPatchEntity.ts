import * as THREE from 'three';
import { CarrotPatchState } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';
import { createPolyforkCarrot } from '../models/polyforkAssets';

export class CarrotPatchEntity {
  public readonly patch: CarrotPatchState;
  public readonly group: THREE.Group;
  private carrotMeshes: THREE.Group[] = [];
  private soilMesh: THREE.Mesh;
  private fertilizerIndicator: THREE.Mesh | null = null;

  constructor(patch: CarrotPatchState) {
    this.patch = patch;
    this.group = new THREE.Group();
    this.group.position.set(...patch.position);

    // Soil mound
    const soilGeo = new THREE.CylinderGeometry(1.0, 1.15, 0.12, 16);
    const soilMat = Materials.getStandard(COLORS.soil, 0.85, 0.05);
    this.soilMesh = new THREE.Mesh(soilGeo, soilMat);
    this.soilMesh.receiveShadow = true;
    this.group.add(this.soilMesh);

    this.rebuildCarrots();
  }

  public rebuildCarrots(): void {
    // Clear old carrots
    this.carrotMeshes.forEach((c) => this.group.remove(c));
    this.carrotMeshes = [];

    const count = this.patch.fertilized ? 8 : 3;
    const radius = this.patch.fertilized ? 0.7 : 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = i === 0 && this.patch.fertilized ? 0 : radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const carrotGroup = createPolyforkCarrot();
      carrotGroup.position.set(x, 0.06, z);

      this.carrotMeshes.push(carrotGroup);
      this.group.add(carrotGroup);
    }

    if (this.patch.fertilized && !this.fertilizerIndicator) {
      const ringGeo = new THREE.RingGeometry(0.9, 1.05, 16);
      const ringMat = Materials.getTransparent(0x4cd137, 0.8, 0x4cd137);
      this.fertilizerIndicator = new THREE.Mesh(ringGeo, ringMat);
      this.fertilizerIndicator.rotation.x = -Math.PI / 2;
      this.fertilizerIndicator.position.y = 0.08;
      this.group.add(this.fertilizerIndicator);
    }
  }

  public update(delta: number): void {
    const isGrowing = this.patch.status === 'growing';
    const progress = THREE.MathUtils.clamp(
      this.patch.growthElapsedSeconds / Math.max(0.1, this.patch.growthDurationSeconds),
      0,
      1
    );

    const activeCount = this.patch.foodUnits;

    this.carrotMeshes.forEach((mesh, idx) => {
      if (idx < activeCount) {
        mesh.visible = true;
        if (isGrowing) {
          mesh.scale.setScalar(Math.max(0.2, progress));
        } else {
          mesh.scale.setScalar(1.0);
        }
      } else {
        mesh.visible = false;
      }
    });

    if (this.patch.status === 'depleted') {
      this.group.scale.y = Math.max(0.05, this.group.scale.y - delta * 1.5);
    }
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
