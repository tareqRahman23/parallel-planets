import * as THREE from 'three';
import { LooseProduct } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';

export class LooseProductEntity {
  public readonly product: LooseProduct;
  public readonly group: THREE.Group;
  private meshGroup: THREE.Group;
  private isCollecting: boolean = false;
  private collectTargetPos: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  private collectProgress: number = 0;

  constructor(product: LooseProduct) {
    this.product = product;
    this.group = new THREE.Group();
    this.group.position.set(...product.worldPosition);

    this.meshGroup = new THREE.Group();
    this.group.add(this.meshGroup);

    this.buildModel();
  }

  private buildModel(): void {
    const kind = this.product.kind;

    if (kind === 'fur') {
      const geo = new THREE.DodecahedronGeometry(0.28, 1);
      const mat = Materials.getStandard(COLORS.rabbitFurLight, 0.9, 0.0);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.y = 0.25;
      this.meshGroup.add(mesh);
    } else if (kind === 'fertilizer') {
      const geo = new THREE.CylinderGeometry(0.22, 0.26, 0.35, 8);
      const mat = Materials.getStandard(COLORS.soil, 0.8, 0.1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.y = 0.2;
      this.meshGroup.add(mesh);

      // Leaf emblem
      const leafGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
      const leafMesh = new THREE.Mesh(leafGeo, Materials.getStandard(COLORS.leafGreen, 0.6, 0.1));
      leafMesh.position.set(0, 0.38, 0);
      this.meshGroup.add(leafMesh);
    } else if (kind === 'stone') {
      const geo = new THREE.DodecahedronGeometry(0.22, 0);
      const mesh = new THREE.Mesh(geo, Materials.getStandard(COLORS.stone, 0.7, 0.1));
      mesh.castShadow = true;
      mesh.position.y = 0.2;
      this.meshGroup.add(mesh);
    } else if (kind === 'thread') {
      const geo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 10);
      const mat = Materials.getStandard(0x9c88ff, 0.6, 0.2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.y = 0.2;
      this.meshGroup.add(mesh);
    } else if (kind === 'fabric') {
      const geo = new THREE.BoxGeometry(0.35, 0.12, 0.35);
      const mat = Materials.getStandard(0xfbc531, 0.5, 0.2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.y = 0.15;
      this.meshGroup.add(mesh);
    } else if (kind === 'techPart') {
      const geo = new THREE.TorusGeometry(0.18, 0.08, 8, 16);
      const mesh = new THREE.Mesh(geo, Materials.getEmissive(COLORS.techBlue, COLORS.techCyanGlow, 1.2));
      mesh.castShadow = true;
      mesh.position.y = 0.25;
      this.meshGroup.add(mesh);
    } else {
      // Generic workshop item
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mesh = new THREE.Mesh(geo, Materials.getStandard(COLORS.armorSteel, 0.4, 0.6));
      mesh.castShadow = true;
      mesh.position.y = 0.25;
      this.meshGroup.add(mesh);
    }
  }

  public startCollectionAnimation(targetPos: THREE.Vector3): void {
    this.isCollecting = true;
    this.collectTargetPos.copy(targetPos);
  }

  public update(delta: number): boolean {
    if (this.isCollecting) {
      this.collectProgress += delta * 3.5;
      this.group.position.lerp(this.collectTargetPos, 0.15);
      this.group.scale.setScalar(Math.max(0.01, 1.0 - this.collectProgress));
      return this.collectProgress >= 1.0;
    }

    // Idle bobbing & slow spin
    const time = Date.now() * 0.003;
    this.meshGroup.position.y = Math.sin(time) * 0.06;
    this.meshGroup.rotation.y += delta * 1.5;

    // Expiration pulse in the final 8 seconds
    const remaining = this.product.lifetimeSeconds - this.product.ageSeconds;
    if (remaining <= 8.0 && this.product.lifetimeSeconds !== Infinity) {
      const pulse = Math.abs(Math.sin(Date.now() * 0.01));
      this.meshGroup.scale.setScalar(0.85 + pulse * 0.3);
    }

    return false;
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
