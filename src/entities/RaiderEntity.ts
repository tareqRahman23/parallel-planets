import * as THREE from 'three';
import { RaiderState } from '../app/GameSession';
import { Materials } from '../models/materials';
import { ICombatant } from './Entity';

export class RaiderEntity implements ICombatant {
  public readonly raider: RaiderState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;

  private bodyMesh: THREE.Mesh;
  private sackMesh: THREE.Mesh;
  private cageRings: THREE.Mesh[] = [];

  constructor(raider: RaiderState) {
    this.raider = raider;
    this.position = new THREE.Vector3(...raider.position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    const isBrute = raider.kind === 'brute';

    // Body
    const bodyGeo = isBrute
      ? new THREE.BoxGeometry(1.2, 1.4, 1.2)
      : new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isBrute ? 0x962d3e : 0xd35400,
      roughness: 0.6,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = isBrute ? 0.7 : 0.45;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Glowing alien eye/visor
    const visorGeo = new THREE.BoxGeometry(isBrute ? 0.8 : 0.4, 0.15, 0.2);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, isBrute ? 1.1 : 0.7, isBrute ? 0.6 : 0.35);
    this.group.add(visor);

    // Carried Sack
    const sackGeo = new THREE.SphereGeometry(isBrute ? 0.4 : 0.25, 8, 8);
    const sackMat = Materials.getStandard(0x8e44ad);
    this.sackMesh = new THREE.Mesh(sackGeo, sackMat);
    this.sackMesh.position.set(0.3, isBrute ? 0.9 : 0.5, 0.3);
    this.sackMesh.visible = false;
    this.group.add(this.sackMesh);

    // 4 Cage Ring Segments
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(isBrute ? 0.9 : 0.6, 0.05, 8, 16);
      const ringMat = Materials.getEmissive(0x3498db, 0x2980b9, 1.5);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.25 + i * (isBrute ? 0.35 : 0.22);
      ringMesh.visible = false;
      this.cageRings.push(ringMesh);
      this.group.add(ringMesh);
    }
  }

  public get id(): string {
    return this.raider.id;
  }

  public get isDead(): boolean {
    return this.raider.health <= 0;
  }

  public get isAlive(): boolean {
    return this.raider.health > 0;
  }

  public get currentHealth(): number {
    return this.raider.health;
  }

  public get maxHealth(): number {
    return this.raider.maxHealth;
  }

  public takeDamage(amount: number): number {
    if (!this.isAlive) return 0;
    const actual = Math.min(this.raider.health, amount);
    this.raider.health -= actual;

    // Hit squash
    this.group.scale.y = 0.8;
    setTimeout(() => {
      if (this.group) this.group.scale.y = 1.0;
    }, 100);

    return actual;
  }

  public update(delta: number): void {
    this.position.set(...this.raider.position);
    this.group.position.copy(this.position);

    // Check carried goods
    const isCarrying = Object.values(this.raider.carriedGoods).some((v) => (v || 0) > 0);
    this.sackMesh.visible = isCarrying;

    // Update cage rings
    const segments = this.raider.cageSegments;
    const isStunned = this.raider.isStunned;

    this.cageRings.forEach((ring, idx) => {
      ring.visible = isStunned || idx < segments;
      if (ring.visible) {
        ring.rotation.z += delta * 3;
      }
    });

    if (isStunned) {
      this.group.rotation.z = Math.PI / 2; // Lie down
    } else {
      this.group.rotation.z = 0;
    }
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
