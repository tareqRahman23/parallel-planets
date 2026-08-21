import * as THREE from 'three';
import {
  OwnedCreature,
  CreatureStats,
  getCreatureStats,
  getGrowthStage,
} from '../creatures/CreatureData';
import {
  createRabbitModelParts,
  createBullModelParts,
  CreatureModelParts,
} from '../models/createCreatureModels';
import { GAME_CONFIG } from '../app/GameConfig';
import { GameSession } from '../app/GameSession';
import { GameEvents } from '../app/GameEvents';
import { ICombatant } from './Entity';
import { RaiderEntity } from './RaiderEntity';

export class CreatureEntity implements ICombatant {
  public readonly creature: OwnedCreature;
  public readonly parts: CreatureModelParts;
  public readonly position: THREE.Vector3;

  private session: GameSession;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  private targetPosition: THREE.Vector3 | null = null;
  private stateTimer: number = 0;
  private reservedPatchId: string | null = null;
  private hopAnimationTimer: number = 0;
  private creatureMotionTime = Math.random() * Math.PI * 2;
  private wasMoving = false;

  // Combat timers
  public attackCooldownTimer: number = 0;
  public chargeCooldownTimer: number = 0;
  public isCharging: boolean = false;
  public chargeTargetPos: THREE.Vector3 | null = null;
  public currentCombatTarget: any = null;

  // Thought bubble
  private thoughtBubble: THREE.Group;

  // Overhead Status Bar
  private statusBarGroup: THREE.Group;
  private barBgMesh: THREE.Mesh;
  private barFillMesh: THREE.Mesh;
  private barIconMesh: THREE.Mesh;

  constructor(session: GameSession, creature: OwnedCreature, spawnPos: THREE.Vector3) {
    this.session = session;
    this.creature = creature;
    this.position = spawnPos.clone();
    this.creature.worldPosition = [this.position.x, this.position.y, this.position.z];

    if (creature.kind === 'rabbit') {
      this.parts = createRabbitModelParts();
    } else {
      this.parts = createBullModelParts();
    }

    this.parts.root.position.copy(this.position);
    const stage = getGrowthStage(creature.kind, creature.carrotsEaten);
    this.parts.setStageAndArmor(stage, creature.armorEquipped);

    // Thought Bubble
    this.thoughtBubble = new THREE.Group();
    const bubbleGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    this.thoughtBubble.add(bubbleMesh);

    const carrotGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
    const carrotMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const carrotMesh = new THREE.Mesh(carrotGeo, carrotMat);
    carrotMesh.rotation.z = Math.PI;
    this.thoughtBubble.add(carrotMesh);

    this.thoughtBubble.position.set(0, creature.kind === 'bull' ? 2.3 : 1.7, 0);
    this.thoughtBubble.visible = false;
    this.parts.root.add(this.thoughtBubble);

    // Overhead Status Bar
    this.statusBarGroup = new THREE.Group();
    const barY = creature.kind === 'bull' ? 2.05 : 1.45;
    this.statusBarGroup.position.set(0, barY, 0);
    this.statusBarGroup.rotation.x = -Math.PI / 4; // Face isometric camera

    const bgGeo = new THREE.PlaneGeometry(0.88, 0.14);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x11161d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.barBgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.statusBarGroup.add(this.barBgMesh);

    const fillGeo = new THREE.PlaneGeometry(0.84, 0.1);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0xfbc531,
      side: THREE.DoubleSide,
    });
    this.barFillMesh = new THREE.Mesh(fillGeo, fillMat);
    this.barFillMesh.position.z = 0.01;
    this.statusBarGroup.add(this.barFillMesh);

    const iconGeo = new THREE.SphereGeometry(0.065, 6, 6);
    const iconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.barIconMesh = new THREE.Mesh(iconGeo, iconMat);
    this.barIconMesh.position.set(-0.48, 0, 0.02);
    this.statusBarGroup.add(this.barIconMesh);

    this.parts.root.add(this.statusBarGroup);
  }

  public get id(): string {
    return this.creature.id;
  }

  public get kind() {
    return this.creature.kind;
  }

  public get stats(): CreatureStats {
    return getCreatureStats(this.creature);
  }

  public get isAlive(): boolean {
    return this.creature.currentHealth > 0 && this.creature.invasionState !== 'lost';
  }

  public get isDead(): boolean {
    return !this.isAlive;
  }

  public get currentHealth(): number {
    return this.creature.currentHealth;
  }

  public get maxHealth(): number {
    return this.stats.maxHealth;
  }

  public onClick(): boolean {
    if (!this.isAlive) return false;

    // Cute hop animation
    this.hopAnimationTimer = 0.35;
    this.parts.root.scale.set(1.25, 0.75, 1.25);
    setTimeout(() => {
      if (this.parts.root) {
        const stage = getGrowthStage(this.creature.kind, this.creature.carrotsEaten);
        this.parts.setStageAndArmor(stage, this.creature.armorEquipped);
      }
    }, 150);

    const res = this.session.interactWithCreature(this.creature.id);
    return res !== null;
  }

  public takeDamage(amount: number): number {
    if (!this.isAlive) return 0;
    const mitigated = Math.max(1, amount * (1.0 - this.stats.damageReduction));
    const actualDamage = Math.min(this.creature.currentHealth, mitigated);
    this.creature.currentHealth -= actualDamage;

    // Damage squash effect
    this.parts.root.scale.y *= 0.85;
    setTimeout(() => {
      if (this.parts.root) {
        const stage = getGrowthStage(this.creature.kind, this.creature.carrotsEaten);
        this.parts.setStageAndArmor(stage, this.creature.armorEquipped);
      }
    }, 120);

    if (this.creature.currentHealth <= 0) {
      if (this.session.mode === 'homeRaid' || this.session.mode === 'home') {
        this.creature.homeState = 'stunned';
        this.parts.root.rotation.z = Math.PI / 2;
        GameEvents.emit('creature-home-stunned', this.creature);
      } else {
        this.creature.invasionState = 'lost';
        this.parts.root.rotation.z = Math.PI / 2;
        GameEvents.emit('creature-knockout', this.creature);
      }
    }

    return actualDamage;
  }

  public updateHome(delta: number, raiders: RaiderEntity[] = []): void {
    // Keep session synchronized with entity position
    this.creature.worldPosition = [this.position.x, this.position.y, this.position.z];

    // Handle hop animation from clicks
    if (this.hopAnimationTimer > 0) {
      this.hopAnimationTimer -= delta;
      this.parts.root.position.y = this.position.y + Math.sin((0.35 - this.hopAnimationTimer) / 0.35 * Math.PI) * 0.45;
    } else {
      this.parts.root.position.y = this.position.y;
    }

    this.creatureMotionTime += delta;
    this.updateCreatureAnimation();
    this.wasMoving = false;

    this.updateOverheadBar();

    const isRaid = this.session.mode === 'homeRaid';

    // 1. Recovering state (from invasion)
    if (this.creature.homeState === 'recovering') {
      this.thoughtBubble.visible = false;
      return;
    }

    // 2. Stunned state (home raid)
    if (this.creature.homeState === 'stunned') {
      this.thoughtBubble.visible = false;
      this.parts.root.rotation.z = Math.PI / 2;
      return;
    }

    this.parts.root.rotation.z = 0;

    // 3. Home Raid Defense Combat
    if (isRaid && raiders.length > 0) {
      this.thoughtBubble.visible = false;
      this.updateHomeRaidCombat(delta, raiders);
      return;
    }

    // 4. Normal Farming & Feeding
    this.thoughtBubble.visible = this.creature.appetiteRemainingSeconds <= 0 && this.creature.homeState !== 'eating';

    if (this.creature.homeState === 'eating') {
      this.stateTimer -= delta;
      this.parts.head.position.y = (this.creature.kind === 'bull' ? 1.1 : 0.85) + Math.sin(Date.now() * 0.02) * 0.08;
      if (this.stateTimer <= 0) {
        if (this.reservedPatchId) {
          this.session.consumeFoodUnit(this.creature.id, this.reservedPatchId);
          this.session.feedCreature(this.creature.id);
          this.reservedPatchId = null;
        }
        this.parts.head.position.y = this.creature.kind === 'bull' ? 1.1 : 0.85;
        this.creature.homeState = 'active';
      }
      return;
    }

    // Seeking food when hungry
    if (this.creature.appetiteRemainingSeconds <= 0) {
      if (!this.reservedPatchId) {
        let closestPatch = null;
        let minDist = Infinity;

        for (const patch of this.session.home.carrotPatches) {
          if (patch.status === 'mature' && patch.foodUnits > Object.keys(patch.reservedUnits).length) {
            const pVec = new THREE.Vector3(...patch.position);
            const d = this.position.distanceTo(pVec);
            if (d < minDist) {
              minDist = d;
              closestPatch = patch;
            }
          }
        }

        if (closestPatch) {
          if (this.session.reserveFoodUnit(this.creature.id, closestPatch.id)) {
            this.reservedPatchId = closestPatch.id;
            this.targetPosition = new THREE.Vector3(...closestPatch.position);
          }
        }
      }

      if (this.targetPosition) {
        const dist = this.position.distanceTo(this.targetPosition);
        if (dist <= 0.55) {
          this.creature.homeState = 'eating';
          this.stateTimer = GAME_CONFIG.creatures[this.creature.kind].eatDurationSeconds;
          this.velocity.set(0, 0, 0);
          return;
        } else {
          this.moveToward(this.targetPosition, this.stats.moveSpeed, delta);
        }
        return;
      }
    }

    // Idle Roaming
    this.stateTimer -= delta;
    if (this.stateTimer <= 0 || !this.targetPosition) {
      this.stateTimer = 4 + Math.random() * 4;
      const rx = (Math.random() - 0.5) * 14;
      const rz = (Math.random() - 0.5) * 14;
      this.targetPosition = new THREE.Vector3(rx, 0, rz);
    }

    if (this.targetPosition) {
      const dist = this.position.distanceTo(this.targetPosition);
      if (dist > 0.5) {
        this.moveToward(this.targetPosition, this.stats.moveSpeed * 0.45, delta);
      } else {
        this.velocity.set(0, 0, 0);
      }
    }
  }

  private updateOverheadBar(): void {
    const fillMat = this.barFillMesh.material as THREE.MeshBasicMaterial;
    const iconMat = this.barIconMesh.material as THREE.MeshBasicMaterial;

    // Case 1: Producing Fur / Fertilizer
    if (this.creature.pendingProduct) {
      this.statusBarGroup.visible = true;
      const total = this.creature.pendingProduct.totalSeconds || 2.5;
      const progress = THREE.MathUtils.clamp(1.0 - this.creature.pendingProduct.remainingSeconds / total, 0, 1);
      
      this.barFillMesh.scale.x = Math.max(0.01, progress);
      this.barFillMesh.position.x = -0.42 + (0.84 * progress) / 2;

      if (this.creature.pendingProduct.kind === 'fur') {
        fillMat.color.setHex(0xfbc531); // Golden fur production
        iconMat.color.setHex(0xffffff); // White fluff
      } else {
        fillMat.color.setHex(0x795548); // Brown fertilizer
        iconMat.color.setHex(0x2ecc71); // Green sprout
      }
      this.barIconMesh.visible = true;
      return;
    }

    // Case 2: Eating
    if (this.creature.homeState === 'eating') {
      this.statusBarGroup.visible = true;
      fillMat.color.setHex(0x2ecc71); // Green eating
      this.barFillMesh.scale.x = 1.0;
      this.barFillMesh.position.x = 0;
      iconMat.color.setHex(0xff7700); // Carrot icon
      this.barIconMesh.visible = true;
      return;
    }

    // Case 3: Stunned
    if (this.creature.homeState === 'stunned') {
      this.statusBarGroup.visible = true;
      fillMat.color.setHex(0xe74c3c); // Red stun
      this.barFillMesh.scale.x = 0.5;
      this.barFillMesh.position.x = 0;
      this.barIconMesh.visible = false;
      return;
    }

    // Case 4: Hungry / Appetite Ready
    if (this.creature.appetiteRemainingSeconds <= 0) {
      this.statusBarGroup.visible = true;
      fillMat.color.setHex(0xe67e22); // Orange hungry
      const pulse = Math.abs(Math.sin(Date.now() * 0.006));
      this.barFillMesh.scale.x = 0.7 + pulse * 0.3;
      this.barFillMesh.position.x = 0;
      iconMat.color.setHex(0xff7700);
      this.barIconMesh.visible = true;
      return;
    }

    // Case 5: Full & Content
    this.statusBarGroup.visible = true;
    fillMat.color.setHex(0x00cec9); // Soft cyan/teal
    this.barFillMesh.scale.x = 1.0;
    this.barFillMesh.position.x = 0;
    this.barIconMesh.visible = false;
  }

  private updateHomeRaidCombat(delta: number, raiders: RaiderEntity[]): void {
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }

    const livingRaiders = raiders.filter((r) => r.isAlive);
    if (livingRaiders.length === 0) return;

    let target: RaiderEntity | null = null;
    if (this.creature.kind === 'rabbit') {
      // Prioritize carriers
      target = livingRaiders.find((r) => Object.values(r.raider.carriedGoods).some((v) => (v || 0) > 0)) || livingRaiders[0];
    } else {
      // Prioritize raiders targeting machines or warehouse
      target = livingRaiders.find((r) => r.raider.targetType === 'machine' || r.raider.targetType === 'warehouse') || livingRaiders[0];
    }

    if (target) {
      const dist = this.position.distanceTo(target.position);
      const attackRange = this.creature.kind === 'rabbit' ? 1.4 : 1.8;
      const cooldown = this.creature.kind === 'rabbit' ? 0.8 : 1.25;

      if (dist <= attackRange) {
        this.velocity.set(0, 0, 0);
        if (this.attackCooldownTimer <= 0) {
          this.attackCooldownTimer = cooldown;
          target.takeDamage(this.stats.damage);
          GameEvents.emit('combat-hit', { position: target.position, isEnemy: true });
        }
      } else {
        this.moveToward(target.position, this.stats.moveSpeed, delta);
      }
    }
  }

  public moveToward(target: THREE.Vector3, speed: number, delta: number): void {
    const dir = target.clone().sub(this.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.wasMoving = true;
      dir.normalize();
      this.position.addScaledVector(dir, speed * delta);
      this.parts.root.position.copy(this.position);

      const angle = Math.atan2(dir.x, dir.z);
      this.parts.root.rotation.y = angle;

    }
  }

  private updateCreatureAnimation(): void {
    // The Polyfork rabbit is an unrigged static mesh, so it lives in an
    // independent visual group. This keeps gameplay anchors stable while
    // giving the creature a readable idle, run-hop, and feeding performance.
    if (this.creature.kind !== 'rabbit' || !this.parts.visualRoot) return;

    const visual = this.parts.visualRoot;
    const t = this.creatureMotionTime;

    if (this.creature.homeState === 'eating') {
      visual.position.y = -0.035 + Math.sin(t * 10) * 0.018;
      visual.rotation.x = -0.18 + Math.sin(t * 10) * 0.05;
      visual.rotation.z = Math.sin(t * 5) * 0.035;
      return;
    }

    if (this.wasMoving) {
      visual.position.y = 0.025 + Math.abs(Math.sin(t * 12)) * 0.14;
      visual.rotation.x = Math.cos(t * 12) * 0.08;
      visual.rotation.z = Math.sin(t * 6) * 0.055;
      return;
    }

    visual.position.y = 0.018 + Math.sin(t * 2.4) * 0.018;
    visual.rotation.x = 0;
    visual.rotation.z = Math.sin(t * 1.7) * 0.025;
  }

  public dispose(): void {
    if (this.parts.root.parent) {
      this.parts.root.parent.remove(this.parts.root);
    }
  }
}
