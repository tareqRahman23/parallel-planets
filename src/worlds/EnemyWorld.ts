import * as THREE from 'three';
import { World } from './World';
import { GameSession } from '../app/GameSession';
import { GAME_CONFIG } from '../app/GameConfig';
import { createEnemyPlanetEnvironment } from '../models/createEnvironmentModels';
import { CreatureEntity } from '../entities/CreatureEntity';
import { EnemyBuildingEntity } from '../entities/EnemyBuildingEntity';
import { EnemyWallEntity } from '../entities/EnemyWallEntity';
import { NavigationGrid } from '../invasion/NavigationGrid';
import { AStarPathfinder } from '../invasion/AStarPathfinder';
import { ParticleBurst } from '../effects/ParticleBurst';
import { Input } from '../core/Input';
import { CameraController } from '../core/CameraController';
import { GameEvents } from '../app/GameEvents';
import { disposeHierarchy } from '../core/Disposable';
import { createPolyforkSpaceMine } from '../models/polyforkAssets';

export class EnemyWorld extends World {
  public grid: NavigationGrid;
  public buildings: EnemyBuildingEntity[] = [];
  public walls: EnemyWallEntity[] = [];
  public deployedArmy: CreatureEntity[] = [];

  private particleBurst!: ParticleBurst;
  private environmentUpdate!: (delta: number) => void;
  private unsubscribeEvents: (() => void)[] = [];

  // Deployment & Range Visuals
  private perimeterRingMesh!: THREE.Mesh;
  private rangeCirclesGroup: THREE.Group = new THREE.Group();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Selected troop card for deployment
  public selectedTroopKind: 'rabbit' | 'bull' | null = null;
  public selectedSupportPower: 'sword' | 'gun' | null = null;

  // Attack & Projectile queues
  private activeMortarShells: Array<{
    targetPos: THREE.Vector3;
    currentPos: THREE.Vector3;
    elapsed: number;
    duration: number;
    damage: number;
    splashRadius: number;
    mesh: THREE.Object3D;
    markerMesh: THREE.Mesh;
  }> = [];

  constructor(session: GameSession) {
    super(session);
    this.grid = new NavigationGrid(0.8);
  }

  public init(cameraController: CameraController): void {
    cameraController.setFrustumSize(26);
    cameraController.setTarget(new THREE.Vector3(0, 0, 0), true);

    // 1. Atmosphere & Fog
    this.scene.background = new THREE.Color(0x181224);
    this.scene.fog = new THREE.Fog(0x181224, 25, 75);

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(0x5d3e68, 0x1f1728, 0.85);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xa5b8d0, 2.0);
    dirLight.position.set(-15, 30, -15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 3. Environment Diorama
    const env = createEnemyPlanetEnvironment();
    this.scene.add(env.group);
    this.environmentUpdate = env.update;

    // 4. Effects
    const effectsGroup = new THREE.Group();
    this.scene.add(effectsGroup);
    this.particleBurst = new ParticleBurst(effectsGroup);

    // 5. Perimeter Deployment Ring (Radius 9.5 to 11.2)
    const ringGeo = new THREE.RingGeometry(9.2, 11.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.perimeterRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.perimeterRingMesh.rotation.x = -Math.PI / 2;
    this.perimeterRingMesh.position.y = 0.04;
    this.scene.add(this.perimeterRingMesh);

    // 6. Range Circles Group
    this.scene.add(this.rangeCirclesGroup);

    // 7. Spawn Buildings & Walls & Stamp Navigation Blockers
    this.setupBaseEntities();

    // 8. Event Listeners
    this.setupEventListeners();
  }

  private setupBaseEntities(): void {
    // Buildings
    this.session.invasion.buildings.forEach((bState) => {
      const bEntity = new EnemyBuildingEntity(this.session, bState);
      this.buildings.push(bEntity);
      this.scene.add(bEntity.group);

      // Mark Blocker
      const radius = bState.kind === 'core' ? 1.5 : 1.1;
      this.grid.markBlocker(bEntity.position.x, bEntity.position.z, radius, bEntity.id, false);

      // Add defense range circles
      if (bState.isDefense) {
        const range = bState.kind === 'cannon' ? 8.0 : 11.0;
        const circleGeo = new THREE.RingGeometry(range - 0.1, range + 0.1, 32);
        const circleMat = new THREE.MeshBasicMaterial({
          color: bState.kind === 'cannon' ? 0xff4757 : 0xffa502,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = -Math.PI / 2;
        circle.position.set(bEntity.position.x, 0.05, bEntity.position.z);
        this.rangeCirclesGroup.add(circle);
      }
    });

    // Walls
    this.session.invasion.walls.forEach((wState) => {
      const wEntity = new EnemyWallEntity(wState);
      this.walls.push(wEntity);
      this.scene.add(wEntity.group);

      // Mark Wall Blocker
      this.grid.markBlocker(wEntity.position.x, wEntity.position.z, 0.6, wEntity.id, false);
    });
  }

  private setupEventListeners(): void {
    const unsubs = [
      GameEvents.on('building-destroyed', (building) => {
        this.particleBurst.emitExplosion(new THREE.Vector3(...building.position));
        this.grid.removeBlocker(building.id);
      }),
      GameEvents.on('wall-destroyed', (wall) => {
        this.particleBurst.emitRockChips(new THREE.Vector3(...wall.position));
        this.grid.removeBlocker(wall.id);
      }),
      GameEvents.on('combat-hit', (data: { position: THREE.Vector3; isEnemy?: boolean }) => {
        this.particleBurst.emitHit(data.position, !!data.isEnemy);
      }),
      GameEvents.on('select-deploy-troop', (kind: 'rabbit' | 'bull') => {
        this.selectedTroopKind = kind;
        this.selectedSupportPower = null;
      }),
      GameEvents.on('select-support-power', (power: 'sword' | 'gun') => {
        this.selectedSupportPower = power;
        this.selectedTroopKind = null;
      }),
    ];
    this.unsubscribeEvents.push(...unsubs);
  }

  public update(delta: number, input: Input, cameraController: CameraController): void {
    this.environmentUpdate?.(delta);

    // 1. Camera Pan & Zoom
    if (input.wheelDelta !== 0) {
      cameraController.zoom(input.wheelDelta);
    }
    if (input.mouseDragDelta.lengthSq() > 0) {
      cameraController.pan(input.mouseDragDelta.x, input.mouseDragDelta.y);
    }
    if (input.isKeyPressed(' ')) {
      cameraController.setTarget(new THREE.Vector3(0, 0, 0));
    }

    // 2. Pointer Raycast on ground
    this.raycaster.setFromCamera(input.mousePosition, cameraController.camera);
    const hitPoint = new THREE.Vector3();
    const hasHit = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (hasHit) {
      this.handlePointerInteraction(hitPoint, input);
    }

    // 3. Update Deployed Creatures AI & Movement
    this.updateDeployedArmyAI(delta);

    // 4. Update Enemy Defenses AI
    this.updateEnemyDefenses(delta);

    // 5. Update Projectiles & Effects
    this.updateMortarProjectiles(delta);
    this.particleBurst.update(delta);

    // 6. Update Entities
    this.buildings.forEach((b) => b.update(delta));
  }

  private handlePointerInteraction(hitPoint: THREE.Vector3, input: Input): void {
    const distFromCenter = Math.hypot(hitPoint.x, hitPoint.z);
    const isPerimeter = distFromCenter >= 8.8 && distFromCenter <= 11.5;

    // A. Deploy Troop
    if (this.selectedTroopKind && input.leftMouseClicked) {
      if (isPerimeter) {
        // Find undeployed creature of selected kind
        const creature = this.session.ownedCreatures.find(
          (c) => c.kind === this.selectedTroopKind && c.invasionState === 'undeployed'
        );

        if (creature) {
          const posTuple: [number, number, number] = [hitPoint.x, 0, hitPoint.z];
          if (this.session.deployCreature(creature.id, posTuple)) {
            const entity = new CreatureEntity(this.session, creature, hitPoint);
            this.deployedArmy.push(entity);
            this.scene.add(entity.parts.root);
            this.particleBurst.emitSparks(hitPoint);
          }
        }
      }
    }

    // B. Use Support Power
    if (this.selectedSupportPower && input.leftMouseClicked && this.session.invasion.timerStarted) {
      const posTuple: [number, number, number] = [hitPoint.x, 0, hitPoint.z];
      if (this.session.useSupportPower(this.selectedSupportPower, posTuple)) {
        if (this.selectedSupportPower === 'sword') {
          this.executeSwordSupport(hitPoint);
        } else if (this.selectedSupportPower === 'gun') {
          this.executeGunSupport(hitPoint);
        }
      }
    }
  }

  private executeSwordSupport(center: THREE.Vector3): void {
    const cfg = GAME_CONFIG.supportPowers.sword;
    const halfLen = cfg.lineLength / 2;
    const halfWid = cfg.lineWidth / 2;

    // Apply damage to intersecting buildings & walls
    this.buildings.forEach((b) => {
      if (b.isAlive && Math.abs(b.position.x - center.x) <= halfLen && Math.abs(b.position.z - center.z) <= halfWid) {
        b.takeDamage(cfg.buildingDamage);
      }
    });

    this.walls.forEach((w) => {
      if (w.isAlive && Math.abs(w.position.x - center.x) <= halfLen && Math.abs(w.position.z - center.z) <= halfWid) {
        w.takeDamage(cfg.wallDamage);
      }
    });

    this.particleBurst.emitExplosion(center);
    GameEvents.emit('screen-shake', { intensity: 0.6, duration: 0.4 });
  }

  private executeGunSupport(target: THREE.Vector3): void {
    const cfg = GAME_CONFIG.supportPowers.gun;

    // Find primary target (closest building within 2 units)
    const aliveBuildings = this.buildings.filter((b) => b.isAlive);
    let primary: EnemyBuildingEntity | null = null;
    let minDist = 2.0;

    for (const b of aliveBuildings) {
      const d = b.position.distanceTo(target);
      if (d < minDist) {
        minDist = d;
        primary = b;
      }
    }

    if (primary) {
      // Primary receives 260 total damage (mutually exclusive with splash)
      primary.takeDamage(cfg.primaryDamage);
    }

    // Splash damage to other buildings
    this.buildings.forEach((b) => {
      if (b.isAlive && b !== primary && b.position.distanceTo(target) <= cfg.splashRadius) {
        b.takeDamage(cfg.splashDamage);
      }
    });

    this.particleBurst.emitSparks(target);
    GameEvents.emit('screen-shake', { intensity: 0.4, duration: 0.3 });
  }

  private updateDeployedArmyAI(delta: number): void {
    const livingCreatures = this.deployedArmy.filter((c) => c.isAlive);
    const livingRabbits = livingCreatures.filter((c) => c.kind === 'rabbit');
    const aliveBuildings = this.buildings.filter((b) => b.isAlive);
    const aliveWalls = this.walls.filter((w) => w.isAlive);

    if (aliveBuildings.length === 0) return;

    for (const creature of livingCreatures) {
      if (creature.attackCooldownTimer > 0) {
        creature.attackCooldownTimer -= delta;
      }
      if (creature.chargeCooldownTimer > 0) {
        creature.chargeCooldownTimer -= delta;
      }

      // Check current target validity
      if (creature.currentCombatTarget && (!creature.currentCombatTarget.isAlive || creature.currentCombatTarget.isDead)) {
        creature.currentCombatTarget = null;
      }

      // Target selection if no target
      if (!creature.currentCombatTarget) {
        creature.currentCombatTarget = this.selectBestTarget(creature, aliveBuildings, aliveWalls);
      }

      const target = creature.currentCombatTarget;
      if (!target) continue;

      const dist = creature.position.distanceTo(target.position);
      const attackRange = creature.kind === 'rabbit' ? 1.4 : 1.8;

      // Bull Charge check
      if (
        creature.kind === 'bull' &&
        creature.chargeCooldownTimer <= 0 &&
        dist >= 2.5 &&
        dist <= 5.0 &&
        !creature.isCharging
      ) {
        creature.isCharging = true;
        creature.chargeCooldownTimer = GAME_CONFIG.creatures.bull.combat.chargeCooldown;
        creature.chargeTargetPos = target.position.clone();
      }

      if (creature.isCharging && creature.chargeTargetPos) {
        const cDist = creature.position.distanceTo(creature.chargeTargetPos);
        if (cDist <= 0.8) {
          creature.isCharging = false;
          // Charge impact splash
          const splash = GAME_CONFIG.creatures.bull.combat.chargeSplashRadius;
          const dmg = creature.stats.damage * GAME_CONFIG.creatures.bull.combat.chargeDamageMultiplier;

          aliveBuildings.forEach((b) => {
            if (b.isAlive && b.position.distanceTo(creature.position) <= splash) {
              b.takeDamage(dmg);
            }
          });
          aliveWalls.forEach((w) => {
            if (w.isAlive && w.position.distanceTo(creature.position) <= splash) {
              w.takeDamage(dmg);
            }
          });

          GameEvents.emit('screen-shake', { intensity: 0.4, duration: 0.3 });
        } else {
          creature.moveToward(creature.chargeTargetPos, creature.stats.moveSpeed * 2.2, delta);
        }
        continue;
      }

      // In attack range
      if (dist <= attackRange + 0.3) {
        creature.velocity.set(0, 0, 0);
        if (creature.attackCooldownTimer <= 0) {
          creature.attackCooldownTimer = creature.kind === 'rabbit' ? 0.8 : 1.25;

          let dmg = creature.stats.damage;
          if (creature.kind === 'rabbit') {
            // Pack instinct (+5% per living rabbit in 5 units, max 20%)
            const alliesNear = livingRabbits.filter(
              (r) => r.id !== creature.id && r.position.distanceTo(creature.position) <= 5.0
            ).length;
            const packBonus = Math.min(0.20, alliesNear * 0.05);
            dmg *= 1.0 + packBonus;
          }

          target.takeDamage(dmg);
          GameEvents.emit('combat-hit', { position: target.position, isEnemy: true });
        }
      } else {
        // Pathfind toward target
        const path = AStarPathfinder.findPath(
          this.grid,
          creature.position.x,
          creature.position.z,
          target.position.x,
          target.position.z,
          attackRange
        );

        if (path && path.length > 1) {
          const nextNode = new THREE.Vector3(path[1].x, 0, path[1].z);
          creature.moveToward(nextNode, creature.stats.moveSpeed, delta);
        } else {
          // Direct move if within sight
          creature.moveToward(target.position, creature.stats.moveSpeed, delta);
        }
      }
    }
  }

  private selectBestTarget(
    creature: CreatureEntity,
    aliveBuildings: EnemyBuildingEntity[],
    aliveWalls: EnemyWallEntity[]
  ): any {
    let bestTarget: any = null;
    let lowestScore = Infinity;

    for (const b of aliveBuildings) {
      const dist = creature.position.distanceTo(b.position);

      let score = dist;
      if (creature.kind === 'rabbit') {
        const attackers = this.deployedArmy.filter((c) => c.currentCombatTarget === b).length;
        const defensePenalty = b.isDefense ? 3 : 0;
        score = dist + attackers * 2 + defensePenalty;
      } else {
        // Bull target priority
        let pMod = 0;
        if (b.building.kind === 'mortar') pMod = -12;
        else if (b.building.kind === 'cannon') pMod = -10;
        else if (b.building.kind === 'powerGenerator') pMod = -5;
        else if (b.building.kind === 'core') pMod = 0;
        else if (b.building.kind === 'resourceDepot') pMod = 3;

        score = dist + pMod;
      }

      if (score < lowestScore) {
        lowestScore = score;
        bestTarget = b;
      }
    }

    // Check if path is blocked by wall
    if (bestTarget) {
      const path = AStarPathfinder.findPath(
        this.grid,
        creature.position.x,
        creature.position.z,
        bestTarget.position.x,
        bestTarget.position.z,
        1.5
      );

      if (!path) {
        // Find candidate wall with lowest estimated time: travelDistance / moveSpeed + wallHealth / damagePerSecond
        let bestWall: EnemyWallEntity | null = null;
        let bestWallTime = Infinity;

        for (const wall of aliveWalls) {
          const travelDist = creature.position.distanceTo(wall.position);
          const dps = creature.stats.damage / (creature.kind === 'rabbit' ? 0.8 : 1.25);
          const estTime = travelDist / creature.stats.moveSpeed + wall.currentHealth / dps;

          if (estTime < bestWallTime) {
            bestWallTime = estTime;
            bestWall = wall;
          }
        }

        if (bestWall) return bestWall;
      }
    }

    return bestTarget || aliveBuildings[0];
  }

  private updateEnemyDefenses(delta: number): void {
    const livingCreatures = this.deployedArmy.filter((c) => c.isAlive);
    if (livingCreatures.length === 0) return;

    for (const b of this.buildings) {
      if (!b.isAlive || !b.isDefense) continue;
      b.building.attackCooldownTimer -= delta;

      if (b.building.kind === 'cannon') {
        const range = 8.0;
        const cooldown = 1.0;

        if (b.building.attackCooldownTimer <= 0) {
          // Nearest deployed living creature
          let target: CreatureEntity | null = null;
          let minDist = range;

          for (const c of livingCreatures) {
            const d = b.position.distanceTo(c.position);
            if (d <= minDist) {
              minDist = d;
              target = c;
            }
          }

          if (target) {
            b.building.attackCooldownTimer = cooldown;
            target.takeDamage(24);
            GameEvents.emit('combat-hit', { position: target.position, isEnemy: false });
          }
        }
      } else if (b.building.kind === 'mortar') {
        const minR = 3.0;
        const maxR = 11.0;
        const cooldown = 2.6;

        if (b.building.attackCooldownTimer <= 0) {
          // Cluster evaluation: find target position with highest count of allies within 2.4 splash
          let bestTargetPos: THREE.Vector3 | null = null;
          let maxCount = 0;

          for (const c of livingCreatures) {
            const d = b.position.distanceTo(c.position);
            if (d >= minR && d <= maxR) {
              const countInSplash = livingCreatures.filter(
                (other) => other.position.distanceTo(c.position) <= 2.4
              ).length;
              if (countInSplash > maxCount) {
                maxCount = countInSplash;
                bestTargetPos = c.position.clone();
              }
            }
          }

          if (bestTargetPos) {
            b.building.attackCooldownTimer = cooldown;
            this.spawnMortarShell(b.position, bestTargetPos, 38, 2.4);
          }
        }
      }
    }
  }

  private spawnMortarShell(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    damage: number,
    splashRadius: number
  ): void {
    // A small hostile mine makes the delayed mortar arc immediately readable.
    const shell = createPolyforkSpaceMine();
    shell.scale.multiplyScalar(0.18);
    shell.position.copy(fromPos);
    this.scene.add(shell);

    // Ground Warning Marker
    const markerGeo = new THREE.RingGeometry(splashRadius - 0.15, splashRadius, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3838, side: THREE.DoubleSide });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(toPos.x, 0.05, toPos.z);
    this.scene.add(marker);

    this.activeMortarShells.push({
      targetPos: toPos.clone(),
      currentPos: fromPos.clone(),
      elapsed: 0,
      duration: 1.2,
      damage,
      splashRadius,
      mesh: shell,
      markerMesh: marker,
    });
  }

  private updateMortarProjectiles(delta: number): void {
    for (let i = this.activeMortarShells.length - 1; i >= 0; i--) {
      const shell = this.activeMortarShells[i];
      shell.elapsed += delta;
      const t = Math.min(1.0, shell.elapsed / shell.duration);

      // Arc trajectory
      shell.currentPos.lerp(shell.targetPos, t);
      const arcHeight = Math.sin(t * Math.PI) * 6.0;
      shell.mesh.position.set(shell.currentPos.x, shell.currentPos.y + arcHeight, shell.currentPos.z);

      if (t >= 1.0) {
        // Impact
        const livingCreatures = this.deployedArmy.filter((c) => c.isAlive);
        livingCreatures.forEach((c) => {
          if (c.position.distanceTo(shell.targetPos) <= shell.splashRadius) {
            c.takeDamage(shell.damage);
          }
        });

        this.particleBurst.emitExplosion(shell.targetPos);
        GameEvents.emit('screen-shake', { intensity: 0.5, duration: 0.4 });

        this.scene.remove(shell.mesh);
        this.scene.remove(shell.markerMesh);
        shell.markerMesh.geometry.dispose();
        this.activeMortarShells.splice(i, 1);
      }
    }
  }

  public getEnemiesRemaining(): number {
    return this.buildings.filter((b) => b.isAlive && b.building.countsForPercent).length;
  }

  public dispose(): void {
    this.unsubscribeEvents.forEach((fn) => fn());
    this.unsubscribeEvents = [];
    this.particleBurst.dispose();
    this.activeMortarShells.forEach((s) => {
      this.scene.remove(s.mesh);
      this.scene.remove(s.markerMesh);
    });
    disposeHierarchy(this.scene);
  }
}
