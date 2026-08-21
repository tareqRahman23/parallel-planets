import * as THREE from 'three';
import { StoneNodeState } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';

export class StoneNode {
  public readonly state: StoneNodeState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;
  private mainBoulders: THREE.Mesh[] = [];
  private chargePips: THREE.Mesh[] = [];

  constructor(state: StoneNodeState) {
    this.state = state;
    this.position = new THREE.Vector3(...state.position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.buildModel();
  }

  private buildModel(): void {
    // Center base rock
    const baseGeo = new THREE.DodecahedronGeometry(1.1, 1);
    const baseMesh = new THREE.Mesh(baseGeo, Materials.getStandard(COLORS.stone, 0.8, 0.1));
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.position.y = 0.5;
    baseMesh.scale.set(1.1, 0.7, 1.0);
    this.group.add(baseMesh);
    this.mainBoulders.push(baseMesh);

    // 3 charge pips around the node
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const x = Math.cos(angle) * 0.9;
      const z = Math.sin(angle) * 0.9;

      const pipGeo = new THREE.DodecahedronGeometry(0.28, 0);
      const pipMesh = new THREE.Mesh(pipGeo, Materials.getStandard(COLORS.stoneHighlight, 0.5, 0.2));
      pipMesh.castShadow = true;
      pipMesh.position.set(x, 0.2, z);
      this.chargePips.push(pipMesh);
      this.group.add(pipMesh);
    }
  }

  public onMinedFeedback(): void {
    // Squash & stretch pulse
    this.group.scale.set(1.25, 0.75, 1.25);
    setTimeout(() => {
      if (this.group) this.group.scale.set(1, 1, 1);
    }, 120);
  }

  public update(_delta: number): void {
    const charges = this.state.charges;
    this.chargePips.forEach((pip, idx) => {
      pip.visible = idx < charges;
    });
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
