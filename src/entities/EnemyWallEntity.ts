import * as THREE from 'three';
import { EnemyWallState } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';
import { ICombatant } from './Entity';
import { GameEvents } from '../app/GameEvents';

export class EnemyWallEntity implements ICombatant {
  public readonly wall: EnemyWallState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;

  private activeMesh: THREE.Mesh;
  private rubbleGroup: THREE.Group;

  constructor(wall: EnemyWallState) {
    this.wall = wall;
    this.position = new THREE.Vector3(...wall.position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Intact wall block
    const blockGeo = new THREE.BoxGeometry(0.9, 1.1, 0.9);
    const blockMat = Materials.getStandard(COLORS.enemyDark, 0.8, 0.3);
    this.activeMesh = new THREE.Mesh(blockGeo, blockMat);
    this.activeMesh.position.y = 0.55;
    this.activeMesh.castShadow = true;
    this.activeMesh.receiveShadow = true;
    this.group.add(this.activeMesh);

    // Glowing red seam
    const seamGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
    const seamMat = Materials.getEmissive(COLORS.enemyRed, COLORS.enemyEmissive, 1.5);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.y = 0.55;
    this.group.add(seam);

    // Rubble
    this.rubbleGroup = new THREE.Group();
    this.rubbleGroup.visible = false;
    this.group.add(this.rubbleGroup);

    for (let i = 0; i < 4; i++) {
      const chunkGeo = new THREE.DodecahedronGeometry(0.2, 0);
      const chunk = new THREE.Mesh(chunkGeo, blockMat);
      chunk.position.set(
        (Math.random() - 0.5) * 0.7,
        0.1,
        (Math.random() - 0.5) * 0.7
      );
      this.rubbleGroup.add(chunk);
    }
  }

  public get id(): string {
    return this.wall.id;
  }

  public get isAlive(): boolean {
    return this.wall.health > 0 && !this.wall.isDead;
  }

  public get isDead(): boolean {
    return !this.isAlive;
  }

  public get currentHealth(): number {
    return this.wall.health;
  }

  public get maxHealth(): number {
    return this.wall.maxHealth;
  }

  public takeDamage(amount: number): number {
    if (!this.isAlive) return 0;
    const actual = Math.min(this.wall.health, amount);
    this.wall.health = Math.max(0, this.wall.health - actual);

    this.activeMesh.scale.y = 0.8;
    setTimeout(() => {
      if (this.activeMesh) this.activeMesh.scale.y = 1.0;
    }, 100);

    if (this.wall.health <= 0) {
      this.wall.isDead = true;
      this.activeMesh.visible = false;
      this.rubbleGroup.visible = true;
      GameEvents.emit('wall-destroyed', this.wall);
    }

    return actual;
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
