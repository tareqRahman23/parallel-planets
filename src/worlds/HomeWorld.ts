import * as THREE from 'three';
import { World } from './World';
import { GameSession } from '../app/GameSession';
import { GAME_CONFIG } from '../app/GameConfig';
import { createHomePlanetEnvironment } from '../models/createEnvironmentModels';
import { StoneNode } from '../entities/StoneNode';
import { CarrotPatchEntity } from '../entities/CarrotPatchEntity';
import { LooseProductEntity } from '../entities/LooseProductEntity';
import { MachineEntity } from '../entities/MachineEntity';
import { DefenseEntity } from '../entities/DefenseEntity';
import { RaiderEntity } from '../entities/RaiderEntity';
import { CreatureEntity } from '../entities/CreatureEntity';
import { createRocketModel, RocketModelParts } from '../models/createRocketModel';
import { PlacementSystem } from '../home/PlacementSystem';
import { ParticleBurst } from '../effects/ParticleBurst';
import { Input } from '../core/Input';
import { CameraController } from '../core/CameraController';
import { GameEvents } from '../app/GameEvents';
import { disposeHierarchy } from '../core/Disposable';

export class HomeWorld extends World {
  private stoneNodes: StoneNode[] = [];
  private carrotPatches: CarrotPatchEntity[] = [];
  private looseProducts: LooseProductEntity[] = [];
  private machines: MachineEntity[] = [];
  private defenses: DefenseEntity[] = [];
  private raiders: RaiderEntity[] = [];
  private creatures: CreatureEntity[] = [];
  private rocket!: RocketModelParts;

  private placementSystem!: PlacementSystem;
  private particleBurst!: ParticleBurst;
  private environmentUpdate!: (delta: number) => void;
  private unsubscribeEvents: (() => void)[] = [];

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(session: GameSession) {
    super(session);
  }

  public init(cameraController: CameraController): void {
    cameraController.setFrustumSize(22);
    cameraController.setTarget(new THREE.Vector3(0, 0, 0), true);

    // 1. Sky & Fog
    const skyColor = new THREE.Color(0x7eb5e6);
    this.scene.background = skyColor.clone();
    this.scene.fog = new THREE.Fog(skyColor.getHex(), 30, 75);

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x6e964b, 0.8);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(20, 35, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 3. Environment Diorama
    const env = createHomePlanetEnvironment();
    this.scene.add(env.group);
    this.environmentUpdate = env.update;

    // 4. Effects
    const effectsGroup = new THREE.Group();
    this.scene.add(effectsGroup);
    this.particleBurst = new ParticleBurst(effectsGroup);

    // 5. Placement System
    this.placementSystem = new PlacementSystem(this.session, this.scene, cameraController.camera);

    // 6. Spawn Base Entities
    this.setupHomeEntities();

    // 7. Event Listeners
    this.setupEventListeners();
  }

  private setupHomeEntities(): void {
    // Stone Nodes
    this.session.home.stoneNodes.forEach((nState) => {
      const node = new StoneNode(nState);
      this.stoneNodes.push(node);
      this.scene.add(node.group);
    });

    // Machines
    this.session.machines.forEach((mState) => {
      const padConfig = GAME_CONFIG.homeLayout.machinePads.find((p) => p.id === mState.padId);
      const pos = padConfig ? padConfig.position : [0, 0, 0];
      const mEntity = new MachineEntity(mState, pos as [number, number, number]);
      this.machines.push(mEntity);
      this.scene.add(mEntity.group);
    });

    // Defenses
    this.session.defenses.forEach((dState) => {
      const padConfig = GAME_CONFIG.homeLayout.defensePads.find((p) => p.id === dState.padId);
      const pos = padConfig ? padConfig.position : [0, 0, 0];
      const dEntity = new DefenseEntity(dState, pos as [number, number, number]);
      this.defenses.push(dEntity);
      this.scene.add(dEntity.group);
    });

    // Rocket
    this.rocket = createRocketModel();
    this.rocket.root.position.set(...GAME_CONFIG.homeLayout.rocket);
    this.rocket.setRepaired(this.session.rocket.repaired);
    this.rocket.setCargoLevel(this.session.rocket.cargoLevel);
    this.scene.add(this.rocket.root);

    // Creatures from Roster
    this.session.ownedCreatures.forEach((creature) => {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      );
      const entity = new CreatureEntity(this.session, creature, pos);
      this.creatures.push(entity);
      this.scene.add(entity.parts.root);
    });
  }

  private setupEventListeners(): void {
    const unsubs = [
      GameEvents.on('carrot-patch-placed', (patch) => {
        const patchEntity = new CarrotPatchEntity(patch);
        this.carrotPatches.push(patchEntity);
        this.scene.add(patchEntity.group);
        this.particleBurst.emitLeaves(new THREE.Vector3(...patch.position));
      }),
      GameEvents.on('patch-fertilized', (patch) => {
        const pEntity = this.carrotPatches.find((p) => p.patch.id === patch.id);
        if (pEntity) {
          pEntity.rebuildCarrots();
          this.particleBurst.emitSparks(new THREE.Vector3(...patch.position));
        }
      }),
      GameEvents.on('patch-removed', (patchId) => {
        const idx = this.carrotPatches.findIndex((p) => p.patch.id === patchId);
        if (idx !== -1) {
          const entity = this.carrotPatches[idx];
          this.scene.remove(entity.group);
          entity.dispose();
          this.carrotPatches.splice(idx, 1);
        }
      }),
      GameEvents.on('product-spawned', (product) => {
        const prodEntity = new LooseProductEntity(product);
        this.looseProducts.push(prodEntity);
        this.scene.add(prodEntity.group);
      }),
      GameEvents.on('product-expired', (product) => {
        const idx = this.looseProducts.findIndex((p) => p.product.id === product.id);
        if (idx !== -1) {
          const entity = this.looseProducts[idx];
          this.scene.remove(entity.group);
          entity.dispose();
          this.looseProducts.splice(idx, 1);
        }
      }),
      GameEvents.on('creature-delivered', (creature) => {
        const spawnPos = new THREE.Vector3(
          GAME_CONFIG.homeLayout.rabbitPen[0] + (Math.random() - 0.5) * 2,
          0,
          GAME_CONFIG.homeLayout.rabbitPen[2] + (Math.random() - 0.5) * 2
        );
        const entity = new CreatureEntity(this.session, creature, spawnPos);
        this.creatures.push(entity);
        this.scene.add(entity.parts.root);
        this.particleBurst.emitSparks(spawnPos);
      }),
      GameEvents.on('creature-growth', (data: { creature: any }) => {
        const entity = this.creatures.find((c) => c.id === data.creature.id);
        if (entity) {
          entity.parts.setStageAndArmor(data.creature.growthStage, data.creature.armorEquipped);
          this.particleBurst.emitLeaves(entity.position);
        }
      }),
      GameEvents.on('armor-assigned', (data: { creature: any }) => {
        const entity = this.creatures.find((c) => c.id === data.creature.id);
        if (entity) {
          entity.parts.setStageAndArmor(data.creature.growthStage, true);
          this.particleBurst.emitSparks(entity.position);
        }
      }),
      GameEvents.on('defense-purchased', (defense) => {
        const dEntity = this.defenses.find((d) => d.defense.padId === defense.padId);
        if (dEntity) {
          dEntity.buildDefenseModel();
        }
      }),
      GameEvents.on('raid-started', (raid) => {
        this.raiders = [];
        raid.raiders.forEach((rState: any) => {
          const rEntity = new RaiderEntity(rState);
          this.raiders.push(rEntity);
          this.scene.add(rEntity.group);
        });
      }),
      GameEvents.on('raid-ended', () => {
        this.raiders.forEach((r) => {
          this.scene.remove(r.group);
          r.dispose();
        });
        this.raiders = [];
      }),
      GameEvents.on('rocket-repaired', () => {
        this.rocket.setRepaired(true);
      }),
      GameEvents.on('cargo-upgraded', (level) => {
        this.rocket.setCargoLevel(level as 0 | 1 | 2);
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

    // 2. Pointer Raycasting & World Clicks
    this.raycaster.setFromCamera(input.mousePosition, cameraController.camera);
    const hitPoint = new THREE.Vector3();
    const hasHit = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (hasHit && input.leftMouseClicked) {
      this.handleWorldLeftClick(hitPoint);
    }

    // 3. Update Placement System
    this.placementSystem.update(input);

    // 4. Update Entities
    this.stoneNodes.forEach((n) => n.update(delta));
    this.carrotPatches.forEach((p) => p.update(delta));
    this.machines.forEach((m) => m.update(delta));
    this.defenses.forEach((d) => d.update(delta));

    // 5. Update Loose Products
    for (let i = this.looseProducts.length - 1; i >= 0; i--) {
      const prod = this.looseProducts[i];
      const isDone = prod.update(delta);
      if (isDone) {
        this.scene.remove(prod.group);
        prod.dispose();
        this.looseProducts.splice(i, 1);
      }
    }

    // 6. Update Raiders & Caging
    this.raiders.forEach((r) => r.update(delta));

    // 7. Update Creatures
    this.creatures.forEach((c) => c.updateHome(delta, this.raiders));

    // 8. Particle Burst
    this.particleBurst.update(delta);
  }

  private handleWorldLeftClick(hitPoint: THREE.Vector3): void {
    // If active tool is carrot, let PlacementSystem handle it
    if (this.session.home.activePlacementTool === 'carrot') return;

    // A. Click Loose Products (generous 2D hitbox)
    for (let i = this.looseProducts.length - 1; i >= 0; i--) {
      const prodEntity = this.looseProducts[i];
      const dx = prodEntity.group.position.x - hitPoint.x;
      const dz = prodEntity.group.position.z - hitPoint.z;
      if (Math.hypot(dx, dz) <= 2.2) {
        const collected = this.session.collectProduct(prodEntity.product.id);
        if (collected) {
          prodEntity.startCollectionAnimation(new THREE.Vector3(0, 5, 0));
          this.particleBurst.emitSparks(prodEntity.group.position);
          return;
        }
      }
    }

    // B. Click Creatures (Shear/pet/speedup rabbit for fur)
    for (const creatureEntity of this.creatures) {
      const dx = creatureEntity.position.x - hitPoint.x;
      const dz = creatureEntity.position.z - hitPoint.z;
      if (Math.hypot(dx, dz) <= 1.8) {
        if (creatureEntity.onClick()) {
          this.particleBurst.emitSparks(creatureEntity.position);
          return;
        }
      }
    }

    // C. Click Raiders (for caging)
    for (const raiderEntity of this.raiders) {
      const dx = raiderEntity.position.x - hitPoint.x;
      const dz = raiderEntity.position.z - hitPoint.z;
      if (Math.hypot(dx, dz) <= 1.6) {
        this.session.cageRaider(raiderEntity.id);
        return;
      }
    }

    // C. Click Stone Nodes
    for (const node of this.stoneNodes) {
      if (node.position.distanceTo(hitPoint) <= 1.5) {
        if (this.session.clickStoneNode(node.state.id)) {
          node.onMinedFeedback();
          this.particleBurst.emitRockChips(node.position);
          return;
        }
      }
    }

    // D. Click Rocket
    if (new THREE.Vector3(...GAME_CONFIG.homeLayout.rocket).distanceTo(hitPoint) <= 2.2) {
      GameEvents.emit('open-deployment-modal');
      return;
    }

    // E. Click Machines. Refining machines run one intentional batch per click;
    // the drill remains the hands-off resource source.
    for (const m of this.machines) {
      if (m.position.distanceTo(hitPoint) <= 1.8) {
        if (m.machine.kind === 'workshop') {
          GameEvents.emit('open-workshop-modal');
        } else if (m.machine.kind === 'drill') {
          GameEvents.emit('open-machine-modal', m.machine.id);
        } else {
          if (this.session.queueMachineJob(m.machine.id)) {
            m.playActivationFeedback();
            this.particleBurst.emitSparks(m.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
          } else {
            GameEvents.emit('machine-input-missing', m.machine);
          }
        }
        return;
      }
    }

    // F. Click Fertilizer Tool on Patch
    if (this.session.home.activePlacementTool === 'fertilizer') {
      for (const patch of this.carrotPatches) {
        if (new THREE.Vector3(...patch.patch.position).distanceTo(hitPoint) <= 1.2) {
          if (this.session.applyFertilizer(patch.patch.id)) {
            this.placementSystem.setTool('none');
            return;
          }
        }
      }
    }
  }

  public getEnemiesRemaining(): number {
    return this.raiders.filter((r) => r.isAlive).length;
  }

  public dispose(): void {
    this.unsubscribeEvents.forEach((fn) => fn());
    this.unsubscribeEvents = [];
    this.placementSystem.dispose();
    this.particleBurst.dispose();
    disposeHierarchy(this.scene);
  }
}
