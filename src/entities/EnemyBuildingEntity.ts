import * as THREE from 'three';
import { EnemyBuildingState, GameSession } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';
import { ICombatant } from './Entity';
import { GameEvents } from '../app/GameEvents';
import { GAME_CONFIG } from '../app/GameConfig';

export class EnemyBuildingEntity implements ICombatant {
  public readonly building: EnemyBuildingState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;

  private activeGroup: THREE.Group;
  private rubbleGroup: THREE.Group;
  private rotatingParts: THREE.Object3D[] = [];
  private session: GameSession;

  constructor(session: GameSession, building: EnemyBuildingState) {
    this.session = session;
    this.building = building;
    this.position = new THREE.Vector3(...building.position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.activeGroup = new THREE.Group();
    this.rubbleGroup = new THREE.Group();
    this.rubbleGroup.visible = false;

    this.group.add(this.activeGroup);
    this.group.add(this.rubbleGroup);

    this.buildModel();
    this.buildRubbleModel();
  }

  public get id(): string {
    return this.building.id;
  }

  public get isAlive(): boolean {
    return this.building.health > 0 && !this.building.isDead;
  }

  public get isDead(): boolean {
    return !this.isAlive;
  }

  public get currentHealth(): number {
    return this.building.health;
  }

  public get maxHealth(): number {
    return this.building.maxHealth;
  }

  public get isDefense(): boolean {
    return this.building.isDefense;
  }

  private buildModel(): void {
    const kind = this.building.kind;
    const darkMetal = Materials.getStandard(COLORS.rocketDark, 0.7, 0.4);

    if (kind === 'core') {
      // Pedestal
      const pedGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.8, 8);
      const pedMesh = new THREE.Mesh(pedGeo, darkMetal);
      pedMesh.position.y = 0.4;
      pedMesh.castShadow = true;
      this.activeGroup.add(pedMesh);

      // Core Crystal
      const crystalGeo = new THREE.OctahedronGeometry(1.0, 0);
      const crystalMat = Materials.getEmissive(0xff0044, 0xaa0022, 1.6, 0.2);
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 1.6;
      crystal.scale.set(0.9, 1.4, 0.9);
      crystal.castShadow = true;
      this.activeGroup.add(crystal);
      this.rotatingParts.push(crystal);

      // Rotating containment ring
      const ringGeo = new THREE.TorusGeometry(1.4, 0.08, 6, 16);
      const ringMat = Materials.getEmissive(COLORS.enemyRed, COLORS.enemyEmissive, 1.4);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 1.6;
      ring.rotation.x = Math.PI / 3;
      this.activeGroup.add(ring);
      this.rotatingParts.push(ring);
    } else if (kind === 'cannon') {
      const baseGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.6, 8);
      const baseMesh = new THREE.Mesh(baseGeo, darkMetal);
      baseMesh.position.y = 0.3;
      baseMesh.castShadow = true;
      this.activeGroup.add(baseMesh);

      const turretHead = new THREE.Group();
      turretHead.position.y = 0.7;

      const headGeo = new THREE.BoxGeometry(0.8, 0.5, 0.9);
      const headMat = Materials.getStandard(COLORS.enemyRed, 0.5, 0.3);
      const head = new THREE.Mesh(headGeo, headMat);
      head.castShadow = true;
      turretHead.add(head);

      const barrelGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8);
      const barrel = new THREE.Mesh(barrelGeo, darkMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, 0.7);
      turretHead.add(barrel);

      this.activeGroup.add(turretHead);
      this.rotatingParts.push(turretHead);
    } else if (kind === 'mortar') {
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 8);
      const baseMesh = new THREE.Mesh(baseGeo, darkMetal);
      baseMesh.position.y = 0.25;
      baseMesh.castShadow = true;
      this.activeGroup.add(baseMesh);

      const barrelGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.2, 8);
      const barrelMat = Materials.getStandard(COLORS.enemyGroundDark, 0.4, 0.5);
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.x = -Math.PI / 6;
      barrel.position.set(0, 0.8, 0);
      barrel.castShadow = true;
      this.activeGroup.add(barrel);
    } else if (kind === 'resourceDepot') {
      const vaultGeo = new THREE.BoxGeometry(1.6, 1.0, 1.6);
      const vaultMat = Materials.getStandard(COLORS.playerBackpack, 0.6, 0.2);
      const vault = new THREE.Mesh(vaultGeo, vaultMat);
      vault.position.y = 0.5;
      vault.castShadow = true;
      this.activeGroup.add(vault);

      const roofGeo = new THREE.ConeGeometry(1.2, 0.6, 4);
      const roof = new THREE.Mesh(roofGeo, darkMetal);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.3;
      this.activeGroup.add(roof);
    } else if (kind === 'powerGenerator') {
      const genGeo = new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8);
      const genMat = Materials.getStandard(COLORS.enemyRed, 0.5, 0.3);
      const gen = new THREE.Mesh(genGeo, genMat);
      gen.position.y = 0.6;
      gen.castShadow = true;
      this.activeGroup.add(gen);

      const turbineGeo = new THREE.TorusGeometry(0.6, 0.1, 6, 12);
      const turbineMat = Materials.getEmissive(0xff0055, 0xff0055, 1.5);
      const turbine = new THREE.Mesh(turbineGeo, turbineMat);
      turbine.rotation.x = Math.PI / 2;
      turbine.position.y = 1.2;
      this.activeGroup.add(turbine);
      this.rotatingParts.push(turbine);
    }
  }

  private buildRubbleModel(): void {
    const rubbleMat = Materials.getStandard(COLORS.enemyDark, 0.8, 0.2);
    for (let i = 0; i < 4; i++) {
      const chunkGeo = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2, 0);
      const chunk = new THREE.Mesh(chunkGeo, rubbleMat);
      chunk.position.set(
        (Math.random() - 0.5) * 1.2,
        0.15,
        (Math.random() - 0.5) * 1.2
      );
      this.rubbleGroup.add(chunk);
    }
  }

  public takeDamage(amount: number): number {
    if (!this.isAlive) return 0;
    const actual = Math.min(this.building.health, amount);
    this.building.health = Math.max(0, this.building.health - actual);

    // Check Depot Loot Thresholds (25%, 50%, 75%, 100%)
    if (this.building.kind === 'resourceDepot' && this.building.lootAwardedThresholds) {
      const hpPct = this.building.health / this.building.maxHealth;
      // Threshold 0: crossing 75%
      if (hpPct <= 0.75 && !this.building.lootAwardedThresholds[0]) {
        this.building.lootAwardedThresholds[0] = true;
        this.session.invasion.lootEscrow.coins += 30;
        this.session.invasion.lootEscrow.stone += 2;
        GameEvents.emit('depot-looted', { depotId: this.id, coins: 30, stone: 2 });
      }
      // Threshold 1: crossing 50%
      if (hpPct <= 0.50 && !this.building.lootAwardedThresholds[1]) {
        this.building.lootAwardedThresholds[1] = true;
        this.session.invasion.lootEscrow.coins += 30;
        this.session.invasion.lootEscrow.stone += 2;
        GameEvents.emit('depot-looted', { depotId: this.id, coins: 30, stone: 2 });
      }
      // Threshold 2: crossing 25%
      if (hpPct <= 0.25 && !this.building.lootAwardedThresholds[2]) {
        this.building.lootAwardedThresholds[2] = true;
        this.session.invasion.lootEscrow.coins += 30;
        this.session.invasion.lootEscrow.stone += 2;
        GameEvents.emit('depot-looted', { depotId: this.id, coins: 30, stone: 2 });
      }
      // Threshold 3: destroyed (0%)
      if (hpPct <= 0 && !this.building.lootAwardedThresholds[3]) {
        this.building.lootAwardedThresholds[3] = true;
        this.session.invasion.lootEscrow.coins += 30;
        this.session.invasion.lootEscrow.stone += 2;
        GameEvents.emit('depot-looted', { depotId: this.id, coins: 30, stone: 2 });
      }
    }

    // Check Core Destruction Loot
    if (this.building.kind === 'core' && this.building.health <= 0) {
      this.session.invasion.lootEscrow.coins += GAME_CONFIG.enemyBase.buildings.core.loot.coins;
      this.session.invasion.lootEscrow.stone += GAME_CONFIG.enemyBase.buildings.core.loot.stone;
    }

    if (this.building.health <= 0) {
      this.building.isDead = true;
      this.activeGroup.visible = false;
      this.rubbleGroup.visible = true;
      GameEvents.emit('building-destroyed', this.building);
      this.session.calculateDestruction();
    }

    return actual;
  }

  public update(delta: number): void {
    if (this.isDead) return;

    this.rotatingParts.forEach((part, idx) => {
      part.rotation.y += delta * (idx === 0 ? 1.2 : -0.8);
    });
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
