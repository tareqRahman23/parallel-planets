import { GAME_CONFIG } from './GameConfig';
import { GameEvents } from './GameEvents';
import {
  CreatureKind,
  GrowthStage,
  ArmorKind,
  OwnedCreature,
  PendingCreatureDelivery,
  generateCreatureName,
  getGrowthStage,
  getCreatureStats,
} from '../creatures/CreatureData';
import {
  SupplyOrder,
  SupplyOrderSystem,
  OrderResourceType,
  UnlockedProducts,
} from '../systems/SupplyOrderSystem';

export type GameMode =
  | 'home'
  | 'homeRaid'
  | 'loadout'
  | 'launching'
  | 'invasionPreview'
  | 'invasion'
  | 'invasionResult'
  | 'victory';

export type PlacementTool = 'none' | 'carrot' | 'fertilizer' | 'cage';

export type LooseProductKind =
  | 'fur'
  | 'fertilizer'
  | 'stone'
  | 'thread'
  | 'fabric'
  | 'techPart'
  | 'workshopItem';

export interface LooseProduct {
  id: string;
  kind: LooseProductKind;
  worldPosition: [number, number, number];
  ownerSourceId: string;
  ageSeconds: number;
  lifetimeSeconds: number;
  reservedByRaiderId: string | null;
  payloadItemId?: string;
}

export interface CarrotPatchState {
  id: string;
  position: [number, number, number];
  status: 'growing' | 'mature' | 'depleted';
  growthElapsedSeconds: number;
  growthDurationSeconds: number;
  foodUnits: number;
  unitsEaten: number;
  fertilized: boolean;
  reservedUnits: Record<string, string>; // creatureId -> unitId
  wiltTimer?: number;
}

export interface StoneNodeState {
  id: string;
  position: [number, number, number];
  charges: number;
  maxCharges: number;
  regenElapsedSeconds: number;
  lastClickTimestamp: number;
  clickCooldownRemainingSeconds?: number;
}

export interface RaiderState {
  id: string;
  kind: 'scavenger' | 'brute';
  position: [number, number, number];
  health: number;
  maxHealth: number;
  targetType: 'looseProduct' | 'warehouse' | 'machine' | 'defense' | 'escape';
  targetId: string | null;
  cageSegments: number;
  lastCageClickTime: number;
  cageClickCooldownRemaining?: number;
  cageDecayRemaining?: number;
  isStunned: boolean;
  stunTimer: number;
  carriedGoods: Partial<Record<OrderResourceType, number>>;
  attackCooldownTimer: number;
  stealTimer: number;
}

export interface HomeRaidState {
  phase: 'locked' | 'scheduled' | 'warning' | 'active' | 'result';
  raidIndex: number;
  secondsUntilSpawn: number;
  warningRemainingSeconds: number;
  activeElapsedSeconds: number;
  raiders: RaiderState[];
  goodsStolen: Partial<Record<OrderResourceType, number>>;
  defeatedScavengers: number;
  defeatedBrutes: number;
}

export type MachineKind = 'drill' | 'spinnery' | 'tailor' | 'stoneForge' | 'workshop';

export interface MachineJob {
  id: string;
  recipeId?: string;
  inputSpent: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  outputKind: LooseProductKind;
  outputAmount: number;
}

export interface MachineState {
  id: string;
  padId: string;
  kind: MachineKind;
  status: 'unbuilt' | 'constructing' | 'idle' | 'processing' | 'outputFull' | 'disabled';
  health: number;
  maxHealth: number;
  constructionRemainingSeconds: number;
  repairRemainingSeconds: number;
  activeJob: MachineJob | null;
  queuedJobs: MachineJob[];
  outputTray: Array<{ id: string; kind: LooseProductKind; payloadItemId?: string }>;
  maxOutputSlots: number;
  autoRunEnabled: boolean;
  level: 1 | 2 | 3;
}

export type DefenseKind = 'pulseTurret' | 'snareTotem' | 'repairBeacon';

export interface DefenseState {
  id: string;
  padId: string;
  kind: DefenseKind;
  status: 'unbuilt' | 'constructing' | 'active' | 'disabled' | 'repairing';
  health: number;
  maxHealth: number;
  constructionRemainingSeconds: number;
  repairRemainingSeconds: number;
  cooldownRemainingSeconds: number;
}

export interface EnemyBuildingState {
  id: string;
  kind: 'core' | 'cannon' | 'mortar' | 'resourceDepot' | 'powerGenerator';
  name: string;
  health: number;
  maxHealth: number;
  position: [number, number, number];
  isDefense: boolean;
  countsForPercent: boolean;
  isDead: boolean;
  attackCooldownTimer: number;
  currentTargetId: string | null;
  lootAwardedThresholds?: [boolean, boolean, boolean, boolean]; // For 25%, 50%, 75%, 100%
}

export interface EnemyWallState {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  isDead: boolean;
}

export interface InvasionState {
  phase: 'inactive' | 'preview' | 'active' | 'finalizing' | 'result';
  committedCreatureIds: string[];
  deployedCreatureIds: string[];
  selectedSupport: 'sword' | 'gun' | 'none' | null;
  supportChargesRemaining: number;
  supportCooldownRemainingSeconds: number;
  timerStarted: boolean;
  remainingSeconds: number;
  buildings: EnemyBuildingState[];
  walls: EnemyWallState[];
  destructionPercent: number;
  stars: {
    fiftyPercent: boolean;
    core: boolean;
    fullDestruction: boolean;
  };
  lootEscrow: {
    coins: number;
    stone: number;
    techParts: number;
  };
  lootSettlement: {
    coinsAdded: number;
    techPartsStored: number;
    stoneStored: number;
    techPartsSold: number;
    stoneSold: number;
    overflowSaleCoins: number;
  } | null;
  finalized: boolean;
}

export interface WorkshopRecipeDefinition {
  id: string;
  name: string;
  stone: number;
  fabric: number;
  techParts: number;
  coins: number;
  durationSeconds: number;
  type: 'armor' | 'support' | 'rocket' | 'cargo';
  level?: number;
  isOneTime: boolean;
  requiresRepair?: boolean;
  requiresCargoLevel?: number;
}

let idSequence = 0;
export function generateLocalId(prefix: string): string {
  idSequence++;
  return `${prefix}_${idSequence}_${Date.now().toString(36)}`;
}

export class GameSession {
  public schemaVersion: number = 2;
  public mode: GameMode = 'home';

  public economy: {
    coins: number;
    inventory: Record<OrderResourceType, number>;
    warehouseLevel: 0 | 1 | 2;
  };

  public home: {
    carrotPatches: CarrotPatchState[];
    looseProducts: LooseProduct[];
    stoneNodes: StoneNodeState[];
    activePlacementTool: PlacementTool;
    raid: HomeRaidState;
  };

  public creatures: {
    owned: OwnedCreature[];
    pendingDeliveries: PendingCreatureDelivery[];
  };

  public orders: {
    active: SupplyOrder[];
    streak: number;
    completedCount: number;
  };

  public machines: MachineState[];
  public defenses: DefenseState[];

  public workshop: {
    activeJob: {
      recipeId: string;
      elapsedSeconds: number;
      durationSeconds: number;
    } | null;
    queuedJobs: string[];
    readyOutputs: string[]; // on workshop table
  };

  public rocket: {
    repaired: boolean;
    cargoLevel: 0 | 1 | 2;
    selectedCreatureIds: string[];
  };

  public equipment: {
    rabbitArmor: number;
    bullArmor: number;
    swordSupportUnlocked: boolean;
    gunSupportUnlocked: boolean;
  };

  public invasion: InvasionState;

  public stats: {
    totalStoneGathered: number;
    totalFurHarvested: number;
    totalFertilizerProduced: number;
    totalCoinsEarned: number;
    totalTechPartsProduced: number;
    totalThreadProduced: number;
    totalFabricProduced: number;
    startTime: number;
    runTimerActive: boolean;
    missionTimerSeconds: number;
    campaignVictoryAchieved: boolean;
  };

  constructor() {
    this.economy = {
      coins: GAME_CONFIG.economy.startingCoins,
      inventory: {
        stone: 0,
        fur: 0,
        fertilizer: 0,
        thread: 0,
        fabric: 0,
        techParts: 0,
      },
      warehouseLevel: 0,
    };

    this.home = {
      carrotPatches: [],
      looseProducts: [],
      stoneNodes: GAME_CONFIG.homeLayout.stoneNodes.map((n) => ({
        id: n.id,
        position: [...n.position],
        charges: GAME_CONFIG.economy.stoneNode.initialCharges,
        maxCharges: GAME_CONFIG.economy.stoneNode.maxCharges,
        regenElapsedSeconds: 0,
        lastClickTimestamp: 0,
      })),
      activePlacementTool: 'none',
      raid: {
        phase: 'locked',
        raidIndex: 0,
        secondsUntilSpawn: GAME_CONFIG.raids.firstRaidDelaySeconds,
        warningRemainingSeconds: 0,
        activeElapsedSeconds: 0,
        raiders: [],
        goodsStolen: {},
        defeatedScavengers: 0,
        defeatedBrutes: 0,
      },
    };

    this.creatures = {
      owned: [],
      pendingDeliveries: [],
    };

    const initialUnlocked: UnlockedProducts = {
      stone: true,
      fur: false,
      fertilizer: false,
      thread: false,
      fabric: false,
      techParts: false,
    };

    this.orders = {
      active: SupplyOrderSystem.createInitialOrders(initialUnlocked),
      streak: 0,
      completedCount: 0,
    };

    this.machines = [
      {
        id: 'drill',
        padId: 'pad_1',
        kind: 'drill',
        status: 'unbuilt',
        health: GAME_CONFIG.machines.drill.maxHealth,
        maxHealth: GAME_CONFIG.machines.drill.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        activeJob: null,
        queuedJobs: [],
        outputTray: [],
        maxOutputSlots: 3,
        autoRunEnabled: true,
        level: 1,
      },
      {
        id: 'spinnery',
        padId: 'pad_2',
        kind: 'spinnery',
        status: 'unbuilt',
        health: GAME_CONFIG.machines.spinnery.maxHealth,
        maxHealth: GAME_CONFIG.machines.spinnery.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        activeJob: null,
        queuedJobs: [],
        outputTray: [],
        maxOutputSlots: 3,
        autoRunEnabled: false,
        level: 1,
      },
      {
        id: 'tailor',
        padId: 'pad_3',
        kind: 'tailor',
        status: 'unbuilt',
        health: GAME_CONFIG.machines.tailor.maxHealth,
        maxHealth: GAME_CONFIG.machines.tailor.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        activeJob: null,
        queuedJobs: [],
        outputTray: [],
        maxOutputSlots: 3,
        autoRunEnabled: false,
        level: 1,
      },
      {
        id: 'stoneForge',
        padId: 'pad_4',
        kind: 'stoneForge',
        status: 'unbuilt',
        health: GAME_CONFIG.machines.stoneForge.maxHealth,
        maxHealth: GAME_CONFIG.machines.stoneForge.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        activeJob: null,
        queuedJobs: [],
        outputTray: [],
        maxOutputSlots: 3,
        autoRunEnabled: false,
        level: 1,
      },
      {
        id: 'workshop',
        padId: 'pad_5',
        kind: 'workshop',
        status: 'unbuilt',
        health: GAME_CONFIG.machines.workshop.maxHealth,
        maxHealth: GAME_CONFIG.machines.workshop.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        activeJob: null,
        queuedJobs: [],
        outputTray: [],
        maxOutputSlots: 2,
        autoRunEnabled: true,
        level: 1,
      },
    ];

    this.defenses = [
      {
        id: 'def_1',
        padId: 'def_pad_1',
        kind: 'pulseTurret',
        status: 'unbuilt',
        health: GAME_CONFIG.defenses.pulseTurret.maxHealth,
        maxHealth: GAME_CONFIG.defenses.pulseTurret.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        cooldownRemainingSeconds: 0,
      },
      {
        id: 'def_2',
        padId: 'def_pad_2',
        kind: 'snareTotem',
        status: 'unbuilt',
        health: GAME_CONFIG.defenses.snareTotem.maxHealth,
        maxHealth: GAME_CONFIG.defenses.snareTotem.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        cooldownRemainingSeconds: 0,
      },
      {
        id: 'def_3',
        padId: 'def_pad_3',
        kind: 'repairBeacon',
        status: 'unbuilt',
        health: GAME_CONFIG.defenses.repairBeacon.maxHealth,
        maxHealth: GAME_CONFIG.defenses.repairBeacon.maxHealth,
        constructionRemainingSeconds: 0,
        repairRemainingSeconds: 0,
        cooldownRemainingSeconds: 0,
      },
    ];

    this.workshop = {
      activeJob: null,
      queuedJobs: [],
      readyOutputs: [],
    };

    this.rocket = {
      repaired: false,
      cargoLevel: 0,
      selectedCreatureIds: [],
    };

    this.equipment = {
      rabbitArmor: 0,
      bullArmor: 0,
      swordSupportUnlocked: false,
      gunSupportUnlocked: false,
    };

    this.invasion = this.createInitialInvasionState();

    this.stats = {
      totalStoneGathered: 0,
      totalFurHarvested: 0,
      totalFertilizerProduced: 0,
      totalCoinsEarned: 0,
      totalTechPartsProduced: 0,
      totalThreadProduced: 0,
      totalFabricProduced: 0,
      startTime: Date.now(),
      runTimerActive: true,
      missionTimerSeconds: 0,
      campaignVictoryAchieved: false,
    };
  }

  private createInitialInvasionState(): InvasionState {
    const rawBuildings = GAME_CONFIG.enemyBase.buildings;
    const buildingKeys = Object.keys(rawBuildings) as Array<keyof typeof rawBuildings>;

    const buildings: EnemyBuildingState[] = buildingKeys.map((key) => {
      const b = rawBuildings[key];
      return {
        id: b.id,
        kind: b.kind,
        name: b.name,
        health: b.maxHealth,
        maxHealth: b.maxHealth,
        position: [...b.position],
        isDefense: b.isDefense,
        countsForPercent: b.countsForPercent,
        isDead: false,
        attackCooldownTimer: 0,
        currentTargetId: null,
        lootAwardedThresholds: b.kind === 'resourceDepot' ? [false, false, false, false] : undefined,
      };
    });

    const walls: EnemyWallState[] = GAME_CONFIG.enemyBase.walls.map((w) => ({
      id: w.id,
      position: [...w.position],
      health: w.maxHealth,
      maxHealth: w.maxHealth,
      isDead: false,
    }));

    return {
      phase: 'inactive',
      committedCreatureIds: [],
      deployedCreatureIds: [],
      selectedSupport: null,
      supportChargesRemaining: 0,
      supportCooldownRemainingSeconds: 0,
      timerStarted: false,
      remainingSeconds: GAME_CONFIG.enemyBase.battleDurationSeconds,
      buildings,
      walls,
      destructionPercent: 0,
      stars: {
        fiftyPercent: false,
        core: false,
        fullDestruction: false,
      },
      lootEscrow: {
        coins: 0,
        stone: 0,
        techParts: 0,
      },
      lootSettlement: null,
      finalized: false,
    };
  }

  // --- Getters ---
  public getState() {
    return this;
  }

  public get phase(): GameMode {
    return this.mode;
  }

  public get coins(): number {
    return this.economy.coins;
  }

  public get stone(): number {
    return this.economy.inventory.stone;
  }

  public get fur(): number {
    return this.economy.inventory.fur;
  }

  public get fertilizer(): number {
    return this.economy.inventory.fertilizer;
  }

  public get thread(): number {
    return this.economy.inventory.thread;
  }

  public get fabric(): number {
    return this.economy.inventory.fabric;
  }

  public get techParts(): number {
    return this.economy.inventory.techParts;
  }

  public get inventory(): Record<OrderResourceType, number> {
    return this.economy.inventory;
  }

  public get totalStoredGoods(): number {
    return (
      this.economy.inventory.stone +
      this.economy.inventory.fur +
      this.economy.inventory.fertilizer +
      this.economy.inventory.thread +
      this.economy.inventory.fabric +
      this.economy.inventory.techParts
    );
  }

  public get warehouseCapacity(): number {
    return GAME_CONFIG.economy.warehouse.capacities[this.economy.warehouseLevel];
  }

  public get isWarehouseFull(): boolean {
    return this.totalStoredGoods >= this.warehouseCapacity;
  }

  public get remainingWarehouseCapacity(): number {
    return Math.max(0, this.warehouseCapacity - this.totalStoredGoods);
  }

  public get livingCreatureCount(): number {
    return this.creatures.owned.length + this.creatures.pendingDeliveries.length;
  }

  public get pendingDeliveries(): PendingCreatureDelivery[] {
    return this.creatures.pendingDeliveries;
  }

  public get ownedCreatures(): OwnedCreature[] {
    return this.creatures.owned;
  }

  public get selectedCreatureIds(): string[] {
    return this.rocket.selectedCreatureIds;
  }

  public get rocketCapacity(): number {
    return GAME_CONFIG.rocket.capacities[this.rocket.cargoLevel];
  }

  public get selectedArmyWeight(): number {
    return this.rocket.selectedCreatureIds.reduce((sum, id) => {
      const c = this.creatures.owned.find((item) => item.id === id);
      if (!c) return sum;
      return sum + GAME_CONFIG.creatures[c.kind].weight;
    }, 0);
  }

  public get isRocketRepaired(): boolean {
    return this.rocket.repaired;
  }

  public get cargoLevel(): 0 | 1 | 2 {
    return this.rocket.cargoLevel;
  }

  public get isDrillBuilt(): boolean {
    const drill = this.machines.find((m) => m.id === 'drill');
    return drill?.status === 'idle' || drill?.status === 'processing' || drill?.status === 'outputFull';
  }

  public get unlockedProducts(): UnlockedProducts {
    return {
      stone: true,
      fur: this.stats.totalFurHarvested > 0 || this.creatures.owned.some((c) => c.kind === 'rabbit'),
      fertilizer: this.stats.totalFertilizerProduced > 0,
      thread: this.stats.totalThreadProduced > 0,
      fabric: this.stats.totalFabricProduced > 0,
      techParts: this.stats.totalTechPartsProduced > 0,
    };
  }

  // --- Mode Management ---
  public setMode(newMode: GameMode): void {
    if (this.mode === newMode) return;
    this.mode = newMode;
    GameEvents.emit('mode-changed', newMode);
    GameEvents.emit('phase-changed', newMode);
  }

  public setPhase(newPhase: GameMode): void {
    this.setMode(newPhase);
  }

  // --- Economy Transactions ---
  public addCoins(amount: number): void {
    if (amount <= 0) return;
    this.economy.coins += amount;
    this.stats.totalCoinsEarned += amount;
    GameEvents.emit('coins-changed', { amount: this.economy.coins, delta: amount });
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.economy.coins < amount) return false;
    this.economy.coins -= amount;
    GameEvents.emit('coins-changed', { amount: this.economy.coins, delta: -amount });
    return true;
  }

  public addToInventory(resource: OrderResourceType, amount: number): boolean {
    return this.addResource(resource, amount);
  }

  public addStone(amount: number): boolean {
    return this.addResource('stone', amount);
  }

  public addTechParts(amount: number): boolean {
    return this.addResource('techParts', amount);
  }

  public spendStone(amount: number): boolean {
    return this.spendResource('stone', amount);
  }

  public spendCarrots(amount: number): boolean {
    return this.spendResource('fertilizer', amount);
  }

  public repairRocket(): boolean {
    if (this.rocket.repaired) return false;
    if (this.techParts < 12) return false;
    this.spendResource('techParts', 12);
    this.rocket.repaired = true;
    GameEvents.emit('rocket-repaired');
    return true;
  }

  public buildDrill(): boolean {
    const drill = this.machines.find((m) => m.id === 'drill');
    if (!drill || drill.status !== 'unbuilt') return false;
    if (this.techParts < 2 && this.coins < 120) return false;
    if (this.techParts >= 2) {
      this.spendResource('techParts', 2);
    } else {
      this.spendCoins(120);
    }
    drill.status = 'idle';
    GameEvents.emit('machine-purchased', drill);
    return true;
  }

  public addResource(resource: OrderResourceType, amount: number): boolean {
    if (amount <= 0) return false;
    if (this.totalStoredGoods + amount > this.warehouseCapacity) return false;
    this.economy.inventory[resource] += amount;

    if (resource === 'stone') this.stats.totalStoneGathered += amount;
    if (resource === 'fur') this.stats.totalFurHarvested += amount;
    if (resource === 'fertilizer') this.stats.totalFertilizerProduced += amount;
    if (resource === 'thread') this.stats.totalThreadProduced += amount;
    if (resource === 'fabric') this.stats.totalFabricProduced += amount;
    if (resource === 'techParts') this.stats.totalTechPartsProduced += amount;

    GameEvents.emit(`${resource}-changed` as any, {
      amount: this.economy.inventory[resource],
      delta: amount,
    });
    return true;
  }

  public spendResource(resource: OrderResourceType, amount: number): boolean {
    if (amount <= 0) return false;
    if ((this.economy.inventory[resource] || 0) < amount) return false;
    this.economy.inventory[resource] -= amount;
    GameEvents.emit(`${resource}-changed` as any, {
      amount: this.economy.inventory[resource],
      delta: -amount,
    });
    return true;
  }

  public upgradeWarehouse(): boolean {
    if (this.economy.warehouseLevel >= 2) return false;
    const nextLevel = (this.economy.warehouseLevel + 1) as 1 | 2;
    const cost = GAME_CONFIG.economy.warehouse.upgradeCosts[nextLevel];
    if (!this.spendCoins(cost)) return false;

    this.economy.warehouseLevel = nextLevel;
    GameEvents.emit('warehouse-upgraded', nextLevel);
    return true;
  }

  public sellToMarket(resource: OrderResourceType, amount: number): boolean {
    if (amount <= 0) return false;
    if ((this.economy.inventory[resource] || 0) < amount) return false;

    const unitPrice = GAME_CONFIG.economy.market[resource];
    const totalEarnings = unitPrice * amount;

    this.spendResource(resource, amount);
    this.addCoins(totalEarnings);
    GameEvents.emit('market-sold', { resource, amount, earnings: totalEarnings });
    return true;
  }

  // --- Carrot Placement & Harvesting ---
  public canPlaceCarrot(position: [number, number, number]): boolean {
    if (this.economy.coins < GAME_CONFIG.economy.carrot.cost) return false;
    const [x, , z] = position;
    // Bounds check
    const distSq = x * x + z * z;
    if (distSq > 11.5 * 11.5) return false;

    // Check overlap with pads, warehouse, rocket, rabbit pen
    const pads = [
      ...GAME_CONFIG.homeLayout.machinePads.map((p) => p.position),
      ...GAME_CONFIG.homeLayout.defensePads.map((p) => p.position),
      GAME_CONFIG.homeLayout.warehouse,
      GAME_CONFIG.homeLayout.rabbitPen,
      GAME_CONFIG.homeLayout.rocket,
    ];

    for (const [px, , pz] of pads) {
      const d = Math.hypot(x - px, z - pz);
      if (d < 2.2) return false;
    }

    // Overlap with existing patches
    for (const patch of this.home.carrotPatches) {
      const [ox, , oz] = patch.position;
      const d = Math.hypot(x - ox, z - oz);
      if (d < 1.4) return false;
    }

    return true;
  }

  public placeCarrot(position: [number, number, number]): CarrotPatchState | null {
    if (!this.canPlaceCarrot(position)) return null;
    if (!this.spendCoins(GAME_CONFIG.economy.carrot.cost)) return null;

    const patch: CarrotPatchState = {
      id: generateLocalId('patch'),
      position: [...position],
      status: 'growing',
      growthElapsedSeconds: 0,
      growthDurationSeconds: GAME_CONFIG.economy.carrot.growthSeconds,
      foodUnits: GAME_CONFIG.economy.carrot.foodUnits,
      unitsEaten: 0,
      fertilized: false,
      reservedUnits: {},
    };

    this.home.carrotPatches.push(patch);
    GameEvents.emit('carrot-patch-placed', patch);
    return patch;
  }

  public applyFertilizer(patchId: string): boolean {
    const patch = this.home.carrotPatches.find((p) => p.id === patchId);
    if (!patch || patch.fertilized || patch.status === 'depleted') return false;
    if (!this.spendResource('fertilizer', 1)) return false;

    patch.fertilized = true;
    if (patch.status === 'growing') {
      patch.growthElapsedSeconds = Math.min(
        GAME_CONFIG.economy.carrot.fertilizedGrowthSeconds,
        patch.growthElapsedSeconds
      );
      patch.growthDurationSeconds = GAME_CONFIG.economy.carrot.fertilizedGrowthSeconds;
    }
    // Total capacity becomes 8, available units = 8 - unitsEaten
    patch.foodUnits = Math.max(0, GAME_CONFIG.economy.carrot.fertilizedFoodUnits - patch.unitsEaten);

    GameEvents.emit('patch-fertilized', patch);
    return true;
  }

  public reserveFoodUnit(creatureId: string, patchId: string): boolean {
    const patch = this.home.carrotPatches.find((p) => p.id === patchId);
    if (!patch || patch.status !== 'mature' || patch.foodUnits <= 0) return false;

    const reservedCount = Object.keys(patch.reservedUnits).length;
    if (reservedCount >= patch.foodUnits) return false;

    const unitId = `unit_${patch.id}_${reservedCount + 1}`;
    patch.reservedUnits[creatureId] = unitId;
    return true;
  }

  public releaseFoodReservation(creatureId: string): void {
    for (const patch of this.home.carrotPatches) {
      if (patch.reservedUnits[creatureId]) {
        delete patch.reservedUnits[creatureId];
      }
    }
  }

  public consumeFoodUnit(creatureId: string, patchId: string): boolean {
    const patch = this.home.carrotPatches.find((p) => p.id === patchId);
    if (!patch || patch.foodUnits <= 0) return false;

    delete patch.reservedUnits[creatureId];
    patch.foodUnits--;
    patch.unitsEaten++;

    if (patch.foodUnits <= 0) {
      patch.status = 'depleted';
      patch.wiltTimer = GAME_CONFIG.economy.carrot.wiltDurationSeconds;
      patch.reservedUnits = {}; // Release all
    }

    GameEvents.emit('carrot-consumed', { creatureId, patchId, remaining: patch.foodUnits });
    return true;
  }

  // --- Loose Products ---
  public spawnLooseProduct(
    kind: LooseProductKind,
    worldPosition: [number, number, number],
    ownerSourceId: string = 'world',
    payloadItemId?: string
  ): LooseProduct {
    const lifetimes = GAME_CONFIG.economy.looseProducts;
    let lifetime = Infinity;
    if (kind === 'fur') lifetime = lifetimes.furLifetime;
    else if (kind === 'fertilizer') lifetime = lifetimes.fertilizerLifetime;
    else if (kind === 'stone') lifetime = lifetimes.stoneLifetime;
    else if (kind === 'thread') lifetime = lifetimes.threadLifetime;
    else if (kind === 'fabric') lifetime = lifetimes.fabricLifetime;
    else if (kind === 'techPart') lifetime = lifetimes.techPartLifetime;

    const product: LooseProduct = {
      id: generateLocalId('prod'),
      kind,
      worldPosition: [...worldPosition],
      ownerSourceId,
      ageSeconds: 0,
      lifetimeSeconds: lifetime,
      reservedByRaiderId: null,
      payloadItemId,
    };

    this.home.looseProducts.push(product);
    GameEvents.emit('product-spawned', product);
    return product;
  }

  public canCollectProduct(productId: string): boolean {
    const product = this.home.looseProducts.find((p) => p.id === productId);
    if (!product) return false;
    if (product.reservedByRaiderId !== null) return false; // Already physically carried
    if (product.kind === 'workshopItem') return true;

    // Check warehouse capacity
    return !this.isWarehouseFull;
  }

  public collectProduct(productId: string): LooseProduct | null {
    const idx = this.home.looseProducts.findIndex((p) => p.id === productId);
    if (idx === -1) return null;
    const product = this.home.looseProducts[idx];

    if (!this.canCollectProduct(productId)) return null;

    this.home.looseProducts.splice(idx, 1);

    if (product.kind === 'stone') this.addResource('stone', 1);
    else if (product.kind === 'fur') this.addResource('fur', 1);
    else if (product.kind === 'fertilizer') this.addResource('fertilizer', 1);
    else if (product.kind === 'thread') this.addResource('thread', 1);
    else if (product.kind === 'fabric') this.addResource('fabric', 1);
    else if (product.kind === 'techPart') this.addResource('techParts', 1);
    else if (product.kind === 'workshopItem' && product.payloadItemId) {
      this.collectWorkshopItem(product.payloadItemId);
    }

    GameEvents.emit('product-collected', product);
    return product;
  }

  // --- Stone Nodes ---
  public clickStoneNode(nodeId: string): boolean {
    const node = this.home.stoneNodes.find((n) => n.id === nodeId);
    if (!node || node.charges <= 0) return false;

    if ((node.clickCooldownRemainingSeconds || 0) > 0) {
      return false;
    }

    node.charges--;
    node.clickCooldownRemainingSeconds = GAME_CONFIG.economy.stoneNode.clickCooldownSeconds;

    if (!this.isWarehouseFull) {
      this.addResource('stone', 1);
    } else {
      // Spawn loose stone
      const offset: [number, number, number] = [
        node.position[0] + (Math.random() - 0.5) * 1.2,
        node.position[1] + 0.2,
        node.position[2] + (Math.random() - 0.5) * 1.2,
      ];
      this.spawnLooseProduct('stone', offset, node.id);
    }

    GameEvents.emit('stone-mined', { nodeId, position: node.position });
    return true;
  }

  // --- Creatures & Feeding ---
  public purchaseCreature(kind: CreatureKind): boolean {
    const cost = GAME_CONFIG.creatures[kind].cost;
    if (this.livingCreatureCount >= GAME_CONFIG.economy.populationCap) return false;
    if (!this.spendCoins(cost)) return false;

    const pending: PendingCreatureDelivery = {
      id: generateLocalId(kind),
      kind,
      name: generateCreatureName(kind),
      remainingSeconds: GAME_CONFIG.economy.deliveryCooldownSeconds,
    };

    this.creatures.pendingDeliveries.push(pending);
    GameEvents.emit('creature-purchased', pending);
    return true;
  }

  public deliverCreature(pending: PendingCreatureDelivery): OwnedCreature {
    this.creatures.pendingDeliveries = this.creatures.pendingDeliveries.filter((p) => p.id !== pending.id);

    const stats = getCreatureStats({
      kind: pending.kind,
      growthStage: 1,
      armorEquipped: false,
    });

    const appetiteConfig = GAME_CONFIG.creatures[pending.kind];
    const firstAppetite =
      appetiteConfig.appetiteFirstMinSeconds +
      Math.random() * (appetiteConfig.appetiteFirstMaxSeconds - appetiteConfig.appetiteFirstMinSeconds);

    const creature: OwnedCreature = {
      id: pending.id,
      kind: pending.kind,
      name: pending.name,
      carrotsEaten: 0,
      armorEquipped: false,
      currentHealth: stats.maxHealth,
      // Delivery is already represented by the timed queue. Leaving a creature
      // in "arriving" here meant it never entered the appetite/production loop.
      homeState: 'active',
      invasionState: 'home',
      productionCounter: 0,
      appetiteRemainingSeconds: firstAppetite,
      recoveryRemainingSeconds: 0,
      pendingProduct: null,
    };

    this.creatures.owned.push(creature);
    this.checkRaidUnlock();
    GameEvents.emit('creature-delivered', creature);
    return creature;
  }

  public feedCreature(creatureId: string): { newStage: GrowthStage; grew: boolean } | null {
    const creature = this.creatures.owned.find((c) => c.id === creatureId);
    if (!creature) return null;

    creature.carrotsEaten++;
    const oldStage = getGrowthStage(creature.kind, creature.carrotsEaten - 1);
    const newStage = getGrowthStage(creature.kind, creature.carrotsEaten);

    let grew = false;
    if (newStage !== oldStage) {
      grew = true;
      const oldStats = getCreatureStats({ ...creature, growthStage: oldStage });
      const newStats = getCreatureStats({ ...creature, growthStage: newStage });
      const hpDiff = newStats.maxHealth - oldStats.maxHealth;
      creature.currentHealth = Math.min(newStats.maxHealth, creature.currentHealth + hpDiff);
      GameEvents.emit('creature-growth', { creature, oldStage, newStage });
    }

    // Schedule production
    if (creature.kind === 'rabbit') {
      const delay = GAME_CONFIG.creatures.rabbit.furProductionDelaySeconds;
      creature.pendingProduct = {
        kind: 'fur',
        remainingSeconds: delay,
        totalSeconds: delay,
      };
    } else {
      creature.productionCounter++;
      if (creature.productionCounter >= GAME_CONFIG.creatures.bull.mealsPerFertilizer) {
        creature.productionCounter = 0;
        const delay = GAME_CONFIG.creatures.bull.fertilizerProductionDelaySeconds;
        creature.pendingProduct = {
          kind: 'fertilizer',
          remainingSeconds: delay,
          totalSeconds: delay,
        };
      }
    }

    // Reset appetite
    const appetiteConfig = GAME_CONFIG.creatures[creature.kind];
    creature.appetiteRemainingSeconds =
      appetiteConfig.appetiteLaterMinSeconds +
      Math.random() * (appetiteConfig.appetiteLaterMaxSeconds - appetiteConfig.appetiteLaterMinSeconds);

    GameEvents.emit('creature-fed', { creature, carrotsEaten: creature.carrotsEaten });
    return { newStage, grew };
  }

  public interactWithCreature(creatureId: string): { action: 'fur' | 'fertilizer' | 'pet' | 'speedup'; spawnedProduct?: LooseProduct } | null {
    const creature = this.creatures.owned.find((c) => c.id === creatureId);
    if (!creature) return null;

    const pos = creature.worldPosition ?? [0, 0, 0];
    const dropPos: [number, number, number] = [
      pos[0] + (Math.random() - 0.5) * 0.6,
      0.2,
      pos[2] + (Math.random() - 0.5) * 0.6,
    ];

    // 1. If creature has pending product, speed up / harvest immediately
    if (creature.pendingProduct) {
      const kind = creature.pendingProduct.kind;
      creature.pendingProduct = null;
      const product = this.spawnLooseProduct(kind, dropPos, creature.id);
      GameEvents.emit('creature-pet', { creature, product });
      return { action: 'speedup', spawnedProduct: product };
    }

    // 2. Direct harvest / pet click
    if ((creature.petCooldownRemainingSeconds || 0) <= 0) {
      creature.petCooldownRemainingSeconds = 3.0;
      if (creature.kind === 'rabbit') {
        const product = this.spawnLooseProduct('fur', dropPos, creature.id);
        GameEvents.emit('creature-pet', { creature, product });
        return { action: 'fur', spawnedProduct: product };
      } else {
        GameEvents.emit('creature-pet', { creature });
        return { action: 'pet' };
      }
    }

    return null;
  }

  public assignArmor(creatureId: string, armorKind: ArmorKind): boolean {
    const creature = this.creatures.owned.find((c) => c.id === creatureId);
    if (!creature || creature.armorEquipped) return false;

    if (creature.kind === 'rabbit' && armorKind !== 'rabbitArmor') return false;
    if (creature.kind === 'bull' && armorKind !== 'bullArmor') return false;

    if (this.equipment[armorKind] <= 0) return false;

    this.equipment[armorKind]--;
    const oldStats = getCreatureStats(creature);
    creature.armorEquipped = true;
    const newStats = getCreatureStats(creature);
    const hpDiff = newStats.maxHealth - oldStats.maxHealth;
    creature.currentHealth = Math.min(newStats.maxHealth, creature.currentHealth + hpDiff);

    GameEvents.emit('armor-assigned', { creature, armorKind });
    return true;
  }

  // --- Supply Orders ---
  public completeOrder(orderId: string): boolean {
    const orderIndex = this.orders.active.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;
    const order = this.orders.active[orderIndex];

    if (!SupplyOrderSystem.canCompleteOrder(order, this.economy.inventory)) return false;

    for (const req of order.requirements) {
      this.spendResource(req.resource, req.amount);
    }

    const reward = SupplyOrderSystem.calculateOrderReward(order, this.orders.streak);
    this.addCoins(reward);

    this.orders.streak++;
    this.orders.completedCount++;
    order.status = 'completed';
    order.replacementTimer = 3.0;

    GameEvents.emit('order-completed', { order, reward, streak: this.orders.streak });
    return true;
  }

  public expireOrder(orderId: string): void {
    const order = this.orders.active.find((o) => o.id === orderId);
    if (!order || order.status !== 'active') return;

    order.status = 'expired';
    order.replacementTimer = 3.0;
    this.orders.streak = 0; // Reset streak
    GameEvents.emit('order-expired', order);
  }

  // --- Machines & Production ---
  public purchaseMachine(kind: MachineKind): boolean {
    const machine = this.machines.find((m) => m.kind === kind);
    if (!machine || machine.status !== 'unbuilt') return false;

    // Prerequisite check
    if (kind === 'tailor') {
      const spinnery = this.machines.find((m) => m.kind === 'spinnery');
      if (!spinnery || spinnery.status === 'unbuilt' || spinnery.status === 'constructing') return false;
    }
    if (kind === 'stoneForge') {
      const drill = this.machines.find((m) => m.kind === 'drill');
      if (!drill || drill.status === 'unbuilt' || drill.status === 'constructing') return false;
    }
    if (kind === 'workshop') {
      const tailor = this.machines.find((m) => m.kind === 'tailor');
      const forge = this.machines.find((m) => m.kind === 'stoneForge');
      if (
        !tailor || tailor.status === 'unbuilt' || tailor.status === 'constructing' ||
        !forge || forge.status === 'unbuilt' || forge.status === 'constructing'
      ) {
        return false;
      }
    }

    const price = (GAME_CONFIG.machines as any)[kind]?.price || 0;
    if (!this.spendCoins(price)) return false;

    machine.status = 'constructing';
    machine.constructionRemainingSeconds = GAME_CONFIG.machines.constructionTimeSeconds;
    this.checkRaidUnlock();

    GameEvents.emit('machine-purchased', machine);
    return true;
  }

  public getMachineUpgradeCost(machine: MachineState): number | null {
    if (machine.level >= 3) return null;
    const basePrice = (GAME_CONFIG.machines as any)[machine.kind]?.price || 100;
    return Math.ceil(basePrice * (machine.level === 1 ? 0.5 : 0.85));
  }

  public upgradeMachine(machineId: string): boolean {
    const machine = this.machines.find((item) => item.id === machineId);
    if (!machine || machine.status === 'unbuilt' || machine.status === 'constructing' || machine.level >= 3) return false;

    const cost = this.getMachineUpgradeCost(machine);
    if (cost === null || !this.spendCoins(cost)) return false;

    machine.level = (machine.level + 1) as 2 | 3;
    GameEvents.emit('machine-upgraded', machine);
    return true;
  }

  private getMachineJobDuration(machine: MachineState, baseDurationSeconds: number): number {
    return baseDurationSeconds / (1 + (machine.level - 1) * 0.35);
  }

  public canQueueMachineJob(machineId: string, recipeId?: string): boolean {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine || (machine.status !== 'idle' && machine.status !== 'processing')) return false;
    if (machine.queuedJobs.length >= GAME_CONFIG.machines.maxQueuedJobs) return false;

    if (machine.kind === 'spinnery') {
      return this.fur >= 2;
    }
    if (machine.kind === 'tailor') {
      return this.thread >= 2;
    }
    if (machine.kind === 'stoneForge') {
      return this.stone >= 5;
    }
    if (machine.kind === 'workshop' && recipeId) {
      return this.canQueueWorkshopRecipe(recipeId);
    }

    return false;
  }

  public queueMachineJob(machineId: string, recipeId?: string): boolean {
    if (!this.canQueueMachineJob(machineId, recipeId)) return false;
    const machine = this.machines.find((m) => m.id === machineId)!;
    let job: MachineJob | null = null;
    if (machine.kind === 'spinnery') {
      this.spendResource('fur', 2);
      job = {
        id: generateLocalId('job'),
        inputSpent: true,
        elapsedSeconds: 0,
        durationSeconds: this.getMachineJobDuration(machine, GAME_CONFIG.machines.spinnery.durationSeconds),
        outputKind: 'thread',
        outputAmount: 1,
      };
    } else if (machine.kind === 'tailor') {
      this.spendResource('thread', 2);
      job = {
        id: generateLocalId('job'),
        inputSpent: true,
        elapsedSeconds: 0,
        durationSeconds: this.getMachineJobDuration(machine, GAME_CONFIG.machines.tailor.durationSeconds),
        outputKind: 'fabric',
        outputAmount: 1,
      };
    } else if (machine.kind === 'stoneForge') {
      this.spendResource('stone', 5);
      job = {
        id: generateLocalId('job'),
        inputSpent: true,
        elapsedSeconds: 0,
        durationSeconds: this.getMachineJobDuration(machine, GAME_CONFIG.machines.stoneForge.durationSeconds),
        outputKind: 'techPart',
        outputAmount: 1,
      };
    } else if (machine.kind === 'workshop' && recipeId) {
      return this.queueWorkshopRecipe(recipeId);
    }

    if (job) {
      if (machine.activeJob === null && machine.status === 'idle') {
        machine.activeJob = job;
        machine.status = 'processing';
      } else {
        machine.queuedJobs.push(job);
      }
    }

    GameEvents.emit('machine-job-queued', machine);
    return true;
  }

  public canQueueWorkshopRecipe(recipeId: string): boolean {
    const recipe = (GAME_CONFIG.workshop.recipes as any)[recipeId] as WorkshopRecipeDefinition;
    if (!recipe) return false;

    if (this.workshop.queuedJobs.length >= GAME_CONFIG.machines.maxQueuedJobs) return false;

    // Check one-time locks
    if (recipe.isOneTime) {
      if (recipeId === 'swordSupport' && this.equipment.swordSupportUnlocked) return false;
      if (recipeId === 'gunSupport' && this.equipment.gunSupportUnlocked) return false;
      if (recipeId === 'rocketRepair' && this.rocket.repaired) return false;
      if (recipeId === 'cargoUpgrade1' && this.rocket.cargoLevel >= 1) return false;
      if (recipeId === 'cargoUpgrade2' && (this.rocket.cargoLevel < 1 || this.rocket.cargoLevel >= 2)) return false;

      // Also cannot be currently active, queued, or ready on table
      const isAlreadyQueued =
        this.workshop.activeJob?.recipeId === recipeId ||
        this.workshop.queuedJobs.includes(recipeId) ||
        this.workshop.readyOutputs.includes(recipeId);
      if (isAlreadyQueued) return false;
    }

    if (recipe.requiresRepair && !this.rocket.repaired) return false;
    if (recipe.requiresCargoLevel !== undefined && this.rocket.cargoLevel < recipe.requiresCargoLevel) return false;

    if (this.stone < recipe.stone) return false;
    if (this.fabric < recipe.fabric) return false;
    if (this.techParts < recipe.techParts) return false;
    if (recipe.coins > 0 && this.coins < recipe.coins) return false;

    return true;
  }

  public queueWorkshopRecipe(recipeId: string): boolean {
    if (!this.canQueueWorkshopRecipe(recipeId)) return false;
    const recipe = (GAME_CONFIG.workshop.recipes as any)[recipeId] as WorkshopRecipeDefinition;

    if (recipe.stone > 0) this.spendResource('stone', recipe.stone);
    if (recipe.fabric > 0) this.spendResource('fabric', recipe.fabric);
    if (recipe.techParts > 0) this.spendResource('techParts', recipe.techParts);
    const workshopMachine = this.machines.find((machine) => machine.kind === 'workshop');
    if (this.workshop.activeJob === null && this.workshop.readyOutputs.length < 2) {
      this.workshop.activeJob = {
        recipeId,
        elapsedSeconds: 0,
        durationSeconds: workshopMachine
          ? this.getMachineJobDuration(workshopMachine, recipe.durationSeconds)
          : recipe.durationSeconds,
      };
      GameEvents.emit('workshop-job-started', recipeId);
    } else {
      this.workshop.queuedJobs.push(recipeId);
    }

    GameEvents.emit('workshop-job-queued', recipeId);
    return true;
  }

  public collectWorkshopItem(recipeId: string): boolean {
    const idx = this.workshop.readyOutputs.indexOf(recipeId);
    if (idx === -1) return false;

    this.workshop.readyOutputs.splice(idx, 1);
    const recipe = (GAME_CONFIG.workshop.recipes as any)[recipeId] as WorkshopRecipeDefinition;

    if (recipe.id === 'rabbitArmor') {
      this.equipment.rabbitArmor++;
    } else if (recipe.id === 'bullArmor') {
      this.equipment.bullArmor++;
    } else if (recipe.id === 'swordSupport') {
      this.equipment.swordSupportUnlocked = true;
    } else if (recipe.id === 'gunSupport') {
      this.equipment.gunSupportUnlocked = true;
    } else if (recipe.id === 'rocketRepair') {
      this.rocket.repaired = true;
      GameEvents.emit('rocket-repaired');
    } else if (recipe.id === 'cargoUpgrade1') {
      this.rocket.cargoLevel = 1;
      GameEvents.emit('cargo-upgraded', 1);
    } else if (recipe.id === 'cargoUpgrade2') {
      this.rocket.cargoLevel = 2;
      GameEvents.emit('cargo-upgraded', 2);
    }

    GameEvents.emit('workshop-item-collected', recipeId);
    return true;
  }

  public collectMachineOutput(machineId: string, outputIndex: number = 0): boolean {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine || machine.outputTray.length <= outputIndex) return false;

    const output = machine.outputTray[outputIndex];
    if (this.isWarehouseFull) return false;

    if (this.addResource(output.kind as OrderResourceType, 1)) {
      machine.outputTray.splice(outputIndex, 1);
      if (machine.status === 'outputFull') {
        if (machine.queuedJobs.length > 0) {
          machine.activeJob = machine.queuedJobs.shift()!;
          machine.status = 'processing';
        } else {
          machine.status = 'idle';
        }
      }
      GameEvents.emit('machine-output-collected', { machine, output });
      return true;
    }

    return false;
  }

  public repairMachine(machineId: string): boolean {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine || machine.status !== 'disabled') return false;

    const basePrice = (GAME_CONFIG.machines as any)[machine.kind]?.price || 100;
    const repairCost = Math.ceil(basePrice * GAME_CONFIG.machines.repairCostRatio);

    if (!this.spendCoins(repairCost)) return false;

    machine.health = machine.maxHealth;
    machine.status = machine.activeJob ? 'processing' : 'idle';
    GameEvents.emit('machine-repaired', machine);
    return true;
  }

  public toggleDrill(): boolean {
    const drill = this.machines.find((m) => m.id === 'drill');
    if (!drill || drill.status === 'unbuilt' || drill.status === 'constructing') return false;

    drill.autoRunEnabled = !drill.autoRunEnabled;
    if (!drill.autoRunEnabled && drill.activeJob) {
      drill.activeJob = null; // discard incomplete interval
    }
    GameEvents.emit('drill-toggled', drill.autoRunEnabled);
    return true;
  }

  // --- Defenses ---
  public purchaseDefense(kind: DefenseKind, padId: string): boolean {
    const def = this.defenses.find((d) => d.padId === padId);
    if (!def || def.status !== 'unbuilt') return false;

    const defConfig = GAME_CONFIG.defenses[kind];
    if (!this.spendCoins(defConfig.price)) return false;

    def.kind = kind;
    def.health = defConfig.maxHealth;
    def.maxHealth = defConfig.maxHealth;
    def.status = 'constructing';
    def.constructionRemainingSeconds = GAME_CONFIG.defenses.constructionTimeSeconds;

    GameEvents.emit('defense-purchased', def);
    return true;
  }

  public repairDefense(defenseId: string): boolean {
    const def = this.defenses.find((d) => d.id === defenseId);
    if (!def || def.status !== 'disabled') return false;

    const basePrice = GAME_CONFIG.defenses[def.kind].price;
    const repairCost = Math.ceil(basePrice * GAME_CONFIG.defenses.repairCostRatio);

    if (!this.spendCoins(repairCost)) return false;

    def.health = def.maxHealth;
    def.status = 'active';
    GameEvents.emit('defense-repaired', def);
    return true;
  }

  // --- Raids & Caging ---
  public checkRaidUnlock(): void {
    if (this.home.raid.phase !== 'locked') return;

    const hasBuiltMachine = this.machines.some((m) => m.status !== 'unbuilt');
    const ownsTwoCreatures = this.livingCreatureCount >= 2;

    if (hasBuiltMachine || ownsTwoCreatures) {
      this.home.raid.phase = 'scheduled';
      this.home.raid.secondsUntilSpawn = GAME_CONFIG.raids.firstRaidDelaySeconds;
      GameEvents.emit('raid-unlocked');
    }
  }

  public cageRaider(raiderId: string): boolean {
    const raider = this.home.raid.raiders.find((r) => r.id === raiderId);
    if (!raider || raider.health <= 0) return false;

    if ((raider.cageClickCooldownRemaining || 0) > 0) {
      return false;
    }

    raider.cageClickCooldownRemaining = GAME_CONFIG.raids.caging.clickCooldownSeconds;
    raider.cageDecayRemaining = GAME_CONFIG.raids.caging.segmentDecaySeconds;
    raider.cageSegments++;

    if (raider.cageSegments >= GAME_CONFIG.raids.caging.requiredClicks) {
      raider.isStunned = true;
      raider.stunTimer = GAME_CONFIG.raids.caging.stunDurationSeconds;
      raider.cageSegments = 0;
      GameEvents.emit('raider-caged', raider);
    } else {
      GameEvents.emit('cage-clicked', { raider, segments: raider.cageSegments });
    }

    return true;
  }

  // --- Rocket & Loadout ---
  public selectCreatureForLaunch(creatureId: string): boolean {
    const creature = this.creatures.owned.find((c) => c.id === creatureId);
    if (!creature || creature.homeState === 'recovering') return false;

    const idx = this.rocket.selectedCreatureIds.indexOf(creatureId);
    if (idx !== -1) {
      this.rocket.selectedCreatureIds.splice(idx, 1);
      creature.homeState = 'active';
      GameEvents.emit('army-selection-changed');
      return true;
    }

    const weight = GAME_CONFIG.creatures[creature.kind].weight;
    if (this.selectedArmyWeight + weight > this.rocketCapacity) return false;

    this.releaseFoodReservation(creatureId);
    this.rocket.selectedCreatureIds.push(creatureId);
    creature.homeState = 'selected';
    GameEvents.emit('army-selection-changed');
    return true;
  }

  public clearArmySelection(): void {
    this.creatures.owned.forEach((c) => {
      if (c.homeState === 'selected') c.homeState = 'active';
    });
    this.rocket.selectedCreatureIds = [];
    GameEvents.emit('army-selection-changed');
  }

  public canConfirmLaunch(selectedSupport: 'sword' | 'gun' | 'none' | null): { canLaunch: boolean; reason?: string } {
    if (this.home.raid.phase === 'warning' || this.home.raid.phase === 'active') {
      return { canLaunch: false, reason: 'Home raid in progress' };
    }
    if (this.selectedCreatureIds.length === 0) {
      return { canLaunch: false, reason: 'Select at least one creature' };
    }
    if (selectedSupport === null) {
      return { canLaunch: false, reason: 'Confirm support choice' };
    }

    return { canLaunch: true };
  }

  public confirmLoadout(selectedSupport: 'sword' | 'gun' | 'none'): boolean {
    const check = this.canConfirmLaunch(selectedSupport);
    if (!check.canLaunch) return false;

    // Power off drill
    const drill = this.machines.find((m) => m.id === 'drill');
    if (drill) drill.autoRunEnabled = false;

    this.invasion = this.createInitialInvasionState();
    this.invasion.phase = 'preview';
    this.invasion.committedCreatureIds = [...this.rocket.selectedCreatureIds];
    this.invasion.selectedSupport = selectedSupport;

    if (selectedSupport === 'sword') {
      this.invasion.supportChargesRemaining = GAME_CONFIG.supportPowers.sword.charges;
    } else if (selectedSupport === 'gun') {
      this.invasion.supportChargesRemaining = GAME_CONFIG.supportPowers.gun.charges;
    } else {
      this.invasion.supportChargesRemaining = 0;
    }

    // Set creature states
    this.creatures.owned.forEach((c) => {
      if (this.invasion.committedCreatureIds.includes(c.id)) {
        c.invasionState = 'undeployed';
      }
    });

    this.setMode('invasionPreview');
    return true;
  }

  public returnFromPreview(): void {
    this.creatures.owned.forEach((c) => {
      if (this.invasion.committedCreatureIds.includes(c.id)) {
        c.homeState = 'active';
        c.invasionState = 'home';
      }
    });

    this.invasion.phase = 'inactive';
    this.setMode('home');
    GameEvents.emit('returned-from-preview');
  }

  public startInvasionCombat(): void {
    this.invasion.phase = 'active';
    this.setMode('invasion');
  }

  public deployCreature(creatureId: string, worldPosition: [number, number, number]): boolean {
    if (this.invasion.phase !== 'active' && this.invasion.phase !== 'preview') return false;
    const creature = this.creatures.owned.find((c) => c.id === creatureId);
    if (!creature || creature.invasionState !== 'undeployed') return false;

    creature.invasionState = 'deployed';
    this.invasion.deployedCreatureIds.push(creatureId);

    if (!this.invasion.timerStarted) {
      this.invasion.timerStarted = true;
      this.invasion.phase = 'active';
      this.setMode('invasion');
    }

    GameEvents.emit('invasion-creature-deployed', { creature, position: worldPosition });
    return true;
  }

  // --- Invasion Combat & Support ---
  public useSupportPower(power: 'sword' | 'gun', targetPos: [number, number, number]): boolean {
    if (this.invasion.phase !== 'active' || !this.invasion.timerStarted) return false;
    if (this.invasion.selectedSupport !== power) return false;
    if (this.invasion.supportChargesRemaining <= 0) return false;
    if (this.invasion.supportCooldownRemainingSeconds > 0) return false;

    this.invasion.supportChargesRemaining--;
    const config = GAME_CONFIG.supportPowers[power];
    this.invasion.supportCooldownRemainingSeconds = config.cooldownSeconds;

    GameEvents.emit('support-power-used', { power, targetPos });
    return true;
  }

  public calculateDestruction(): {
    percent: number;
    countedDead: number;
    totalCounted: number;
    stars: { fiftyPercent: boolean; core: boolean; fullDestruction: boolean };
    fiftyPercent: boolean;
    core: boolean;
    fullDestruction: boolean;
  } {
    const countedBuildings = this.invasion.buildings.filter((b) => b.countsForPercent);
    const countedDead = countedBuildings.filter((b) => b.isDead).length;
    const percent = Math.floor((countedDead / Math.max(1, countedBuildings.length)) * 100);
    this.invasion.destructionPercent = percent;

    // Stars
    if (percent >= 50 && !this.invasion.stars.fiftyPercent) {
      this.invasion.stars.fiftyPercent = true;
      GameEvents.emit('star-earned', 1);
    }
    const coreDead = this.invasion.buildings.find((b) => b.kind === 'core')?.isDead ?? false;
    if (coreDead && !this.invasion.stars.core) {
      this.invasion.stars.core = true;
      this.stats.campaignVictoryAchieved = true;
      GameEvents.emit('star-earned', 2);
    }
    if (countedDead === countedBuildings.length && !this.invasion.stars.fullDestruction) {
      this.invasion.stars.fullDestruction = true;
      this.invasion.lootEscrow.coins += GAME_CONFIG.enemyBase.fullDestructionBonus.coins;
      this.invasion.lootEscrow.techParts += GAME_CONFIG.enemyBase.fullDestructionBonus.techParts;
      GameEvents.emit('star-earned', 3);
    }
    return {
      percent,
      countedDead,
      totalCounted: countedBuildings.length,
      stars: this.invasion.stars,
      fiftyPercent: this.invasion.stars.fiftyPercent,
      core: this.invasion.stars.core,
      fullDestruction: this.invasion.stars.fullDestruction,
    };
  }

  public finalizeInvasionResult(): InvasionState {
    if (this.invasion.finalized) return this.invasion;
    this.calculateDestruction();

    // Settle loot escrow
    const escrow = this.invasion.lootEscrow;
    let coinsToAdd = escrow.coins;
    let techPartsStored = 0;
    let stoneStored = 0;
    let techPartsSold = 0;
    let stoneSold = 0;
    let overflowCoins = 0;

    let remCap = this.remainingWarehouseCapacity;

    // Tech parts first
    const techToStore = Math.min(escrow.techParts, remCap);
    techPartsStored = techToStore;
    this.addResource('techParts', techToStore);
    remCap -= techToStore;

    const techOverflow = escrow.techParts - techToStore;
    if (techOverflow > 0) {
      techPartsSold = techOverflow;
      overflowCoins += techOverflow * GAME_CONFIG.economy.market.techParts;
    }

    // Stone second
    const stoneToStore = Math.min(escrow.stone, remCap);
    stoneStored = stoneToStore;
    this.addResource('stone', stoneToStore);
    remCap -= stoneToStore;

    const stoneOverflow = escrow.stone - stoneToStore;
    if (stoneOverflow > 0) {
      stoneSold = stoneOverflow;
      overflowCoins += stoneOverflow * GAME_CONFIG.economy.market.stone;
    }

    coinsToAdd += overflowCoins;
    this.addCoins(coinsToAdd);

    this.invasion.lootSettlement = {
      coinsAdded: coinsToAdd,
      techPartsStored,
      stoneStored,
      techPartsSold,
      stoneSold,
      overflowSaleCoins: overflowCoins,
    };

    this.invasion.finalized = true;
    this.invasion.phase = 'result';
    this.setMode('invasionResult');
    GameEvents.emit('invasion-finalized', this.invasion);
    return this.invasion;
  }

  public continueHomeFromInvasion(): void {
    // 1. Remove permanently lost creatures and their armor
    this.creatures.owned = this.creatures.owned.filter((c) => c.invasionState !== 'lost');

    // 2. Set surviving deployed creatures into 30s recovery
    this.creatures.owned.forEach((c) => {
      if ((c.invasionState === 'deployed' || c.invasionState === 'survived') && c.currentHealth > 0) {
        c.homeState = 'recovering';
        c.invasionState = 'home';
        c.recoveryRemainingSeconds = 30.0;
        this.releaseFoodReservation(c.id);
      } else if (c.invasionState === 'undeployed') {
        c.homeState = 'active';
        c.invasionState = 'home';
        c.recoveryRemainingSeconds = 0;
      }
    });

    // 3. Clear army selection
    this.rocket.selectedCreatureIds = [];
    this.invasion = this.createInitialInvasionState();
    this.setMode('home');
    GameEvents.emit('returned-home');
  }

  // --- Simulation Loop Updates ---
  public update(delta: number): void {
    if (delta <= 0) return;

    if (this.mode === 'home' || this.mode === 'homeRaid') {
      this.updateHomeSimulation(delta);
    } else if (this.mode === 'invasion' && this.invasion.timerStarted && !this.invasion.finalized) {
      this.updateInvasionSimulation(delta);
    }
  }

  private updateHomeSimulation(delta: number): void {
    if (this.stats.runTimerActive) {
      this.stats.missionTimerSeconds += delta;
    }

    // 1. Carrot Patches growth & wilting
    for (let i = this.home.carrotPatches.length - 1; i >= 0; i--) {
      const patch = this.home.carrotPatches[i];
      if (patch.status === 'growing') {
        patch.growthElapsedSeconds += delta;
        if (patch.growthElapsedSeconds >= patch.growthDurationSeconds) {
          patch.status = 'mature';
          GameEvents.emit('patch-mature', patch);
        }
      } else if (patch.status === 'depleted' && patch.wiltTimer !== undefined) {
        patch.wiltTimer -= delta;
        if (patch.wiltTimer <= 0) {
          this.home.carrotPatches.splice(i, 1);
          GameEvents.emit('patch-removed', patch.id);
        }
      }
    }

    // 2. Stone Nodes regen & cooldown
    for (const node of this.home.stoneNodes) {
      if (node.clickCooldownRemainingSeconds && node.clickCooldownRemainingSeconds > 0) {
        node.clickCooldownRemainingSeconds -= delta;
      }
      if (node.charges < node.maxCharges) {
        node.regenElapsedSeconds += delta;
        if (node.regenElapsedSeconds >= GAME_CONFIG.economy.stoneNode.regenSecondsPerCharge) {
          node.charges++;
          node.regenElapsedSeconds = 0;
          GameEvents.emit('stone-node-charged', node);
        }
      }
    }

    // 3. Pending Deliveries
    for (let i = this.creatures.pendingDeliveries.length - 1; i >= 0; i--) {
      const pending = this.creatures.pendingDeliveries[i];
      pending.remainingSeconds -= delta;
      if (pending.remainingSeconds <= 0) {
        this.deliverCreature(pending);
      }
    }

    // 4. Creature Appetite, Recovery & Pending Products
    for (const creature of this.creatures.owned) {
      if (creature.homeState === 'recovering') {
        creature.recoveryRemainingSeconds -= delta;
        const stats = getCreatureStats(creature);
        const healRate = stats.maxHealth / 30.0;
        creature.currentHealth = Math.min(stats.maxHealth, creature.currentHealth + healRate * delta);

        if (creature.recoveryRemainingSeconds <= 0) {
          creature.homeState = 'active';
          creature.currentHealth = stats.maxHealth;
        }
      } else if (creature.homeState === 'active') {
        if (creature.appetiteRemainingSeconds > 0) {
          creature.appetiteRemainingSeconds -= delta;
        }
      }

      if (creature.pendingProduct) {
        creature.pendingProduct.remainingSeconds -= delta;
        if (creature.pendingProduct.remainingSeconds <= 0) {
          const kind = creature.pendingProduct.kind;
          creature.pendingProduct = null;
          // Spawn loose product beside creature
          const pos = creature.worldPosition ?? [0, 0, 0];
          const dropPos: [number, number, number] = [
            pos[0] + (Math.random() - 0.5) * 0.8,
            0.2,
            pos[2] + (Math.random() - 0.5) * 0.8,
          ];
          this.spawnLooseProduct(kind, dropPos, creature.id);
        }
      }

      if (creature.petCooldownRemainingSeconds && creature.petCooldownRemainingSeconds > 0) {
        creature.petCooldownRemainingSeconds = Math.max(0, creature.petCooldownRemainingSeconds - delta);
      }
    }

    // 5. Loose Products lifetimes
    for (let i = this.home.looseProducts.length - 1; i >= 0; i--) {
      const prod = this.home.looseProducts[i];
      if (prod.lifetimeSeconds !== Infinity) {
        prod.ageSeconds += delta;
        if (prod.ageSeconds >= prod.lifetimeSeconds) {
          this.home.looseProducts.splice(i, 1);
          GameEvents.emit('product-expired', prod);
        }
      }
    }

    // 6. Machines & Workshop
    this.updateMachines(delta);

    // 7. Supply Orders
    this.updateOrders(delta);

    // 8. Defenses & Raids
    this.updateDefenses(delta);
    this.updateRaidCycle(delta);
  }

  private updateMachines(delta: number): void {
    for (const machine of this.machines) {
      if (machine.status === 'constructing') {
        machine.constructionRemainingSeconds -= delta;
        if (machine.constructionRemainingSeconds <= 0) {
          machine.status = 'idle';
          GameEvents.emit('machine-built', machine);
        }
      } else if (machine.status === 'idle' || machine.status === 'processing' || machine.status === 'outputFull') {
        // Only the starter drill is an unattended extraction line. Refining machines
        // consume crafted inputs, so every batch begins from a deliberate player click.
        if (machine.status === 'idle' && machine.kind === 'drill' && machine.autoRunEnabled && !machine.activeJob) {
          const automaticJob = this.createAutomaticMachineJob(machine);
          if (automaticJob) {
            machine.activeJob = automaticJob;
            machine.status = 'processing';
          }
        }

        // Advance active job
        if (machine.activeJob && machine.status === 'processing') {
          machine.activeJob.elapsedSeconds += delta;
          if (machine.activeJob.elapsedSeconds >= machine.activeJob.durationSeconds) {
            // Finished
            const finishedJob = machine.activeJob;
            machine.activeJob = null;
            this.depositMachineOutput(machine, finishedJob);

            if (machine.queuedJobs.length > 0) {
              machine.activeJob = machine.queuedJobs.shift()!;
              machine.status = 'processing';
            } else {
              machine.status = 'idle';
            }

            GameEvents.emit('machine-output-ready', machine);
          }
        } else if (machine.status === 'idle' && machine.queuedJobs.length > 0) {
          machine.activeJob = machine.queuedJobs.shift()!;
          machine.status = 'processing';
        }
      }
    }

    // Workshop Update
    if (this.workshop.activeJob) {
      this.workshop.activeJob.elapsedSeconds += delta;
      if (this.workshop.activeJob.elapsedSeconds >= this.workshop.activeJob.durationSeconds) {
        const finishedRecipeId = this.workshop.activeJob.recipeId;
        this.workshop.readyOutputs.push(finishedRecipeId);
        this.workshop.activeJob = null;
        GameEvents.emit('workshop-output-ready', finishedRecipeId);
      }
    } else if (this.workshop.queuedJobs.length > 0 && this.workshop.readyOutputs.length < 2) {
      const nextRecipeId = this.workshop.queuedJobs.shift()!;
      const recipe = (GAME_CONFIG.workshop.recipes as any)[nextRecipeId] as WorkshopRecipeDefinition;
      this.workshop.activeJob = {
        recipeId: nextRecipeId,
        elapsedSeconds: 0,
        durationSeconds: recipe.durationSeconds,
      };
      GameEvents.emit('workshop-job-started', nextRecipeId);
    }
  }

  private createAutomaticMachineJob(machine: MachineState): MachineJob | null {
    if (machine.kind === 'drill') {
      return {
        id: generateLocalId('drillJob'),
        inputSpent: true,
        elapsedSeconds: 0,
        durationSeconds: this.getMachineJobDuration(machine, GAME_CONFIG.machines.drill.intervalSeconds),
        outputKind: GAME_CONFIG.machines.drill.outputKind,
        outputAmount: GAME_CONFIG.machines.drill.outputAmount,
      };
    }

    return null;
  }

  private depositMachineOutput(machine: MachineState, job: MachineJob): void {
    const inventoryKind: OrderResourceType = job.outputKind === 'techPart'
      ? 'techParts'
      : job.outputKind as OrderResourceType;

    if (this.addResource(inventoryKind, job.outputAmount)) {
      GameEvents.emit('machine-output-stored', {
        machine,
        resource: inventoryKind,
        amount: job.outputAmount,
      });
    } else {
      const pad = GAME_CONFIG.homeLayout.machinePads.find((item) => item.id === machine.padId);
      const position = pad?.position ?? [0, 0, 0];
      this.spawnLooseProduct(
        job.outputKind,
        [position[0] + 1.1, 0.2, position[2] + 0.5],
        machine.id
      );
      GameEvents.emit('machine-output-spilled', { machine, resource: inventoryKind, amount: job.outputAmount });
    }
  }

  private updateOrders(delta: number): void {
    const unlocked = this.unlockedProducts;
    for (let i = 0; i < this.orders.active.length; i++) {
      const order = this.orders.active[i];
      if (order.status === 'active') {
        if (order.durationSeconds !== Infinity) {
          order.remainingSeconds -= delta;
          if (order.remainingSeconds <= 0) {
            this.expireOrder(order.id);
          }
        }
      } else {
        order.replacementTimer -= delta;
        if (order.replacementTimer <= 0) {
          const activeTemplateIds = this.orders.active
            .filter((o) => o.status === 'active')
            .map((o) => o.id.split('_')[0]);
          this.orders.active[i] = SupplyOrderSystem.generateOrder(activeTemplateIds, unlocked);
          GameEvents.emit('order-replaced', { index: i, order: this.orders.active[i] });
        }
      }
    }
  }

  private updateDefenses(delta: number): void {
    for (const def of this.defenses) {
      if (def.status === 'constructing') {
        def.constructionRemainingSeconds -= delta;
        if (def.constructionRemainingSeconds <= 0) {
          def.status = 'active';
          GameEvents.emit('defense-built', def);
        }
      } else if (def.status === 'active') {
        if (def.cooldownRemainingSeconds > 0) {
          def.cooldownRemainingSeconds -= delta;
        }

        // Repair beacon active healing
        if (def.kind === 'repairBeacon') {
          const repairAmount = GAME_CONFIG.defenses.repairBeacon.repairPerSecond * delta;
          for (const m of this.machines) {
            if (m.status !== 'disabled' && m.status !== 'unbuilt' && m.health < m.maxHealth) {
              m.health = Math.min(m.maxHealth, m.health + repairAmount);
            }
          }
          for (const otherDef of this.defenses) {
            if (otherDef.id !== def.id && otherDef.status === 'active' && otherDef.health < otherDef.maxHealth) {
              otherDef.health = Math.min(otherDef.maxHealth, otherDef.health + repairAmount);
            }
          }
        }
      }
    }
  }

  private updateRaidCycle(delta: number): void {
    const raid = this.home.raid;
    if (raid.phase === 'locked') return;

    if (raid.phase === 'scheduled') {
      raid.secondsUntilSpawn -= delta;
      if (raid.secondsUntilSpawn <= GAME_CONFIG.raids.warningDurationSeconds) {
        raid.phase = 'warning';
        raid.warningRemainingSeconds = raid.secondsUntilSpawn;
        GameEvents.emit('raid-warning', raid.warningRemainingSeconds);
      }
    } else if (raid.phase === 'warning') {
      raid.warningRemainingSeconds -= delta;
      if (raid.warningRemainingSeconds <= 0) {
        this.spawnRaid();
      }
    } else if (raid.phase === 'active') {
      raid.activeElapsedSeconds += delta;

      for (const raider of raid.raiders) {
        if (raider.cageClickCooldownRemaining && raider.cageClickCooldownRemaining > 0) {
          raider.cageClickCooldownRemaining -= delta;
        }
        if (raider.cageDecayRemaining && raider.cageDecayRemaining > 0) {
          raider.cageDecayRemaining -= delta;
          if (raider.cageDecayRemaining <= 0 && !raider.isStunned) {
            raider.cageSegments = 0;
          }
        }
        if (raider.isStunned && raider.stunTimer > 0) {
          raider.stunTimer -= delta;
          if (raider.stunTimer <= 0) {
            raider.isStunned = false;
          }
        }
      }

      if (raid.activeElapsedSeconds >= GAME_CONFIG.raids.maxRaidDurationSeconds) {
        this.endRaid('timeout');
      } else {
        // Check if all raiders defeated or escaped
        if (raid.raiders.length === 0) {
          this.endRaid('cleared');
        }
      }
    }
  }

  private spawnRaid(): void {
    const raid = this.home.raid;
    raid.phase = 'active';
    raid.raidIndex++;
    raid.activeElapsedSeconds = 0;
    raid.raiders = [];
    raid.goodsStolen = {};
    raid.defeatedScavengers = 0;
    raid.defeatedBrutes = 0;
    this.setMode('homeRaid');

    const index = raid.raidIndex;
    let scavCount = 2;
    let bruteCount = 0;

    if (index === 2) scavCount = 3;
    else if (index === 3) { scavCount = 3; bruteCount = 1; }
    else if (index === 4) { scavCount = 4; bruteCount = 1; }
    else if (index >= 5) { scavCount = Math.min(5, 4 + (index - 4)); bruteCount = 2; }

    for (let i = 0; i < scavCount; i++) {
      raid.raiders.push({
        id: generateLocalId('scav'),
        kind: 'scavenger',
        position: [-10, 0, (Math.random() - 0.5) * 10],
        health: GAME_CONFIG.raids.scavenger.maxHealth,
        maxHealth: GAME_CONFIG.raids.scavenger.maxHealth,
        targetType: 'looseProduct',
        targetId: null,
        cageSegments: 0,
        lastCageClickTime: 0,
        isStunned: false,
        stunTimer: 0,
        carriedGoods: {},
        attackCooldownTimer: 0,
        stealTimer: 0,
      });
    }

    for (let i = 0; i < bruteCount; i++) {
      raid.raiders.push({
        id: generateLocalId('brute'),
        kind: 'brute',
        position: [10, 0, (Math.random() - 0.5) * 10],
        health: GAME_CONFIG.raids.brute.maxHealth,
        maxHealth: GAME_CONFIG.raids.brute.maxHealth,
        targetType: 'machine',
        targetId: null,
        cageSegments: 0,
        lastCageClickTime: 0,
        isStunned: false,
        stunTimer: 0,
        carriedGoods: {},
        attackCooldownTimer: 0,
        stealTimer: 0,
      });
    }

    GameEvents.emit('raid-started', raid);
  }

  public endRaid(_reason: 'timeout' | 'cleared'): void {
    const raid = this.home.raid;
    raid.phase = 'scheduled';
    const interval =
      GAME_CONFIG.raids.laterRaidMinIntervalSeconds +
      Math.random() * (GAME_CONFIG.raids.laterRaidMaxIntervalSeconds - GAME_CONFIG.raids.laterRaidMinIntervalSeconds);
    raid.secondsUntilSpawn = interval;

    // Calculate bounty
    const bounty =
      raid.defeatedScavengers * GAME_CONFIG.raids.bounties.scavenger +
      raid.defeatedBrutes * GAME_CONFIG.raids.bounties.brute;
    if (bounty > 0) {
      this.addCoins(bounty);
    }

    // Restore health of all living Home creatures
    this.creatures.owned.forEach((c) => {
      const stats = getCreatureStats(c);
      c.currentHealth = stats.maxHealth;
      if (c.homeState === 'stunned') c.homeState = 'active';
    });

    raid.raiders = [];
    this.setMode('home');
    GameEvents.emit('raid-ended', { raid, bounty });
  }

  private updateInvasionSimulation(delta: number): void {
    this.invasion.remainingSeconds -= delta;
    if (this.invasion.supportCooldownRemainingSeconds > 0) {
      this.invasion.supportCooldownRemainingSeconds = Math.max(0, this.invasion.supportCooldownRemainingSeconds - delta);
    }

    // Check generators for defense speed bonus
    const livingGenerators = this.invasion.buildings.filter(
      (b) => b.kind === 'powerGenerator' && !b.isDead
    ).length;

    // Defense cooldowns
    for (const b of this.invasion.buildings) {
      if (b.isDefense && !b.isDead && b.attackCooldownTimer > 0) {
        const speedBonus = 1 + 0.1 * livingGenerators;
        b.attackCooldownTimer -= delta * speedBonus;
      }
    }

    // End condition check: timer expired
    if (this.invasion.remainingSeconds <= 0) {
      this.finalizeInvasionResult();
      return;
    }

    // End condition check: all 8 buildings destroyed
    const countedAlive = this.invasion.buildings.filter((b) => b.countsForPercent && !b.isDead);
    if (countedAlive.length === 0) {
      this.finalizeInvasionResult();
      return;
    }

    // End condition check: all deployed lost AND no undeployed remaining
    const livingDeployed = this.creatures.owned.filter(
      (c) => c.invasionState === 'deployed' && c.currentHealth > 0
    );
    const undeployed = this.creatures.owned.filter((c) => c.invasionState === 'undeployed');

    if (livingDeployed.length === 0 && undeployed.length === 0 && this.invasion.deployedCreatureIds.length > 0) {
      this.finalizeInvasionResult();
    }
  }

  public resetSession(): void {
    const newSession = new GameSession();
    Object.assign(this, newSession);
    GameEvents.emit('session-reset');
  }
}
